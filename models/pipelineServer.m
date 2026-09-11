function pipelineServer()
% pipelineServer  Persistent stdio JSON-IPC daemon for DR screening.
% Communicates with external frontend (Electron/Node) via newline-delimited
% JSON on stdin/stdout. Keeps Model 1 and Model 2 warm in GPU memory.
%
% Run standalone or compile with MATLAB Compiler:
%   mcc -m models/pipelineServer.m -a models -a functions -o dr_backend

    % Ensure unbuffered stdout
    if ispc
        % Windows stdout handle 1
    end

    thisDir = fileparts(mfilename('fullpath'));
    repoRoot = fullfile(thisDir, '..');
    addpath(fullfile(repoRoot, 'functions'));
    addpath(fullfile(repoRoot, 'models'));

    % Default paths (can be overridden via set_config)
    dataDir = fullfile(repoRoot, 'patient_data');
    tempDir = fullfile(repoRoot, 'temp');
    if ~isfolder(tempDir), mkdir(tempDir); end

    sendJson(struct('event', 'status', 'state', 'BOOTING', ...
        'message', 'Initializing MATLAB AI Engine and loading models...'));

    % Check GPU
    gpuAvail = false;
    try
        gpuAvail = canUseGPU();
    catch
        gpuAvail = false;
    end

    % Load Model 1
    model1Path = fullfile(thisDir, 'model1_final.mat');
    if ~isfile(model1Path)
        sendError('init', 'FILE_NOT_FOUND', ...
            ['Model 1 weights not found: ' model1Path], 'Verify model1_final.mat exists in models/');
        return;
    end
    m1 = load(model1Path, 'net');
    net1 = m1.net;

    % Load Model 2
    model2Path = fullfile(thisDir, 'model2_final_weighted.mat');
    if ~isfile(model2Path)
        sendError('init', 'FILE_NOT_FOUND', ...
            ['Model 2 weights not found: ' model2Path], 'Verify model2_final_weighted.mat exists in models/');
        return;
    end
    m2 = load(model2Path, 'net2trained');
    net2 = m2.net2trained;

    % Handshake ready
    sendJson(struct('event', 'ready', 'version', '1.0', ...
        'gpuAvailable', gpuAvail, 'dataDir', dataDir));

    % State
    lastAnalysis = [];

    % Main event loop (listening to stdin)
    while true
        rawLine = fgetl(0);
        if ~ischar(rawLine)
            % EOF detected (parent process closed stdin / exited)
            break;
        end

        trimmed = strtrim(rawLine);
        if isempty(trimmed)
            continue;
        end

        reqId = 'unknown';
        try
            req = jsondecode(trimmed);
            if isfield(req, 'id')
                reqId = req.id;
            end
        catch ME
            sendError('unknown', 'MALFORMED_JSON', ...
                ['Failed to parse JSON input: ' ME.message], 'Provide valid newline-delimited JSON.');
            continue;
        end

        if ~isfield(req, 'action')
            sendError(reqId, 'INVALID_REQUEST', 'Missing "action" field in request.', 'Include an action: ping, set_config, analyze, save, or exit.');
            continue;
        end

        try
            switch lower(req.action)
                case 'ping'
                    sendJson(struct('id', reqId, 'event', 'pong', 'timestamp', datestr(now, 'yyyy-mm-ddTHH:MM:SS')));

                case 'set_config'
                    if isfield(req, 'dataDir') && ~isempty(req.dataDir)
                        dataDir = req.dataDir;
                        if ~isfolder(dataDir), mkdir(dataDir); end
                        tempDir = fullfile(dataDir, '..', 'temp');
                        if ~isfolder(tempDir), mkdir(tempDir); end
                    end
                    sendJson(struct('id', reqId, 'event', 'config_ack', 'dataDir', dataDir));

                case 'analyze'
                    if ~isfield(req, 'leftImgPath') || ~isfield(req, 'rightImgPath')
                        sendError(reqId, 'INVALID_REQUEST', 'Both leftImgPath and rightImgPath are required.', 'Provide valid file paths.');
                        continue;
                    end

                    leftPath = req.leftImgPath;
                    rightPath = req.rightImgPath;

                    if ~isfile(leftPath)
                        sendError(reqId, 'FILE_NOT_FOUND', ['Left eye image does not exist: ' leftPath], 'Check file path.');
                        continue;
                    end
                    if ~isfile(rightPath)
                        sendError(reqId, 'FILE_NOT_FOUND', ['Right eye image does not exist: ' rightPath], 'Check file path.');
                        continue;
                    end

                    % Progress: Enhancing
                    sendProgress(reqId, 'Enhancing & Quality Verification', 20);
                    
                    % Quality pre-check
                    try
                        imgRawL = imread(leftPath);
                        imgRawR = imread(rightPath);
                    catch ME
                        sendError(reqId, 'CORRUPT_IMAGE', ['Failed to read image file: ' ME.message], 'Ensure image is a valid PNG/JPEG/TIFF.');
                        continue;
                    end

                    % Progress: Model 1
                    sendProgress(reqId, 'Model 1 Lesion Segmentation', 50);

                    % Progress: Model 2 & Grad-CAM
                    sendProgress(reqId, 'Model 2 Severity & Grad-CAM', 80);

                    % Execute full bilateral analysis
                    analysis = analyzePatientVisit(net1, net2, leftPath, rightPath);
                    lastAnalysis = analysis;

                    % Export heatmaps and raw thumbs for UI visualization
                    [~, leftBase, ~] = fileparts(leftPath);
                    [~, rightBase, ~] = fileparts(rightPath);
                    ts = datestr(now, 'yyyymmdd_HHMMSS');

                    leftHeatmapPath  = fullfile(tempDir, sprintf('%s_%s_OS_heatmap.png', ts, leftBase));
                    rightHeatmapPath = fullfile(tempDir, sprintf('%s_%s_OD_heatmap.png', ts, rightBase));
                    leftRawPath      = fullfile(tempDir, sprintf('%s_%s_OS_raw.png', ts, leftBase));
                    rightRawPath     = fullfile(tempDir, sprintf('%s_%s_OD_raw.png', ts, rightBase));

                    imwrite(analysis.leftEye.heatmap, leftHeatmapPath);
                    imwrite(analysis.rightEye.heatmap, rightHeatmapPath);
                    imwrite(analysis.leftEye.imgRaw, leftRawPath);
                    imwrite(analysis.rightEye.imgRaw, rightRawPath);

                    sendProgress(reqId, 'Compiling Results', 95);

                    % Build payload
                    summaryData = struct();
                    summaryData.leftEye = struct( ...
                        'predictedGrade', analysis.leftEye.predictedGrade, ...
                        'gradeLabel', analysis.leftEye.gradeLabel, ...
                        'confidence', round(analysis.leftEye.confidence * 1000) / 10, ...
                        'referral', analysis.leftEye.referral, ...
                        'quality', analysis.leftEye.quality, ...
                        'lesionText', {analysis.leftEye.lesionText}, ...
                        'rawPath', leftRawPath, ...
                        'heatmapPath', leftHeatmapPath);

                    summaryData.rightEye = struct( ...
                        'predictedGrade', analysis.rightEye.predictedGrade, ...
                        'gradeLabel', analysis.rightEye.gradeLabel, ...
                        'confidence', round(analysis.rightEye.confidence * 1000) / 10, ...
                        'referral', analysis.rightEye.referral, ...
                        'quality', analysis.rightEye.quality, ...
                        'lesionText', {analysis.rightEye.lesionText}, ...
                        'rawPath', rightRawPath, ...
                        'heatmapPath', rightHeatmapPath);

                    % Overall diagnosis
                    maxGrade = max(analysis.leftEye.predictedGrade, analysis.rightEye.predictedGrade);
                    if maxGrade >= 2
                        summaryData.overallReferral = 'REFER TO RETINA SPECIALIST';
                        summaryData.isReferable = true;
                    else
                        summaryData.overallReferral = 'Routine Annual Follow-up';
                        summaryData.isReferable = false;
                    end

                    % Save result JSON to disk to avoid stdout buffer overflow
                    resultFilePath = fullfile(tempDir, sprintf('analysis_%s_%s.json', reqId, ts));
                    fid = fopen(resultFilePath, 'w');
                    fprintf(fid, '%s', jsonencode(summaryData));
                    fclose(fid);

                    sendProgress(reqId, 'Analysis Complete', 100);

                    sendJson(struct('id', reqId, 'event', 'analysis_complete', ...
                        'resultFile', resultFilePath, 'summary', summaryData));

                case 'save'
                    if isempty(lastAnalysis)
                        sendError(reqId, 'NO_ANALYSIS', 'No analysis available to save. Run analyze first.', 'Analyze patient images before saving.');
                        continue;
                    end
                    if ~isfield(req, 'patientInfo')
                        sendError(reqId, 'INVALID_REQUEST', 'Missing patientInfo object.', 'Include name, patientID, age, sex, diabetesDuration.');
                        continue;
                    end

                    pInfo = req.patientInfo;
                    sendProgress(reqId, 'Generating PDF and Saving Visit', 50);

                    visitPath = savePatientVisit(lastAnalysis, pInfo, dataDir);
                    reportPdf = fullfile(visitPath, 'report.pdf');
                    reportPng = fullfile(visitPath, 'report.png');

                    sendProgress(reqId, 'Save Complete', 100);

                    sendJson(struct('id', reqId, 'event', 'saved', ...
                        'visitPath', visitPath, 'pdfPath', reportPdf, 'pngPath', reportPng));

                case 'exit'
                    sendJson(struct('id', reqId, 'event', 'exiting', 'message', 'Daemon shutting down.'));
                    break;

                otherwise
                    sendError(reqId, 'UNKNOWN_ACTION', ['Unrecognized action: ' req.action], 'Supported actions: ping, set_config, analyze, save, exit.');
            end
        catch ME
            sendError(reqId, 'INTERNAL_ERROR', ME.message, 'Review backend logs for stack trace.');
        end
    end
end

function sendJson(s)
    str = jsonencode(s);
    fprintf('%s\n', str);
    fflush(1);
end

function sendProgress(id, stage, pct)
    p = struct('id', id, 'event', 'progress', 'stage', stage, 'percent', pct);
    sendJson(p);
end

function sendError(id, code, msg, remedy)
    e = struct('id', id, 'event', 'error', 'code', code, 'message', msg, 'remedy', remedy);
    sendJson(e);
end
