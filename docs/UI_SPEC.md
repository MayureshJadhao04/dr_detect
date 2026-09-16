# UI Spec — DR Detect Desktop Application

The application is built as a cross-platform desktop application using **Electron 44 + React 19 + Vite 8**, connected via headless stdio JSON-IPC to the MATLAB R2026a backend runtime.

---

## 1. Aesthetic & Design System: Clinical Neumorphic / Soft Inflated Glass

The UI adopts a tactile, clinical frosted-glass aesthetic reminiscent of physical medical hardware surfaces:
- **Surface Elevation**: Cards look like inflated frosted-glass slabs floating subtly above a light `#EEF3F9` clinical background.
- **Surface Material**: Soft directional tonal variation (`linear-gradient(145deg, #FFFFFF 0%, #F8FAFD 52%, #F1F5FA 100%)`).
- **Multi-Layer Shadow Architecture**:
  - Top-left ambient lift: `-6px -6px 16px rgba(255, 255, 255, 0.90)`
  - Close contact shadow: `0 2px 6px rgba(70, 90, 120, 0.10)`
  - Diffuse ambient separation: `0 10px 24px rgba(70, 90, 120, 0.08)`
  - Inset upper rim highlight: `inset 0 1px 1.5px rgba(255, 255, 255, 0.90)`
  - Inset lower curvature shading: `inset 0 -1.5px 3px rgba(150, 165, 185, 0.10)`
- **Subconscious Edge Lighting (`::before`)**: Diffuse specular highlight along upper curved rims (`radial-gradient(ellipse 70% 32% at 24% 0%, rgba(255,255,255,0.40), transparent 80%)`).
- **Border Treatment**: No harsh dark borders. Uses soft edge glows (`1px solid rgba(255, 255, 255, 0.65)`).
- **Recessed Controls**: Inputs and search fields use gentle neumorphic insets (`--neu-inset`: `inset 2px 2px 5px rgba(140,160,185,0.22)`, `inset -2px -2px 5px rgba(255,255,255,0.80)`).

---

## 2. Layout & Global Navigation

### Sidebar (`desktop/src/components/Sidebar.jsx`)
- **Width**: 240px, full height with soft right border and subtle elevation shadow.
- **Brand Header** (`Logo.jsx`):
  - Pure transparent RGBA retina logo mark (477×523 natural ratio, 130px width).
  - DOM-rendered crisp tagline: `EARLY DETECTION · BRIGHTER TOMORROWS` in `Inter`, uppercase, `0.11em` tracking with brand coral accent dot (`#EF5B63`).
- **Navigation Tabs**:
  1. `Dashboard` — System overview, throughput metrics, recent alerts.
  2. `New Screening` — Bilateral examination console with live AI pipeline.
  3. `Patients` — Offline local patient visits archive (`patient_data/`).
  4. `Reports` — Standardized clinical A4 PDF document library.
  5. `Doctor Review` — Tele-triage dashboard with automated severity flags.
  6. `Analytics` — District-level population epidemiology & model validation graphs.
  7. `Model Insights` — DeepLabv3+ & ResNet-101 architecture and explainability specs.
  8. `Settings` — Daemon watchdog configuration, GPU acceleration, and storage paths.
- **Active State**: Light coral pill (`#FCE1E3`) with coral border (`#F6C9CD`) and coral text (`#D94750`).

### Top Bar (`desktop/src/components/TopBar.jsx`)
- Dynamic breadcrumb header per active tab.
- Inset search pill with quick navigation.
- Engine status indicator pill: `READY` (green), `BUSY / RUNNING` (amber), `ERROR` (red).
- Real-time digital clock and clinical operator profile badge.

---

## 3. Screening Console Components (`screen`)

1. **Patient Information Card** (`PatientInfoCard.jsx`):
   - Inline editable patient demographic grid: Patient ID, Full Name, Age, Sex, Diabetes Duration.
   - "Add New Patient" workflow auto-generates sequential IDs and resets form state.
2. **Fundus Images Card** (`FundusImagesCard.jsx`):
   - Dedicated `.fundus-eye-panel` containers for Right Eye (OD) and Left Eye (OS).
   - Black retinal camera viewports (`#000000`, 240px) with eye icons and upload prompt.
   - Status indicators: "No image selected", "Image added", "Image failed to load".
   - File picker integration with support for local image drop/selection.
3. **Screening Result Card** (`ScreeningResultCard.jsx`):
   - Guarded action: "Run Screening" button disabled with pale pink styling until both OD and OS images are loaded.
   - Real-time spinner & analysis state.
   - Bilateral result cards: OD (Right Eye) and OS (Left Eye) with ICDR severity badges (Grade 0: Normal, Grade 1: Mild, Grade 2: Moderate, Grade 3: Severe, Grade 4: PDR).
   - Clinical Referral Recommendation banner.
   - Primary action buttons: "View Report" (opens native PDF) and "Send to Doctor" (saves visit and queues for triage).
4. **Progress Stepper** (`ProgressStepper.jsx`):
   - 4-phase execution feedback: Preprocessing & Enhancement → DeepLabv3+ Segmentation → ResNet-101 Grading → PDF Generation.
   - Abort control to safely terminate running daemon operations.
5. **Results Hub** (`ResultsHub.jsx`):
   - Interactive Grad-CAM attention blending slider (0% original fundus to 100% full jet-colormap overlay).
   - Detected lesion chips and radial confidence gauges.
   - Bilateral side-by-side comparison.
6. **Patient Records Table** (`RecordsTable.jsx`):
   - Inset search bar filtering by patient ID and name.
   - Direct launch links to generated PDF reports and visit directories.

---

## 4. Color Tokens & Palette

| Token | Hex / RGBA | Role |
|---|---|---|
| `--bg` | `#EEF3F9` | App shell backdrop |
| `--surface` | `#FFFFFF` -> `#F1F5FA` | Inflated frosted glass card surfaces |
| `--text-primary` | `#17253D` | Primary navy headings & data |
| `--text-secondary` | `#60708A` | Muted clinical labels & subtitles |
| `--blue` | `#315DAA` | Primary interactive buttons & OD theme |
| `--brand` | `#EF5B63` | Alerts, PDR/Severe badges, active nav |
| `--success` | `#28A88A` | Grade 0 / No DR normal state |
| `--warning` | `#E7A348` | Cautionary states, Moderate NPDR |
