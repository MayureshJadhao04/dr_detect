%% gradCAMDemo.m
% Runs generateGradCAM.m on a handful of validation images (one per
% grade where possible, for report figures) and saves annotated
% overlay images to the explainability\ folder.

clear; clc;

modelFile = 'D:\Projects\dr-screening\models\model2_final_weighted.mat';
modelVar  = 'net2trained';
outDir    = 'D:\Projects\dr-screening\explainability\gradcam_samples';
maskCacheDir = 'D:\DATASETS\model2_224\masks_cache';
nPerGrade = 2;   % how many example images per grade to generate

if ~exist(outDir, 'dir')
    mkdir(outDir);
end

labels = readtable('D:\DATASETS\model2_224\labels.csv', 'TextType', 'string');
load('D:\DATASETS\model2_224\model2_split.mat', 'valIdx2');
valLabels = labels(valIdx2, :);

s = load(modelFile, modelVar);
net2 = s.(modelVar);

gradeNames = {'Normal','Mild','Moderate','Severe','Proliferative'};

for g = 0:4
    rowsThisGrade = find(valLabels.grade == g);
    if isempty(rowsThisGrade)
        fprintf('No val images for grade %d, skipping.\n', g);
        continue;
    end
    nSamples = min(nPerGrade, numel(rowsThisGrade));
    pickRows = rowsThisGrade(1:nSamples);

    for r = 1:numel(pickRows)
        row = valLabels(pickRows(r), :);

        img = imread(row.image_path);
        imgResized = single(imresize(img, [224 224]));

        [~, imgName, ~] = fileparts(row.image_path);
        maskData = load(fullfile(maskCacheDir, imgName + ".mat"), 'maskResized');

        [heatmap, predGrade, confidence, scoresAll] = ...
            generateGradCAM(net2, imgResized, maskData.maskResized);

        fig = figure('Visible', 'off', 'Position', [100 100 900 400]);

        subplot(1,2,1);
        imshow(uint8(imgResized));
        title(sprintf('Original -- True: %s (grade %d)', gradeNames{g+1}, g));

        subplot(1,2,2);
        imshow(uint8(imgResized));
        hold on;
        h = imagesc(heatmap);
        set(h, 'AlphaData', 0.45 * heatmap);
        colormap(gca, 'jet');
        hold off;
        title(sprintf('Grad-CAM -- Pred: %s (%.1f%% conf)', ...
            gradeNames{predGrade+1}, confidence*100));

        outFile = fullfile(outDir, sprintf('grade%d_%s.png', g, imgName));
        saveas(fig, outFile);
        close(fig);

        fprintf('Grade %d, %s: true=%d pred=%d conf=%.3f -> saved %s\n', ...
            g, imgName, g, predGrade, confidence, outFile);
    end
end

fprintf('\nDone. Grad-CAM samples saved to %s\n', outDir);
