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
fprintf('Starting MATLAB Compiler (mcc)...\n');
mcc('-m', fullfile(thisDir, 'models', 'pipelineServer.m'), ...
    '-a', fullfile(thisDir, 'models'), ...
    '-a', fullfile(thisDir, 'functions'), ...
    '-a', fullfile(thisDir, 'pipeline'), ...
    '-a', fullfile(thisDir, 'explainability'), ...
    '-a', fullfile(thisDir, 'reporting'), ...
    '-o', 'dr_backend', ...
    '-d', outputDir, ...
    '-v');

% Copy the compiled executable to repo root for easy detection by Electron
exeSrc = fullfile(outputDir, 'dr_backend.exe');
exeDest = fullfile(thisDir, 'dr_backend.exe');
if isfile(exeSrc)
    copyfile(exeSrc, exeDest);
    fprintf('\nSUCCESS: dr_backend.exe compiled and copied to root: %s\n', exeDest);
else
    fprintf('\nCompilation complete. Check dist_backend/ for generated binary.\n');
end
