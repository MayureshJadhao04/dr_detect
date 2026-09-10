function posWeights = computeChannelPosWeights(manifestPath, splitPath)
% COMPUTECHANNELPOSWEIGHTS Scans every TRAIN-split image's masks and
% computes a real, data-driven positive-class weight per channel, for
% use in a weighted BCE loss.
%
%   posWeights = computeChannelPosWeights('D:\DATASETS\combined\manifest.csv', ...
%                                          'D:\DATASETS\combined\stratified_image_split.mat')
%
% This counts actual PIXELS (not just "how many images have this channel
% positive" - a different, coarser number you already have). Pixel-level
% counts are what a per-pixel BCE loss actually needs.
%
% pos_weight_c = negative_pixels_c / positive_pixels_c, standard inverse-
% frequency weighting (same idea as PyTorch's BCEWithLogitsLoss pos_weight).
% Clipped to a max of 100 to avoid a pathological weight on the near-empty
% proliferative channel dominating the loss numerically.

    manifest = readtable(manifestPath, 'TextType', 'string');
    load(splitPath, 'trainIdx');   % adjust variable name if your split file uses a different one

    channels = {'vessel','dark','light','prolif'};
    maskCols = {'vessel_mask','dark_mask','light_mask','prolif_mask'};
    hasCols  = {'has_vessel','has_dark','has_light','has_prolif'};

    posPixels = zeros(1,4);
    validPixels = zeros(1,4);

    trainRows = manifest(trainIdx, :);

    for i = 1:height(trainRows)
        for c = 1:4
            if trainRows.(hasCols{c})(i) == 1
                maskPath = trainRows.(maskCols{c}){i};
                if isfile(maskPath)
                    m = imread(maskPath) > 0;
                    posPixels(c) = posPixels(c) + sum(m(:));
                    validPixels(c) = validPixels(c) + numel(m);
                end
            end
        end
        if mod(i,50) == 0
            fprintf('Scanned %d/%d train images\n', i, height(trainRows));
        end
    end

    negPixels = validPixels - posPixels;
    posWeights = negPixels ./ max(posPixels, 1);   % avoid divide-by-zero
    posWeights = min(posWeights, 100);             % clip pathological extremes

    fprintf('\n--- Per-channel positive-pixel stats (train split) ---\n');
    for c = 1:4
        fprintf('%-8s  positive=%d  valid=%d  (%.4f%%)  pos_weight=%.2f\n', ...
            channels{c}, posPixels(c), validPixels(c), ...
            100*posPixels(c)/max(validPixels(c),1), posWeights(c));
    end

    save('D:\DATASETS\combined\channelPosWeights.mat', 'posWeights');
    fprintf('\nSaved to D:\\DATASETS\\combined\\channelPosWeights.mat\n');
end
