%% evaluateModel1_checkpoint.m
% Evaluates a Model 1 checkpoint (e.g. a partial-epoch checkpoint from
% checkpoints_resume, or model1_trained_v2.mat) on the native-resolution
% grid-only validation patches. Mirrors the methodology used for the
% original epoch-2 evaluation (per-channel Sensitivity/Specificity/
% Dice/IoU, respecting per-channel validity flags so datasets that don't
% have a given mask type don't get counted against that channel).
%
% EDIT the two paths below before running.

clear; clc;

%% --- EDIT THESE ---
checkpointFile = 'D:\Projects\dr-screening\checkpoints_resume\net_checkpoint__2943__2026_09_10__21_41_16.mat';; % <-- set this
checkpointVar  = 'net';   % variable name inside the checkpoint .mat -- confirm via `whos('-file', checkpointFile)` if unsure
threshold      = 0.5;     % sigmoid threshold for binarizing predictions
%% -------------------

valPatches = readtable('D:\DATASETS\combined\val_patch_manifest.csv', 'TextType', 'string');
manifest   = readtable('D:\DATASETS\combined\manifest.csv', 'TextType', 'string');

s = load(checkpointFile, checkpointVar);
net = s.(checkpointVar);

dsVal = DRPatchDatastore(valPatches, manifest, 16);
reset(dsVal);

channelNames = {'vessel','dark','light','prolif'};
nCh = numel(channelNames);

TP = zeros(1,nCh); TN = zeros(1,nCh); FP = zeros(1,nCh); FN = zeros(1,nCh);
interSum = zeros(1,nCh); unionSum = zeros(1,nCh);
posPatches = zeros(1,nCh); validPatches = zeros(1,nCh);

nProcessed = 0;
fprintf('Evaluating over %d validation patches...\n', height(valPatches));

while hasdata(dsVal)
    data = read(dsVal);
    X = cat(4, data{:,1}{:});          % [H W 3 B]
    Y = cat(4, data{:,2}{:});          % [H W 8 B] -- ch 1-4 mask, ch 5-8 validity

    Xdl = dlarray(single(X), 'SSCB');
    Ypred = predict(net, Xdl);         % raw logits, [H W 4 B]
    Yprob = sigmoid(Ypred);
    Ybin = extractdata(Yprob) > threshold;

    B = size(X,4);
    for c = 1:nCh
        gt    = Y(:,:,c,:) > 0.5;
        valid = Y(:,:,nCh+c,:) > 0.5;
        pred  = Ybin(:,:,c,:);

        for b = 1:B
            v = valid(:,:,1,b);
            if ~any(v(:)), continue; end   % this patch has no valid GT for this channel -- skip
            validPatches(c) = validPatches(c) + 1;

            g = gt(:,:,1,b) & v;
            p = pred(:,:,1,b) & v;

            if any(g(:)), posPatches(c) = posPatches(c) + 1; end

            TP(c) = TP(c) + sum(p(:) & g(:));
            TN(c) = TN(c) + sum(~p(:) & ~g(:) & v(:));
            FP(c) = FP(c) + sum(p(:) & ~g(:));
            FN(c) = FN(c) + sum(~p(:) & g(:));

            interSum(c) = interSum(c) + sum(p(:) & g(:));
            unionSum(c) = unionSum(c) + sum(p(:) | g(:));
        end
    end

    nProcessed = nProcessed + B;
    if mod(nProcessed, 800) < 16
        fprintf(' ...processed %d patches\n', nProcessed);
    end
end

fprintf('\n=== Model 1 Validation Results (grid-only, native-resolution patches) ===\n');
fprintf('%-8s %-8s %-8s %-8s %-8s %s\n', 'Channel','Sensit.','Specif.','Dice','IoU','PosPatches/Valid');
for c = 1:nCh
    sens = TP(c) / max(TP(c)+FN(c), 1);
    spec = TN(c) / max(TN(c)+FP(c), 1);
    dice = 2*interSum(c) / max(interSum(c) + (interSum(c)+FP(c)+FN(c)), 1); % 2*TP / (2*TP+FP+FN)
    dice = 2*TP(c) / max(2*TP(c) + FP(c) + FN(c), 1);
    iou  = interSum(c) / max(unionSum(c), 1);
    fprintf('%-8s %-8.4f %-8.4f %-8.4f %-8.4f %d/%d\n', ...
        channelNames{c}, sens, spec, dice, iou, posPatches(c), validPatches(c));
end

fprintf('\nNOTE: "prolif" typically has a very small positive-patch sample size -- treat\n');
fprintf('its numbers as low-confidence, not on equal footing with vessel/dark/light.\n');
