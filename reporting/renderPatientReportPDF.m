function renderPatientReportPDF(analysis, patientInfo, outPdfPath)
% renderPatientReportPDF  Draws the DR_Detect-branded PDF report from
% ALREADY-COMPUTED analysis data (see analyzePatientVisit.m). Does NOT
% run any inference -- pure rendering, so it's safe to call as many
% times as needed (e.g. regenerating a report) without re-running Model
% 1 / Model 2 / Grad-CAM.
%
%   renderPatientReportPDF(analysis, patientInfo, outPdfPath)
%
%   analysis     : struct from analyzePatientVisit.m (fields rightEye,
%                  leftEye, each with heatmap/predictedGrade/confidence/
%                  gradeLabel/referral/maskProb/imgResized224/
%                  validRegion/imgRaw/imgEnhanced/lesionText/quality)
%   patientInfo  : struct with fields name, patientID, age, sex,
%                  diabetesDuration
%   outPdfPath   : where to save the report (.pdf)
%
% THREE DELIBERATE DEVIATIONS FROM THE MOCKUP'S LITERAL TEXT (do not
% silently "fix" these without confirming with the user first):
%   1. DME row prints "Not assessed", not "Not detected" -- no DME
%      detection model exists anywhere in this pipeline.
%   2. Footer "Trained on" line lists "IDRiD, APTOS2019" only --
%      Messidor was never incorporated into training.
%   3. "Detected lesions" text (computed in analyzePatientVisit.m) uses
%      an ASSUMED, UNCONFIRMED channel-to-lesion-name mapping -- verify
%      against Model 1's actual training-time class order before
%      trusting these names in a real report.
%
% PDF export uses print()/'-dpdf', NOT exportgraphics -- a real bug was
% found this session where exportgraphics(...,'ContentType','vector')
% did not respect PaperSize/PaperPosition margins the way expected,
% causing left/right edge cropping. print() is confirmed working.

eR = analysis.rightEye;
eL = analysis.leftEye;

dmeText = 'Not assessed';   % see deviation #1 above

reportID = sprintf('DRD-%s-%04d', datestr(now,'yyyymmdd'), randi(9999));
dateStr  = datestr(now, 'dd mmm yyyy, HH:MM AM');

%% ---- Figure setup ----
figW = 700;
figH = round(700 * 29.7/21.0);   % keep exact A4 aspect ratio
designAspect = figW / figH;      % used only for keeping images visually square

fig = figure('Visible', 'off', 'Color', 'w', ...
    'Units', 'pixels', 'Position', [100 100 figW figH], ...
    'PaperUnits', 'centimeters', 'PaperSize', [21.0 29.7], ...
    'PaperPosition', [0 0 21.0 29.7], 'PaperPositionMode', 'manual');

set(fig, 'DefaultTextFontName', pickFont());
set(fig, 'DefaultAxesFontName', pickFont());

bgAx = axes(fig, 'Units', 'normalized', 'Position', [0 0 1 1], ...
    'XLim', [0 1], 'YLim', [0 1], 'Visible', 'off');
hold(bgAx, 'on');

navy   = hex2rgb('17243A');
gray   = hex2rgb('64748B');
ltgray = hex2rgb('CBD5E1');
tblhdr = hex2rgb('F8FAFC');

ty = @(f) 1 - f;

ML = 0.058;   % left margin
MR = 0.942;   % right margin

%% ---- Header ----
text(bgAx, ML, ty(0.028), 'DR_Detect', 'FontSize', 26, 'FontWeight', 'bold', ...
    'Color', navy, 'Interpreter', 'none');
text(bgAx, ML, ty(0.052), 'A I - P O W E R E D   D I A B E T I C   R E T I N O P A T H Y   S C R E E N I N G', ...
    'FontSize', 8, 'Color', gray, 'FontWeight', 'bold');

line(bgAx, [0.660 0.660], [ty(0.010) ty(0.075)], 'Color', gray, 'LineWidth', 1.2);

metaLabels = {'Report ID', 'Date & Time', 'Facility'};
metaValues = {reportID, dateStr, 'Tele-ophthalmology Unit'};
metaLabelX = 0.675;
metaValueX = 0.775;
for i = 1:3
    yy = 0.020 + (i-1)*0.020;
    text(bgAx, metaLabelX, ty(yy), metaLabels{i}, 'FontSize', 8.5, 'Color', gray);
    text(bgAx, metaValueX, ty(yy), [': ' metaValues{i}], 'FontSize', 8.5, 'Color', navy, 'FontWeight', 'bold');
end

line(bgAx, [ML MR], [ty(0.083) ty(0.083)], 'Color', navy, 'LineWidth', 1.5);

%% ---- Title block ----
text(bgAx, ML, ty(0.108), 'Diabetic Retinopathy Screening Report', ...
    'FontSize', 19, 'FontWeight', 'bold', 'Color', navy);
text(bgAx, ML, ty(0.138), 'Automated analysis to support clinical decision-making', ...
    'FontSize', 10, 'Color', gray);

line(bgAx, [ML MR], [ty(0.155) ty(0.155)], 'Color', ltgray, 'LineWidth', 1);

%% ---- Patient Information ----
text(bgAx, ML, ty(0.160), 'Patient Information', 'FontSize', 12, 'FontWeight', 'bold', 'Color', navy);

rectangle(bgAx, 'Position', [ML, ty(0.220), MR-ML, 0.220-0.170], ...
    'FaceColor', tblhdr, 'EdgeColor', ltgray, 'LineWidth', 0.75);

fields = {'Name', 'Patient ID', 'Age', 'Sex', 'Diabetes Duration'};
values = { patientInfo.name, patientInfo.patientID, ...
    sprintf('%d years', patientInfo.age), patientInfo.sex, ...
    sprintf('%d years', patientInfo.diabetesDuration) };
colX  = ML + [0, 0.195, 0.370, 0.500, 0.635];
divX  = ML + [0.180, 0.355, 0.480, 0.610];

for i = 1:5
    text(bgAx, colX(i), ty(0.183), fields{i}, 'FontSize', 8.5, 'Color', gray);
    text(bgAx, colX(i), ty(0.205), values{i}, 'FontSize', 10.5, 'FontWeight', 'bold', 'Color', navy);
end
for i = 1:numel(divX)
    line(bgAx, [divX(i) divX(i)], [ty(0.176) ty(0.216)], 'Color', ltgray, 'LineWidth', 1);
end

line(bgAx, [ML MR], [ty(0.230) ty(0.230)], 'Color', ltgray, 'LineWidth', 1);

%% ---- Screening Result table ----
text(bgAx, ML, ty(0.245), 'Screening Result', 'FontSize', 12, 'FontWeight', 'bold', 'Color', navy);

tblTop = 0.258; rowH = 0.027; nRows = 4;
tblColX = ML + [0, 0.290, 0.590];
tblColW = [0.290, 0.300, 0.300];
tblRight = MR;

rectangle(bgAx, 'Position', [tblColX(1), ty(tblTop+rowH), tblRight-tblColX(1), rowH], ...
    'FaceColor', tblhdr, 'EdgeColor', 'none');

rowLabels = {'DR Grade', 'Referral Decision', ['DME ' char(8203)]};
rightVals = {eR.gradeLabel, eR.referral, dmeText};
leftVals  = {eL.gradeLabel, eL.referral, dmeText};
headerVals = {'Parameter', 'Right Eye (OD)', 'Left Eye (OS)'};

for r = 1:nRows
    rowTopY = tblTop + (r-1)*rowH;
    if r == 1
        for c = 1:3
            halign = 'left'; if c > 1, halign = 'center'; end
            xpos = tblColX(c) + 0.010; if c > 1, xpos = tblColX(c) + tblColW(c)/2; end
            text(bgAx, xpos, ty(rowTopY + rowH*0.65), headerVals{c}, ...
                'FontSize', 9.5, 'FontWeight', 'bold', 'Color', navy, ...
                'HorizontalAlignment', halign);
        end
    else
        ri = r - 1;
        text(bgAx, tblColX(1)+0.010, ty(rowTopY + rowH*0.65), rowLabels{ri}, ...
            'FontSize', 9.5, 'FontWeight', 'bold', 'Color', navy);
        text(bgAx, tblColX(2)+tblColW(2)/2, ty(rowTopY + rowH*0.65), rightVals{ri}, ...
            'FontSize', 9.5, 'FontWeight', 'bold', 'Color', navy, 'HorizontalAlignment', 'center');
        text(bgAx, tblColX(3)+tblColW(3)/2, ty(rowTopY + rowH*0.65), leftVals{ri}, ...
            'FontSize', 9.5, 'FontWeight', 'bold', 'Color', navy, 'HorizontalAlignment', 'center');
    end
    line(bgAx, [tblColX(1) tblRight], [ty(rowTopY) ty(rowTopY)], 'Color', ltgray, 'LineWidth', 0.75);
end
line(bgAx, [tblColX(1) tblRight], [ty(tblTop+nRows*rowH) ty(tblTop+nRows*rowH)], 'Color', ltgray, 'LineWidth', 0.75);
for c = 2:3
    line(bgAx, [tblColX(c) tblColX(c)], [ty(tblTop) ty(tblTop+nRows*rowH)], 'Color', ltgray, 'LineWidth', 0.75);
end
rectangle(bgAx, 'Position', [tblColX(1), ty(tblTop+nRows*rowH), tblRight-tblColX(1), nRows*rowH], ...
    'EdgeColor', ltgray, 'LineWidth', 0.75);

tblBottom = tblTop + nRows*rowH;

%% ---- Fundus Analysis ----
text(bgAx, ML, ty(tblBottom + 0.016), 'Fundus Analysis', 'FontSize', 12, 'FontWeight', 'bold', 'Color', navy);

eyeBoxTop = tblBottom + 0.028;
eyeBoxH   = 0.220;
gap       = 0.010;

renderEyeBox(fig, bgAx, eyeBoxTop, eyeBoxH, 'Right Eye', '(OD)', ...
    eR.imgResized224, eR.imgEnhanced, eR.heatmap, eR.imgRaw, eR.lesionText, eR.confidence, eR.quality, ...
    designAspect, navy, ltgray, gray, ML, MR);

renderEyeBox(fig, bgAx, eyeBoxTop + eyeBoxH + gap, eyeBoxH, 'Left Eye', '(OS)', ...
    eL.imgResized224, eL.imgEnhanced, eL.heatmap, eL.imgRaw, eL.lesionText, eL.confidence, eL.quality, ...
    designAspect, navy, ltgray, gray, ML, MR);

footerTop = eyeBoxTop + 2*eyeBoxH + gap + 0.014;

%% ---- Footer ----
line(bgAx, [ML MR], [ty(footerTop) ty(footerTop)], 'Color', ltgray, 'LineWidth', 1);

text(bgAx, ML, ty(footerTop+0.015), 'DR_Detect', 'FontSize', 12, 'FontWeight', 'bold', 'Color', navy, 'Interpreter', 'none');
text(bgAx, ML, ty(footerTop+0.030), 'Version 1.0.0  |  ResNet101 (fine-tuned)', 'FontSize', 8, 'Color', gray);
text(bgAx, ML, ty(footerTop+0.043), 'Trained on: IDRiD, APTOS2019', 'FontSize', 8, 'Color', gray);

sigY = footerTop + 0.016;
line(bgAx, [0.590 0.740], [ty(sigY) ty(sigY)], 'Color', 'k', 'LineWidth', 0.75);
line(bgAx, [0.775 0.880], [ty(sigY) ty(sigY)], 'Color', 'k', 'LineWidth', 0.75);
text(bgAx, 0.590, ty(sigY+0.013), "Clinician's Name & Signature", 'FontSize', 7.5, 'Color', gray);
text(bgAx, 0.775, ty(sigY+0.013), 'Date', 'FontSize', 7.5, 'Color', gray);

line(bgAx, [ML MR], [ty(footerTop+0.054) ty(footerTop+0.054)], 'Color', ltgray, 'LineWidth', 0.5);
text(bgAx, ML, ty(footerTop+0.068), ['Report generated on: ' dateStr], 'FontSize', 7.5, 'Color', gray);
text(bgAx, 0.400, ty(footerTop+0.068), ...
    'This report is generated by an AI model and is intended to assist clinical decision-making.', ...
    'FontSize', 7, 'Color', gray);
text(bgAx, 0.400, ty(footerTop+0.079), ...
    'It should not replace the judgment of a qualified eye care professional.', ...
    'FontSize', 7, 'Color', gray);

%% ---- Save ----
[outDir, outName, ~] = fileparts(outPdfPath);
if isempty(outDir), outDir = pwd; end
pdfPath = fullfile(outDir, [outName '.pdf']);

print(fig, pdfPath, '-dpdf', '-r300', '-bestfit');

pngPath = fullfile(outDir, [outName '.png']);
print(fig, pngPath, '-dpng', '-r150');

close(fig);

end

%% ========================================================================
function renderEyeBox(fig, bgAx, boxTop, boxH, eyeLabel1, eyeLabel2, ...
    imgOrig, imgEnh, heatmap, imgRawForOrig, lesionText, confidence, iqText, ...
    designAspect, navy, ltgray, gray, xLeft, xRight)

ty = @(f) 1 - f;

rectangle(bgAx, 'Position', [xLeft, ty(boxTop+boxH), xRight-xLeft, boxH], ...
    'EdgeColor', ltgray, 'LineWidth', 1);

text(bgAx, xLeft+0.010, ty(boxTop+boxH*0.42), eyeLabel1, 'FontSize', 11, 'FontWeight', 'bold', 'Color', navy);
text(bgAx, xLeft+0.010, ty(boxTop+boxH*0.42+0.020), eyeLabel2, 'FontSize', 11, 'FontWeight', 'bold', 'Color', navy);

labelDivX = xLeft + 0.095;
line(bgAx, [labelDivX labelDivX], [ty(boxTop+0.012) ty(boxTop+boxH-0.012)], 'Color', ltgray, 'LineWidth', 1);

imgTop   = boxTop + 0.038;
imgWFrac = 0.170;
imgHFrac = imgWFrac * designAspect;
imgGap   = 0.011;
imgStartX = labelDivX + 0.018;

capNames = {'Original', 'Enhanced', 'Grad-CAM'};
for k = 1:3
    xk = imgStartX + (k-1)*(imgWFrac + imgGap);
    text(bgAx, xk + imgWFrac/2, ty(imgTop - 0.007), capNames{k}, ...
        'FontSize', 9, 'FontWeight', 'bold', 'Color', navy, 'HorizontalAlignment', 'center');

    axImg = axes(fig, 'Units', 'normalized', ...
        'Position', [xk, 1-(imgTop+imgHFrac), imgWFrac, imgHFrac]);

    switch k
        case 1
            [dispImg, ~] = resizeWithPad(imgRawForOrig, [], [400 400]);
            imshow(uint8(dispImg), 'Parent', axImg);
        case 2
            [dispImg, ~] = resizeWithPad(imgEnh, [], [400 400]);
            imshow(uint8(dispImg), 'Parent', axImg);
        case 3
            imshow(uint8(imgOrig), 'Parent', axImg);
            hold(axImg, 'on');
            hIm = imshow(heatmap, 'Parent', axImg);
            colormap(axImg, 'jet');
            set(hIm, 'AlphaData', 0.45);
    end
end

sbDivX = imgStartX + 3*imgWFrac + 2*imgGap + 0.010;
line(bgAx, [sbDivX sbDivX], [ty(boxTop+0.012) ty(boxTop+boxH-0.012)], 'Color', ltgray, 'LineWidth', 1);

sbX = sbDivX + 0.014;
text(bgAx, sbX, ty(boxTop+0.040), 'Detected lesions', 'FontSize', 9, 'FontWeight', 'bold', 'Color', navy);

nLesionSlots = 4;
lineSpacing = 0.0135;
for li = 1:min(numel(lesionText), nLesionSlots)
    text(bgAx, sbX, ty(boxTop+0.056+(li-1)*lineSpacing), lesionText{li}, 'FontSize', 8.5, 'Color', navy);
end
sidebarY1 = boxTop + 0.056 + nLesionSlots*lineSpacing + 0.002;

line(bgAx, [sbX xRight-0.015], [ty(sidebarY1) ty(sidebarY1)], 'Color', ltgray, 'LineWidth', 0.75);

text(bgAx, sbX, ty(sidebarY1+0.018), 'AI confidence', 'FontSize', 9, 'FontWeight', 'bold', 'Color', navy);
text(bgAx, sbX, ty(sidebarY1+0.035), sprintf('%.0f%%', confidence*100), 'FontSize', 8.5, 'Color', navy);
line(bgAx, [sbX xRight-0.015], [ty(sidebarY1+0.048) ty(sidebarY1+0.048)], 'Color', ltgray, 'LineWidth', 0.75);

text(bgAx, sbX, ty(sidebarY1+0.068), 'Image quality', 'FontSize', 9, 'FontWeight', 'bold', 'Color', navy);
text(bgAx, sbX, ty(sidebarY1+0.085), iqText, 'FontSize', 8.5, 'Color', navy);

end

%% ========================================================================
function rgb = hex2rgb(hexStr)
hexStr = char(hexStr);
rgb = [hex2dec(hexStr(1:2)), hex2dec(hexStr(3:4)), hex2dec(hexStr(5:6))] / 255;
end

%% ========================================================================
function fontName = pickFont()
availableFonts = listfonts();
if any(strcmpi(availableFonts, 'Inter'))
    fontName = 'Inter';
else
    fontName = 'Arial';
end
end
