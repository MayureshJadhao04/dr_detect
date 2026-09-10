%% buildEnhancedCache.m
% Runs enhanceImage.m ONCE per image and caches the result to disk.
% Reason this is a separate step, not done on-the-fly during patch
% sampling: CLAHE (adapthisteq) and the bilateral filter are real compute
% cost, and with patch-based training you'll be reading from the same
% source images many times across many epochs -- recomputing enhancement
% every time would be wasteful. Also, CLAHE's NumTiles=[8 8] operates
% relative to the WHOLE image, so enhancement must happen on the
% full-size image before any cropping, never per-patch (per-patch CLAHE
% would use the wrong local context and give inconsistent contrast
% normalization across patches from the same image).
%
% Cached as PNG, not JPEG, to avoid stacking a second lossy compression
% pass on top of the (likely already-JPEG) source images.

clear; clc;

manifestPath = 'D:\DATASETS\combined\manifest.csv';
cacheImageFolder = 'D:\DATASETS\combined_enhanced\images';
cacheMapPath = 'D:\DATASETS\combined_enhanced\enhanced_path_map.csv';

if ~isfolder(cacheImageFolder)
    mkdir(cacheImageFolder);
end

manifest = readtable(manifestPath, 'TextType', 'string');
n = height(manifest);

enhancedPaths = strings(n, 1);

fprintf('Enhancing %d images and caching to %s...\n', n, cacheImageFolder);

for i = 1:n
    srcPath = manifest.image_path(i);
    [~, name, ~] = fileparts(srcPath);
    dstPath = fullfile(cacheImageFolder, char(name) + ".png");

    if isfile(dstPath)
        enhancedPaths(i) = dstPath;
        continue;   % already cached from a previous run, skip re-work
    end

    img = imread(srcPath);
    enhanced = enhanceImage(img);
    imwrite(enhanced, dstPath);
    enhancedPaths(i) = dstPath;

    if mod(i, 25) == 0
        fprintf('  ...%d / %d\n', i, n);
    end
end

pathMap = table(manifest.image_path, enhancedPaths, ...
    'VariableNames', {'original_path', 'enhanced_path'});
writetable(pathMap, cacheMapPath);

fprintf('\nDone. Enhanced-path map saved to %s\n', cacheMapPath);
fprintf('Verify a few outputs visually before trusting this cache blindly --\n');
fprintf('e.g. imshow(imread(enhancedPaths(1))) and compare to the original.\n');
