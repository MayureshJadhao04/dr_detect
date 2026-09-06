%% Evaluate Model 2 on the validation set
clear; clc;
load('D:\DATASETS\model2_resnet50.mat', 'model2');

labels = readtable('D:\DATASETS\model2_224\labels.csv', 'TextType', 'string');
labels.grade = categorical(labels.grade);

rng(1);   % SAME seed as training - reproduces the identical val split
cv = cvpartition(labels.grade, 'Holdout', 0.15);
valLabels = labels(test(cv), :);

imdsVal = imageDatastore(valLabels.image_path, 'Labels', valLabels.grade);
imdsVal.ReadFcn = @(filename) enhanceImage(imread(filename));
augVal = augmentedImageDatastore([224 224 3], imdsVal);

predictedGrades = classify(model2, augVal);
trueGrades = valLabels.grade;

%% --- 5-class confusion matrix ---
figure;
cm = confusionchart(trueGrades, predictedGrades);
cm.Title = '5-class grade confusion matrix (validation set)';
overallAcc = mean(predictedGrades == trueGrades);
fprintf('Overall 5-class accuracy: %.2f%%\n\n', overallAcc*100);

%% --- Collapse to referable (grade >= 2) vs non-referable, the actual PS metric ---
trueReferable = double(trueGrades) - 1 >= 2;        % categorical 1-5 -> grade 0-4, so subtract 1
predReferable = double(predictedGrades) - 1 >= 2;

TP = sum(trueReferable == 1 & predReferable == 1);
FN = sum(trueReferable == 1 & predReferable == 0);
TN = sum(trueReferable == 0 & predReferable == 0);
FP = sum(trueReferable == 0 & predReferable == 1);

sensitivity = TP / (TP + FN);   % catches real referable cases
specificity = TN / (TN + FP);   % correctly clears healthy cases

fprintf('--- Referable DR (grade >= 2) — the PS target metric ---\n');
fprintf('Sensitivity: %.2f%%  (target: >90%%)\n', sensitivity*100);
fprintf('Specificity: %.2f%%  (target: >85%%)\n', specificity*100);
fprintf('TP=%d  FN=%d  TN=%d  FP=%d\n', TP, FN, TN, FP);

figure;
confusionchart([TN FP; FN TP], {'Non-referable','Referable'}, ...
    'Title', 'Referable DR — binary confusion matrix', ...
    'RowSummary', 'row-normalized');
