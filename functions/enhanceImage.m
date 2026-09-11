function enhanced = enhanceImage(img)
% ENHANCEIMAGE Mandatory camera-normalization step, applied to every
% fundus image regardless of quality.
%   - CLAHE on the L-channel in Lab color space (contrast enhancement
%     without distorting color balance the way applying CLAHE per-RGB-
%     channel would)
%   - Denoise (mild, preserves lesion edges)
%   - Percentile-based color normalization (reduces camera-to-camera
%     color cast differences)
%   Restores original image class/range at the end.

    originalClass = class(img);
    if ~isa(img, 'double')
        imgD = im2double(img);
    else
        imgD = img;
    end

    % --- CLAHE on L-channel only, in Lab space ---
    labImg = rgb2lab(imgD);
    L = labImg(:,:,1);
    L_norm = L / 100;                       % rgb2lab's L channel is 0-100, adapthisteq expects 0-1
    L_eq = adapthisteq(L_norm, 'ClipLimit', 0.01, 'Distribution', 'rayleigh');
    labImg(:,:,1) = L_eq * 100;
    imgEnhanced = lab2rgb(labImg);
    imgEnhanced = max(0, min(1, imgEnhanced));   % lab2rgb can produce slight out-of-range values

    % --- mild denoise, per channel, edge-preserving ---
    for c = 1:size(imgEnhanced, 3)
        imgEnhanced(:,:,c) = imbilatfilt(imgEnhanced(:,:,c), 0.01, 3);
    end

    % --- percentile-based color normalization per channel ---
    % stretches each channel's 1st-99th percentile to 0-1, reduces
    % camera-specific color cast without clipping outliers as harshly
    % as a plain min/max stretch would
    for c = 1:size(imgEnhanced, 3)
        channel = imgEnhanced(:,:,c);
        lowP = prctile(channel(:), 1);
        highP = prctile(channel(:), 99);
        if highP > lowP
            channel = (channel - lowP) / (highP - lowP);
            channel = max(0, min(1, channel));
        end
        imgEnhanced(:,:,c) = channel;
    end

    % --- restore original class/range ---
    switch originalClass
        case 'uint8'
            enhanced = im2uint8(imgEnhanced);
        case 'uint16'
            enhanced = im2uint16(imgEnhanced);
        otherwise
            enhanced = imgEnhanced;   % already double
    end
end
