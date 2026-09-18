function results = evaluateModel2_384(modelPath)
% EVALUATEMODEL2_384 Evaluates 384x384 Model 2 on validation set
%   Computes 5-class accuracy, per-class recall, Quadratic Kappa, and Referable DR Sensitivity/Specificity.

    if nargin < 1 || isempty(modelPath)
        modelPath = 'D:\Projects\dr-screening\models\model2_final_384.mat';
    end

    dataRoot = 'D:\DATASETS\model2_384';
    labelsPath = fullfile(dataRoot, 'labels.csv');
    splitPath  = fullfile(dataRoot, 'model2_split.mat');
    maskDir    = fullfile(dataRoot, 'masks_cache');

    labels = readtable(labelsPath, 'TextType', 'string');
    load(splitPath, 'valIdx2');
    valLabels = labels(valIdx2, :);

    dsVal = DRClassificationDatastore_384(valLabels, maskDir, 16, true, false);
    reset(dsVal);

    s = load(modelPath);
    if isfield(s, 'net2trained')
        net = s.net2trained;
    elseif isfield(s, 'net2')
        net = s.net2;
    elseif isfield(s, 'net2_384')
        net = s.net2_384;
    end

    numClasses = 5;
    confMat = zeros(numClasses, numClasses);
    nProcessed = 0;
    nTotal = height(valLabels);

    fprintf('Evaluating %s on %d validation samples...\n', modelPath, nTotal);

    while hasdata(dsVal)
        data = read(dsVal);
        X = cat(4, data{:,1}{:});
        T = data{:,2};

        Xdl = dlarray(single(X), 'SSCB');
        scores = predict(net, Xdl);
        scores = extractdata(scores);
        if size(scores, 1) == numClasses && size(scores, 2) ~= numClasses
            scores = scores';
        end

        [~, predIdx] = max(scores, [], 2);
        predGrade = predIdx - 1;
        trueGrade = double(string(T));

        for b = 1:numel(trueGrade)
            r = trueGrade(b) + 1;
            c = predGrade(b) + 1;
            confMat(r, c) = confMat(r, c) + 1;
        end
        nProcessed = nProcessed + numel(trueGrade);
    end

    % 1. Accuracy
    totalN = sum(confMat(:));
    overallAcc = sum(diag(confMat)) / totalN;

    % 2. Per-class Recall
    recalls = zeros(numClasses, 1);
    for g = 1:numClasses
        recalls(g) = confMat(g, g) / max(sum(confMat(g, :)), 1);
    end

    % 3. Quadratic Weighted Kappa
    w = zeros(numClasses, numClasses);
    for i = 1:numClasses
        for j = 1:numClasses
            w(i, j) = ((i - j)^2) / ((numClasses - 1)^2);
        end
    end
    O = confMat / totalN;
    rSum = sum(confMat, 2);
    cSum = sum(confMat, 1);
    E = (rSum * cSum) / (totalN^2);
    qwk = 1 - (sum(sum(w .* O)) / max(sum(sum(w .* E)), 1e-9));

    % 4. Referable DR (Grades 2-4 vs 0-1)
    refTrue = [sum(confMat(1:2, :), 'all'), sum(confMat(3:5, :), 'all')];
    tp = sum(confMat(3:5, 3:5), 'all');
    fn = sum(confMat(3:5, 1:2), 'all');
    tn = sum(confMat(1:2, 1:2), 'all');
    fp = sum(confMat(1:2, 3:5), 'all');

    refSens = tp / max(tp + fn, 1);
    refSpec = tn / max(tn + fp, 1);

    results = struct();
    results.confMat = confMat;
    results.overallAcc = overallAcc;
    results.recalls = recalls;
    results.qwk = qwk;
    results.refSens = refSens;
    results.refSpec = refSpec;

    fprintf('\n=== Model 2 (384px) Validation Results ===\n');
    fprintf('5-Class Accuracy:          %.2f%%\n', overallAcc * 100);
    fprintf('Quadratic Weighted Kappa:  %.4f\n', qwk);
    fprintf('Referable Sensitivity:     %.2f%%\n', refSens * 100);
    fprintf('Referable Specificity:     %.2f%%\n', refSpec * 100);
    fprintf('\nPer-Grade Recall:\n');
    gradeNames = {'0-No DR', '1-Mild', '2-Moderate', '3-Severe', '4-Proliferative'};
    for g = 1:numClasses
        fprintf('  %-16s: %.2f%% (n=%d)\n', gradeNames{g}, recalls(g)*100, sum(confMat(g,:)));
    end
    disp(array2table(confMat, 'VariableNames', {'p0','p1','p2','p3','p4'}, ...
        'RowNames', {'t0','t1','t2','t3','t4'}));
end
