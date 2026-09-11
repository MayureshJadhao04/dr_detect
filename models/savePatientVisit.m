function visitPath = savePatientVisit(analysis, patientInfo, baseDir)
% savePatientVisit  Saves an ALREADY-ANALYZED patient visit to the
% local, offline-first data model. Takes the struct returned by
% analyzePatientVisit.m -- does NOT run any inference itself, so this
% is safe to call only after the clinician has reviewed the on-screen
% results and clicked "Save"/"Send Report".
%
%   visitPath = savePatientVisit(analysis, patientInfo, baseDir)
%
%   analysis     : struct from analyzePatientVisit.m (fields rightEye,
%                  leftEye, leftImgPath, rightImgPath)
%   patientInfo  : struct with fields name, patientID, age, sex,
%                  diabetesDuration
%   baseDir      : (optional) path to patient_data root directory
%
%   visitPath    : full path to the created visit folder

    if nargin < 3 || isempty(baseDir)
        baseDir = 'D:\Projects\dr-screening\patient_data';
    end

    requiredFields = {'name','patientID','age','sex','diabetesDuration'};
    for k = 1:numel(requiredFields)
        if ~isfield(patientInfo, requiredFields{k})
            error('savePatientVisit:MissingPatientField', ...
                'patientInfo.%s is required.', requiredFields{k});
        end
    end
    if ~isfield(analysis, 'rightEye') || ~isfield(analysis, 'leftEye')
        error('savePatientVisit:InvalidAnalysis', ...
            'analysis must be the struct returned by analyzePatientVisit.m.');
    end

    eR = analysis.rightEye;
    eL = analysis.leftEye;

    patientDir = fullfile(baseDir, char(patientInfo.patientID));
    visitsDir = fullfile(patientDir, 'visits');

    if ~isfolder(patientDir)
        mkdir(patientDir);
    end
    if ~isfolder(visitsDir)
        mkdir(visitsDir);
    end

    % --- info.json: write once, or refresh if patient details changed ---
    infoPath = fullfile(patientDir, 'info.json');
    infoStruct = struct( ...
        'name', patientInfo.name, ...
        'patientID', patientInfo.patientID, ...
        'age', patientInfo.age, ...
        'sex', patientInfo.sex, ...
        'diabetesDuration', patientInfo.diabetesDuration);
    fid = fopen(infoPath, 'w');
    fprintf(fid, '%s', jsonencode(infoStruct, 'PrettyPrint', true));
    fclose(fid);

    % --- one timestamped visit folder ---
    timestamp = datestr(now, 'yyyymmdd_HHMMSS');
    visitPath = fullfile(visitsDir, timestamp);
    mkdir(visitPath);

    % --- save images (from the ALREADY-COMPUTED analysis, no re-reading
    % or re-enhancing needed) ---
    % Coerce paths to plain char explicitly -- a cell or unexpected type
    % here (e.g. from table indexing) would otherwise silently produce
    % an empty fullfile() result and a cryptic imwrite error.
    rightImgPathChar = localToChar(analysis.rightImgPath, 'analysis.rightImgPath');
    leftImgPathChar  = localToChar(analysis.leftImgPath,  'analysis.leftImgPath');

    [~, ~, rightExt] = fileparts(rightImgPathChar);
    [~, ~, leftExt] = fileparts(leftImgPathChar);
    if isempty(rightExt), rightExt = '.jpg'; end
    if isempty(leftExt), leftExt = '.jpg'; end

    rightRawPath = fullfile(visitPath, ['right_raw' rightExt]);
    leftRawPath  = fullfile(visitPath, ['left_raw' leftExt]);
    if isempty(rightRawPath) || isempty(leftRawPath)
        error('savePatientVisit:EmptyOutputPath', ...
            'Computed an empty output filename -- visitPath="%s", rightExt="%s", leftExt="%s".', ...
            visitPath, rightExt, leftExt);
    end

    imwrite(eR.imgRaw, rightRawPath);
    imwrite(eR.imgEnhanced, fullfile(visitPath, 'right_enhanced.png'));
    imwrite(eL.imgRaw, leftRawPath);
    imwrite(eL.imgEnhanced, fullfile(visitPath, 'left_enhanced.png'));

    % --- report.pdf, rendered from the already-computed analysis (no
    % inference re-run -- see renderPatientReportPDF.m) ---
    reportPath = fullfile(visitPath, 'report.pdf');
    renderPatientReportPDF(analysis, patientInfo, reportPath);

    % --- result.json: the structured record for this visit ---
    resultStruct = struct( ...
        'patientID', patientInfo.patientID, ...
        'timestamp', timestamp, ...
        'rightEye', struct('grade', eR.predictedGrade, 'confidence', eR.confidence, 'referral', eR.referral), ...
        'leftEye',  struct('grade', eL.predictedGrade, 'confidence', eL.confidence, 'referral', eL.referral), ...
        'reportPath', reportPath, ...
        'synced', false);   % future scope: sync process flips this to true

    resultPath = fullfile(visitPath, 'result.json');
    fid = fopen(resultPath, 'w');
    fprintf(fid, '%s', jsonencode(resultStruct, 'PrettyPrint', true));
    fclose(fid);

    fprintf('Visit saved for patient %s: %s\n', patientInfo.patientID, visitPath);
end


%% ========================================================================
function s = localToChar(v, fieldNameForError)
% Coerces a string/char/cell-wrapped-string to plain char, with a clear
% error if it's something unexpected (e.g. numeric, empty, or a
% multi-element cell) -- this is the defensive fix for a real bug hit
% this session where an unexpected type here produced an empty fullfile()
% result and a cryptic "Filename must be supplied" error from imwrite
% several lines later, far from the actual cause.
if isstring(v) && isscalar(v)
    s = char(v);
elseif ischar(v)
    s = v;
elseif iscell(v) && isscalar(v)
    s = localToChar(v{1}, fieldNameForError);   % unwrap a 1x1 cell, common table-indexing gotcha
else
    error('savePatientVisit:BadPathType', ...
        '%s must be a char or scalar string, got class "%s".', ...
        fieldNameForError, class(v));
end
if isempty(s)
    error('savePatientVisit:EmptyPath', '%s is empty.', fieldNameForError);
end
end