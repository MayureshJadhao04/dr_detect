function [imgOut, maskOut, contentMask] = resizeWithPad(img, mask, targetSize)
% RESIZEWITHPAD Resize preserving aspect ratio, then pad with black to
% reach targetSize exactly - avoids the stretching/distortion a plain
% imresize to a fixed size causes on non-square source images.
%   mask can be [] if there's no mask to resize alongside this image.
%   contentMask (new) - true where pixels are real resized image
%   content, false where padding was added. Feed this into
%   enhanceImage.m so it excludes padding from its color normalization.

[h, w, ~] = size(img);
scale = min(targetSize(1)/h, targetSize(2)/w);
newH = round(h * scale);
newW = round(w * scale);

imgResized = imresize(img, [newH newW], 'bilinear');

imgOut = zeros([targetSize, size(img,3)], class(img));
yOff = floor((targetSize(1) - newH) / 2);
xOff = floor((targetSize(2) - newW) / 2);
imgOut(yOff+1:yOff+newH, xOff+1:xOff+newW, :) = imgResized;

% --- NEW: track which pixels are real content vs. padding ---
contentMask = false(targetSize);
contentMask(yOff+1:yOff+newH, xOff+1:xOff+newW) = true;

if isempty(mask)
    maskOut = false(targetSize);
    return
end

maskResized = imresize(mask, [newH newW], 'nearest') > 0;
maskOut = false(targetSize);
maskOut(yOff+1:yOff+newH, xOff+1:xOff+newW) = maskResized;
end