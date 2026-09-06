function enhanced = enhanceImage(img)
%ENHANCEIMAGE Mandatory camera-normalization step, applied to every
% fundus image regardless of quality.

originalClass = class(img);
if ~isa(img, 'double')
    imgD = im2double(img);
else
    imgD = img;
end

contentMask = mean(imgD, 3) > 0.03;

% --- CLAHE on L-channel only, in Lab space (color-safe) ---
labImg = rgb2lab(imgD);
L = labImg(:,:,1);
L_norm = L / 100;
L_eq = adapthisteq(L_norm, 'ClipLimit', 0.02, 'Distribution', 'rayleigh', 'NumTiles', [8 8]);
labImg(:,:,1) = L_eq * 100;
imgEnhanced = lab2rgb(labImg);
imgEnhanced = max(0, min(1, imgEnhanced));

% --- lighter denoise, preserves sharpness better ---
for c = 1:size(imgEnhanced, 3)
    imgEnhanced(:,:,c) = imbilatfilt(imgEnhanced(:,:,c), 0.005, 2);
end

% --- force black-bar/background pixels back to pure black ---
for c = 1:size(imgEnhanced, 3)
    ch = imgEnhanced(:,:,c);
    ch(~contentMask) = 0;
    imgEnhanced(:,:,c) = ch;
end

switch originalClass
    case 'uint8'
        enhanced = im2uint8(imgEnhanced);
    case 'uint16'
        enhanced = im2uint16(imgEnhanced);
    otherwise
        enhanced = imgEnhanced;
end
end