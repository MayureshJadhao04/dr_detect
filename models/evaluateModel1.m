%% evaluateModel1.m
% Positive/empty-split quality gate for Model 1, computed against
% grid-only native-resolution validation patches (dsVal).
%
% For each channel (vessel/dark/light/prolif), computes:
%   - Sensitivity (recall): of real positive pixels, how many caught
%   - Specificity: of real negative pixels, how many correctly left alone
%   - Dice, IoU: standard overlap metrics
% Pixels/patches where the channel's validity flag is 0 (mask unknown,
% not "empty") are EXCLUDED entirely from all stats for that channel --
% counting them as true negatives would be fabricating ground truth we
% don't actually have.
%
% Also separately counts how many POSITIVE patches (i.e. genuinely
% containing that lesion/vessel type) were available for each channel,
% since prolif is known to be extremely thin (49/4132 patches) and its
% numbers should be read with that in mind, not trusted equally with
% vessel/dark/light.

clear; clc;

THRESHOLD = 0.5;   % probability threshold for binarizing sigmoid output
                     % -- a judgment call, not derived from data; 0.5 is
                     % the standard default, revisit if sensitivity/
                     % specificity trade-off needs shifting later

load('D:\Projects\dr-screening\models\model1_trained.mat', 'net');

valPatches = readtable('D:\DATASETS\combined\val_patch_manifest.csv', 'TextType', 'string');
manifest = readtable('D:\DATASETS\combined\manifest.csv', 'TextType', 'string');
dsVal = DRPatchDatastore(valPatches, manifest, 16);

channelNames = ["vessel","dark","light","prolif"];

TP = zeros(1,4); FP = zeros(1,4); FN = zeros(1,4); TN = zeros(1,4);
numPositivePatches = zeros(1,4);
numValidPatches = zeros(1,4);
patchDiceList = cell(1,4);   % per-channel list of per-patch Dice, positive patches only

reset(dsVal);
fprintf('Evaluating over %d validation patches...\n', dsVal.NumObservations);

batchNum = 0;
while hasdata(dsVal)
    data = read(dsVal);
    batchNum = batchNum + 1;
    n = height(data);

    imgBatch = cat(4, data.InputImage{:});
    dlX = dlarray(single(imgBatch), 'SSCB');

    Y = predict(net, dlX);              % raw logits, [256 256 4 n]
    probs = extractdata(sigmoid(Y));    % independent per-channel probabilities
    predBinary = probs > THRESHOLD;

    for s = 1:n
        target = data.Target{s};        % [256 256 8] logical
        for c = 1:4
            hasFlag = target(1,1,4+c);  % broadcast flag -- any pixel works
            if ~hasFlag
                continue;                % ground truth unknown -- exclude entirely
            end
            numValidPatches(c) = numValidPatches(c) + 1;

            gt = target(:,:,c);
            pred = predBinary(:,:,c,s);

            tp = sum(gt & pred, 'all');
            fp = sum(~gt & pred, 'all');
            fn = sum(gt & ~pred, 'all');
            tn = sum(~gt & ~pred, 'all');

            TP(c) = TP(c) + tp; FP(c) = FP(c) + fp;
            FN(c) = FN(c) + fn; TN(c) = TN(c) + tn;

            if any(gt(:))
                numPositivePatches(c) = numPositivePatches(c) + 1;
                dicePatch = 2*tp / max(2*tp + fp + fn, 1);  % avoid 0/0
                patchDiceList{c}(end+1) = dicePatch;
            end
        end
    end

    if mod(batchNum, 50) == 0
        fprintf('  ...processed %d patches\n', batchNum * dsVal.MiniBatchSize);
    end
end

fprintf('\n=== Model 1 Validation Results (grid-only, native-resolution patches) ===\n');
fprintf('%-8s %10s %10s %8s %8s %20s\n', 'Channel', 'Sensit.', 'Specif.', 'Dice', 'IoU', 'PosPatches/Valid');
for c = 1:4
    sensitivity = TP(c) / max(TP(c) + FN(c), 1);
    specificity = TN(c) / max(TN(c) + FP(c), 1);
    dice = 2*TP(c) / max(2*TP(c) + FP(c) + FN(c), 1);
    iou = TP(c) / max(TP(c) + FP(c) + FN(c), 1);

    fprintf('%-8s %10.4f %10.4f %8.4f %8.4f %12d/%d\n', ...
        channelNames(c), sensitivity, specificity, dice, iou, ...
        numPositivePatches(c), numValidPatches(c));
end

fprintf(['\nNOTE: "prolif" has a very small positive-patch sample size ' ...
         '(see PosPatches column above) -- treat its numbers as low-' ...
         'confidence, not on equal footing with vessel/dark/light. This ' ...
         'reflects genuine data scarcity (5,842 positive pixels total ' ...
         'across the entire 479-image training set), not a pipeline flaw.\n']);