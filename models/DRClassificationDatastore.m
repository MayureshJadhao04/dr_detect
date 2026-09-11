classdef DRClassificationDatastore < matlab.io.Datastore & ...
        matlab.io.datastore.MiniBatchable & ...
        matlab.io.datastore.Shuffleable

    properties
        Labels table
        MiniBatchSize
        UseMask logical
    end

    properties(SetAccess = protected)
        NumObservations
    end

    properties (Access = private)
        CurrentIndex
        MaskCacheDir
    end

    methods
        function ds = DRClassificationDatastore(labelsTbl, maskCacheDir, miniBatchSize, useMask)
            if nargin < 4
                useMask = true;   % default: 7-channel fusion (image + Model 1 mask)
            end
            ds.Labels = labelsTbl;
            ds.MaskCacheDir = maskCacheDir;
            ds.MiniBatchSize = miniBatchSize;
            ds.UseMask = useMask;
            ds.NumObservations = height(labelsTbl);
            ds.CurrentIndex = 1;
        end

        function tf = hasdata(ds)
            tf = ds.CurrentIndex <= ds.NumObservations;
        end

        function [data, info] = read(ds)
            idxRange = ds.CurrentIndex : min(ds.CurrentIndex + ds.MiniBatchSize - 1, ds.NumObservations);
            n = numel(idxRange);

            predictors = cell(n,1);
            responses = cell(n,1);

            for k = 1:n
                row = ds.Labels(idxRange(k), :);

                img = imread(row.image_path);
                imgResized = single(imresize(img, [224 224]));

                if ds.UseMask
                    [~, imgName, ~] = fileparts(row.image_path);
                    maskData = load(fullfile(ds.MaskCacheDir, imgName + ".mat"), 'maskResized');
                    predictors{k} = cat(3, imgResized, maskData.maskResized);   % [224 224 7]
                else
                    predictors{k} = imgResized;                                 % [224 224 3]
                end

                responses{k} = categorical(row.grade, 0:4);
            end

            data = table(predictors, responses, 'VariableNames', {'InputImage','Grade'});
            info.Indices = idxRange;

            ds.CurrentIndex = ds.CurrentIndex + n;
        end

        function reset(ds)
            ds.CurrentIndex = 1;
        end

        function dsNew = shuffle(ds)
            dsNew = copy(ds);
            idx = randperm(dsNew.NumObservations);
            dsNew.Labels = dsNew.Labels(idx, :);
            dsNew.CurrentIndex = 1;
        end
    end

    methods (Hidden = true)
        function frac = progress(ds)
            frac = (ds.CurrentIndex - 1) / ds.NumObservations;
        end
    end
end