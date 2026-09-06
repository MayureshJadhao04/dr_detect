%% C3 - Pair e-Ophtha images with annotations (MA and EX), including healthy as zero masks
clear; clc;

maRoot = 'D:\DATASETS\raw\eophtha\e_ophtha_MA\e_ophtha_MA';
exRoot = 'D:\DATASETS\raw\eophtha\e_ophtha_EX\e_ophtha_EX';

outImg      = 'D:\DATASETS\combined\eophtha\images';
outMaskDark = 'D:\DATASETS\combined\eophtha\mask_dark';   % from MA
outMaskLight= 'D:\DATASETS\combined\eophtha\mask_light';  % from EX

if ~exist(outImg,'dir'); mkdir(outImg); end
if ~exist(outMaskDark,'dir'); mkdir(outMaskDark); end
if ~exist(outMaskLight,'dir'); mkdir(outMaskLight); end

% ---- MA (dark lesions) ----
processGroup(fullfile(maRoot,'MA'),      fullfile(maRoot,'Annotation_MA'), outImg, outMaskDark, 'ma_', true,  []);
processGroup(fullfile(maRoot,'healthy'), [],                                outImg, outMaskDark, 'ma_healthy_', false, []);

% ---- EX (light lesions) ----
processGroup(fullfile(exRoot,'EX'),      fullfile(exRoot,'Annotation_EX'), outImg, outMaskLight, 'ex_', true,  '_EX');
processGroup(fullfile(exRoot,'healthy'), [],                                outImg, outMaskLight, 'ex_healthy_', false, []);

disp('Done.');

function processGroup(imgRoot, annRoot, outImg, outMask, prefix, hasLesion, annSuffix)
patients = dir(imgRoot);
patients = patients([patients.isdir] & ~ismember({patients.name}, {'.','..'}));

for p = 1:numel(patients)
    pid = patients(p).name;
    imgFiles = dir(fullfile(imgRoot, pid, '*.*'));
    imgFiles = imgFiles(~[imgFiles.isdir] & ~strcmpi({imgFiles.name}, 'Thumbs.db'));

    for k = 1:numel(imgFiles)
        [~, name, ext] = fileparts(imgFiles(k).name);
        if isempty(ext) || strcmpi(ext, '.db'); continue; end

        srcImg = fullfile(imgRoot, pid, imgFiles(k).name);
        dstImg = fullfile(outImg, [prefix pid '_' name '.jpg']);
        copyfile(srcImg, dstImg);

        info = imfinfo(srcImg);
        h = info.Height; w = info.Width;

        if hasLesion
            if isempty(annSuffix)
                annMatch = dir(fullfile(annRoot, pid, [name '.*']));
            else
                annMatch = dir(fullfile(annRoot, pid, [name annSuffix '.*']));
            end
            annMatch = annMatch(~strcmpi({annMatch.name}, 'Thumbs.db'));

            if isempty(annMatch)
                warning('No annotation for %s / %s', pid, name);
                continue;
            end
            srcMsk = fullfile(annRoot, pid, annMatch(1).name);
            dstMsk = fullfile(outMask, [prefix pid '_' name '.png']);
            copyfile(srcMsk, dstMsk);
        else
            zeroMask = zeros(h, w, 'uint8');
            imwrite(zeroMask, fullfile(outMask, [prefix pid '_' name '.png']));
        end
    end
end
end