function prepareModel2Data(outRoot)
% PREPAREMODEL2DATA Combines APTOS2019 + IDRiD Disease Grading into one
% resized (224x224), aspect-preserving, labeled dataset for Model 2.
%
%   prepareModel2Data('D:\DATASETS\model2_224')
%
% Output: outRoot/images/*.png + outRoot/labels.csv
%   labels.csv columns: image_path, grade, source
%
% APTOS2019 and IDRiD both use train+test/val combined as one training
% pool (per earlier decision - no formal held-out set from either,
% Messidor-2 is the only true test set, handled separately).

    targetSize = [224 224];

    if ~isfolder(fullfile(outRoot,'images')), mkdir(fullfile(outRoot,'images')); end

    allRows = table();

    % ================= APTOS2019 =================
    aptosRoot = 'D:\DATASETS\raw\APTOS2019';
    aptosImgDir = fullfile(aptosRoot, 'train_images', 'train_images');

    aptosCsvFiles = {'train_1.csv', 'valid.csv', 'test.csv'};
    for c = 1:numel(aptosCsvFiles)
        csvPath = fullfile(aptosRoot, aptosCsvFiles{c});
        if ~isfile(csvPath)
            fprintf('Skipping missing file: %s\n', csvPath);
            continue
        end
        T = readtable(csvPath, 'TextType', 'string');

        for i = 1:height(T)
            idCode = T.id_code(i);
            grade = T.diagnosis(i);

            srcPath = fullfile(aptosImgDir, idCode + ".png");
            if ~isfile(srcPath)
                fprintf('WARNING: APTOS image not found, skipping: %s\n', srcPath);
                continue
            end

            img = imread(srcPath);
            [imgOut, ~] = resizeWithPad(img, [], targetSize);

            outName = sprintf('aptos_%s.png', idCode);
            imwrite(imgOut, fullfile(outRoot, 'images', outName));

            newRow = table(string(fullfile(outRoot,'images',outName)), grade, "aptos2019", ...
                'VariableNames', {'image_path','grade','source'});
            allRows = [allRows; newRow]; %#ok<AGROW>
        end
        fprintf('APTOS2019 %s: done\n', aptosCsvFiles{c});
    end

    % ================= IDRiD Disease Grading =================
    idridRoot = 'D:\DATASETS\raw\IDRiD\B. Disease Grading\B. Disease Grading';

    idridSplits = { ...
        struct('imgFolder', fullfile(idridRoot,'1. Original Images','a. Training Set'), ...
               'csv', fullfile(idridRoot,'2. Groundtruths','a. IDRiD_Disease Grading_Training Labels.csv')), ...
        struct('imgFolder', fullfile(idridRoot,'1. Original Images','b. Testing Set'), ...
               'csv', fullfile(idridRoot,'2. Groundtruths','b. IDRiD_Disease Grading_Testing Labels.csv')) ...
    };

    for s = 1:numel(idridSplits)
        split = idridSplits{s};
        if ~isfile(split.csv)
            fprintf('Skipping missing file: %s\n', split.csv);
            continue
        end
        T = readtable(split.csv, 'TextType', 'string');

        for i = 1:height(T)
            imgName = T.ImageName(i);
            grade = T.RetinopathyGrade(i);

            srcPath = fullfile(split.imgFolder, imgName + ".jpg");
            if ~isfile(srcPath)
                fprintf('WARNING: IDRiD image not found, skipping: %s\n', srcPath);
                continue
            end

            img = imread(srcPath);
            [imgOut, ~] = resizeWithPad(img, [], targetSize);

            outName = sprintf('idrid_%s.png', imgName);
            imwrite(imgOut, fullfile(outRoot, 'images', outName));

            newRow = table(string(fullfile(outRoot,'images',outName)), grade, "idrid", ...
                'VariableNames', {'image_path','grade','source'});
            allRows = [allRows; newRow]; %#ok<AGROW>
        end
        fprintf('IDRiD split: done\n');
    end

    writetable(allRows, fullfile(outRoot, 'labels.csv'));
    fprintf('\nDone. %d total images. Breakdown:\n', height(allRows));
    disp(groupcounts(allRows, 'source'));
    fprintf('\nGrade distribution:\n');
    disp(groupcounts(allRows, 'grade'));
end
