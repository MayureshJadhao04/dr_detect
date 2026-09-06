%% Step 2 verification - runs all checks at once
manifest = readtable('D:\DATASETS\combined\manifest.csv');

fprintf('--- Structure ---\n');
disp(manifest.Properties.VariableNames)
fprintf('Row count: %d (expect 564)\n\n', height(manifest));

fprintf('--- Per-channel valid counts ---\n');
fprintf('Vessel valid: %d (expect 101)\n', sum(manifest.vessels_valid));
fprintf('Dark valid: %d (expect 462)\n', sum(manifest.dark_valid));
fprintf('Light valid: %d (expect 163)\n', sum(manifest.light_valid));
fprintf('Proliferative valid: %d (expect 81)\n\n', sum(manifest.proliferative_valid));

fprintf('--- Image sizes (sample) ---\n');
for i = [1, 100, 300, 564]
    img = imread(manifest.image_path{i});
    fprintf('Row %d: size = %s\n', i, mat2str(size(img)));
end

fprintf('\n--- Mask content check ---\n');
idx = find(manifest.dark_valid == 1, 1);
p = manifest.dark_mask{idx};
m = imread(p) > 0;
fprintf('Row %d dark mask size: %s, non-zero pixels: %d\n', idx, mat2str(size(m)), sum(m(:)));

fprintf('\n--- Visual check (look at the figure window) ---\n');
figure;
imshowpair(imread(manifest.image_path{idx}), m, 'blend');
title(sprintf('Row %d - image vs dark lesion mask overlay', idx));

fprintf('\nDone. Review the printed numbers above against the "expect" values,\n');
fprintf('and check the figure window - the mask should visibly land on a\n');
fprintf('real lesion area of the image, not be blank or misaligned.\n');
