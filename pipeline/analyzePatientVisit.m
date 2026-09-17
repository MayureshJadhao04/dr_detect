function analysis = analyzePatientVisit(net1, net2, leftImgPath, rightImgPath)
% analyzePatientVisit  Runs Model 1 + Model 2 + Grad-CAM ONCE per eye and
% returns everything needed to (a) display results on screen and (b),
% separately, save/render a report later -- WITHOUT re-running inference.
%
%   analysis = analyzePatientVisit(net1, net2, leftImgPath, rightImgPath)
%
% analysis.rightEye / analysis.leftEye each contain:
%   heatmap, predictedGrade, confidence, gradeLabel, referral,
%   maskProb, imgResized224, validRegion, imgRaw, imgEnhanced,
%   lesionText (cell array), quality
%
% This is the function the "Analyse" button should call. Show
% analysis.rightEye.gradeLabel / .confidence / .referral / .heatmap etc.
% on screen. When the clinician then clicks "Save"/"Send Report", pass
% this SAME struct into savePatientVisit() -- do not call this function
% again, it would just re-run inference for no reason.

    REFERRAL_THRESHOLD = 2;
    gradeNames = {'No DR','Mild NPDR','Moderate NPDR','Severe NPDR','Proliferative DR'};

    analysis.rightEye = runOneEye(net1, net2, rightImgPath, gradeNames, REFERRAL_THRESHOLD);
    analysis.leftEye  = runOneEye(net1, net2, leftImgPath,  gradeNames, REFERRAL_THRESHOLD);
    analysis.leftImgPath  = leftImgPath;
    analysis.rightImgPath = rightImgPath;
end


function eye = runOneEye(net1, net2, imgPath, gradeNames, referralThreshold)
    [heatmap, predictedGrade, confidence, ~, maskProb, imgResized224, validRegion] = ...
        generateGradCAMForImage(net1, net2, imgPath);

    imgRaw = imread(imgPath);
    imgEnhanced = enhanceImage(imgRaw);

    predictedGrade = max(0, min(4, round(double(predictedGrade))));
    confidence = max(0, min(1, double(confidence)));
    if confidence > 1
        confidence = confidence / 100;   % defensive, matches earlier pipeline guard
    end

    gradeLabel = sprintf('Level %d - %s', predictedGrade, gradeNames{predictedGrade+1});

    % Confidence-based clinical deferral: if confidence < 65%, refer for manual clinician review
    CONFIDENCE_DEFERRAL_THRESHOLD = 0.65;
    if confidence < CONFIDENCE_DEFERRAL_THRESHOLD
        referral = 'REFER (Low Confidence / Clinical Deferral)';
    elseif predictedGrade >= referralThreshold
        referral = 'REFER';
    else
        referral = 'Routine Follow-up';
    end

    eye.heatmap        = heatmap;
    eye.predictedGrade = predictedGrade;
    eye.confidence     = confidence;
    eye.gradeLabel     = gradeLabel;
    eye.referral       = referral;
    eye.maskProb       = maskProb;
    eye.imgResized224  = imgResized224;
    eye.validRegion    = validRegion;
    eye.imgRaw         = imgRaw;
    eye.imgEnhanced    = imgEnhanced;
    eye.lesionText      = detectedLesionsText(maskProb);
    eye.quality        = imageQualityText(imgRaw);
end


%% ========================================================================
function found = detectedLesionsText(maskProb)
% Returns a CELL ARRAY, one lesion name per entry. ASSUMPTION FLAGGED:
% channel order assumed [vessel, dark-lesion, light-lesion, prolif].
% Confirm against Model 1's actual training-time class order before
% trusting these names in a real report.
lesionChannelMap = { ...
    2, {'Microaneurysms', 'Hemorrhages'}; ...
    3, {'Hard exudates'}; ...
    4, {'Neovascularization'} };

covThresh = 0.0005;
totalPx = size(maskProb,1) * size(maskProb,2);

found = {};
for i = 1:size(lesionChannelMap,1)
    ch = lesionChannelMap{i,1};
    names = lesionChannelMap{i,2};
    if ch > size(maskProb,3), continue; end
    coverage = sum(maskProb(:,:,ch) >= 0.5, 'all') / totalPx;
    if coverage > covThresh
        found = [found, names]; %#ok<AGROW>
    end
end

if isempty(found)
    found = {'No significant lesions detected'};
end
end


%% ========================================================================
function txt = imageQualityText(imgRaw)
% Real but simple heuristic (Laplacian-variance blur check + mean-
% brightness bounds). Not a trained model.
grayImg = double(rgb2gray(imgRaw));
lapVar = var(reshape(conv2(grayImg, fspecial('laplacian'), 'valid'), [], 1));
meanBrightness = mean(grayImg(:));

if lapVar > 15 && meanBrightness > 30 && meanBrightness < 220
    txt = 'Good';
else
    txt = 'Check quality (blur/exposure)';
end
end
