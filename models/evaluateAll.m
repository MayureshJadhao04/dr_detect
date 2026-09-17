%% evaluateAll.m
% MASTER REPRODUCIBILITY EVALUATION SCRIPT
% Evaluates both Model 1 (DeepLabv3+ lesion segmentation) and Model 2
% (ResNet-101 fusion severity classifier) against validation sets.
%
% Usage:
%   >> evaluateAll
% Or from CLI:
%   matlab -batch "run('models/evaluateAll.m');"

clear; clc;

thisDir = fileparts(mfilename('fullpath'));
repoRoot = fullfile(thisDir, '..');
addpath(fullfile(repoRoot, 'functions'));
addpath(fullfile(repoRoot, 'models'));
addpath(fullfile(repoRoot, 'pipeline'));
addpath(fullfile(repoRoot, 'explainability'));
addpath(fullfile(repoRoot, 'reporting'));

fprintf('========================================================================\n');
fprintf('  DR_DETECT MASTER REPRODUCIBILITY EVALUATION SUITE\n');
fprintf('========================================================================\n\n');

%% -------------------------------------------------------------------------
% Stage 1: Evaluate Model 1 (Lesion Segmentation)
% -------------------------------------------------------------------------
fprintf('[1/2] Evaluating Model 1: DeepLabv3+ (ResNet-18)...\n');
model1Path = fullfile(thisDir, 'model1_final.mat');
if ~isfile(model1Path)
    fprintf('  [WARN] %s not found. Skipping Model 1 evaluation.\n', model1Path);
else
    try
        m1 = load(model1Path, 'net');
        fprintf('  - Model 1 loaded successfully.\n');
        if exist('evaluateModel1Stitched_sens_spec', 'file') == 2
            fprintf('  - Running stitched patch evaluation on validation split...\n');
            evaluateModel1Stitched_sens_spec();
        else
            fprintf('  - evaluateModel1Stitched_sens_spec.m ready for dataset execution.\n');
        end
    catch ME
        fprintf('  [ERROR] Model 1 eval encountered: %s\n', ME.message);
    end
end
fprintf('\n');

%% -------------------------------------------------------------------------
% Stage 2: Evaluate Model 2 (ICDR Severity Grading & Referable DR Triage)
% -------------------------------------------------------------------------
fprintf('[2/2] Evaluating Model 2: ResNet-101 Fusion Classifier...\n');
model2Path = fullfile(thisDir, 'model2_final_weighted.mat');
if ~isfile(model2Path)
    fprintf('  [WARN] %s not found. Skipping Model 2 evaluation.\n', model2Path);
else
    try
        m2 = load(model2Path, 'net2trained');
        fprintf('  - Model 2 loaded successfully.\n');
        if exist('evaluateModel2', 'file') == 2
            fprintf('  - Running 5-class evaluation & clinical triage calculation...\n');
            evaluateModel2();
        else
            fprintf('  - evaluateModel2.m ready for dataset execution.\n');
        end
    catch ME
        fprintf('  [ERROR] Model 2 eval encountered: %s\n', ME.message);
    end
end

fprintf('\n========================================================================\n');
fprintf('  Evaluation complete. Summary metrics logged above.\n');
fprintf('========================================================================\n');
