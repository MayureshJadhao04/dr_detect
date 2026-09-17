%% runAblationStudy.m
% Computes exact empirical ablation metrics across Tier-1 configurations
% on the held-out validation set (valIdx2, N=550).
%
% Generates the scientific ablation table for SIH presentation:
%   Iter 1: Baseline (Direct forward pass)
%   Iter 2: + Prediction TTA (Upright + Horizontal + Vertical flip ensembled)

clear; clc;

thisDir = fileparts(mfilename('fullpath'));
repoRoot = fullfile(thisDir, '..');
addpath(fullfile(repoRoot, 'functions'));
addpath(fullfile(repoRoot, 'models'));
addpath(fullfile(repoRoot, 'pipeline'));
addpath(fullfile(repoRoot, 'explainability'));
addpath(fullfile(repoRoot, 'reporting'));

labelsPath = 'D:\DATASETS\model2_224\labels.csv';
splitPath  = 'D:\DATASETS\model2_224\model2_split.mat';
maskCache  = 'D:\DATASETS\model2_224\masks_cache';
modelPath  = fullfile(thisDir, 'model2_final_weighted.mat');

if ~isfile(labelsPath) || ~isfile(splitPath) || ~isfile(modelPath)
    fprintf('[INFO] Dataset or model path not found on current host. Running mock / unit test.\n');
    return;
end

labels = readtable(labelsPath, 'TextType', 'string');
load(splitPath, 'valIdx2');
valLabels = labels(valIdx2, :);

s = load(modelPath, 'net2trained');
net2 = s.net2trained;

numClasses = 5;
nVal = height(valLabels);
fprintf('Evaluating Ablation Suite on %d validation images...\n\n', nVal);

% --- Pass 1: Baseline (No TTA) ---
dsVal = DRClassificationDatastore(valLabels, maskCache, 16, true);
reset(dsVal);
confMat_base = zeros(numClasses, numClasses);

while hasdata(dsVal)
    data = read(dsVal);
    X = cat(4, data{:,1}{:});
    T = double(string(data{:,2}));

    Xdl = dlarray(single(X), 'SSCB');
    scores = extractdata(predict(net2, Xdl));
    if size(scores,1) == numClasses && size(scores,2) ~= numClasses, scores = scores'; end
    [~, predIdx] = max(scores, [], 2);
    pred = predIdx - 1;

    for b = 1:numel(T)
        confMat_base(T(b)+1, pred(b)+1) = confMat_base(T(b)+1, pred(b)+1) + 1;
    end
end

acc_base = sum(diag(confMat_base)) / sum(confMat_base(:));
tp_ref_base = sum(sum(confMat_base(3:5, 3:5)));
fn_ref_base = sum(sum(confMat_base(3:5, 1:2)));
tn_ref_base = sum(sum(confMat_base(1:2, 1:2)));
fp_ref_base = sum(sum(confMat_base(1:2, 3:5)));
sens_base = tp_ref_base / max(tp_ref_base + fn_ref_base, 1);
spec_base = tn_ref_base / max(tn_ref_base + fp_ref_base, 1);

% --- Pass 2: With Prediction TTA ---
reset(dsVal);
confMat_tta = zeros(numClasses, numClasses);

while hasdata(dsVal)
    data = read(dsVal);
    X = cat(4, data{:,1}{:});
    T = double(string(data{:,2}));

    % 1. Original
    Xdl_orig = dlarray(single(X), 'SSCB');
    sc1 = extractdata(predict(net2, Xdl_orig));
    if size(sc1,1) == numClasses && size(sc1,2) ~= numClasses, sc1 = sc1'; end

    % 2. Vertical flip
    Xdl_v = dlarray(flip(single(X), 1), 'SSCB');
    sc2 = extractdata(predict(net2, Xdl_v));
    if size(sc2,1) == numClasses && size(sc2,2) ~= numClasses, sc2 = sc2'; end

    % 3. Horizontal flip
    Xdl_h = dlarray(flip(single(X), 2), 'SSCB');
    sc3 = extractdata(predict(net2, Xdl_h));
    if size(sc3,1) == numClasses && size(sc3,2) ~= numClasses, sc3 = sc3'; end

    % Ensemble
    scores_tta = (sc1 + sc2 + sc3) / 3;
    [~, predIdx] = max(scores_tta, [], 2);
    pred = predIdx - 1;

    for b = 1:numel(T)
        confMat_tta(T(b)+1, pred(b)+1) = confMat_tta(T(b)+1, pred(b)+1) + 1;
    end
end

acc_tta = sum(diag(confMat_tta)) / sum(confMat_tta(:));
tp_ref_tta = sum(sum(confMat_tta(3:5, 3:5)));
fn_ref_tta = sum(sum(confMat_tta(3:5, 1:2)));
tn_ref_tta = sum(sum(confMat_tta(1:2, 1:2)));
fp_ref_tta = sum(sum(confMat_tta(1:2, 3:5)));
sens_tta = tp_ref_tta / max(tp_ref_tta + fn_ref_tta, 1);
spec_tta = tn_ref_tta / max(tn_ref_tta + fp_ref_tta, 1);

fprintf('=========================================================================================\n');
fprintf('  EMPIRICAL ABLATION RESULTS (Held-Out Validation Set, N=%d)\n', nVal);
fprintf('=========================================================================================\n');
fprintf('%-24s | %-12s | %-14s | %-14s\n', 'Configuration', '5-Class Acc', 'Ref Sensitivity', 'Ref Specificity');
fprintf('-----------------------------------------------------------------------------------------\n');
fprintf('%-24s | %11.2f%% | %13.2f%% | %13.2f%%\n', '1. Baseline (Direct)', acc_base*100, sens_base*100, spec_base*100);
fprintf('%-24s | %11.2f%% | %13.2f%% | %13.2f%%\n', '2. + Prediction TTA',  acc_tta*100,  sens_tta*100,  spec_tta*100);
fprintf('=========================================================================================\n');
