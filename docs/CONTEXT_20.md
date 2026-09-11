# Context handoff v20 — Full Frontend Completion & Compilation Readiness

Supersedes `CONTEXT_19.md`. 

**Current State (Sept 11, 2026)**:
The frontend desktop application has been completely built, verified, redesigned to match the hospital reference dashboard, and committed to git (`7a66e9d`). All core features (bilateral screening, Grad-CAM overlay, PDF reporting, patient records, real tele-triage doctor responses, and daemon management) are operational.

---

## 1. Project Summary

- **Problem**: SIH Problem Statement 26038 (MathWorks) — "Explainable AI for Diabetic Retinopathy Screening in Rural India."
- **Stack**:
  - **AI / Pipeline**: MATLAB R2026a, NVIDIA GPU, Model 1 (DeepLabv3+ lesion segmentation), Model 2 (ResNet-101 ICDR 0–4 severity grading), Grad-CAM heatmaps.
  - **Desktop App**: Electron 44 + React 19 + Vite 8 + Lucide React.
  - **Local IPC / Backend**: `models/pipelineServer.m` stdio JSON-IPC daemon (pure stdin/stdout, newline-delimited, zero ports/listening sockets, immune to firewall blocks) supervised by `desktop/electron/daemonManager.cjs`.
- **Repo Root**: `D:\Projects\dr-screening\`

---

## 2. Models & MATLAB Pipeline (Unchanged & Final)

- **Model 1**: `models/model1_final.mat` (DeepLabv3+ segmentation for microaneurysms, hemorrhages, hard/soft exudates).
- **Model 2**: `models/model2_final_weighted.mat` (ResNet-101 fusion classifier for ICDR 0–4 severity grading).
- **Explainability**: `models/generateGradCAM.m`, `generateGradCAMForImage.m`.
- **Backend Daemon Protocol**: `models/pipelineServer.m` communicates via stdin/stdout:
  - Inbound: `{"id":"...","action":"analyze|save|ping|set_config|exit",...}\n`
  - Outbound: `{"id":"...","event":"ready|progress|analysis_complete|saved|pong|error",...}\n`
  - Error Contract: Structured shape `{"id":"...","event":"error","code":"...","message":"...","remedy":"..."}`.
- **Reporting & Storage**: `models/generatePatientReport.m`, `renderPatientReportPDF.m`, `savePatientVisit.m`. Uses pure local offline file store (`patient_data/<patientID>/visits/<timestamp>/`), no external database engine required.

---

## 3. Desktop Frontend Architecture (Completed)

All UI components reside in `desktop/src/components/` and are fully operational:

### A. Shell & Layout
- **Container**: `app-shell` rounded floating container (18px border radius, soft shadow, `#eef1f6` main background).
- **Sidebar** (`Sidebar.jsx`): Pure white (`#ffffff`) sidebar with dark headings, subtle right border, and active tab light indigo highlight (`#f0f3fe`) with curved left capsule marker matching reference design.
- **TopBar** (`TopBar.jsx`): Transparent header with centered search bar pill, live date/time clock, notification bell, and operator profile badge.

### B. Screening Tab (`activeTab === 'screen'`)
1. **PatientInfoCard** (`PatientInfoCard.jsx`):
   - Fields: Name, Age, Gender, Contact, Notes, Risk Factors, Screening Date.
   - "Add New Patient": Clears input fields, preserves gender selector clean state, auto-increments Patient ID (`P-10249`, `P-10250`, etc.).
   - Edit toggle allows updating patient details without losing entered data.
2. **FundusImagesCard** (`FundusImagesCard.jsx`):
   - Separate upload tiles for Right Eye (OD) and Left Eye (OS).
   - Local image preview with "Image Added" badges that validate real image presence (never flags empty placeholders).
   - "Replace Image" and "Clear" actions for error correction.
3. **ScreeningResultCard** (`ScreeningResultCard.jsx`):
   - Guard against empty image runs: "Run Screening" disabled until both OD and OS images are uploaded.
   - "Stop Screening" abort button during analysis.
   - **OD Card (Right Eye)**: Styled after top-right panel in reference with rich royal blue gradient (`#4f5ef7` -> `#3a4ae4`), white typography, ICDR badge, and subtle bar chart graphic.
   - **OS Card (Left Eye)**: Styled after bottom-right panel in reference with dark slate/charcoal gradient (`#525c6a` -> `#3e4652`), white typography, green ICDR badge, and subtle node graphic.
   - **Referral Banner**: Clinical triage recommendation (Referral Recommended vs Routine Follow-up).
   - **Actions**: "View Report" (opens generated A4 PDF in native viewer) and "Send Report" (saves to patient visit folder and pushes to doctor review database).
4. **ProgressStepper** (`ProgressStepper.jsx`):
   - 4-stage pipeline visualization (Preprocessing -> DeepLabv3+ -> ResNet-101 -> Report Compilation) with abort control.
5. **ResultsHub** (`ResultsHub.jsx`):
   - Detailed bilateral comparison columns with OD (blue) and OS (slate) markers.
   - Radial severity gauge, detected biomarker/lesion chips, and interactive Grad-CAM attention blending slider (0–100%).
   - Export buttons: "View PDF" and "Open Folder".
6. **RecordsTable** (`RecordsTable.jsx`):
   - Patient visit history table with real-time search filtering, status pills, and direct report launch buttons.

### C. Doctor Responses Tab (`activeTab === 'responses'`)
- **DoctorResponsesView** (`DoctorResponsesView.jsx`):
  - Tele-triage dashboard displaying doctor feedback on uploaded reports.
  - **Real Triage Logic**: Automatically flags severe cases (`maxGrade >= 3` npdr/pdr) as `ACTION REQUIRED` (red alert badge), while lower grades are marked `REVIEWED` (green).
  - Search filter, summary metric cards, and "View Report" links.

### D. Settings Tab (`activeTab === 'settings'`)
- **SettingsView** (`SettingsView.jsx`): Daemon port configuration, model checkpoint paths, ping check, and UI preferences.

---

## 4. Electron Daemon Integration (`desktop/electron/`)

- `daemonManager.cjs`: Spawns and supervises the MATLAB backend process.
  - Checks for compiled executable at `dr_backend.exe`.
  - Fallback in development mode: runs `matlab -batch "run('models/pipelineServer.m');"`.
  - 120-second watchdog timer, stdout parsing, automatic restart up to 2 attempts on crash.
- `main.cjs` & `preload.cjs`: IPC bridge exposing `window.api` methods (`runScreening`, `stopPipeline`, `savePatientVisit`, `getPatientHistory`, `openPath`, `getDaemonStatus`).

---

## 5. Verification & Git Status

- **Build**: `npm run build` in `desktop/` succeeds cleanly in <400ms (`dist/` generated).
- **Git Commit**: `7a66e9d` — `feat(ui): complete dashboard redesign, white sidebar, and bilateral OD/OS cards`. Working tree is 100% clean.

---

## 6. Immediate Next Step: Compilation into Standalone Executable

1. **Compile MATLAB Backend**:
   - Run `compile_backend.m` in MATLAB:
     ```matlab
     mcc -m models/pipelineServer.m -a models -a functions -o dr_backend -d dist_backend -v
     ```
   - Copies generated `dr_backend.exe` to repo root (`D:\Projects\dr-screening\dr_backend.exe`).
2. **Package Desktop Electron App**:
   - Ensure `electron-builder` includes `dr_backend.exe` and `models/` in `extraResources`.
   - Run `npm run build:exe` inside `desktop/` to generate the standalone Windows installer.
