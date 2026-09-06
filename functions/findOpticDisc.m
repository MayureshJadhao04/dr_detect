function [center, radius, found] = findOpticDisc(enhancedImg)
%FINDOPTICDISC Classical CV localization of the optic disc.
%   Detects the brightest large, roughly-circular region in the image.
%
%   Selection combines Area with Circularity, not Area alone. This was
%   validated against IDRiD ground truth (disc mask value 32): in
%   cases where a hard-exudate cluster was LARGER than the true disc
%   (e.g. train_IDRiD_25: competitor area 4926 vs disc 4290;
%   test_IDRiD_74f074: competitor area 5416 vs disc 4446), circularity
%   cleanly separated them (true disc ~0.68-0.69, exudate clump
%   ~0.21-0.25 in both cases) because exudates are several separate
%   deposits merged by imclose into one irregular, non-convex blob,
%   while the disc is one coherent round structure. Vessel-density
%   scoring was tried first and rejected -- it did NOT separate these
%   cases reliably and even favored small irrelevant candidates in
%   some images.
%
%   center - [x, y] coordinates of disc center, [] if not found
%   radius - approximate disc radius in pixels, [] if not found
%   found  - true/false

if size(enhancedImg,3) == 3
    gray = rgb2gray(enhancedImg);
else
    gray = enhancedImg;
end
gray = im2double(gray);

contentMask = gray > 0.03;   % exclude black background/padding

realPixels = gray(contentMask);
brightThreshold = prctile(realPixels, 97);   % top 3% brightest pixels

brightMask = gray > brightThreshold & contentMask;

brightMask = bwareaopen(brightMask, 30);
brightMask = imclose(brightMask, strel('disk', 5));
brightMask = imfill(brightMask, 'holes');

minRadius = round(size(gray,1) * 0.04);
maxRadius = round(size(gray,1) * 0.12);

[centers, radii, metric] = imfindcircles(brightMask, [minRadius maxRadius], ...
    'ObjectPolarity', 'bright', 'Sensitivity', 0.9);

if isempty(centers)
    stats = regionprops(brightMask, gray, 'Centroid', 'EquivDiameter', ...
        'MeanIntensity', 'Area', 'Circularity');
    if isempty(stats)
        center = [];
        radius = [];
        found = false;
        return;
    end

    % Combined score: Area * Circularity. Rewards large regions, but
    % penalizes irregular/non-convex blobs (exudate clusters) even if
    % they happen to be larger than the true disc. Validated on two
    % previously-failing cases -- see header note.
    scores = [stats.Area] .* [stats.Circularity];
    [~, idx] = max(scores);

    center = stats(idx).Centroid;
    radius = stats(idx).EquivDiameter / 2;
    found = true;
else
    center = centers(1,:);
    radius = radii(1);
    found = true;
end
end