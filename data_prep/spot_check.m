%% Spot-check v3 - DRIVE and e-Ophtha
clear; clc;

manifest = readtable('D:\DATASETS\combined\manifest.csv');

driveRow   = find(strcmp(manifest.dataset, 'drive'), 1);
eoDarkRow  = find(strcmp(manifest.dataset, 'eophtha') & manifest.has_dark == 1, 1);
eoLightRow = find(strcmp(manifest.dataset, 'eophtha') & manifest.has_light == 1, 1);

figure;

subplot(3,2,1); imshow(imread(manifest.image_path{driveRow}));      title('DRIVE image');
subplot(3,2,2); imshow(imread(manifest.vessel_mask{driveRow}));     title('DRIVE vessel mask');

subplot(3,2,3); imshow(imread(manifest.image_path{eoDarkRow}));     title('e-Ophtha (MA) image');
subplot(3,2,4); imshow(imread(manifest.dark_mask{eoDarkRow}));      title('e-Ophtha dark mask');

subplot(3,2,5); imshow(imread(manifest.image_path{eoLightRow}));    title('e-Ophtha (EX) image');
subplot(3,2,6); imshow(imread(manifest.light_mask{eoLightRow}));    title('e-Ophtha light mask');