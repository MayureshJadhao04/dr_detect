# TODO — DR Detect Tracking & Milestones

Status legend: [ ] not started · [~] in progress · [x] done

**Current Milestone (Sept 16–17, 2026):**
Desktop Application (React 19 + Vite 8 + Electron 44) finalized with soft-inflated frosted glass / clinical neomorphic aesthetic, direct high-res transparent logo, and complete bilateral screening lifecycle.
Standalone Windows distribution bundle compiled (`dr_backend.exe` + `electron-builder` NSIS installer `DR-Detect-1.0.0-x64.exe` 713 MB).

---

## 1. Machine Learning & Core Pipeline (MATLAB R2026a)
- [x] Classical CV Image Enhancement (`enhanceImage.m` - CLAHE, bilateral filter, color balance)
- [x] Optical Disc & Fovea Localization (`findOpticDisc.m`, `findFovea.m`)
- [x] Quality Assessment Check (`qualityCheck.m` - Laplacian variance blur & illumination metrics)
- [x] Model 1 Segmentation Network (`model1_final.mat` - DeepLabv3+ ResNet-50 backbone, 4 channels: vessels, dark lesions, light lesions, proliferative)
- [x] Model 2 Classification Network (`model2_final_weighted.mat` - ResNet-101 fusion classifier, ICDR 0–4 severity grading)
- [x] Explainability Heatmaps (`generateGradCAM.m`, `generateGradCAMForImage.m`)
- [x] Automated A4 Clinical PDF Report Generation (`renderPatientReportPDF.m` vector PDF + companion PNG)
- [x] Offline Patient Visit File Storage (`savePatientVisit.m` in `patient_data/<id>/visits/<timestamp>/`)

---

## 2. Desktop Application & Daemon Integration
- [x] JSON-IPC Daemon Protocol (`models/pipelineServer.m` over stdin/stdout, zero open network ports)
- [x] Electron Supervisor (`desktop/electron/daemonManager.cjs` watchdog, crash recovery, health ping)
- [x] Preload & Secure IPC Bridge (`desktop/electron/preload.cjs`, `desktop/electron/main.cjs`)
- [x] UI Shell & Navigation (Sidebar, TopBar with real-time clock, status indicators)
- [x] Multi-View Architecture:
  - [x] New Screening Console (`screen`)
  - [x] Overview Dashboard (`dashboard`)
  - [x] Local Patient Records Archive (`patients` / `records`)
  - [x] Clinical Reports Library (`reports`)
  - [x] Tele-Triage Doctor Review Hub (`responses`)
  - [x] Population Statistics & AI Analytics (`analytics`)
  - [x] Pipeline Architecture & Model Insights (`model-info`)
  - [x] Engine Daemon & Storage Settings (`settings`)
- [x] Bilateral Screening Flow:
  - [x] Patient Information editing with auto-increment ID (`P-10249`, `P-10250`)
  - [x] OD / OS image upload tiles with file picking and visual verification
  - [x] Bilateral progress stepper with abort control
  - [x] Results hub with radial severity gauge, ICDR badge, Grad-CAM attention blending slider
  - [x] Instant A4 PDF launch and folder explorer integration

---

## 3. Visual & Aesthetic Refinement (Completed Sept 16–17)
- [x] Premium Clinical Neumorphic Design System:
  - [x] Soft inflated frosted glass slabs (`linear-gradient(145deg, #FFFFFF, #F8FAFD, #F1F5FA)`)
  - [x] Multi-layer shadow system (contact depth `0 2px 6px rgba(70,90,120,0.10)`, ambient `0 10px 24px`, top-left lift `-6px -6px 16px`, inset edge rim highlights)
  - [x] Dedicated `.fundus-eye-panel` styling for OD and OS image containers
  - [x] Gentle recessed neumorphic inputs (`--neu-inset`)
  - [x] Tactile dimensional buttons and disabled state styling
- [x] Brand Asset & Typography:
  - [x] Pure transparent RGBA logo mark (`desktop/src/assets/dr-detect-logo.png`)
  - [x] Separated sharp DOM tagline (`EARLY DETECTION · BRIGHTER TOMORROWS`) with brand coral accent dot
  - [x] Clean aspect-ratio rendering without blur or pixelation

---

## 4. Packaging & Deployment
- [x] Standalone MATLAB Backend Binary (`dr_backend.exe` via `mcc -m models/pipelineServer.m`)
- [x] Verified headless execution with real fundus image inputs (<15s per bilateral visit)
- [x] Windows x64 Desktop Installer (`DR-Detect-1.0.0-x64.exe`, 713 MB via `electron-builder`)
- [x] Project Presentation & Pitch Deck Assets (`PROJECT_PRESENTATION_GUIDE.md`, `create_presentation.py`)

---

## 5. Future Roadmap (Post-Hackathon)
- [ ] Cloud-synced hospital EMR / HL7 FHIR connector
- [ ] Remote multi-specialist web portal
- [ ] Automated longitudinal disease progression tracking
