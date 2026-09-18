function prepareModel2Data_384(outRoot, maxImages)
% PREPAREMODEL2DATA_384 Prepares 384x384 high-resolution dataset for Model 2
%   1. Resizes raw fundus images with aspect-preserving letterboxing to 384x384
%   2. Generates continuous soft probability masks (384x384x4) from masks_cache
%   3. Precomputes 4-2-1 clinical quadrant biomarkers (N_MA, A_Heme, Q_Heme, F_NV)
%   4. Preserves identical stratified train/val split for unbiased comparison

    if nargin < 1 || isempty(outRoot)
        outRoot = 'D:\DATASETS\model2_384';
    end
    if nargin < 2
        maxImages = Inf;
    end

    targetSize = [384 384];
    imgOutDir = fullfile(outRoot, 'images');
    maskOutDir = fullfile(outRoot, 'masks_cache');

    if ~isfolder(imgOutDir), mkdir(imgOutDir); end
    if ~isfolder(maskOutDir), mkdir(maskOutDir); end

    srcLabelsPath = 'D:\DATASETS\model2_224\labels.csv';
    srcMaskDir = 'D:\DATASETS\model2_224\masks_cache';
    srcSplitPath = 'D:\DATASETS\model2_224\model2_split.mat';

    aptosRawDir = 'D:\DATASETS\raw\APTOS2019\train_images\train_images';
    idridRawDir1 = 'D:\DATASETS\raw\IDRiD\B. Disease Grading\B. Disease Grading\1. Original Images\a. Training Set';
    idridRawDir2 = 'D:\DATASETS\raw\IDRiD\B. Disease Grading\B. Disease Grading\1. Original Images\b. Testing Set';

    T = readtable(srcLabelsPath, 'TextType', 'string');
    totalN = min(height(T), maxImages);
    fprintf('Starting 384x384 preparation for %d images into %s...\n', totalN, outRoot);

    newImagePaths = strings(totalN, 1);
    grades = zeros(totalN, 1);
    sources = strings(totalN, 1);

    tStart = tic;

    for i = 1:totalN
        origPath = T.image_path(i);
        [~, baseName, ~] = fileparts(origPath);
        grade = T.grade(i);
        src = T.source(i);

        dstImgPath = fullfile(imgOutDir, baseName + ".png");
        dstMaskPath = fullfile(maskOutDir, baseName + ".mat");

        % --- 1. Load Image (from raw if available, else fallback) ---
        img = [];
        if startsWith(baseName, "aptos_")
            rawId = extractAfter(baseName, "aptos_");
            rawFile = fullfile(aptosRawDir, rawId + ".png");
            if isfile(rawFile)
                img = imread(rawFile);
            end
        elseif startsWith(baseName, "idrid_")
            rawId = extractAfter(baseName, "idrid_");
            rawFile1 = fullfile(idridRawDir1, rawId + ".jpg");
            rawFile2 = fullfile(idridRawDir2, rawId + ".jpg");
            if isfile(rawFile1)
                img = imread(rawFile1);
            elseif isfile(rawFile2)
                img = imread(rawFile2);
            end
        end

        if isempty(img)
            % Fallback to existing 224 image
            img = imread(origPath);
        end

        % Resize with aspect-ratio letterbox padding to 384x384
        [img384, ~] = resizeWithPad(img, [], targetSize);
        imwrite(img384, dstImgPath);

        % --- 2. Process Mask & Clinical Biomarkers ---
        srcMaskFile = fullfile(srcMaskDir, baseName + ".mat");
        if isfile(srcMaskFile)
            sMask = load(srcMaskFile, 'maskResized');
            m224 = sMask.maskResized;
            % Bilinear continuous interpolation to 384x384
            m384 = single(imresize(m224, targetSize, 'bilinear'));
            m384 = max(0, min(1, m384));

            % Clinical Biomarker Extraction (Hybrid Bridge)
            darkMask = m384(:,:,2);
            [H, W] = size(darkMask);
            hMid = floor(H/2);
            wMid = floor(W/2);

            % 4 Quadrants: ST, SN, IT, IN
            q1 = darkMask(1:hMid, 1:wMid);
            q2 = darkMask(1:hMid, wMid+1:end);
            q3 = darkMask(hMid+1:end, 1:wMid);
            q4 = darkMask(hMid+1:end, wMid+1:end);
            qCount = single((sum(q1(:) > 0.20) > 10) + ...
                            (sum(q2(:) > 0.20) > 10) + ...
                            (sum(q3(:) > 0.20) > 10) + ...
                            (sum(q4(:) > 0.20) > 10));

            aHeme = single(sum(darkMask(:) > 0.20) / (H * W));

            % Microaneurysm count (small connected components <= 25 px)
            cc = bwconncomp(darkMask > 0.25);
            props = regionprops(cc, 'Area');
            areas = [props.Area];
            nMA = single(sum(areas <= 25));

            % Neovascularization flag
            prolifMask = m384(:,:,4);
            fNV = single(any(prolifMask(:) > 0.20));

            clinicalFeatures = [nMA, aHeme, qCount, fNV];

            maskResized = m384;
            save(dstMaskPath, 'maskResized', 'clinicalFeatures', '-v7');
        else
            % Default empty mask if missing
            maskResized = zeros([targetSize 4], 'single');
            clinicalFeatures = zeros(1, 4, 'single');
            save(dstMaskPath, 'maskResized', 'clinicalFeatures', '-v7');
        end

        newImagePaths(i) = string(dstImgPath);
        grades(i) = grade;
        sources(i) = src;

        if mod(i, 200) == 0 || i == totalN
            elapsed = toc(tStart);
            rate = i / elapsed;
            remaining = (totalN - i) / max(rate, 1e-4);
            fprintf('  [%d / %d] (%.1f%%) - %.1f img/s - ETA: %.1f min\n', ...
                i, totalN, (i/totalN)*100, rate, remaining/60);
        end
    end

    % --- 3. Save Labels and Copy Split ---
    outTable = table(newImagePaths, grades, sources, ...
        'VariableNames', {'image_path', 'grade', 'source'});
    writetable(outTable, fullfile(outRoot, 'labels.csv'));
    fprintf('Saved labels.csv with %d rows to %s\n', height(outTable), outRoot);

    copyfile(srcSplitPath, fullfile(outRoot, 'model2_split.mat'));
    fprintf('Copied model2_split.mat to %s\n', outRoot);
    fprintf('Preparation complete in %.2f minutes.\n', toc(tStart)/60);
end
