%% Train Model 2 - ResNet50 transfer learning, DR severity grading (0-4)
clear; clc;

labels = readtable('D:\DATASETS\model2_224\labels.csv', 'TextType', 'string');
labels.grade = categorical(labels.grade);

fprintf('Total images: %d\n', height(labels));
disp(groupcounts(labels, 'grade'));

%% --- Stratified train/validation split (85/15) ---
% Stratified so each grade is proportionally represented in both sets -
% important given the class imbalance (grade 0 dominant).
rng(1);   % fixed seed, reproducible split
cv = cvpartition(labels.grade, 'Holdout', 0.15);

trainLabels = labels(training(cv), :);
valLabels   = labels(test(cv), :);

fprintf('Train: %d images, Validation: %d images\n', height(trainLabels), height(valLabels));

%% --- Build datastores with on-the-fly enhancement ---
% enhanceImage.m runs on every image at read-time, not pre-saved -
% matches the real app's runtime behavior (see earlier decision in
% CONTEXT.md). Requires enhanceImage.m to be on the MATLAB path.

imdsTrain = imageDatastore(trainLabels.image_path, 'Labels', trainLabels.grade);
imdsTrain.ReadFcn = @(filename) enhanceImage(imread(filename));

imdsVal = imageDatastore(valLabels.image_path, 'Labels', valLabels.grade);
imdsVal.ReadFcn = @(filename) enhanceImage(imread(filename));

%% --- Light geometric augmentation (train only) ---
% Rotation + flips only - fundus images have no fixed "up" orientation,
% but color/intensity augmentation is skipped here since enhanceImage
% already normalizes color/illumination.
augmenter = imageDataAugmenter( ...
    'RandRotation', [-15 15], ...
    'RandXReflection', true, ...
    'RandYReflection', true);

inputSize = [224 224 3];
augTrain = augmentedImageDatastore(inputSize, imdsTrain, 'DataAugmentation', augmenter);
augVal   = augmentedImageDatastore(inputSize, imdsVal);   % no augmentation on validation

%% --- Load ResNet50, replace final layers for 5-class grading ---
net = resnet50;
lgraph = layerGraph(net);

numClasses = 5;   % grades 0-4

newFC = fullyConnectedLayer(numClasses, 'Name', 'fc_dr_grade', ...
    'WeightLearnRateFactor', 10, 'BiasLearnRateFactor', 10);
newClassLayer = classificationLayer('Name', 'classoutput_dr_grade');

lgraph = replaceLayer(lgraph, 'fc1000', newFC);
lgraph = replaceLayer(lgraph, 'ClassificationLayer_fc1000', newClassLayer);

%% --- Freeze early layers (speeds training, reduces overfitting risk) ---
% Only the later layers get meaningfully updated - the early
% general-purpose feature detectors from ImageNet stay fixed.
layers = lgraph.Layers;
for i = 1:numel(layers)-10   % leave the last ~10 layers trainable
    modified = false;
    if isprop(layers(i), 'WeightLearnRateFactor')
        layers(i).WeightLearnRateFactor = 0;
        modified = true;
    end
    if isprop(layers(i), 'BiasLearnRateFactor')
        layers(i).BiasLearnRateFactor = 0;
        modified = true;
    end
    if modified
        lgraph = replaceLayer(lgraph, layers(i).Name, layers(i));
    end
end

%% --- Training options ---
options = trainingOptions('adam', ...
    'InitialLearnRate', 1e-4, ...
    'MiniBatchSize', 32, ...
    'MaxEpochs', 25, ...
    'Shuffle', 'every-epoch', ...
    'ValidationData', augVal, ...
    'ValidationFrequency', floor(height(trainLabels)/32), ...
    'ValidationPatience', 5, ...
    'Verbose', true, ...
    'Plots', 'training-progress', ...
    'ExecutionEnvironment', 'gpu');

%% --- Train ---
[model2, trainInfo] = trainNetwork(augTrain, lgraph, options);

%% --- Save ---
save('D:\DATASETS\model2_resnet50.mat', 'model2', 'trainInfo');
fprintf('Done. Model saved to D:\\DATASETS\\model2_resnet50.mat\n');
