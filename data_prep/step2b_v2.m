%% Step 2b (v3) - Aspect-preserving resize to 512x512, now also saving contentMask
clear; clc;
targetSize = [512 512];

manifest = readtable('D:\DATASETS\combined\manifest.csv');

outRoot  = 'D:\DATASETS\combined_512';
outImg   = fullfile(outRoot, 'images');
outMasks = fullfile(outRoot, 'masks');
if ~exist(outImg,'dir');   mkdir(outImg);   end
if ~exist(outMasks,'dir'); mkdir(outMasks); end

newManifest = table();

for i = 1:height(manifest)
    img = imread(manifest.image_path{i});
    [~, baseName, ~] = fileparts(manifest.image_path{i});

    [imgOut, ~, contentMask] = resizeWithPad(img, [], targetSize);   % <-- capture 3rd output
    outImgName = [baseName '.png'];
    imwrite(imgOut, fullfile(outImg, outImgName));

    maskCols = {'vessel_mask','dark_mask','light_mask','prolif_mask'};
    hasCols  = {'has_vessel','has_dark','has_light','has_prolif'};
    chanNames = {'vessel','dark','light','prolif'};
    outMaskStruct = struct();

    for c = 1:numel(maskCols)
        p = manifest.(maskCols{c}){i};
        hasIt = manifest.(hasCols{c})(i);
        if hasIt == 1 && ~isempty(p) && isfile(p)
            m = imread(p) > 0;
            [~, mOut] = resizeWithPad(img, m, targetSize);
            outMaskStruct.(chanNames{c}) = mOut;
        else
            outMaskStruct.(chanNames{c}) = false(targetSize);
        end
    end

    vesselsOut = outMaskStruct.vessel; darkOut = outMaskStruct.dark; %#ok<NASGU>
    lightOut = outMaskStruct.light; proliferativeOut = outMaskStruct.prolif; %#ok<NASGU>
    contentMaskOut = contentMask; %#ok<NASGU>
    save(fullfile(outMasks, [outImgName '.mat']), ...
        'vesselsOut','darkOut','lightOut','proliferativeOut','contentMaskOut');

    newRow = table(string(fullfile(outImg,outImgName)), string(manifest.dataset{i}), ...
        manifest.has_vessel(i), manifest.has_dark(i), manifest.has_light(i), manifest.has_prolif(i), ...
        'VariableNames', {'image_path','dataset','vessels_valid','dark_valid','light_valid','proliferative_valid'});
    newManifest = [newManifest; newRow]; %#ok<AGROW>

    if mod(i,50)==0 || i==height(manifest)
        fprintf('Processed %d / %d\n', i, height(manifest));
    end
end

writetable(newManifest, fullfile(outRoot, 'manifest.csv'));
fprintf('Done. New manifest at %s\n', fullfile(outRoot, 'manifest.csv'));