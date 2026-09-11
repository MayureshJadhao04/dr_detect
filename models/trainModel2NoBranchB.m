%% trainModel2NoBranchB.m
% Ablation: fine-tunes the ORIGINAL, UNMODIFIED DDR-pretrained ResNet101
% (3-channel RGB input, already 5-class output -- no Model 1 mask
% concatenated) on the same grade labels/split/class-weighted loss as
% trainModel2Weighted.m. Purpose: quantify whether Model 1's mask input
% (Branch B) actually helps classification, for the report.

clear; clc;

labels = readtable('D:\DATASETS\model2_224\labels.csv', 'TextType', 'string');
load('D:\DATASETS\model2_224\model2_split.mat', 'trainIdx2', 'valIdx2');

trainLabels = labels(trainIdx2, :);
valLabels = labels(valIdx2, :);

maskCacheDir = 'D:\DATASETS\model2_224\masks_cache';   % unused when useMask=false, but datastore still needs the arg

dsTrain2 = DRClassificationDatastore(trainLabels, maskCacheDir, 16, false);   % useMask = false
dsVal2   = DRClassificationDatastore(valLabels,   maskCacheDir, 16, false);

% Re-download/load the ORIGINAL unmodified DDR net -- 3-channel input,
% 5-class output already matches the grading scale, no splicing needed.
zipFile = matlab.internal.examples.downloadSupportFile("image","data/DRClassificationModelAndDataset.zip");
filepath = fileparts(zipFile);
unzip(zipFile,filepath)
trainedNetFile = fullfile(filepath,"trainedDRModel_resnet101.mat");
trainedNetData = load(trainedNetFile);
net2_noMask = trainedNetData.trainedNet;

% Same inverse-frequency class weights as the weighted fusion run
trainCounts = [1362 276 830 210 252];   % grades 0-4
numClasses = 5;
classWeights = numel(trainIdx2) ./ (numClasses * trainCounts);

lossFcn = @(Y,T) crossentropy(Y, T, single(classWeights), ...
    'NormalizationFactor', 'all-elements', 'WeightsFormat', 'C') * numClasses;

mkdir('D:\Projects\dr-screening\checkpoints_model2_noBranchB');

commonOptsCell = { ...
    'MaxEpochs', 15, ...
    'MiniBatchSize', 16, ...
    'InitialLearnRate', 1e-4, ...
    'Shuffle', 'every-epoch', ...
    'ValidationData', dsVal2, ...
    'ValidationFrequency', 50, ...
    'ValidationPatience', 10, ...
    'ExecutionEnvironment', 'gpu', ...
    'CheckpointPath', 'D:\Projects\dr-screening\checkpoints_model2_noBranchB', ...
    'CheckpointFrequency', 1, ...
    'Plots', 'training-progress', ...
    'Verbose', true};

try
    options = trainingOptions('adam', commonOptsCell{:}, 'OutputNetwork', 'best-validation');
catch
    options = trainingOptions('adam', commonOptsCell{:}, 'OutputNetwork', 'best-validation-loss');
end

net2trained = trainnet(dsTrain2, net2_noMask, lossFcn, options);

save('D:\Projects\dr-screening\models\model2_noBranchB.mat', 'net2trained', '-v7.3');
fprintf('No-Branch-B ablation training complete. Saved to model2_noBranchB.mat\n');
