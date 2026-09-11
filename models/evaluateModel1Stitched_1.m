function results = evaluateModel1Stitched(net, uniqueVal, manifest, varargin)
% EVALUATEMODEL1STITCHED  Re-evaluate Model 1 the "real" way: tile each
% validation image, predict, stitch into a full-resolution mask (via
% tileAndStitchInference.m), then compute Dice/IoU against the
% FULL-RESOLUTION ground-truth mask -- not per-patch.
%
% This replaces the OLD evaluateModel1.m's patch-level scoring, which
% was known to diverge from true deployment-time performance for two
% reasons (see CONTEXT_12.md discussion):
%   1. Macro-averaging over non-overlapping grid patches (old method)
%      vs. pooled/micro-averaging over full stitched images (this
%      method) are not the same number, especially for rare classes
%      like prolif where many patches have zero ground-truth-positive
%      pixels.
%   2. The old validation patches were non-overlapping. Real inference
%      uses OVERLAPPING tiles with feathered blending, so predictions
%      near tile boundaries are genuinely different (blended from 2+
%      tiles) than anything the old patch-level validation ever saw.
%
% GROUND-TRUTH MASK FORMAT (confirmed, not guessed -- read directly
% from DRPatchDatastore.m's read() method): each image's full-resolution
% per-channel mask is a SEPARATE image file, path stored in the
% `manifest` table, one row per image, indexed POSITIONALLY by imgIdx
% (i.e. manifest(imgIdx, :) is that image's row -- same convention
% DRPatchDatastore.read() itself uses via `m = ds.Manifest(row.imgIdx, :)`).
% Column names: vessel_mask, dark_mask, light_mask, prolif_mask (each a
% full-image file path, loaded via imread, thresholded >0), gated by
% has_vessel/has_dark/has_light/has_prolif flags. For evaluation, a false
% has_* flag means the annotation is UNAVAILABLE and that image is excluded
% from that class metric; it is NOT treated as a confirmed negative.
%
% USAGE:
%   results = evaluateModel1Stitched(net, uniqueVal, manifest)
%
% INPUTS:
%   net        - trained dlnetwork (load model1_final.mat first, then
%                confirm the variable is actually named `net` via `whos`)
%   uniqueVal  - the 85-row table you already built:
%                  uniqueVal = unique(valPatches(:, {'imgIdx','enhancedImagePath','datasetName'}), 'rows');
%   manifest   - the full image-level manifest table already in your
%                workspace (564x10), containing vessel_mask/dark_mask/
%                light_mask/prolif_mask paths and has_* flags, indexed
%                positionally by imgIdx.
%
% NAME-VALUE ARGS:
%   'Threshold'      - probability threshold for binarizing predictions
%                       before Dice/IoU, default 0.5.
%   'ClassNames'     - cellstr, default {'vessel','dark','light','prolif'}
%   'TileSize'       - passed through to tileAndStitchInference, default [256 256]
%   'OverlapFraction'- passed through, default 0.25
%
% OUTPUT:
%   results - struct with fields:
%       .perImageDice   [nImages x numClasses] Dice per image per class
%       .perImageIoU    [nImages x numClasses] IoU per image per class
%       .pooledDice     [1 x numClasses] pooled/micro-averaged Dice
%                        (TP/FP/FN summed across ALL images first, then
%                        Dice computed once -- this is the number that
%                        should go in the report, NOT a mean of
%                        per-image or per-patch numbers)
%       .pooledIoU      [1 x numClasses] pooled/micro-averaged IoU
%       .classNames     cellstr
%       .imgIdx         [nImages x 1] imgIdx per row, for traceability
%       .datasetName    cellstr, datasetName per row, for traceability
%       .nEvaluated     [1 x numClasses] number of images with GT for each class
%
% IMPORTANT: prolif's pooled number should STILL be reported with
% explicit low-confidence framing (only 6/85 val images and 49/4132
% patches had any prolif-positive pixels per CONTEXT_11) -- stitching
% doesn't fix data scarcity, it only fixes the aggregation/overlap
% methodology issues. Don't let a cleaner number quietly imply more
% confidence than the underlying data supports.
%
% NOT YET RUN. Depends on tileAndStitchInference.m, which HAS been run
% and confirmed working (see CONTEXT_12.md) -- this evaluator itself
% has not been executed yet, run it on 1-2 images first before trusting
% a full 85-image loop's timing/behavior.

    p = inputParser;
    addParameter(p, 'Threshold', 0.5);
    addParameter(p, 'ClassNames', {'vessel','dark','light','prolif'});
    addParameter(p, 'TileSize', [256 256]);
    addParameter(p, 'OverlapFraction', 0.25);
    parse(p, varargin{:});
    thresh     = p.Results.Threshold;
    classNames = p.Results.ClassNames;
    tileSize   = p.Results.TileSize;
    overlapFr  = p.Results.OverlapFraction;

    nImages = height(uniqueVal);
    numClasses = numel(classNames);

    perImageDice = nan(nImages, numClasses);
    perImageIoU  = nan(nImages, numClasses);

    % running pooled confusion counts, summed across all images/pixels
    pooledTP = zeros(1, numClasses);
    pooledFP = zeros(1, numClasses);
    pooledFN = zeros(1, numClasses);

    for i = 1:nImages
        imgIdx = uniqueVal.imgIdx(i);
        imgPath = uniqueVal.enhancedImagePath{i};

        img = imread(imgPath);
        [H, W, ~] = size(img);

        [gtMask, hasGT] = loadFullMaskFromManifest(manifest, imgIdx, H, W);

        [predProb, ~] = tileAndStitchInference(net, img, ...
            'TileSize', tileSize, 'OverlapFraction', overlapFr, ...
            'NumClasses', numClasses);

        predBinary = predProb >= thresh;
        gtBinary = gtMask;  % logical masks; unavailable annotations are false but NOT scored

        for ch = 1:numClasses
            % IMPORTANT: missing/unavailable GT is not a negative example.
            % Exclude that image from this class metric instead of counting
            % all predicted pixels as false positives.
            if ~hasGT(ch)
                continue;
            end

            p_ch = predBinary(:, :, ch);
            g_ch = gtBinary(:, :, ch);

            tp = nnz(p_ch & g_ch);
            fp = nnz(p_ch & ~g_ch);
            fn = nnz(~p_ch & g_ch);

            perImageDice(i, ch) = (2 * tp) / max(2 * tp + fp + fn, eps);
            perImageIoU(i, ch)  = tp / max(tp + fp + fn, eps);

            pooledTP(ch) = pooledTP(ch) + tp;
            pooledFP(ch) = pooledFP(ch) + fp;
            pooledFN(ch) = pooledFN(ch) + fn;
        end

        fprintf('Evaluated %d/%d (imgIdx=%d, %s): %s', i, nImages, imgIdx, ...
            char(string(uniqueVal.datasetName{i})), imgPath);
        skipped = classNames(~hasGT);
        if ~isempty(skipped)
            fprintf('  [GT unavailable: %s not scored]', strjoin(skipped, ', '));
        end
        fprintf('\n');
    end

    pooledDice = nan(1, numClasses);
    pooledIoU  = nan(1, numClasses);
    for ch = 1:numClasses
        denomDice = 2 * pooledTP(ch) + pooledFP(ch) + pooledFN(ch);
        denomIoU  = pooledTP(ch) + pooledFP(ch) + pooledFN(ch);
        if denomDice > 0
            pooledDice(ch) = (2 * pooledTP(ch)) / denomDice;
        end
        if denomIoU > 0
            pooledIoU(ch) = pooledTP(ch) / denomIoU;
        end
    end

    nEvaluated = sum(~isnan(perImageDice), 1);

    results.perImageDice = perImageDice;
    results.perImageIoU  = perImageIoU;
    results.pooledDice   = pooledDice;
    results.pooledIoU    = pooledIoU;
    results.nEvaluated   = nEvaluated;
    results.classNames   = classNames;
    results.imgIdx       = uniqueVal.imgIdx;
    results.datasetName  = uniqueVal.datasetName;

    fprintf('\n--- Pooled (stitched, full-image) validation results ---\n');
    for ch = 1:numClasses
        note = '';
        if strcmpi(classNames{ch}, 'prolif')
            note = '   [LOW CONFIDENCE - thin val data, see note]';
        end
        fprintf('%-8s  Dice: %.4f   IoU: %.4f   N=%d/%d%s\n', classNames{ch}, ...
            pooledDice(ch), pooledIoU(ch), nEvaluated(ch), nImages, note);
    end
end


function [gtMask, hasGT] = loadFullMaskFromManifest(manifest, imgIdx, H, W)
% Load full-resolution GT masks and report which class annotations actually
% exist. IMPORTANT: has_* == false means "annotation unavailable" here,
% not "the image is confirmed negative". Unavailable classes are excluded
% from Dice/IoU rather than being scored against an all-zero GT mask.

    m = manifest(imgIdx, :);

    maskCols = ["vessel_mask","dark_mask","light_mask","prolif_mask"];
    hasCols  = ["has_vessel","has_dark","has_light","has_prolif"];
    numClasses = numel(maskCols);

    gtMask = false(H, W, numClasses);
    hasGT = false(1, numClasses);

    for c = 1:numClasses
        hasFlag = m.(hasCols(c));
        if ismissing(hasFlag)
            hasFlag = false;
        end
        hasFlag = logical(hasFlag);

        if hasFlag
            maskPath = m.(maskCols(c));
            if ismissing(maskPath) || strlength(string(maskPath)) == 0
                error('loadFullMaskFromManifest: %s is marked true but its mask path is missing for imgIdx=%d.', ...
                    maskCols(c), imgIdx);
            end

            maskFull = imread(char(string(maskPath)));
            if ~isequal(size(maskFull, 1), H) || ~isequal(size(maskFull, 2), W)
                error('loadFullMaskFromManifest: mask size [%d %d] for imgIdx=%d channel %s does not match image size [%d %d] -- check enhanced image vs mask file are the same resolution.', ...
                    size(maskFull,1), size(maskFull,2), imgIdx, maskCols(c), H, W);
            end
            gtMask(:, :, c) = maskFull > 0;
            hasGT(c) = true;
        end
    end
end
