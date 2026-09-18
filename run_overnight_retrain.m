%% run_overnight_retrain.m - Master Autonomous Retraining & Hybrid Bridge Pipeline
clear; clc;

logFile = 'D:\Projects\dr-screening\retrain_execution.log';
diary(logFile);

fprintf('=======================================================\n');
fprintf('  DR_DETECT AUTONOMOUS RETRAINING & HYBRID BRIDGE RUN  \n');
fprintf('  Start Time: %s\n', datestr(now));
fprintf('=======================================================\n\n');

addpath('data_prep', 'models', 'functions', 'pipeline', 'explainability');

dataRoot = 'D:\DATASETS\model2_384';
labelsPath = fullfile(dataRoot, 'labels.csv');

%% Step 1: 384x384 Dataset Preparation
fprintf('[STEP 1/5] Checking 384x384 Dataset Preparation...\n');
needPrep = true;
if isfile(labelsPath)
    try
        T = readtable(labelsPath);
        if height(T) >= 3400
            fprintf('  Dataset already precomputed (%d images found). Skipping prep.\n', height(T));
            needPrep = false;
        end
    catch
        needPrep = true;
    end
end

if needPrep
    fprintf('  Extracting 384x384 images, continuous soft masks & 4-2-1 clinical biomarkers...\n');
    tPrep = tic;
    prepareModel2Data_384(dataRoot);
    fprintf('  Dataset prep completed in %.2f minutes.\n', toc(tPrep)/60);
end

%% Step 2: Architecture Initialization
fprintf('\n[STEP 2/5] Initializing 384x384 ResNet-101 (7-channel input)...\n');
initModelPath = 'D:\Projects\dr-screening\models\model2_384_init.mat';
if ~isfile(initModelPath)
    s = load('models/model2_fusion_untrained.mat');
    lg = layerGraph(s.net2);
    lg = replaceLayer(lg, 'data', imageInputLayer([384 384 7], 'Name', 'data', 'Normalization', 'zerocenter'));
    net2_384 = dlnetwork(lg);
    save(initModelPath, 'net2_384', '-v7.3');
    fprintf('  Created and saved %s\n', initModelPath);
else
    fprintf('  %s exists. Reusing.\n', initModelPath);
end

%% Step 3: Model 2 (384px + Focal + Ordinal) Retraining
fprintf('\n[STEP 3/5] Launching Retraining (15 epochs, Focal gamma=2.0, Ordinal lambda=0.20)...\n');
trainModel2_384;

%% Step 4: Standalone CNN Validation & Metrics
fprintf('\n[STEP 4/5] Evaluating Retrained Model 2 (384px) on 516 Validation Images...\n');
trainedModelPath = 'D:\Projects\dr-screening\models\model2_final_384.mat';
resultsCnn = evaluateModel2_384(trainedModelPath);

%% Step 5: Late-Fusion Hybrid Feature Bridge
fprintf('\n[STEP 5/5] Stacking 5 CNN Softmax Outputs + 4-2-1 Clinical Biomarkers...\n');
bridgePath = 'D:\Projects\dr-screening\models\late_fusion_bridge.mat';
bridgeResults = trainLateFusionBridge(trainedModelPath, bridgePath);

fprintf('\n=======================================================\n');
fprintf('  RETRAINING & HYBRID BRIDGE COMPLETE!\n');
fprintf('  End Time: %s\n', datestr(now));
fprintf('  Results Summary:\n');
fprintf('    Raw 384px CNN 5-Class Accuracy: %.2f%%\n', resultsCnn.overallAcc * 100);
fprintf('    Quadratic Weighted Kappa:       %.4f\n', resultsCnn.qwk);
fprintf('    Referable DR Sensitivity:       %.2f%%\n', resultsCnn.refSens * 100);
fprintf('    Hybrid Bridge Stacked Acc:      %.2f%%\n', bridgeResults.bridgeAcc * 100);
fprintf('=======================================================\n');

diary off;
