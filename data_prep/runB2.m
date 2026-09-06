%% B2 - Copy DRIVE training (only, since test has no public ground truth) into combined pool
clear; clc;

rawImg = 'D:\DATASETS\raw\DRIVE\training\images';
rawMsk = 'D:\DATASETS\raw\DRIVE\training\1st_manual';

outImg = 'D:\DATASETS\combined\DRIVE\images';
outMsk = 'D:\DATASETS\combined\DRIVE\mask_vessel';

if ~exist(outImg,'dir'); mkdir(outImg); end
if ~exist(outMsk,'dir'); mkdir(outMsk); end

imgFiles = dir(fullfile(rawImg, '*.tif'));

for k = 1:numel(imgFiles)
    [~, name, ext] = fileparts(imgFiles(k).name);
    idNum = regexp(name, '^\d+', 'match', 'once');

    srcImg = fullfile(rawImg, imgFiles(k).name);
    dstImg = fullfile(outImg, ['drive_' idNum ext]);
    copyfile(srcImg, dstImg);

    mskMatch = dir(fullfile(rawMsk, [idNum '_manual1.*']));
    if isempty(mskMatch)
        warning('No mask found for id %s', idNum);
        continue;
    end
    srcMsk = fullfile(rawMsk, mskMatch(1).name);
    [~, ~, mskExt] = fileparts(mskMatch(1).name);
    dstMsk = fullfile(outMsk, ['drive_' idNum mskExt]);
    copyfile(srcMsk, dstMsk);
end

fprintf('Done. %d images copied.\n', numel(imgFiles));