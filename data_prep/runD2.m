%% D2 - Build manifest.csv across IDRiD, DRIVE, e-Ophtha
clear; clc;

manifest = table();

%% ---- IDRiD: all 4 channels ----
idridImgFolder = 'D:\DATASETS\combined\Refined IDRID\images';
idridFiles = [dir(fullfile(idridImgFolder, '*.jpg')); dir(fullfile(idridImgFolder, '*.png'))];

for k = 1:numel(idridFiles)
    [~, name, ~] = fileparts(idridFiles(k).name);
    row = table();
    row.image_path   = {fullfile(idridImgFolder, idridFiles(k).name)};
    row.dataset       = {'idrid'};
    row.vessel_mask   = {fullfile('D:\DATASETS\combined\Refined IDRID\mask_vessel', [name '.png'])};
    row.dark_mask     = {fullfile('D:\DATASETS\combined\Refined IDRID\mask_dark',   [name '.png'])};
    row.light_mask    = {fullfile('D:\DATASETS\combined\Refined IDRID\mask_light',  [name '.png'])};
    row.prolif_mask   = {fullfile('D:\DATASETS\combined\Refined IDRID\mask_prolif', [name '.png'])};
    row.has_vessel = 1; row.has_dark = 1; row.has_light = 1; row.has_prolif = 1;
    manifest = [manifest; row];
end

%% ---- DRIVE: vessel only ----
driveImgFolder = 'D:\DATASETS\combined\DRIVE\images';
driveFiles = dir(fullfile(driveImgFolder, '*.tif'));

for k = 1:numel(driveFiles)
    [~, name, ~] = fileparts(driveFiles(k).name);
    row = table();
    row.image_path  = {fullfile(driveImgFolder, driveFiles(k).name)};
    row.dataset      = {'drive'};
    row.vessel_mask  = {fullfile('D:\DATASETS\combined\DRIVE\mask_vessel', [name '.gif'])};
    row.dark_mask    = {''};
    row.light_mask   = {''};
    row.prolif_mask  = {''};
    row.has_vessel = 1; row.has_dark = 0; row.has_light = 0; row.has_prolif = 0;
    manifest = [manifest; row];
end

%% ---- e-Ophtha: dark or light only ----
eoImgFolder = 'D:\DATASETS\combined\eophtha\images';
eoFiles = dir(fullfile(eoImgFolder, '*.jpg'));

for k = 1:numel(eoFiles)
    [~, name, ~] = fileparts(eoFiles(k).name);
    row = table();
    row.image_path = {fullfile(eoImgFolder, eoFiles(k).name)};
    row.dataset     = {'eophtha'};

    isMA = startsWith(name, 'ma_');
    if isMA
        row.vessel_mask = {''};
        row.dark_mask   = {fullfile('D:\DATASETS\combined\eophtha\mask_dark', [name '.png'])};
        row.light_mask  = {''};
        row.prolif_mask = {''};
        row.has_vessel = 0; row.has_dark = 1; row.has_light = 0; row.has_prolif = 0;
    else
        row.vessel_mask = {''};
        row.dark_mask   = {''};
        row.light_mask  = {fullfile('D:\DATASETS\combined\eophtha\mask_light', [name '.png'])};
        row.prolif_mask = {''};
        row.has_vessel = 0; row.has_dark = 0; row.has_light = 1; row.has_prolif = 0;
    end
    manifest = [manifest; row];
end

%% ---- Save ----
writetable(manifest, 'D:\DATASETS\combined\manifest.csv');
fprintf('Manifest written with %d total rows.\n', height(manifest));
fprintf('  IDRiD: %d, DRIVE: %d, e-Ophtha: %d\n', numel(idridFiles), numel(driveFiles), numel(eoFiles));