%% trainModel1.m
% Trains Model 1 (deeplabv3plus resnet18, softmax removed, 4-channel
% raw-logit output) using DRPatchDatastore + maskedWeightedBCELoss.
% Safe for unattended/overnight runs: per-epoch checkpointing,
% validation-based early stopping, best-checkpoint output.

clear; clc;

%% Reload all required data/objects fresh
patchesOversampled = readtable('D:\DATASETS\combined\training_patch_manifest_oversampled.csv', 'TextType', 'string');
valPatches = readtable('D:\DATASETS\combined\val_patch_manifest.csv', 'TextType', 'string');
manifest = readtable('D:\DATASETS\combined\manifest.csv', 'TextType', 'string');
load('D:\DATASETS\combined\channelPosWeights.mat')   % posWeights

%% Rebuild network (confirmed working sequence from this session)
net = deeplabv3plus([256 256 3], 4, "resnet18");
net = removeLayers(net, "softmax-out");
net = initialize(net);

%% Rebuild datastores
ds = DRPatchDatastore(patchesOversampled, manifest, 16);
dsVal = DRPatchDatastore(valPatches, manifest, 16);

%% Training options
mkdir("D:\Projects\dr-screening\checkpoints");

commonOpts = { ...
    'MaxEpochs', 30, ...
    'MiniBatchSize', 16, ...
    'InitialLearnRate', 1e-4, ...
    'Shuffle', "every-epoch", ...
    'ValidationData', dsVal, ...
    'ValidationFrequency', 300, ...
    'ValidationPatience', 20, ...
    'ExecutionEnvironment', "gpu", ...
    'CheckpointPath', "D:\Projects\dr-screening\checkpoints", ...
    'CheckpointFrequency', 1, ...
    'Plots', "training-progress", ...
    'Verbose', true};

try
    options = trainingOptions("adam", commonOpts{:}, 'OutputNetwork', "best-validation");
catch
    options = trainingOptions("adam", commonOpts{:}, 'OutputNetwork', "best-validation-loss");
end

lossFcn = @(Y,T) maskedWeightedBCELoss(Y, T, posWeights, 1.0);

%% Train
[net, info] = trainnet(ds, net, lossFcn, options);

%% Save final result
save('D:\Projects\dr-screening\models\model1_trained.mat', 'net', 'info', '-v7.3');
fprintf('Training complete. Saved to model1_trained.mat\n');