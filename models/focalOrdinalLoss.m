function loss = focalOrdinalLoss(Y, T, classWeights, gamma, lambdaOrd)
% FOCALORDINALLOSS Combined Focal Loss and Ordinal Distance Penalty
%   Y: Softmax probabilities dlarray [numClasses, batchSize]
%   T: One-hot ground truth dlarray [numClasses, batchSize]
%   classWeights: Inverse-frequency class weight vector [numClasses, 1]
%   gamma: Focal parameter (default 2.0, down-weights easy Grade 0 images)
%   lambdaOrd: Ordinal penalty weight (default 0.20, penalizes (y_true - y_pred)^2)

    if nargin < 3 || isempty(classWeights)
        classWeights = dlarray(ones(size(Y, 1), 1), 'CB');
    elseif ~isa(classWeights, 'dlarray')
        classWeights = dlarray(reshape(single(classWeights), [], 1), 'CB');
    end
    if nargin < 4 || isempty(gamma)
        gamma = 2.0;
    end
    if nargin < 5 || isempty(lambdaOrd)
        lambdaOrd = 0.20;
    end

    epsVal = 1e-7;
    Y_clamped = max(epsVal, min(1 - epsVal, Y));

    % 1. Multi-class Focal Loss
    focalLoss = -sum(classWeights .* ((1 - Y_clamped).^gamma) .* T .* log(Y_clamped), 1);

    % 2. Ordinal Quadratic Distance Penalty
    numClasses = size(Y, 1);
    gradeVector = dlarray(reshape(single(0:(numClasses - 1)), [], 1), 'CB');
    predGrade = sum(gradeVector .* Y, 1);
    trueGrade = sum(gradeVector .* T, 1);
    ordinalPenalty = (predGrade - trueGrade).^2;

    % 3. Total batch loss
    loss = mean(focalLoss + lambdaOrd * ordinalPenalty);
end
