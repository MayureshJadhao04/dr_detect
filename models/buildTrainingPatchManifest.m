%% buildTrainingPatchManifest.m
% Generates the TRAINING-time patch index: for every image in the TRAIN
% split (never val -- see buildStratifiedImageSplit_v2.m, must run
% first), computes patch coordinates two ways:
%   (a) a grid covering the whole image, for background/negative
%       diversity (so the model also learns what "no lesion here" looks
%       like, and doesn't only ever see lesion-centered crops)
%   (b) one patch centered on each connected lesion component per
%       channel, so sparse channels (dark/light/prolif) are guaranteed
%       real positive exposure regardless of where the grid happens to
%       fall -- this is the actual fix for the sparsity problem that
%       started this whole investigation
%
% This script does NOT extract/save actual pixel patches -- it saves a
% lightweight INDEX (image reference + top-left coordinate + patch size
% + source tag). Actual pixels are read lazily by the datastore at
% training time, from the cached enhanced images (see
% buildEnhancedCache.m) + native masks. Keeps this step fast and the
% output small.
%
% CHANGED from the original version: no longer reads
% enhanced_path_map.csv (readtable mangled its header on import in
% testing -- unreliable). Enhanced-image paths are instead reconstructed
% directly from manifest.csv's image_path column, using the SAME
% deterministic naming rule buildEnhancedCache.m actually used: same
% filename stem, .png extension, inside cacheImageFolder. No CSV
% round-trip, no dependency on how MATLAB happens to parse that file.
%
% PATCH SIZE: 256, divisible by 32 (standard ResNet stride convention).
% NOT yet empirically verified against deeplabv3plus itself -- run
% deeplabv3plus([256 256 3],4,"resnet18") once to confirm before
% training, cheap check, not done by this script.

clear; clc;

manifestPath = 'D:\DATASETS\combined\manifest.csv';
splitPath = 'D:\DATASETS\combined\stratified_image_split.mat';
cacheImageFolder = 'D:\DATASETS\combined_enhanced\images';
outPatchManifestPath = 'D:\DATASETS\combined\training_patch_manifest.csv';

PATCH_SIZE = 256;
GRID_OVERLAP_FRACTION = 0.25;   % design choice, not a fact -- 25%
                                 % overlap between grid patches

manifest = readtable(manifestPath, 'TextType', 'string');
splitData = load(splitPath);

if splitData.n ~= height(manifest)
    error(['stratified_image_split.mat was built against %d images, but ' ...
           'the current manifest has %d rows -- re-run ' ...
           'buildStratifiedImageSplit_v2.m against the current manifest ' ...
           'before continuing.'], splitData.n, height(manifest));
end

trainIdx = splitData.trainIdx;
maskCols = ["vessel_mask", "dark_mask", "light_mask", "prolif_mask"];
hasCols  = ["has_vessel", "has_dark", "has_light", "has_prolif"];
channelNamesList = ["vessel", "dark", "light", "prolif"];

patchRows = table('Size', [0 6], ...
    'VariableTypes', {'double','string','string','double','double','string'}, ...
    'VariableNames', {'imgIdx','enhancedImagePath','datasetName','patchRow','patchCol','source'});

fprintf('Generating training patches for %d train-split images (val images excluded)...\n', numel(trainIdx));

for kk = 1:numel(trainIdx)
    i = trainIdx(kk);
    row = manifest(i, :);

    [~, srcName, ~] = fileparts(row.image_path(1));
    enhancedPath = fullfile(cacheImageFolder, srcName + ".png");
    if ~isfile(enhancedPath)
        warning('Row %d: expected enhanced cache file not found at %s -- run buildEnhancedCache.m first. Skipping.', ...
            i, enhancedPath);
        continue;
    end

    info = imfinfo(enhancedPath);
    imgH = info.Height; imgW = info.Width;

    % --- (a) grid patches, whole-image coverage ---
    stride = round(PATCH_SIZE * (1 - GRID_OVERLAP_FRACTION));
    rowStarts = 1:stride:max(1, imgH - PATCH_SIZE + 1);
    colStarts = 1:stride:max(1, imgW - PATCH_SIZE + 1);
    if isempty(rowStarts) || rowStarts(end) + PATCH_SIZE - 1 < imgH
        rowStarts = [rowStarts, max(1, imgH - PATCH_SIZE + 1)]; %#ok<AGROW>
    end
    if isempty(colStarts) || colStarts(end) + PATCH_SIZE - 1 < imgW
        colStarts = [colStarts, max(1, imgW - PATCH_SIZE + 1)]; %#ok<AGROW>
    end
    rowStarts = unique(rowStarts);
    colStarts = unique(colStarts);

    for r = rowStarts
        for c = colStarts
            newRow = {i, enhancedPath, row.dataset(1), r, c, "grid"};
            patchRows = [patchRows; newRow]; %#ok<AGROW>
        end
    end

    % --- (b) lesion-centered patches, per channel ---
    for ch = 1:4
        if row.(hasCols(ch))(1) ~= 1
            continue;
        end
        maskPath = row.(maskCols(ch))(1);
        if strlength(maskPath) == 0 || ~isfile(maskPath)
            continue;
        end
        maskImg = imread(maskPath);
        if ndims(maskImg) == 3
            maskImg = maskImg(:,:,1);
        end
        maskLogical = maskImg > 0;
        if ~any(maskLogical(:))
            continue;
        end

        cc = bwconncomp(maskLogical);
        stats = regionprops(cc, 'Centroid');
        for s = 1:numel(stats)
            cR = round(stats(s).Centroid(2)) - floor(PATCH_SIZE/2);
            cC = round(stats(s).Centroid(1)) - floor(PATCH_SIZE/2);
            cR = max(1, min(cR, imgH - PATCH_SIZE + 1));
            cC = max(1, min(cC, imgW - PATCH_SIZE + 1));
            newRow = {i, enhancedPath, row.dataset(1), cR, cC, "lesion_" + channelNamesList(ch)};
            patchRows = [patchRows; newRow]; %#ok<AGROW>
        end
    end

    if mod(kk, 20) == 0
        fprintf('  ...%d / %d images processed, %d patches so far\n', kk, numel(trainIdx), height(patchRows));
    end
end

fprintf('\nTotal training patches generated: %d\n', height(patchRows));
fprintf('Breakdown by source:\n');
summary(categorical(patchRows.source))

writetable(patchRows, outPatchManifestPath);
fprintf('\nSaved training patch manifest to %s\n', outPatchManifestPath);
fprintf(['\nNOTE: this manifest does not yet deduplicate near-identical ' ...
         'lesion-centered patches that happen to overlap heavily with a ' ...
         'grid patch -- some redundancy is expected and is not ' ...
         'necessarily a problem (mild oversampling of lesion regions is ' ...
         'the intended effect), but if training patch counts look ' ...
         'extreme for any one image, worth a manual look.\n']);
