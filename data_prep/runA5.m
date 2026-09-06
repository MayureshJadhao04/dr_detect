%% A5 - Split IDRiD's 12-value combined mask into 4 binary channel masks
clear; clc;

rawMskFolder = 'D:\DATASETS\combined\Refined IDRID\masks_raw';

outVessel = 'D:\DATASETS\combined\Refined IDRID\mask_vessel';
outDark   = 'D:\DATASETS\combined\Refined IDRID\mask_dark';
outLight  = 'D:\DATASETS\combined\Refined IDRID\mask_light';
outProlif = 'D:\DATASETS\combined\Refined IDRID\mask_prolif';

for f = {outVessel, outDark, outLight, outProlif}
    if ~exist(f{1}, 'dir'); mkdir(f{1}); end
end

mskFiles = dir(fullfile(rawMskFolder, '*.png'));

for k = 1:numel(mskFiles)
    [~, name, ~] = fileparts(mskFiles(k).name);
    mask = imread(fullfile(rawMskFolder, mskFiles(k).name));

    vessel = uint8((mask == 24)) * 255;
    dark   = uint8((mask == 127) | (mask == 255)) * 255;
    light  = uint8((mask == 63)  | (mask == 191)) * 255;
    prolif = uint8((mask == 166) | (mask == 96)  | (mask == 4)) * 255;

    imwrite(vessel, fullfile(outVessel, [name '.png']));
    imwrite(dark,   fullfile(outDark,   [name '.png']));
    imwrite(light,  fullfile(outLight,  [name '.png']));
    imwrite(prolif, fullfile(outProlif, [name '.png']));
end

fprintf('Done. %d IDRiD masks split into 4 channels.\n', numel(mskFiles));