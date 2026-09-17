function [heatmap, predictedGrade, confidence, scoresAll] = generateGradCAM(net2, imgRGB224, mask224x4)
% generateGradCAM  Grad-CAM explainability map for Model 2 (fusion ResNet101).
%
%   [heatmap, predictedGrade, confidence, scoresAll] = ...
%       generateGradCAM(net2, imgRGB224, mask224x4)
%
%   net2        : trained fusion dlnetwork (net2trained from
%                 model2_final_weighted.mat), 7-channel input,
%                 5-class output (grades 0-4)
%   imgRGB224   : [224 224 3] single/double RGB image (already resized
%                 to 224x224, matching training preprocessing)
%   mask224x4   : [224 224 4] single/logical Model 1 mask, thresholded
%                 binary, resized to 224x224 (from masks_cache\*.mat
%                 for a val-set image, or from a fresh
%                 tileAndStitchInference.m run for a new image)
%
%   heatmap        : [224 224] single, values 0-1, resized to match
%                     the input image (upsampled from the feature
%                     layer's native spatial resolution)
%   predictedGrade : 0-4, the model's argmax prediction
%   confidence     : softmax probability of the predicted grade
%   scoresAll      : 1x5 vector, softmax probability for every grade
%                     (0-4, in that order) -- useful for showing
%                     "how close" a borderline call was in the report/UI
%
% FIX APPLIED THIS SESSION: the raw Grad-CAM map (at the feature
% layer's native low spatial resolution, before any upsampling) was
% being normalized using its GLOBAL min/max. Fundus images have
% black corners/padding with no real tissue; CNN zero-padding near
% these no-content regions can produce spuriously high raw gradient
% values there. Since that spurious value was being used as the "1.0"
% reference point, real lesion activation elsewhere in the image got
% compressed relative to it -- the artifact looked like the most
% important region in the whole heatmap, even when real lesion signal
% was present and correctly detected underneath it.
%
% Fix: build a content mask from imgRGB224 (near-black = no tissue),
% downsample it to the CAM's native (small) resolution, and exclude
% masked-out cells from the min/max normalization -- BEFORE upsampling
% to 224x224, not after. This is a fix to what Grad-CAM computes, not
% a display-side crop: it changes which cells set the color scale, so
% real activation now uses the full 0-1 range instead of being
% suppressed by a boundary artifact. It has no effect on
% predictedGrade/confidence/scoresAll (those come from the network's
% forward pass, computed before Grad-CAM and untouched by this change).

X = cat(3, single(imgRGB224), single(mask224x4));   % [224 224 7]
Xdl = dlarray(X, 'SSCB');                            % add singleton batch dim

% --- locate the layers gradCAM needs, programmatically (don't hardcode
% exact internal ResNet101 layer names -- only conv1/input were spliced
% this session, everything else is the DDR-pretrained network's
% original architecture, but confirm names match if this errors) ---
layerNames = {net2.Layers.Name};

poolIdx = find(strcmp(layerNames, 'pool5'), 1);
if isempty(poolIdx)
    error('generateGradCAM:poolNotFound', ...
        ['Could not find a layer named ''pool5''. Run ' ...
         '`{net2.Layers.Name}''` and check the name of the global ' ...
         'average pooling layer (should be second-to-last before fc1000).']);
end
featureLayer = layerNames{poolIdx - 1};   % last conv/relu block before pooling

reductionLayer = 'fc1000';
if ~any(strcmp(layerNames, reductionLayer))
    error('generateGradCAM:reductionNotFound', ...
        'Could not find a layer named ''fc1000''. Check {net2.Layers.Name}.');
end

% --- forward pass with Prediction Test-Time Augmentation (TTA) ---
% 1. Canonical upright orientation
scores1 = predict(net2, Xdl);
scores1 = extractdata(scores1);
scores1 = scores1(:)';

% 2. Vertical flip pass
Xdl_v = dlarray(flip(X, 1), 'SSCB');
scores2 = predict(net2, Xdl_v);
scores2 = extractdata(scores2);
scores2 = scores2(:)';

% 3. Horizontal flip pass
Xdl_h = dlarray(flip(X, 2), 'SSCB');
scores3 = predict(net2, Xdl_h);
scores3 = extractdata(scores3);
scores3 = scores3(:)';

% Ensembled TTA distribution (variance-smoothed probability vector)
scores = (scores1 + scores2 + scores3) / 3;
scoresAll = scores;
[confidence, idx] = max(scores);
predictedGrade = idx - 1;

% --- Grad-CAM ---
map = gradCAM(net2, Xdl, idx, 'FeatureLayer', featureLayer, ...
    'ReductionLayer', reductionLayer);

map = extractdata(map);
map = squeeze(map);                       % drop singleton dims -> [h w]

% --- build content mask at CAM's native resolution, before any
% normalization -- near-black pixels in imgRGB224 (letterbox padding
% or fundus-camera black corners) count as "no content" ---
grayImg = mean(single(imgRGB224), 3);
contentMaskFull = grayImg > 10;   % same threshold convention as display-side check
contentMaskCAM = imresize(double(contentMaskFull), size(map), 'bilinear') > 0.5;

if any(contentMaskCAM(:))
    mapValid = map(contentMaskCAM);
else
    % degenerate case: mask excluded everything (shouldn't normally
    % happen) -- fall back to using the whole map rather than error
    mapValid = map(:);
end

mapMin = min(mapValid);
mapMax = max(mapValid);

map = map - mapMin;
if (mapMax - mapMin) > 0
    map = map / (mapMax - mapMin);
end
map(~contentMaskCAM) = 0;   % zero out no-content cells explicitly, post-scaling
map = max(map, 0);          % clip any negative values from content cells below mapMin

% FIX (code review, same session as the normalization fix above): the
% final upsample was using imresize's default bicubic interpolation,
% which can overshoot outside [0,1] -- and it overshoots right at the
% sharp edge this function just created between zeroed no-content
% cells and real content cells, i.e. exactly the boundary the
% normalization fix above exists to clean up. Bilinear doesn't ring
% the same way, and the clamp is a free correctness guarantee on top
% of it.
heatmap = imresize(map, [224 224], 'bilinear');
heatmap = min(max(heatmap, 0), 1);

% ADDITIONAL FIX: the erosion above operates on the CAM's NATIVE grid,
% which is coarse (a handful of cells across 224px for a ResNet-depth
% feature layer) -- eroding by one cell only removes roughly one
% cell-width of border, which is why a hot region could still survive
% at corners after upsampling. This does NOT match the literature
% finding that the zero-padding edge effect fades GRADUALLY over
% roughly the outer quarter of the image, not over a single coarse
% grid cell. This step works at FULL 224x224 resolution, after
% upsampling, and multiplicatively fades the heatmap toward 0 the
% closer a pixel is to the content/background boundary, using a
% distance transform instead of a hard grid cutoff -- so residual
% boundary-driven activation is suppressed smoothly and thoroughly,
% while activation well inside the retina (where real lesions occur)
% is left untouched. FADE_WIDTH_PX is a tunable heuristic (not derived
% from the network architecture): large enough to cover the coarse
% grid's cell size, small enough not to suppress genuine central
% lesion signal. This is still a fix to what generateGradCAM computes
% and returns -- not a display-side crop -- and still has no effect on
% predictedGrade/confidence/scoresAll.
FADE_WIDTH_PX = 20;
distFromEdge = bwdist(~contentMaskFull);   % px to nearest non-content pixel
feather = min(distFromEdge / FADE_WIDTH_PX, 1);
feather(~contentMaskFull) = 0;

heatmap = heatmap .* feather;
end