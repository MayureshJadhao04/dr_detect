function foveaCenter = findFovea(discCenter, discRadius, imgSize, enhancedImg)
%FINDFOVEA Estimates fovea location from optic disc position.
%   3-arg call: pure geometric heuristic (2.75 disc diameters from disc,
%   direction based on disc's side of the image). Baseline-confirmed
%   mean 81.5px / median 69.3px error on IDRiD (n=80).
%
%   4-arg call: geometric estimate PLUS a bounded local refinement.
%   Unlike the earlier rejected refinement (which freely compared two
%   distant left/right candidates and let hemorrhages/vessels hijack
%   the pick -- measured mean 427.6px/median 556.5px), this version:
%     (a) only searches within a small radius of the geometric prior,
%         so it can never jump to the wrong side of the disc or latch
%         onto a lesion far from the anatomically expected location
%     (b) scores REGIONAL darkness (Gaussian-blurred), not raw pixel
%         intensity, so a single dark vessel/microaneurysm pixel can't
%         win -- it has to be a genuinely dark patch of some size
%
%   This has NOT yet been validated against the full-dataset baseline.
%   Run the same eval script used for the geometric baseline, calling
%   findFovea(discCenter, discRadius, size(enh), enh) this time, and
%   compare mean/median to 81.5/69.3 BEFORE shipping this. If it does
%   not clearly beat baseline, fall back to the 3-arg call -- do not
%   ship on the strength of reasoning alone; the last attempt also
%   sounded reasonable and made things dramatically worse in practice.

    imgWidth = imgSize(2);
    imageMidlineX = imgWidth / 2;

    if discCenter(1) < imageMidlineX
        direction = 1;
    else
        direction = -1;
    end

    offsetX = 2.75 * (2 * discRadius) * direction;
    geometricEstimate = [discCenter(1) + offsetX, discCenter(2)];

    if nargin < 4
        foveaCenter = geometricEstimate;
        return;
    end

    % ---- Bounded local refinement ----
    if size(enhancedImg,3) == 3
        gray = rgb2gray(enhancedImg);
    else
        gray = enhancedImg;
    end
    gray = im2double(gray);
    contentMask = gray > 0.03;   % exclude black background/padding

    searchRadius = round(0.6 * discRadius);
    cx = round(geometricEstimate(1));
    cy = round(geometricEstimate(2));

    xMin = max(1, cx - searchRadius);
    xMax = min(size(gray,2), cx + searchRadius);
    yMin = max(1, cy - searchRadius);
    yMax = min(size(gray,1), cy + searchRadius);

    % If the geometric estimate + window falls mostly off the retina,
    % don't refine -- just return the geometric estimate.
    windowMask = contentMask(yMin:yMax, xMin:xMax);
    if nnz(windowMask) < 0.5 * numel(windowMask)
        foveaCenter = geometricEstimate;
        return;
    end

    % Regional darkness via Gaussian blur -- smooths out single-pixel
    % vessels/microaneurysms so only genuinely dark patches score low.
    blurSigma = max(2, discRadius / 6);
    blurred = imgaussfilt(gray, blurSigma);

    window = blurred(yMin:yMax, xMin:xMax);
    window(~windowMask) = Inf;   % never pick off-retina pixels

    [~, linIdx] = min(window(:));
    [ry, rx] = ind2sub(size(window), linIdx);

    foveaCenter = [xMin + rx - 1, yMin + ry - 1];
end
