function [heatmap, predictedGrade, confidence, scoresAll, maskProb, imgResized224, validRegion] = ...
    generateGradCAMForImage(net1, net2, imgPath)
% generateGradCAMForImage  End-to-end explainability for ONE raw new
% fundus image: runs the actual deployment pipeline (enhance -> Model 1
% tile/stitch -> Model 2 fusion input -> Grad-CAM), rather than reading
% a precomputed mask from masks_cache\ (which only exists for the
% original 3,446 labeled training/val images).
%
%   [heatmap, predictedGrade, confidence, scoresAll, maskProb, ...
%    imgResized224, validRegion] = generateGradCAMForImage(net1, net2, imgPath)
%
%   net1    : Model 1 dlnetwork (load from model1_final.mat, var 'net')
%   net2    : Model 2 dlnetwork (load from model2_final_weighted.mat,
%             var 'net2trained')
%   imgPath : path to a RAW fundus image (native resolution, NOT
%             pre-resized) -- e.g. a new image dropped into the UI's
%             watch folder
%
%   heatmap        : [224 224] single, 0-1, Grad-CAM overlay map
%   predictedGrade : 0-4
%   confidence     : softmax probability of predictedGrade
%   scoresAll      : 1x5, softmax probability for every grade
%   maskProb       : HxWx4 single, Model 1's full-resolution probability
%                     mask (native resolution, before resize/pad)
%   imgResized224  : 224x224x3 single, the actual Model 2 input image
%                     (raw image, letterbox-padded) -- returned for
%                     display/overlay purposes
%   validRegion    : 224x224 logical, true where imgResized224 contains
%                     real image content (false in the letterbox
%                     padding border) -- use this to crop Grad-CAM
%                     display, since the padding border can show
%                     tile-seam artifacts unrelated to real retinal
%                     content (see notes below)
%
% ASSUMPTION FLAGGED: precomputeModel2Masks.m (the script that built
% masks_cache\ for the original training/val images) could not be
% located on disk to confirm its exact tileAndStitchInference.m
% call -- this function uses that function's documented DEFAULTS
% (TileSize [256 256], OverlapFraction 0.25). If Grad-CAM/mask output
% on a NEW image looks meaningfully different in character from the
% masks_cache\ examples for a similar-looking val image, this
% mismatch is the first thing to suspect.
%
% SECOND ASSUMPTION FLAGGED (code review, not yet confirmed): the
% binarization threshold below (maskProb >= 0.5) is likewise NOT
% verified against what precomputeModel2Masks.m actually used to build
% the masks_cache\ data Model 2's Branch B was trained on -- that
% script is the same one that's missing, per the note above, so its
% exact threshold is unrecoverable the same way its tile
% size/overlap is. This matters more than a cosmetic difference: if
% masks_cache\ was built at a different threshold, the binary mask
% shapes feeding Branch B here won't match what Branch B saw in
% training. Worth a direct sanity check if time allows -- load one
% masks_cache\*.mat file and compare its mask density/shape against
% what 0.5 produces here on a similar image (note the segmentation
% quality-gate sweep separately found 0.5 was NOT optimal for the
% dark/light channels -- 0.75/0.80-0.85 scored higher there -- so a
% mismatch is plausible, not just a theoretical concern). Not fixed
% here since the correct value is unconfirmed, not just unfixed.
%
% CONFIRMED via prepareModel2Data.m (read this session): model2_224\
% images\ are built from raw imread() output, resized with
% resizeWithPad(img, [], [224 224]) -- NO enhanceImage call anywhere
% in that script. Combined with DRClassificationDatastore.m also not
% calling enhanceImage in read(), this settles it: Model 2 was
% trained on RAW, non-enhanced, aspect-preserving-padded images.
% Fixes applied vs. the earlier draft of this function:
%   1. Model 2's image input comes from the RAW image, not
%      imgEnhanced (enhancement is Model-1-only preprocessing).
%   2. Model 2's image input is resized with resizeWithPad(...),
%      matching prepareModel2Data.m exactly, instead of a plain
%      imresize (which would squish aspect ratio instead of
%      letterboxing it).
%   3. mask224 is now resized+padded with the SAME resizeWithPad
%      geometry as the image (per-channel loop, since resizeWithPad's
%      mask argument is 2D), instead of a plain imresize -- keeps
%      image and mask spatially aligned in the fused 7-channel input.
%
% KNOWN LIMITATION, CONFIRMED THIS SESSION (not fixed here -- see
% report limitations section): tileAndStitchInference's tile overlap
% blending leaves faint seam artifacts in maskProb (visually confirmed
% as a faint grid pattern in the vessel-probability channel on raw
% images). These seams sit at a FIXED pixel offset in native
% resolution, but land at a DIFFERENT relative position in the 224x224
% frame depending on the source image's native size -- a position the
% masks_cache-trained network never saw consistently, since
% masks_cache/model2_224 images were built once, at fixed sizes, with
% seams (if any) always in the same relative spot. This can produce
% spurious Grad-CAM activation near the image border/corners on FRESH
% raw-image inference (this function), even though it does not appear
% when using precomputed masks_cache\ data (gradCAMDemo.m). validRegion
% (above) is provided so display code can crop the border out rather
% than show this artifact as if it were real signal.
%
% Enhancement step (Model 1 input only) matches the CONFIRMED-ACTIVE
% enhanceImage.m (the version that was silently shadowing on the path
% all session, now copied over the repo's functions\ copy so there's
% one canonical version) -- called with NO extra arguments, since
% enhanceImage.m takes no options (there is no denoise on/off flag).

imgRaw = imread(imgPath);
imgEnhanced = enhanceImage(imgRaw);   % Model 1 input only -- native resolution

% --- Model 1: tile + stitch over the full ENHANCED image (Model 1 was
% trained/masks_cache-built on enhanced images -- unchanged from before) ---
[maskProb, ~] = tileAndStitchInference(net1, imgEnhanced);   % HxWx4 probabilities

% --- threshold, then resize+pad using the SAME resizeWithPad geometry
% as the image (identical scale/offset per channel, since that geometry
% is a function of imgRaw's size only, not of the mask) -- keeps mask
% and image spatially aligned in the fused input.
% NOTE: 0.5 threshold is UNCONFIRMED against masks_cache\'s actual
% build -- see "SECOND ASSUMPTION FLAGGED" above. ---
% --- Continuous soft probability maps: preserve subtle lesion likelihoods [0.0, 1.0]
% without hard 0.5 cutoff truncation, keeping scale aligned with imgRaw letterbox ---
% Determine Model 2 input resolution dynamically (handles 384x384 and 224x224)
tgtSize = [224 224];
try
    if isprop(net2, 'Layers') && ~isempty(net2.Layers)
        inSz = net2.Layers(1).InputSize;
        tgtSize = inSz(1:2);
    end
catch
    tgtSize = [224 224];
end
tgtH = tgtSize(1);
tgtW = tgtSize(2);

[hRaw, wRaw, ~] = size(imgRaw);
scaleP = min(tgtH/hRaw, tgtW/wRaw);
newH = round(hRaw * scaleP);
newW = round(wRaw * scaleP);
yOffP = floor((tgtH - newH) / 2);
xOffP = floor((tgtW - newW) / 2);

maskInput = zeros(tgtH, tgtW, size(maskProb,3), 'single');
for c = 1:size(maskProb,3)
    channelResized = imresize(single(maskProb(:,:,c)), [newH newW], 'bilinear');
    maskInput(yOffP+1:yOffP+newH, xOffP+1:xOffP+newW, c) = channelResized;
end
maskInput = min(max(maskInput, 0), 1);

% Resize RAW image with aspect padding to match Model 2 input size
[imgResized, ~] = resizeWithPad(imgRaw, [], [tgtH tgtW]);
imgResized = single(imgResized);

% Valid region calculation
validRegion = false(tgtH, tgtW);
validRegion(yOffP+1:yOffP+newH, xOffP+1:xOffP+newW) = true;
grayImg = mean(imgResized, 3);
contentMask = grayImg > 10;
validRegion = validRegion & contentMask;

% Grad-CAM on Model 2
[heatmap, predictedGrade, confidence, scoresAll] = ...
    generateGradCAM(net2, imgResized, maskInput);
imgResized224 = imgResized;

end
