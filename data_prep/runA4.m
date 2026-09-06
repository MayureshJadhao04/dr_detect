rawTrainImg = 'D:\DATASETS\raw\Refined IDRID\Train\Images';
rawTrainMsk = 'D:\DATASETS\raw\Refined IDRID\Train\Labels';
rawTestImg  = 'D:\DATASETS\raw\Refined IDRID\Test\Images';
rawTestMsk  = 'D:\DATASETS\raw\Refined IDRID\Test\Labels';

outImg = 'D:\DATASETS\combined\Refined IDRID\images';
outMsk = 'D:\DATASETS\combined\Refined IDRID\masks_raw';

if ~exist(outImg,'dir'); mkdir(outImg); end
if ~exist(outMsk,'dir'); mkdir(outMsk); end

copySplit(rawTrainImg, rawTrainMsk, outImg, outMsk, 'train_');
copySplit(rawTestImg,  rawTestMsk,  outImg, outMsk, 'test_');

fprintf('Done. %d images in combined pool.\n', numel(dir(fullfile(outImg,'*.*')))-2);

function copySplit(imgFolder, mskFolder, outImg, outMsk, prefix)
    imgFiles = dir(fullfile(imgFolder, '*.*'));
    imgFiles = imgFiles(~[imgFiles.isdir]);

    for k = 1:numel(imgFiles)
        [~, name, ext] = fileparts(imgFiles(k).name);

        srcImg = fullfile(imgFolder, imgFiles(k).name);
        dstImg = fullfile(outImg, [prefix name ext]);
        copyfile(srcImg, dstImg);

        % Try exact match first (Test-style), then "_vessel" suffix (Train-style)
        mskMatch = dir(fullfile(mskFolder, [name '.*']));
        if isempty(mskMatch)
            mskMatch = dir(fullfile(mskFolder, [name '_vessel.*']));
        end

        if isempty(mskMatch)
            warning('No mask found for %s — skipping mask copy.', imgFiles(k).name);
            continue;
        end
        srcMsk = fullfile(mskFolder, mskMatch(1).name);
        [~, ~, mskExt] = fileparts(mskMatch(1).name);
        dstMsk = fullfile(outMsk, [prefix name mskExt]);
        copyfile(srcMsk, dstMsk);
    end
end
