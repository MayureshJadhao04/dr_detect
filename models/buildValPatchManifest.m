%% buildValPatchManifest.m
% Generates the VALIDATION-time patch index: for every image in the VAL
% split (valIdx from stratified_image_split.mat), computes GRID-ONLY
% patch coordinates covering the whole image.
%
% Deliberately excludes lesion-centered patches (unlike
% buildTrainingPatchManifest.m's step (b)): validation must reflect real
% inference conditions, where the model has no access to ground-truth
% mask locations to center a crop on. Lesion-centered validation patches
% would inflate apparent Dice/IoU, especially for rare channels, in a
% way that would NOT transfer to real deployment performance.
%
% Same grid logic (stride, edge handling, coordinate convention) as
% buildTrainingPatchManifest.m's section (a), copied verbatim to avoid
% any mismatch with how the datastore/training pipeline already expects
% patch coordinates to behave.
%
% Known limitation, not fixed by this script: prolif is present in only
% 6 of the 85 val images (confirmed via validFlag/positiveFlag check).
% Grid sampling from those 6 images may yield very few prolif-positive
% validation patches. This is a genuine data scarcity issue -- do not
% treat prolif's in-loop validation Dice with the same confidence as
% vessel/dark/light.

clear; clc;

manifestPath = 'D:\DATASETS\combined\manifest.csv';
splitPath = 'D:\DATASETS\combined\stratified_image_split.mat';
cacheImageFolder = 'D:\DATASETS\combined_enhanced\images';
outPatchManifestPath = 'D:\DATASETS\combined\val_patch_manifest.csv';

PATCH_SIZE = 256;
GRID_OVERLAP_FRACTION = 0.25;

manifest = readtable(manifestPath, 'TextType', 'string');
splitData = load(splitPath);

if splitData.n ~= height(manifest)
    error(['stratified_image_split.mat was built against %d images, but ' ...
        'the current manifest has %d rows -- re-run ' ...
        'buildStratifiedImageSplit_v2.m against the current manifest ' ...
        'before continuing.'], splitData.n, height(manifest));
end

valIdx = splitData.valIdx;

patchRows = table('Size', [0 6], ...
    'VariableTypes', {'double','string','string','double','double','string'}, ...
    'VariableNames', {'imgIdx','enhancedImagePath','datasetName','patchRow','patchCol','source'});

fprintf('Generating GRID-ONLY validation patches for %d val-split images...\n', numel(valIdx));

for kk = 1:numel(valIdx)
    i = valIdx(kk);
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

    % --- grid patches, whole-image coverage (identical logic to
    % buildTrainingPatchManifest.m section (a)) ---
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

    if mod(kk, 20) == 0
        fprintf('  ...%d / %d images processed, %d patches so far\n', kk, numel(valIdx), height(patchRows));
    end
end

fprintf('\nTotal validation patches generated: %d\n', height(patchRows));
fprintf('Breakdown by source:\n');
summary(categorical(patchRows.source))

writetable(patchRows, outPatchManifestPath);
fprintf('\nSaved validation patch manifest to %s\n', outPatchManifestPath);