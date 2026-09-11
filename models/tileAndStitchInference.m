function [fullMaskProb, fullMaskLogits] = tileAndStitchInference(net, img, varargin)
% TILEANDSTITCHINFERENCE  Run Model 1 on a full-resolution image by
% tiling it into overlapping patches, predicting each tile, and
% stitching the tile predictions back into one full-resolution mask
% using edge-aware feathered blending.
%
% USAGE:
%   [maskProb, maskLogits] = tileAndStitchInference(net, img)
%   [maskProb, maskLogits] = tileAndStitchInference(net, img, ...
%       'TileSize', [256 256], 'OverlapFraction', 0.25, ...
%       'BatchSize', 16, 'NumClasses', 4, 'UseGPU', true)
%
% INPUTS:
%   net              - trained dlnetwork (Model 1, softmax already
%                       removed per the 3-line rebuild sequence in
%                       CONTEXT_11/12). Expected to output raw logits,
%                       size [tileSize(1) tileSize(2) numClasses B].
%   img              - full-resolution image, HxWx3, single or uint8.
%                       NOT pre-tiled, NOT resized -- pass the native-
%                       resolution image as-is (e.g. IDRiD ~1024x1024,
%                       e-Ophtha ~2048x2048, DRIVE ~584x565).
%
% NAME-VALUE ARGS:
%   'TileSize'         [rows cols], default [256 256]. Must match the
%                       network's fixed input size.
%   'OverlapFraction'  fraction of tile size that adjacent tiles share,
%                       default 0.25 (25%). E.g. for 256px tiles this
%                       gives a 64px overlap band and a stride of 192px.
%   'BatchSize'         how many tiles to predict per forward-pass call,
%                       default 16 (matches the MiniBatchSize used in
%                       training -- purely a GPU-throughput choice, not
%                       a correctness requirement; change freely).
%   'NumClasses'        number of output channels, default 4 (vessel,
%                       dark, light, prolif -- matches Model 1).
%   'UseGPU'            logical, default true if a GPU is available.
%
% OUTPUTS:
%   fullMaskProb     - HxWxnumClasses, per-class PROBABILITY map
%                       (sigmoid already applied), same H,W as input
%                       img. This is what should be handed to Model 2
%                       Branch B / used for Grad-CAM / saved as the
%                       final segmentation output.
%   fullMaskLogits   - HxWxnumClasses, the raw (pre-sigmoid) blended
%                       logits, returned in case you need them for
%                       further processing. Blending is done in
%                       PROBABILITY space (see note below), so these
%                       logits are back-derived and provided for
%                       convenience/debugging only -- prefer
%                       fullMaskProb for anything downstream.
%
% WHY PROBABILITY-SPACE BLENDING:
%   Overlap regions are covered by 2+ tiles, each producing its own
%   raw logit for that pixel. Averaging raw logits and averaging
%   probabilities are NOT equivalent (sigmoid is nonlinear). Blending
%   in probability space is the standard, more interpretable choice
%   (a blended probability of 0.7 means "70% confidence" in a way a
%   blended logit doesn't as directly) and is what this function does.
%
% RUN AND VERIFIED on one real val image (IDRiD, 1024x1024) -- output
% shape confirmed correct (HxWx4 matching input HxW), and after fixing
% an input-normalization bug (see note at the `single(img)` line
% below), the stitched output visually looked like a coherent,
% correct vessel prediction with no visible tile-boundary artifacts.
% NOT yet checked on e-Ophtha or DRIVE resolutions, and the SELF-TEST
% block at the bottom (synthetic round-trip, feather-weight-sum check)
% still hasn't been run -- worth doing if stitching artifacts show up
% on other images/datasets.
%
% Companion to Model 1 (CONTEXT_12.md). Save at:
%   D:\Projects\dr-screening\models\tileAndStitchInference.m

    p = inputParser;
    addParameter(p, 'TileSize', [256 256]);
    addParameter(p, 'OverlapFraction', 0.25);
    addParameter(p, 'BatchSize', 16);
    addParameter(p, 'NumClasses', 4);
    addParameter(p, 'UseGPU', canUseGPU());
    parse(p, varargin{:});
    tileSize   = p.Results.TileSize;
    overlapFr  = p.Results.OverlapFraction;
    batchSize  = p.Results.BatchSize;
    numClasses = p.Results.NumClasses;
    useGPU     = p.Results.UseGPU;

    % NOTE: cast to single WITHOUT rescaling -- DRPatchDatastore.read()
    % passes raw uint8 (0-255) pixel values straight through with no
    % normalization at all (confirmed by reading DRPatchDatastore.m),
    % so net was trained on 0-255-range inputs. im2single() would
    % rescale to [0,1] and was CONFIRMED WRONG in testing -- produced
    % collapsed near-zero, artifact-looking predictions. Do not
    % "fix" this back to im2single without re-confirming against
    % DRPatchDatastore.m again first.
    img = single(img);

    % ---- 1. TILE ----
    [tiles, coords, gridInfo] = tileImage(img, tileSize, overlapFr);
    nTiles = numel(tiles);

    % ---- 2. PREDICT (batched) ----
    predLogits = cell(nTiles, 1);
    for startIdx = 1:batchSize:nTiles
        endIdx = min(startIdx + batchSize - 1, nTiles);
        batchTiles = tiles(startIdx:endIdx);
        batchArr = cat(4, batchTiles{:});  % tileSize(1) x tileSize(2) x 3 x B

        dlBatch = dlarray(batchArr, 'SSCB');
        if useGPU
            dlBatch = gpuArray(dlBatch);
        end

        dlPred = predict(net, dlBatch);   % tileSize(1) x tileSize(2) x numClasses x B, raw logits
        dlPred = gather(extractdata(dlPred));

        for k = 1:(endIdx - startIdx + 1)
            predLogits{startIdx + k - 1} = dlPred(:, :, :, k);
        end
    end

    % ---- 3. STITCH (probability-space, edge-aware feathered blend) ----
    [fullMaskProb, fullMaskLogits] = stitchTiles(predLogits, coords, gridInfo, numClasses);

end


% ===================== LOCAL FUNCTIONS =====================

function [tiles, coords, gridInfo] = tileImage(img, tileSize, overlapFr)
% Pads img (bottom/right only, symmetric/reflect padding) so an
% integer number of overlapping tiles exactly covers it, then cuts out
% the tiles. Padding only on bottom/right keeps tile (1,1) aligned
% with pixel (1,1) of the ORIGINAL image, which keeps the coordinate
% math for stitching/cropping simple.

    [origH, origW, C] = size(img);
    th = tileSize(1); tw = tileSize(2);

    overlapPxH = round(overlapFr * th);
    overlapPxW = round(overlapFr * tw);
    strideH = th - overlapPxH;
    strideW = tw - overlapPxW;

    if origH <= th
        nRows = 1;
    else
        nRows = ceil((origH - th) / strideH) + 1;
    end
    if origW <= tw
        nCols = 1;
    else
        nCols = ceil((origW - tw) / strideW) + 1;
    end

    padH = (nRows - 1) * strideH + th;
    padW = (nCols - 1) * strideW + tw;

    padImg = padarray(img, [max(0, padH - origH), max(0, padW - origW)], ...
                       'symmetric', 'post');

    tiles = cell(nRows * nCols, 1);
    coords = zeros(nRows * nCols, 4);  % [rowStart, colStart, rowIdx, colIdx]
    idx = 1;
    for r = 1:nRows
        for c = 1:nCols
            rowStart = (r - 1) * strideH + 1;
            colStart = (c - 1) * strideW + 1;
            tile = padImg(rowStart:rowStart + th - 1, colStart:colStart + tw - 1, :);
            tiles{idx} = tile;
            coords(idx, :) = [rowStart, colStart, r, c];
            idx = idx + 1;
        end
    end

    gridInfo.origH = origH;
    gridInfo.origW = origW;
    gridInfo.padH = padH;
    gridInfo.padW = padW;
    gridInfo.tileSize = tileSize;
    gridInfo.overlapPxH = overlapPxH;
    gridInfo.overlapPxW = overlapPxW;
    gridInfo.strideH = strideH;
    gridInfo.strideW = strideW;
    gridInfo.nRows = nRows;
    gridInfo.nCols = nCols;
end


function w = feather1D(len, overlapPx, isFirstEdge, isLastEdge)
% Linear feather ramp along one dimension of a tile. Interior is 1.
% Ramps down to ~0 over 'overlapPx' pixels at each edge that actually
% borders a neighboring tile. An edge that touches the TRUE image
% boundary (first tile's leading edge, last tile's trailing edge) is
% NOT tapered -- there is no neighbor there to blend with, so tapering
% it would just darken the true image border for no reason.

    w = ones(len, 1);
    rampLen = max(1, overlapPx);

    if ~isFirstEdge
        ramp = ((1:rampLen)') / (rampLen + 1);
        w(1:rampLen) = min(w(1:rampLen), ramp);
    end
    if ~isLastEdge
        ramp = ((rampLen:-1:1)') / (rampLen + 1);
        w(len - rampLen + 1:len) = min(w(len - rampLen + 1:len), ramp);
    end
end


function [fullMaskProb, fullMaskLogits] = stitchTiles(predLogits, coords, gridInfo, numClasses)

    th = gridInfo.tileSize(1); tw = gridInfo.tileSize(2);
    accumProb = zeros(gridInfo.padH, gridInfo.padW, numClasses, 'single');
    weightSum = zeros(gridInfo.padH, gridInfo.padW, 'single');

    for i = 1:numel(predLogits)
        rowStart = coords(i, 1); colStart = coords(i, 2);
        r = coords(i, 3); c = coords(i, 4);

        wRow = feather1D(th, gridInfo.overlapPxH, r == 1, r == gridInfo.nRows);
        wCol = feather1D(tw, gridInfo.overlapPxW, c == 1, c == gridInfo.nCols);
        weight2D = wRow * wCol';  % th x tw

        tileProb = 1 ./ (1 + exp(-predLogits{i}));  % sigmoid, tile logits -> probs

        rEnd = rowStart + th - 1;
        cEnd = colStart + tw - 1;

        for ch = 1:numClasses
            accumProb(rowStart:rEnd, colStart:cEnd, ch) = ...
                accumProb(rowStart:rEnd, colStart:cEnd, ch) + tileProb(:, :, ch) .* weight2D;
        end
        weightSum(rowStart:rEnd, colStart:cEnd) = ...
            weightSum(rowStart:rEnd, colStart:cEnd) + weight2D;
    end

    weightSum(weightSum == 0) = eps;  % guard divide-by-zero, shouldn't occur by construction
    fullMaskProbPadded = accumProb ./ weightSum;

    % crop back to original (un-padded) size -- padding was bottom/right only
    fullMaskProb = fullMaskProbPadded(1:gridInfo.origH, 1:gridInfo.origW, :);

    % back-derive logits from blended probability, for convenience/debugging only
    p = min(max(fullMaskProb, eps), 1 - eps);
    fullMaskLogits = log(p ./ (1 - p));
end


function tf = canUseGPU()
    try
        tf = gpuDeviceCount("available") > 0;
    catch
        tf = false;
    end
end


% ===================== SELF-TEST (run manually, not automatic) =====================
% Sanity check BEFORE trusting this on real data / real net. Confirms
% tiling+stitching round-trips correctly with NO net involved:
%
%   testImg = rand(1024, 1024, 3, 'single');
%   [tiles, coords, gridInfo] = tileImage(testImg, [256 256], 0.25);
%   fakeLogits = cellfun(@(t) zeros(256,256,4,'single'), tiles, 'UniformOutput', false);
%   % feed an image-derived signal instead of zeros to check spatial alignment,
%   % e.g. fakeLogits{i}(:,:,1) = tiles{i}(:,:,1) directly (identity-ish check),
%   % then confirm stitched output channel 1 visually matches testImg channel 1
%   % with NO visible seams/grid pattern and weightSum stays sensible
%   % (feather1D should sum to 1 across every overlap band -- check this
%   %  numerically too: for two adjacent tiles' overlap band, wA+wB should be
%   %  ~1 everywhere, not just at band ends).
%
% Also confirm gridInfo.nRows/nCols actually give FULL coverage (no gap at
% bottom/right) for a non-multiple-of-stride image size, e.g. 584x565 (DRIVE).
