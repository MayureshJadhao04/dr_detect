%% oversampleProliferativePatches.m
% Duplicates the lesion_prolif rows in the training patch manifest so
% they get meaningful, repeated exposure during training instead of
% being statistically invisible (9 out of 46,872 patches = ~0.02%).
%
% This does NOT create new information -- it's still the same ~8-9
% underlying source images, just seen more often per epoch (combined
% with the flip/90-degree-rotation augmentation already planned for
% training, each duplicate will still get a different augmented view,
% so it's not literally the exact same tensor every time). Proliferative
% performance should still be interpreted cautiously regardless of this
% step -- documented as a known data-scarcity limitation, not solved by
% oversampling alone.
%
% OVERSAMPLE_FACTOR = 25 is a stated design choice, not a derived fact.
% Reasoning: 9 * 25 = 225, which brings proliferative from ~0.02% to
% ~0.5% of the training patch pool -- still rare (correctly reflecting
% reality), but no longer effectively absent from a shuffled epoch.
% Adjust and re-run if you want a different balance.

clear; clc;

inPath = 'D:\DATASETS\combined\training_patch_manifest.csv';
outPath = 'D:\DATASETS\combined\training_patch_manifest_oversampled.csv';
OVERSAMPLE_FACTOR = 25;

patches = readtable(inPath, 'TextType', 'string');

isProlif = patches.source == "lesion_prolif";
nProlif = sum(isProlif);

fprintf('Found %d lesion_prolif patches out of %d total.\n', nProlif, height(patches));

if nProlif == 0
    error('No lesion_prolif patches found -- check that buildTrainingPatchManifest.m ran correctly and this path is right.');
end

prolifRows = patches(isProlif, :);
duplicated = repmat(prolifRows, OVERSAMPLE_FACTOR - 1, 1);   % -1 since the
                                                                % originals
                                                                % stay too

patchesOversampled = [patches; duplicated];

fprintf('Added %d duplicate lesion_prolif patches (factor %dx).\n', height(duplicated), OVERSAMPLE_FACTOR);
fprintf('New total: %d patches. Proliferative share: %.2f%% (was %.3f%%).\n', ...
    height(patchesOversampled), ...
    100 * sum(patchesOversampled.source == "lesion_prolif") / height(patchesOversampled), ...
    100 * nProlif / height(patches));

writetable(patchesOversampled, outPath);
fprintf('\nSaved oversampled manifest to %s\n', outPath);
fprintf('Point the datastore/training script at THIS file, not the original training_patch_manifest.csv.\n');
