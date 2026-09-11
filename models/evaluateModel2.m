%% evaluateModel2.m
% Evaluates a Model 2 (fusion ResNet101) checkpoint on the stratified
% validation split. Reports overall accuracy plus per-grade recall and
% a confusion matrix, since aggregate accuracy alone hides minority-
% grade performance (see grade 3 in the unweighted baseline).
%
% EDIT modelFile / modelVar below before running.

clear; clc;

%% --- EDIT THESE ---
modelFile = 'D:\Projects\dr-screening\models\model2_noBranchB.mat';
modelVar  = 'net2trained';
useMask   = false;
%% -------------------

labels = readtable('D:\DATASETS\model2_224\labels.csv', 'TextType', 'string');
load('D:\DATASETS\model2_224\model2_split.mat', 'valIdx2');
valLabels = labels(valIdx2, :);

maskCacheDir = 'D:\DATASETS\model2_224\masks_cache';
dsVal2 = DRClassificationDatastore(valLabels, maskCacheDir, 16, useMask);
reset(dsVal2);

s = load(modelFile, modelVar);
net2 = s.(modelVar);

gradeNames = {'0-Normal','1-Mild','2-Moderate','3-Severe','4-Prolif'};
numClasses = 5;
confMat = zeros(numClasses, numClasses);   % rows = true, cols = predicted

nProcessed = 0;
fprintf('Evaluating %s over %d validation images...\n', modelFile, height(valLabels));

while hasdata(dsVal2)
    data = read(dsVal2);
    X = cat(4, data{:,1}{:});              % [224 224 7 B]
    T = data{:,2};                          % categorical labels, Bx1

    Xdl = dlarray(single(X), 'SSCB');
    scores = predict(net2, Xdl);            % [B x 5] or [5 x B] depending on output format -- checked below
    scores = extractdata(scores);
    if size(scores,1) == numClasses && size(scores,2) ~= numClasses
        scores = scores';                   % normalize to [B x 5]
    end
    [~, predIdx] = max(scores, [], 2);
    predGrade = predIdx - 1;                % 0-indexed grade

    trueGrade = double(string(T));          % categorical 0:4 -> numeric

    for b = 1:numel(trueGrade)
        r = trueGrade(b) + 1;
        c = predGrade(b) + 1;
        confMat(r, c) = confMat(r, c) + 1;
    end

    nProcessed = nProcessed + numel(trueGrade);
    if mod(nProcessed, 100) < 16
        fprintf(' ...processed %d images\n', nProcessed);
    end
end

overallAcc = sum(diag(confMat)) / sum(confMat(:));

fprintf('\n=== Model 2 Validation Results (%s) ===\n', modelFile);
fprintf('Overall accuracy: %.4f\n\n', overallAcc);
fprintf('%-14s %-8s %-6s\n', 'Grade', 'Recall', 'n');
for g = 1:numClasses
    n = sum(confMat(g,:));
    recall = confMat(g,g) / max(n,1);
    fprintf('%-14s %-8.3f %-6d\n', gradeNames{g}, recall, n);
end

fprintf('\nConfusion matrix (rows=true, cols=predicted, order 0..4):\n');
disp(array2table(confMat, 'VariableNames', {'p0','p1','p2','p3','p4'}, ...
    'RowNames', {'t0','t1','t2','t3','t4'}));