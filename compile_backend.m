% compile_backend.m
% Compiles pipelineServer.m into a standalone executable using MATLAB Compiler.
% Run this in MATLAB Command Window:
%   >> compile_backend

fprintf('========================================================\n');
fprintf('Compiling MATLAB AI Pipeline Daemon (dr_backend.exe)...\n');
fprintf('========================================================\n');

thisDir = fileparts(mfilename('fullpath'));
outputDir = fullfile(thisDir, 'dist_backend');
if ~isfolder(outputDir)
    mkdir(outputDir);
end

% Build with mcc
mccCmd = sprintf('mcc -m "%s" -a "%s" -a "%s" -o dr_backend -d "%s" -v', ...
    fullfile(thisDir, 'models', 'pipelineServer.m'), ...
    fullfile(thisDir, 'models'), ...
    fullfile(thisDir, 'functions'), ...
    outputDir);

fprintf('Executing: %s\n', mccCmd);
eval(mccCmd);

% Copy the compiled executable to repo root for easy detection by Electron
exeSrc = fullfile(outputDir, 'dr_backend.exe');
exeDest = fullfile(thisDir, 'dr_backend.exe');
if isfile(exeSrc)
    copyfile(exeSrc, exeDest);
    fprintf('\nSUCCESS: dr_backend.exe compiled and copied to root: %s\n', exeDest);
else
    fprintf('\nCompilation complete. Check dist_backend/ for generated binary.\n');
end
