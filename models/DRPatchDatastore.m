classdef DRPatchDatastore < matlab.io.Datastore & ...
        matlab.io.datastore.MiniBatchable & ...
        matlab.io.datastore.Shuffleable

    properties
        Patches table
        Manifest table
        MiniBatchSize
    end

    properties(SetAccess = protected)
        NumObservations
    end

    properties (Access = private)
        CurrentIndex
    end

    methods
        function ds = DRPatchDatastore(patchesTbl, manifestTbl, miniBatchSize)
            ds.Patches = patchesTbl;
            ds.Manifest = manifestTbl;
            ds.MiniBatchSize = miniBatchSize;
            ds.NumObservations = height(patchesTbl);
            ds.CurrentIndex = 1;
        end

        function tf = hasdata(ds)
            tf = ds.CurrentIndex <= ds.NumObservations;
        end

        function [data, info] = read(ds)
            idxRange = ds.CurrentIndex : min(ds.CurrentIndex + ds.MiniBatchSize - 1, ds.NumObservations);
            n = numel(idxRange);

            predictors = cell(n,1);
            responses  = cell(n,1);

            maskCols = ["vessel_mask","dark_mask","light_mask","prolif_mask"];
            hasCols  = ["has_vessel","has_dark","has_light","has_prolif"];

            for k = 1:n
                row = ds.Patches(idxRange(k), :);
                m = ds.Manifest(row.imgIdx, :);

                r0 = row.patchRow; c0 = row.patchCol;
                r1 = r0 + 255; c1 = c0 + 255;

                img = imread(row.enhancedImagePath);
                patchImg = img(r0:r1, c0:c1, :);
                if size(patchImg,3) == 1
                    patchImg = repmat(patchImg, 1, 1, 3);
                end

                target = false(256, 256, 8);

                for c = 1:4
                    hasFlag = m.(hasCols(c));
                    if hasFlag
                        maskFull = imread(m.(maskCols(c)));
                        target(:,:,c) = maskFull(r0:r1, c0:c1) > 0;
                    else
                        target(:,:,c) = false(256,256);
                    end
                    target(:,:,4+c) = logical(hasFlag);
                end

                predictors{k} = patchImg;
                responses{k}  = target;
            end

            data = table(predictors, responses, 'VariableNames', {'InputImage','Target'});
            info.Indices = idxRange;

            ds.CurrentIndex = ds.CurrentIndex + n;
        end

        function reset(ds)
            ds.CurrentIndex = 1;
        end

        function dsNew = shuffle(ds)
            dsNew = copy(ds);
            idx = randperm(dsNew.NumObservations);
            dsNew.Patches = dsNew.Patches(idx, :);
            dsNew.CurrentIndex = 1;
        end
    end

    methods (Hidden = true)
        function frac = progress(ds)
            frac = (ds.CurrentIndex - 1) / ds.NumObservations;
        end
    end
end