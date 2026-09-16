# Architecture — DR Screening Pipeline & Desktop System

## High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ELECTRON DESKTOP CLIENT                         │
│   React 19 + Vite 8 · Clinical Neomorphic UI · Multi-Tab Navigation    │
│  (Screening Console, Dashboard, Patient Records, Reports, Analytics)   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                 JSON-IPC over stdio (stdin / stdout)
               Supervised by daemonManager.cjs (watchdog)
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     MATLAB HEADLESS DAEMON BACKEND                     │
│                pipelineServer.m / Compiled dr_backend.exe              │
├────────────────────────────────────────────────────────────────────────┤
│  [1] Preprocessing & Enhancement (CLAHE, bilateral filter, norm)       │
│  [2] Quality Assessment (Laplacian variance blur, illumination)        │
│  [3] Optic Disc & Fovea Localization (Classical CV)                    │
│  [4] Model 1: DeepLabv3+ ResNet-50 Lesion Segmentation (4 channels)    │
│  [5] Model 2: ResNet-101 Fusion ICDR 0–4 Severity Grading              │
│  [6] Explainability: Grad-CAM Saliency Heatmap Generation              │
│  [7] Automated Report Engine: Vector A4 PDF + Companion PNG            │
│  [8] Structured File Storage: patient_data/<id>/visits/<timestamp>/    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. IPC Communication Protocol

The Electron host (`desktop/electron/daemonManager.cjs`) spawns either the compiled binary (`dr_backend.exe`) or development runtime (`matlab -batch "run('models/pipelineServer.m');"`). Communication occurs via pure newline-delimited JSON over standard I/O (no HTTP ports or sockets to avoid firewall issues):

- **Frontend to Backend (stdin)**:
  - `analyze`: `{ "id": "req-1", "action": "analyze", "leftImage": "...", "rightImage": "...", "patientInfo": { ... } }`
  - `save`: `{ "id": "req-2", "action": "save", "analysisData": { ... }, "patientInfo": { ... } }`
  - `ping`: `{ "id": "req-3", "action": "ping" }`
  - `exit`: `{ "id": "req-4", "action": "exit" }`

- **Backend to Frontend (stdout)**:
  - `ready`: `{ "event": "ready", "gpuAvailable": true, "message": "Models loaded" }`
  - `progress`: `{ "id": "req-1", "event": "progress", "stage": "Segmentation", "percent": 45 }`
  - `analysis_complete`: `{ "id": "req-1", "event": "analysis_complete", "result": { "rightEye": {...}, "leftEye": {...} } }`
  - `saved`: `{ "id": "req-2", "event": "saved", "visitDir": "...", "pdfPath": "..." }`
  - `error`: `{ "id": "req-1", "event": "error", "code": "ERR_LOAD", "message": "...", "remedy": "..." }`

---

## 2. Pipeline Execution Stages

| Stage | Model / Algorithm | Output & Purpose |
|---|---|---|
| **1. Enhancement** | CLAHE, bilateral denoising, color normalization | Uniform camera-agnostic baseline; original kept intact |
| **2. Quality Check** | Laplacian variance, illumination histogram | Flags ungradeable captures; prompts for recapture |
| **3. Optic Disc/Fovea** | `imbinarize`, `imfindcircles`, `regionprops` | Anatomical reference for lesion proximity |
| **4. Segmentation (Model 1)** | DeepLabv3+ (ResNet-50 encoder) | 4-channel masks: vessels, microaneurysms/hemorrhages, exudates, neovascularization |
| **5. Severity Grading (Model 2)** | ResNet-101 fusion classifier | Bilateral ICDR grades (0 to 4) + softmax confidence |
| **6. Explainability** | Grad-CAM on ResNet-101 final conv layer | Attention heatmap showing biomarker features driving prediction |
| **7. Report Generation** | `renderPatientReportPDF.m` | Vector A4 PDF + 150 DPI preview PNG with full clinical metadata |
| **8. Local Storage** | `savePatientVisit.m` | Offline directory archive containing JSON, masks, heatmaps, PDF |

---

## 3. Directory Layout & Deliverables

```
d:/Projects/dr-screening/
├── desktop/                         # Electron + React + Vite desktop app
│   ├── electron/                    # Main process, preload bridge, daemon supervisor
│   │   ├── main.cjs
│   │   ├── preload.cjs
│   │   └── daemonManager.cjs
│   ├── src/
│   │   ├── components/              # Neumorphic React UI views & components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TopBar.jsx
│   │   │   ├── Logo.jsx
│   │   │   ├── PatientInfoCard.jsx
│   │   │   ├── FundusImagesCard.jsx
│   │   │   ├── ScreeningResultCard.jsx
│   │   │   ├── ProgressStepper.jsx
│   │   │   ├── ResultsHub.jsx
│   │   │   ├── RecordsTable.jsx
│   │   │   ├── DashboardView.jsx
│   │   │   ├── ReportsView.jsx
│   │   │   ├── AnalyticsView.jsx
│   │   │   ├── DoctorResponsesView.jsx
│   │   │   └── SettingsView.jsx
│   │   ├── index.css                # Clinical neomorphic design tokens & shadows
│   │   └── App.jsx
│   └── dist_electron/               # Packaged Windows installer (DR-Detect-1.0.0-x64.exe)
├── models/                          # MATLAB core models & server
│   ├── pipelineServer.m             # Stdio JSON-IPC daemon loop
│   ├── analyzePatientVisit.m        # Bilateral analysis coordinator
│   ├── renderPatientReportPDF.m     # Vector A4 PDF generator
│   ├── savePatientVisit.m           # Offline visit serializer
│   ├── model1_final.mat             # DeepLabv3+ network weights
│   └── model2_final_weighted.mat    # ResNet-101 network weights
├── functions/                       # Classical CV utilities
├── patient_data/                    # Local patient records archive
└── docs/                            # Documentation
```
