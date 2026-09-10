%% buildStratifiedImageSplit_v2.m
% Same purpose as the earlier buildStratifiedSplit.m, rewritten against
% the REAL manifest structure confirmed this session (image_path,
% dataset, vessel_mask, dark_mask, light_mask, prolif_mask, has_vessel,
% has_dark, has_light, has_prolif; separate per-lesion PNG masks, not a
% merged .mat). The earlier version assumed combined_512's format and
% does not apply here.
%
% CRITICAL: this split happens at the IMAGE level, and patches are only
% ever generated later from images inside their assigned split (see
% buildTrainingPatchManifest.m). Splitting after patches exist would let
% patches from the same source image land in both train and val --
% leakage that would inflate validation metrics. This script must run
% BEFORE any patch generation.

clear; clc;

manifestPath = 'D:\DATASETS\combined\manifest.csv';
valFraction = 0.15;
MIN_POSITIVE_IN_VAL = 3;   % same explicit knob as before -- a design
                           % choice, not a fact; adjust if a channel is
                           % too rare to support this

outSplitPath = 'D:\DATASETS\combined\stratified_image_split.mat';
outAuditPath = 'D:\DATASETS\combined\image_positivity_audit.csv';

manifest = readtable(manifestPath, 'TextType', 'string');
n = height(manifest);
channelNames = ["vessel", "dark", "light", "prolif"];
maskCols = ["vessel_mask", "dark_mask", "light_mask", "prolif_mask"];
hasCols = ["has_vessel", "has_dark", "has_light", "has_prolif"];

fprintf('Scanning all %d images for per-channel positivity...\n', n);

validFlag = false(n, 4);
positiveFlag = false(n, 4);

for i = 1:n
    for c = 1:4
        hasVal = manifest.(hasCols(c))(i);
        validFlag(i, c) = (hasVal == 1);
        if ~validFlag(i, c)
            continue;
        end
        maskPath = manifest.(maskCols(c))(i);
        if strlength(maskPath) == 0 || ~isfile(maskPath)
            warning('Row %d: has_%s=1 but mask path missing/invalid (%s) -- treating as invalid.', ...
                i, channelNames(c), maskPath);
            validFlag(i, c) = false;
            continue;
        end
        maskImg = imread(maskPath);
        if ndims(maskImg) == 3
            maskImg = maskImg(:,:,1);
        end
        positiveFlag(i, c) = any(maskImg(:) > 0);
    end
    if mod(i, 50) == 0
        fprintf('  ...%d / %d\n', i, n);
    end
end

fprintf('\n=== Full-dataset channel counts (n=%d images) ===\n', n);
fprintf('%-10s %-10s %-10s\n', 'Channel', 'Valid', 'Positive');
for c = 1:4
    fprintf('%-10s %-10d %-10d\n', channelNames(c), sum(validFlag(:,c)), sum(positiveFlag(:,c)));
end

%% --- Build stratified split (same algorithm as before, real data now) ---
rng(1);
targetValSize = round(valFraction * n);
mustBeInVal = false(n, 1);

for c = 1:4
    posIdx = find(positiveFlag(:, c));
    nPos = numel(posIdx);
    if nPos == 0
        fprintf('\n%s: 0 positive images in the ENTIRE dataset -- cannot stratify.\n', channelNames(c));
        continue;
    end
    nWant = max(MIN_POSITIVE_IN_VAL, round(valFraction * nPos));
    nWant = min(nWant, nPos);
    shuffled = posIdx(randperm(nPos));
    chosen = shuffled(1:nWant);
    mustBeInVal(chosen) = true;
    fprintf('%-10s: %d positive images total, reserving %d for validation.\n', ...
        channelNames(c), nPos, nWant);
end

forcedIdx = find(mustBeInVal);
fprintf('\nTotal images forced into validation by stratification: %d (target was %d).\n', ...
    numel(forcedIdx), targetValSize);

if numel(forcedIdx) > targetValSize
    fprintf('NOTE: forced set exceeds target -- val size will be %d, not silently truncated.\n', numel(forcedIdx));
    valIdx = forcedIdx;
else
    remaining = setdiff((1:n)', forcedIdx);
    remaining = remaining(randperm(numel(remaining)));
    fillIdx = remaining(1:(targetValSize - numel(forcedIdx)));
    valIdx = sort([forcedIdx; fillIdx]);
end

trainIdx = setdiff((1:n)', valIdx);
fprintf('\nFinal split: %d train, %d val (of %d total).\n', numel(trainIdx), numel(valIdx), n);

fprintf('\n=== Verification: channel counts WITHIN the new validation split ===\n');
fprintf('%-10s %-10s %-10s\n', 'Channel', 'Valid', 'Positive');
for c = 1:4
    fprintf('%-10s %-10d %-10d\n', channelNames(c), sum(validFlag(valIdx,c)), sum(positiveFlag(valIdx,c)));
end

save(outSplitPath, 'valIdx', 'trainIdx', 'validFlag', 'positiveFlag', 'n');
fprintf('\nSaved split to %s\n', outSplitPath);

auditTable = table((1:n)', manifest.image_path, manifest.dataset, ...
    validFlag(:,1), positiveFlag(:,1), validFlag(:,2), positiveFlag(:,2), ...
    validFlag(:,3), positiveFlag(:,3), validFlag(:,4), positiveFlag(:,4), ...
    ismember((1:n)', valIdx), ...
    'VariableNames', {'idx','image_path','dataset', ...
        'vessel_valid','vessel_positive','dark_valid','dark_positive', ...
        'light_valid','light_positive','prolif_valid','prolif_positive', ...
        'in_validation_split'});
writetable(auditTable, outAuditPath);
fprintf('Saved audit table to %s\n', outAuditPath);
