function loss = maskedWeightedBCELoss(Y, T, posWeights, diceWeight)
% MASKEDWEIGHTEDBCELOSS Per-channel weighted+masked BCE, COMBINED with a
% per-channel Dice loss term.
%
% Why both: computeChannelPosWeights.m found true imbalance ratios of
% ~272x-7897x for dark/light/prolif, but a raw pos_weight that large
% causes real training instability (huge loss spikes on any batch with
% even one rare positive pixel). Capping pos_weight at 100 avoids that,
% but then dark/light/prolif all get the SAME weight despite very
% different true scarcity - the cap erases the differentiation this was
% built for. Dice loss is naturally bounded [0,1] and rewards correct
% overlap on rare positive regions without needing an extreme
% multiplier - it recovers per-channel sensitivity to scarcity that the
% capped BCE term alone can't provide safely.
%
%   Y - network output, raw logits, size [H W 4 B]
%   T - target, size [H W 8 B]: 1-4 = ground truth masks, 5-8 = validity
%   posWeights - 1x4 vector from computeChannelPosWeights.m (capped)
%   diceWeight - scalar, how much the Dice term contributes relative to
%       BCE (both terms are roughly O(1) scale by construction, so start
%       with diceWeight = 1.0 and adjust only if one channel visibly
%       dominates training)

    if nargin < 4
        diceWeight = 1.0;
    end

    mask = T(:,:,1:4,:);
    validity = T(:,:,5:8,:);
    smooth = 1e-6;

    bceTotal = dlarray(0);
    diceTotal = dlarray(0);
    totalValidCount = 0;

    for c = 1:4
        x = Y(:,:,c,:);
        z = mask(:,:,c,:);
        v = validity(:,:,c,:);
        w = posWeights(c);

        % --- weighted BCE (capped weight, as before) ---
        l = 1 + (w - 1) .* z;
        stableTerm = log(1 + exp(-abs(x))) + max(-x, 0);
        channelBCE = (1 - z) .* x + l .* stableTerm;
        channelBCE = channelBCE .* v;

        bceTotal = bceTotal + sum(channelBCE(:));
        totalValidCount = totalValidCount + sum(v(:));

        % --- per-channel soft Dice, masked to valid pixels only ---
        p = sigmoid(x);
        intersection = sum(p(:) .* z(:) .* v(:));
        denom = sum(p(:) .* v(:)) + sum(z(:) .* v(:));
        diceScore = (2 * intersection + smooth) / (denom + smooth);
        diceTotal = diceTotal + (1 - diceScore);
    end

    bceLoss = bceTotal / max(totalValidCount, 1);
    diceLoss = diceTotal / 4;   % mean across the 4 channels

    loss = bceLoss + diceWeight * diceLoss;
end
