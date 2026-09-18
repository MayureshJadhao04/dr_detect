function bridgeModel = trainLateFusionBridge(modelPath, outBridgePath)
% TRAINLATEFUSIONBRIDGE Stacks 5 CNN Softmax outputs with 4 clinical biomarkers
%   Features: [P0, P1, P2, P3, P4, N_MA, A_Heme, Q_Heme, F_NV] (9 features)
%   Model: Multinomial Logistic / Softmax Classification Head
%   Implements the international clinical 4-2-1 rule directly.

    if nargin < 1 || isempty(modelPath)
        modelPath = 'D:\Projects\dr-screening\models\model2_final_384.mat';
    end
    if nargin < 2 || isempty(outBridgePath)
        outBridgePath = 'D:\Projects\dr-screening\models\late_fusion_bridge.mat';
    end

    dataRoot = 'D:\DATASETS\model2_384';
    labelsPath = fullfile(dataRoot, 'labels.csv');
    splitPath  = fullfile(dataRoot, 'model2_split.mat');
    maskDir    = fullfile(dataRoot, 'masks_cache');

    labels = readtable(labelsPath, 'TextType', 'string');
    load(splitPath, 'trainIdx2', 'valIdx2');

    trainLabels = labels(trainIdx2, :);
    valLabels   = labels(valIdx2, :);

    s = load(modelPath);
    if isfield(s, 'net2trained')
        net = s.net2trained;
    elseif isfield(s, 'net2')
        net = s.net2;
    elseif isfield(s, 'net2_384')
        net = s.net2_384;
    end

    fprintf('Extracting features for Late-Fusion Hybrid Bridge...\n');

    % Extract Training Features
    [X_train, y_train] = extractStackedFeatures(net, trainLabels, maskDir);
    % Extract Validation Features
    [X_val, y_val]     = extractStackedFeatures(net, valLabels, maskDir);

    fprintf('Fitting Multinomial Bridge Model on %d training samples...\n', size(X_train, 1));
    % Fit multinomial model (using mnrfit or fitcecoc)
    % Normalize clinical features
    mu = mean(X_train(:, 6:9), 1);
    sigma = std(X_train(:, 6:9), 0, 1) + 1e-6;

    X_train_norm = X_train;
    X_train_norm(:, 6:9) = (X_train(:, 6:9) - mu) ./ sigma;

    X_val_norm = X_val;
    X_val_norm(:, 6:9) = (X_val(:, 6:9) - mu) ./ sigma;

    % Fit multiclass linear logistic model
    t = templateLinear('Learner', 'logistic', 'Regularization', 'ridge');
    bridgeClassifier = fitcecoc(X_train_norm, y_train, 'Learners', t);

    % Validation
    [predVal, ~] = predict(bridgeClassifier, X_val_norm);
    rawCnnPred = zeros(size(y_val));
    for i = 1:numel(y_val)
        [~, maxIdx] = max(X_val(i, 1:5));
        rawCnnPred(i) = maxIdx - 1;
    end

    rawAcc = mean(rawCnnPred == y_val);
    bridgeAcc = mean(predVal == y_val);

    fprintf('\n=== Hybrid Feature Bridge Evaluation ===\n');
    fprintf('Raw CNN (384px) Accuracy:      %.2f%%\n', rawAcc * 100);
    fprintf('Hybrid Late-Fusion Accuracy:   %.2f%%\n', bridgeAcc * 100);

    bridgeModel = struct();
    bridgeModel.classifier = bridgeClassifier;
    bridgeModel.mu = mu;
    bridgeModel.sigma = sigma;
    bridgeModel.rawAcc = rawAcc;
    bridgeModel.bridgeAcc = bridgeAcc;

    save(outBridgePath, 'bridgeModel', '-v7.3');
    fprintf('Saved Hybrid Bridge model to %s\n', outBridgePath);
end

function [X_all, y_all] = extractStackedFeatures(net, labelsTbl, maskDir)
    n = height(labelsTbl);
    X_all = zeros(n, 9, 'single');
    y_all = double(labelsTbl.grade);

    numClasses = 5;
    miniBatch = 16;
    ds = DRClassificationDatastore_384(labelsTbl, maskDir, miniBatch, true, false);

    curr = 1;
    while hasdata(ds)
        [data, info] = read(ds);
        X = cat(4, data{:,1}{:});
        batchN = size(X, 4);

        Xdl = dlarray(single(X), 'SSCB');
        scores = predict(net, Xdl);
        scores = extractdata(scores);
        if size(scores, 1) == numClasses && size(scores, 2) ~= numClasses
            scores = scores';
        end

        for b = 1:batchN
            rowIdx = info.Indices(b);
            [~, imgName, ~] = fileparts(labelsTbl.image_path(rowIdx));
            maskMat = fullfile(maskDir, imgName + ".mat");
            if isfile(maskMat)
                mData = load(maskMat, 'clinicalFeatures');
                clin = single(mData.clinicalFeatures);
            else
                clin = zeros(1, 4, 'single');
            end
            X_all(curr, 1:5) = scores(b, :);
            X_all(curr, 6:9) = clin;
            curr = curr + 1;
        end
    end
end
