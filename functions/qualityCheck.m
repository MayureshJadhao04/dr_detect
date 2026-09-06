function [isGood, reason, scores] = qualityCheck(enhancedImg)
%QUALITYCHECK Stage 2 of the pipeline: assess if an enhanced image is
%gradeable. Runs on the ENHANCED image, not the raw capture.
%   isGood  - true/false
%   reason  - '' if good, else 'blurry', 'poor_brightness', or 'low_contrast'
%   scores  - struct with raw metric values, for logging/debugging

if size(enhancedImg,3) == 3
    gray = rgb2gray(enhancedImg);
else
    gray = enhancedImg;
end
gray = im2double(gray);

contentMask = gray > 0.03;   % exclude black background/padding from stats

% --- Blur detection: variance of Laplacian, on real content only ---
lap = fspecial('laplacian');
lapResponse = imfilter(gray, lap);
blurScore = var(lapResponse(contentMask));

% --- Brightness stats, on real content only ---
meanBrightness = mean(gray(contentMask));
stdBrightness  = std(gray(contentMask));

scores.blurScore = blurScore;
scores.meanBrightness = meanBrightness;
scores.stdBrightness = stdBrightness;

% Thresholds - PLACEHOLDER, will calibrate against real data below
blurThreshold = 0.0002;    % below observed min (0.00028) - lets all real data through
minBrightness = 0.25;      % below observed min (0.285)
maxBrightness = 0.55;      % above observed max (0.475)
minSpread     = 0.05;      % below observed min (0.058)
isGood = true;
reason = '';

if blurScore < blurThreshold
    isGood = false;
    reason = 'blurry';
elseif meanBrightness < minBrightness || meanBrightness > maxBrightness
    isGood = false;
    reason = 'poor_brightness';
elseif stdBrightness < minSpread
    isGood = false;
    reason = 'low_contrast';
end
end