# Workflow — Build, Testing, and Deployment Guide

## 1. Development Prerequisites
- **MATLAB R2026a** with:
  - Deep Learning Toolbox
  - Computer Vision Toolbox
  - Image Processing Toolbox
  - Parallel Computing Toolbox (for GPU training/inference)
  - MATLAB Compiler (`mcc`)
- **Node.js v20+** and **npm**
- **Git**

---

## 2. Running Locally in Development

### A. Frontend Dev Server (Vite)
```powershell
cd d:\Projects\dr-screening\desktop
npm install
npm run dev
```
Serves React frontend on `http://localhost:5173`.

### B. Launching Electron App (Development Mode)
```powershell
cd d:\Projects\dr-screening\desktop
npm start
```
Spawns Electron. The daemon supervisor automatically checks for `dr_backend.exe`. If not present, it automatically falls back to launching the development script `matlab -batch "run('models/pipelineServer.m');"`.

---

## 3. Compiling the Standalone MATLAB Backend (`dr_backend.exe`)

To compile the headless daemon into a standalone Windows binary:
```matlab
% In MATLAB command prompt:
cd('D:\Projects\dr-screening');
mcc -m models/pipelineServer.m -a models -a functions -o dr_backend -d dist_backend -v
```
Copy the compiled binary into the execution path:
```powershell
Copy-Item "D:\Projects\dr-screening\dist_backend\dr_backend.exe" "D:\Projects\dr-screening\dr_backend.exe"
```

### Verification Test:
Run the standalone test script against real fundus images:
```powershell
node tests\test_backend_standalone.cjs
```
Verifies clean JSON-IPC handshake, progress events, and bilateral inference exit code 0.

---

## 4. Packaging the Standalone Windows Installer

The desktop distribution installer is generated using `electron-builder`:
```powershell
cd d:\Projects\dr-screening\desktop
npm run build:exe
```
This builds the production React client (`dist/`) and compiles the NSIS installer:
- **Output**: `desktop/dist_electron/DR-Detect-1.0.0-x64.exe` (713 MB).
- Includes the standalone `dr_backend.exe` engine unpacked under `resources/`, eliminating any full MATLAB installation requirement on end-user machines.

---

## 5. Offline Data Storage Structure

All patient records, segmented masks, attention heatmaps, and generated reports persist offline in:
```
patient_data/
└── <PatientID>/
    └── visits/
        └── <YYYYMMDD_HHMMSS>/
            ├── visit_data.json         # Full structured analysis metrics
            ├── report.pdf              # Standardized clinical A4 report
            ├── report.png              # Companion 150 DPI preview raster
            ├── right_gradcam.png       # OD attention heatmap
            ├── left_gradcam.png        # OS attention heatmap
            ├── right_mask.png          # OD segmented lesion map
            └── left_mask.png           # OS segmented lesion map
```
Zero internet or external database connection required.
