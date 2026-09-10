%% resumeTrainModel1.m
clear; clc;

patchesOversampled = readtable('D:\DATASETS\combined\training_patch_manifest_oversampled.csv', 'TextType', 'string');
valPatches = readtable('D:\DATASETS\combined\val_patch_manifest.csv', 'TextType', 'string');
manifest = readtable('D:\DATASETS\combined\manifest.csv', 'TextType', 'string');
load('D:\DATASETS\combined\channelPosWeights.mat');          % posWeights
load('D:\Projects\dr-screening\models\model1_trained.mat', 'net');  % your recovered epoch-2 net

ds = DRPatchDatastore(patchesOversampled, manifest, 16);
dsVal = DRPatchDatastore(valPatches, manifest, 16);

mkdir('D:\Projects\dr-screening\checkpoints_resume');

commonOptsCell = { ...
    'MaxEpochs', 15, ...
    'MiniBatchSize', 16, ...
    'InitialLearnRate', 2e-5, ...
    'Shuffle', 'every-epoch', ...
    'ValidationData', dsVal, ...
    'ValidationFrequency', 300, ...
    'ValidationPatience', 30, ...
    'ExecutionEnvironment', 'gpu', ...
    'CheckpointPath', 'D:\Projects\dr-screening\checkpoints_resume', ...
    'CheckpointFrequency', 1, ...
    'Plots', 'training-progress', ...
    'Verbose', true};

try
    options = trainingOptions('adam', commonOptsCell{:}, 'OutputNetwork', 'best-validation');
catch
    options = trainingOptions('adam', commonOptsCell{:}, 'OutputNetwork', 'best-validation-loss');
end

diceWeight = 2.0;   % raised from 1.0 -- experiment to help rare classes (light, prolif)
lossFcn = @(Y,T) maskedWeightedBCELoss(Y, T, posWeights, diceWeight);

[net, info] = trainnet(ds, net, lossFcn, options);

save('D:\Projects\dr-screening\models\model1_trained_v2.mat', 'net', 'info', '-v7.3');
fprintf('Resumed training complete. Saved to model1_trained_v2.mat\n');