classdef DRClassificationDatastore_384 < matlab.io.Datastore & ...
        matlab.io.datastore.MiniBatchable & ...
        matlab.io.datastore.Shuffleable

    properties
        Labels table
        MiniBatchSize
        UseMask logical
        IsTrain logical
    end

    properties(SetAccess = protected)
        NumObservations
    end

    properties (Access = private)
        CurrentIndex
        MaskCacheDir
    end

    methods
        function ds = DRClassificationDatastore_384(labelsTbl, maskCacheDir, miniBatchSize, useMask, isTrain)
            if nargin < 4 || isempty(useMask)
                useMask = true;   % 7-channel fusion (RGB + 4 lesion masks)
            end
            if nargin < 5 || isempty(isTrain)
                isTrain = false;
            end
            ds.Labels = labelsTbl;
            ds.MaskCacheDir = maskCacheDir;
            ds.MiniBatchSize = miniBatchSize;
            ds.UseMask = useMask;
            ds.IsTrain = isTrain;
            ds.NumObservations = height(labelsTbl);
            ds.CurrentIndex = 1;
        end

        function tf = hasdata(ds)
            tf = ds.CurrentIndex <= ds.NumObservations;
        end

        function [data, info] = read(ds)
            idxRange = ds.CurrentIndex : min(ds.CurrentIndex + ds.MiniBatchSize - 1, ds.NumObservations);
            n = numel(idxRange);

            predictors = cell(n, 1);
            responses = cell(n, 1);

            for k = 1:n
                row = ds.Labels(idxRange(k), :);

                img = single(imread(row.image_path));
                if size(img, 1) ~= 384 || size(img, 2) ~= 384
                    img = single(imresize(img, [384 384]));
                end

                if ds.UseMask
                    [~, imgName, ~] = fileparts(row.image_path);
                    maskPath = fullfile(ds.MaskCacheDir, imgName + ".mat");
                    if isfile(maskPath)
                        maskData = load(maskPath, 'maskResized');
                        m = maskData.maskResized;
                        if size(m, 1) ~= 384 || size(m, 2) ~= 384
                            m = single(imresize(m, [384 384]));
                        end
                    else
                        m = zeros(384, 384, 4, 'single');
                    end
                    tensor7 = cat(3, img, m);   % [384 384 7]
                else
                    tensor7 = img;              % [384 384 3]
                end

                % Targeted augmentation for training
                if ds.IsTrain
                    gradeVal = double(row.grade);
                    % Always augment minority classes (1, 3, 4), or 50% chance for others
                    isMinority = (gradeVal == 1 || gradeVal == 3 || gradeVal == 4);
                    if isMinority || rand() > 0.5
                        if rand() > 0.5
                            tensor7 = fliplr(tensor7);
                        end
                        if rand() > 0.5
                            tensor7 = flipud(tensor7);
                        end
                    end
                end

                predictors{k} = tensor7;
                responses{k} = categorical(row.grade, 0:4);
            end

            data = table(predictors, responses, 'VariableNames', {'InputImage', 'Grade'});
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
