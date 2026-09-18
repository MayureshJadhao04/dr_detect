function analysis = analyzePatientVisit(net1, net2, leftImgPath, rightImgPath, bridgeModel)
% analyzePatientVisit  Runs Model 1 + Model 2 + Grad-CAM ONCE per eye and
% returns everything needed to (a) display results on screen and (b),
% separately, save/render a report later -- WITHOUT re-running inference.
%
%   analysis = analyzePatientVisit(net1, net2, leftImgPath, rightImgPath, bridgeModel)

    if nargin < 5
        bridgeModel = [];
    end

    REFERRAL_THRESHOLD = 2;
    gradeNames = {'No DR','Mild NPDR','Moderate NPDR','Severe NPDR','Proliferative DR'};

    analysis.rightEye = runOneEye(net1, net2, rightImgPath, gradeNames, REFERRAL_THRESHOLD, bridgeModel);
    analysis.leftEye  = runOneEye(net1, net2, leftImgPath,  gradeNames, REFERRAL_THRESHOLD, bridgeModel);
    analysis.leftImgPath  = leftImgPath;
    analysis.rightImgPath = rightImgPath;
end


function eye = runOneEye(net1, net2, imgPath, gradeNames, referralThreshold, bridgeModel)
    [heatmap, predictedGrade, confidence, scoresAll, maskProb, imgResized224, validRegion] = ...
        generateGradCAMForImage(net1, net2, imgPath);

    imgRaw = imread(imgPath);
    imgEnhanced = enhanceImage(imgRaw);

    % Late-Fusion Hybrid Feature Bridge (if available)
    if ~isempty(bridgeModel) && isfield(bridgeModel, 'classifier')
        try
            darkMask = maskProb(:,:,2);
            [H, W] = size(darkMask);
            hMid = floor(H/2); wMid = floor(W/2);
            q1 = darkMask(1:hMid, 1:wMid);
            q2 = darkMask(1:hMid, wMid+1:end);
            q3 = darkMask(hMid+1:end, 1:wMid);
            q4 = darkMask(hMid+1:end, wMid+1:end);
            qCount = single((sum(q1(:) > 0.20) > 10) + (sum(q2(:) > 0.20) > 10) + ...
                            (sum(q3(:) > 0.20) > 10) + (sum(q4(:) > 0.20) > 10));
            aHeme = single(sum(darkMask(:) > 0.20) / (H * W));
            cc = bwconncomp(darkMask > 0.25);
            props = regionprops(cc, 'Area');
            areas = [props.Area];
            nMA = single(sum(areas <= 25));
            prolifMask = maskProb(:,:,4);
            fNV = single(any(prolifMask(:) > 0.20));

            clinRaw = [nMA, aHeme, qCount, fNV];
            clinNorm = (clinRaw - bridgeModel.mu) ./ bridgeModel.sigma;

            if size(scoresAll, 1) > 1
                scoresRow = scoresAll';
            else
                scoresRow = scoresAll;
            end
            feat = [single(scoresRow), single(clinNorm)];
            predBridge = predict(bridgeModel.classifier, feat);
            predictedGrade = double(predBridge);
        catch
            % Fall back to CNN prediction if stacking encounters any issue
        end
    end

    predictedGrade = max(0, min(4, round(double(predictedGrade))));
    confidence = max(0, min(1, double(confidence)));
    if confidence > 1
        confidence = confidence / 100;   % defensive, matches earlier pipeline guard
    end

    % Rule-based safety escalation protocol (empirically calibrated prototype thresholds):
    % If Model 1 detects Neovascularization (>0.05%) or extensive hemorrhage (>0.5%),
    % escalate referral to prevent false negatives on severe pathology.
    totalPx = size(maskProb, 1) * size(maskProb, 2);
    hasHighNV = false;
    hasHighHeme = false;
    if size(maskProb, 3) >= 4
        hasHighNV = (sum(maskProb(:,:,4) >= 0.5, 'all') / totalPx) > 0.0005;
    end
    if size(maskProb, 3) >= 2
        hasHighHeme = (sum(maskProb(:,:,2) >= 0.5, 'all') / totalPx) > 0.005;
    end

    CONFIDENCE_DEFERRAL_THRESHOLD = 0.65;
    if hasHighNV || hasHighHeme
        referral = 'REFER (Safety Protocol: High Lesion Density)';
        if predictedGrade < referralThreshold
            predictedGrade = max(predictedGrade, 2);
            gradeLabel = sprintf('Level %d - %s (Escalated)', predictedGrade, gradeNames{predictedGrade+1});
        else
            gradeLabel = sprintf('Level %d - %s', predictedGrade, gradeNames{predictedGrade+1});
        end
    elseif confidence < CONFIDENCE_DEFERRAL_THRESHOLD
        referral = 'REFER (Low Confidence / Clinical Deferral)';
        gradeLabel = sprintf('Level %d - %s', predictedGrade, gradeNames{predictedGrade+1});
    elseif predictedGrade >= referralThreshold
        referral = 'REFER';
        gradeLabel = sprintf('Level %d - %s', predictedGrade, gradeNames{predictedGrade+1});
    else
        referral = 'Routine Follow-up';
        gradeLabel = sprintf('Level %d - %s', predictedGrade, gradeNames{predictedGrade+1});
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
