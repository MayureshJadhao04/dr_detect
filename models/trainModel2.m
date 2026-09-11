%% trainModel2.m
clear; clc;

labels = readtable('D:\DATASETS\model2_224\labels.csv', 'TextType', 'string');
load('D:\DATASETS\model2_224\model2_split.mat', 'trainIdx2', 'valIdx2');

trainLabels = labels(trainIdx2, :);
valLabels = labels(valIdx2, :);

maskCacheDir = 'D:\DATASETS\model2_224\masks_cache';

dsTrain2 = DRClassificationDatastore(trainLabels, maskCacheDir, 16);
dsVal2 = DRClassificationDatastore(valLabels, maskCacheDir, 16);

load('D:\Projects\dr-screening\models\model2_fusion_untrained.mat', 'net2');

mkdir('D:\Projects\dr-screening\checkpoints_model2');

commonOptsCell = { ...
    'MaxEpochs', 15, ...
    'MiniBatchSize', 16, ...
    'InitialLearnRate', 1e-4, ...
    'Shuffle', 'every-epoch', ...
    'ValidationData', dsVal2, ...
    'ValidationFrequency', 50, ...
    'ValidationPatience', 10, ...
    'ExecutionEnvironment', 'gpu', ...
    'CheckpointPath', 'D:\Projects\dr-screening\checkpoints_model2', ...
    'CheckpointFrequency', 1, ...
    'Plots', 'training-progress', ...
    'Verbose', true};

try
    options = trainingOptions('adam', commonOptsCell{:}, 'OutputNetwork', 'best-validation');
catch
    options = trainingOptions('adam', commonOptsCell{:}, 'OutputNetwork', 'best-validation-loss');
end

net2trained = trainnet(dsTrain2, net2, 'crossentropy', options);

save('D:\Projects\dr-screening\models\model2_final.mat', 'net2trained', '-v7.3');
fprintf('Model 2 training complete. Saved to model2_final.mat\n');