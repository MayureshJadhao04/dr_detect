%% trainModel2_384.m - Retrain Model 2 at 384x384 with Focal + Ordinal Loss
clear; clc;
fprintf('=== Starting Model 2 (384x384) Retraining ===\n');

dataRoot = 'D:\DATASETS\model2_384';
labelsPath = fullfile(dataRoot, 'labels.csv');
splitPath  = fullfile(dataRoot, 'model2_split.mat');
maskDir    = fullfile(dataRoot, 'masks_cache');

if ~isfile(labelsPath) || ~isfile(splitPath)
    error('Dataset files missing in %s. Run prepareModel2Data_384 first.', dataRoot);
end

labels = readtable(labelsPath, 'TextType', 'string');
load(splitPath, 'trainIdx2', 'valIdx2');

trainLabels = labels(trainIdx2, :);
valLabels   = labels(valIdx2, :);

fprintf('Training samples: %d, Validation samples: %d\n', height(trainLabels), height(valLabels));

% Mini-batch size 8 optimized for 8GB RTX GPU VRAM
miniBatchSize = 8;
dsTrain = DRClassificationDatastore_384(trainLabels, maskDir, miniBatchSize, true, true);
dsVal   = DRClassificationDatastore_384(valLabels, maskDir, miniBatchSize, true, false);

% Load 384-initialized 7-channel architecture
modelInitPath = 'D:\Projects\dr-screening\models\model2_384_init.mat';
if ~isfile(modelInitPath)
    error('model2_384_init.mat missing. Run buildModel2_384 first.');
end
load(modelInitPath, 'net2_384');

% Inverse-frequency class weights
trainCounts = [1362 276 830 210 252];   % grades 0-4
numClasses = 5;
classWeights = numel(trainIdx2) ./ (numClasses * trainCounts);
classWeightsDL = dlarray(reshape(single(classWeights), [], 1), 'CB');

% Combined Focal (gamma=2.0) + Ordinal Distance (lambda=0.20)
lossFcn = @(Y, T) focalOrdinalLoss(Y, T, classWeightsDL, 2.0, 0.20);

checkpointDir = 'D:\Projects\dr-screening\checkpoints_model2_384';
if ~isfolder(checkpointDir), mkdir(checkpointDir); end

commonOptsCell = { ...
    'MaxEpochs', 15, ...
    'MiniBatchSize', miniBatchSize, ...
    'InitialLearnRate', 1e-4, ...
    'LearnRateSchedule', 'piecewise', ...
    'LearnRateDropPeriod', 10, ...
    'LearnRateDropFactor', 0.2, ...
    'Shuffle', 'every-epoch', ...
    'ValidationData', dsVal, ...
    'ValidationFrequency', 50, ...
    'ValidationPatience', 6, ...
    'ExecutionEnvironment', 'gpu', ...
    'CheckpointPath', checkpointDir, ...
    'CheckpointFrequency', 1, ...
    'Plots', 'none', ...
    'Verbose', true};

try
    options = trainingOptions('adam', commonOptsCell{:}, 'OutputNetwork', 'best-validation');
catch
    options = trainingOptions('adam', commonOptsCell{:}, 'OutputNetwork', 'best-validation-loss');
end

fprintf('Launching trainnet on GPU...\n');
tStart = tic;
net2trained = trainnet(dsTrain, net2_384, lossFcn, options);
tTrain = toc(tStart);

outModelPath = 'D:\Projects\dr-screening\models\model2_final_384.mat';
save(outModelPath, 'net2trained', '-v7.3');
fprintf('=== Training Complete in %.2f hours! Saved to %s ===\n', tTrain/3600, outModelPath);
