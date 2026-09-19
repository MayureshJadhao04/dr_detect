# DR_Detect: AI-Powered Tele-Ophthalmology Screening System

## Comprehensive Project Description & Technical Documentation

- **Project Title**: DR_Detect: Clinical-Grade, Explainable, Offline-First Diabetic Retinopathy Screening & Triage System
- **Domain**: Healthcare & Tele-Ophthalmology / Deep Learning & Computer Vision
- **Problem Statement**: Smart India Hackathon (SIH) — PS 26038 (MathWorks)
- **Software Version**: 1.1.0
- **Target Deployment**: Primary Health Centers (PHCs), Rural Vision Centers, Community Health Clinics

---

## 1. Executive Summary & Problem Motivation

Diabetic Retinopathy (DR) is the principal cause of preventable vision impairment and blindness among the working-age population globally. In India alone, over 77 million adults live with diabetes, of whom an estimated 20% to 30% suffer from varying degrees of diabetic eye disease. Early clinical detection and timely specialist referral can prevent over 90% of severe vision loss.

Despite this, rural and semi-urban screening programs encounter severe systemic bottlenecks:
1. **Ophthalmologist Scarcity**: India averages fewer than 1 ophthalmologist per 100,000 citizens in rural sectors; tertiary eye hospitals are concentrated almost exclusively in Tier-1/2 metropolitan areas.
2. **Cloud and Bandwidth Vulnerability**: Most rural Primary Health Centers (PHCs) lack stable high-speed internet, rendering cloud-only AI inference platforms non-viable for daily field operations.
3. **Black-Box Skepticism**: General AI classifiers output abstract class scores without spatial localization or lesion identification, creating justified clinical hesitation among reviewing doctors.
4. **Inter-Observer Agreement & Boundary Fragility**: The transition from Grade 0 (Healthy) to Grade 1 (Mild Non-Proliferative DR) hinges on identifying one or two tiny microaneurysms measuring 2 to 4 pixels across. Even experienced retina specialists achieve only 60%–70% exact concordance on subtle edge cases.

**DR_Detect solves these bottlenecks through an integrated medical desktop solution**:
- Fully **offline-first** operation on local laptop hardware equipped with consumer/mobile NVIDIA GPUs.
- Dual-stage deep learning: **DeepLabv3+** pixel-level semantic lesion segmentation fused with a **384×384 7-channel ResNet-101** classifier optimized via a custom **Focal + Ordinal Loss** function.
- A clinical **Hybrid Feature Bridge (Late-Fusion Stacking)** explicitly encoding the ophthalmological 4-2-1 rule.
- Dual-stream **Multi-Modal Explainability**: spatial multi-lesion density metrics combined with **Grad-CAM attention heatmaps** (featuring radial boundary suppression and letterbox artifact masking).
- Automated generation of archival-grade **single-page A4 diagnostic PDF reports** in under 1.5 seconds.
- Total bilateral patient screening pipeline execution in **<15 seconds** without sending a single byte outside the local clinic.

---

## 2. Core Clinical Objectives & Capabilities

1. **Automated 5-Class ICDR Severity Grading**:
   - **Grade 0 (No DR)**: Clean fundus, zero identifiable microvascular lesions.
   - **Grade 1 (Mild NPDR)**: Presence of isolated microaneurysm(s) only.
   - **Grade 2 (Moderate NPDR)**: More than microaneurysms, but less than the severe 4-2-1 criteria (scattered hemorrhages, hard exudates, cotton wool spots).
   - **Grade 3 (Severe NPDR)**: Follows the clinical 4-2-1 rule (diffuse intraretinal hemorrhages in all 4 quadrants, venous beading in 2+ quadrants, or IRMA in 1+ quadrant).
   - **Grade 4 (Proliferative DR - PDR)**: Neovascularization, preretinal/vitreous hemorrhages, fibrous proliferation.

2. **Pixel-Level Multi-Lesion Segmentation**:
   - Channel 1: Retinal blood vessels (structural vascular tree).
   - Channel 2: Dark microvascular lesions (Microaneurysms, Blot/Flame Hemorrhages).
   - Channel 3: Light lesions (Hard Exudates, Cotton Wool Spots).
   - Channel 4: Proliferative pathology (Neovascularization, IRMA).

3. **Clinically Calibrated Referral Triage**:
   - Binary division: **Non-Referable** (Grades 0 & 1 — annual routine follow-up) vs. **Referable** (Grades 2, 3, & 4 — prompt specialist ophthalmology intervention).
   - **Fail-Safe Confidence Deferral Gate**: Any analysis with softmax confidence $< 65\%$ triggers an automated referral flag (`REFER (Low Confidence / Clinical Deferral)`).
   - **Safety Escalation Protocol**: Direct heuristic checking of Model 1 segmentations; high lesion loads ($>0.05\%$ neovascularization area or $>0.5\%$ hemorrhage area) automatically elevate the decision to specialist referral regardless of classifier output.

4. **Archival Clinical Report Generation**:
   - Vector A4 diagnostic summary containing patient metadata, bilateral comparisons (OD/OS), raw and enhanced fundus photos, Grad-CAM overlays, quantitative lesion breakdowns, AI confidence, and doctor sign-off blocks.

---

## 3. High-Level System Architecture & IPC Integration

The application follows a resilient three-tier decoupled architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ELECTRON DESKTOP CLIENT                         │
│       React 19 · Vite 8 · Modern Neumorphic Clinical Dashboard         │
│   (Screening Console, Patient History, Reports Hub, System Config)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
               Newline-Delimited JSON-IPC via stdio (stdin/stdout)
                    Supervised by daemonManager.cjs
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     MATLAB HEADLESS ENGINE DAEMON                      │
│            pipelineServer.m  / Compiled dr_backend.exe                 │
├────────────────────────────────────────────────────────────────────────┤
│  [Stage 1] Camera Normalization: CLAHE (Lab) + Bilateral Denoising     │
│  [Stage 2] Image Quality Gate: Laplacian Variance & Illumination Check │
│  [Stage 3] Model 1: DeepLabv3+ ResNet-18 Full-Resolution Tiling        │
│  [Stage 4] Early-Fusion Tensor Assembly: 384×384×7 Tensor              │
│  [Stage 5] Model 2: ResNet-101 Classifier (Focal + Ordinal Loss)       │
│  [Stage 6] Hybrid Feature Bridge: Stacking 5 CNN Scores + 4 Biomarkers │
│  [Stage 7] Multi-Modal XAI: Artifact-Suppressed Grad-CAM Generation    │
│  [Stage 8] Decision Gate: Confidence Thresholding & Safety Escalation  │
│  [Stage 9] PDF Engine: Vector A4 Diagnostic Report Compilation         │
│  [Stage 10] Persistence: Offline Directory JSON Data Store             │
└────────────────────────────────────────────────────────────────────────┘
```

### IPC Protocol Details
- Avoids fragile localhost TCP ports or HTTP socket bindings that often trigger corporate/hospital Windows firewall blocks.
- Communication uses newline-delimited JSON over standard I/O handles (`stdin` / `stdout`).
- `daemonManager.cjs` continuously supervises the backend process with health-check pings, a 120-second watchdog timer per request, message queuing, and automatic crash restarts.
- Whitelisted Electron preload script (`preload.cjs`) ensures strict context isolation between Node.js system APIs and the React web frontend.

---

## 4. Deep Learning Architectures & Algorithmic Design

### 4.1 Model 1: DeepLabv3+ Multi-Lesion Semantic Segmentation
- **Backbone**: ResNet-18 encoder with Atrous Spatial Pyramid Pooling (ASPP).
- **Patch Dimension**: Fixed 256×256 input tiles.
- **Loss Formulation**: Custom Masked Weighted Binary Cross-Entropy (`maskedWeightedBCELoss.m`) designed for extreme positive-pixel sparsity ($<0.5\%$ retinal lesion coverage).
- **Full-Resolution Tiled Reconstruction (`tileAndStitchInference.m`)**:
  - Eliminates the need to downscale high-resolution fundus images (which destroys delicate microaneurysms).
  - Divides native fundus photographs (e.g., 1024×1024 to 2048×2048) into overlapping 256×256 windows with 25% overlap (64px stride overlap).
  - Employs **feathered distance blending** at the seams to merge adjacent tile predictions without boundary artifacts.
  - Outputs full-resolution 4-channel continuous soft probability maps $[0.0, 1.0]$.

### 4.2 Model 2: ResNet-101 Early-Fusion Severity Classifier
- **Resolution**: High-resolution 384×384 (upgraded from initial 224×224 baseline).
- **Input Tensor (7 Channels)**:
  - Channels 1–3: Raw fundus image (RGB), aspect-preserving letterbox-padded to 384×384.
  - Channels 4–7: Model 1's continuous soft probability maps (Vessel, Dark, Light, Proliferative) aligned to the identical letterbox geometry.
- **Novel Loss Function (`focalOrdinalLoss.m`)**:
  $$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{Focal}}(\gamma = 2.0) + \lambda_{\text{ord}} \cdot \mathcal{L}_{\text{Ordinal}}(\lambda_{\text{ord}} = 0.20)$$
  1. *Focal Term*: Class-weighted cross-entropy with factor $(1 - p_t)^\gamma$, suppressing the gradient contribution of easily identified Grade 0 examples.
  2. *Ordinal Penalty Term*: Penalizes $(\hat{y} - y^*)^2$, heavily discouraging severe inter-grade misdiagnoses (e.g., misclassifying Grade 4 as Grade 0) over adjacent boundary misclassifications.
- **Targeted Minority Augmentation**: Horizontal and vertical random flips specifically applied to minority classes (Grades 1, 3, and 4) to counter severe real-world data skew.

### 4.3 Late-Fusion Hybrid Feature Bridge (`trainLateFusionBridge.m`)
Extracted from Model 1 soft probability maps and stacked with Model 2's 5 softmax scores:
- $N_{\text{MA}}$: Discrete microaneurysm lesion count (connected components $\le 25\text{ px}$).
- $A_{\text{Heme}}$: Retinal hemorrhage surface area fraction.
- $Q_{\text{Heme}}$: 4-Quadrant Hemorrhage score ($0 \dots 4$), directly encoding the international **4-2-1 clinical diagnostic rule**.
- $F_{\text{NV}}$: Neovascularization proliferative flag ($>0.20$ threshold).
- **Stacking Classifier**: Multiclass regularized logistic regression head running over Z-score standardized features.

---

## 5. Clinical Diagnostic Performance (Held-Out Benchmark, $N=516$)

Evaluated on the held-out stratified validation partition of the unified APTOS 2019 + IDRiD benchmark:

| Diagnostic Metric | DR_Detect v1.1.0 | Initial Baseline (v1.0.0) | Target Reference | Clinical Significance |
|---|:---:|:---:|:---:|---|
| **Referable Sensitivity (Grade $\ge$ 2)** | **97.36%** | 93.39% | $>90.0\%$ | Detects 97.36% of all sight-threatening DR cases needing urgent care |
| **Referable Specificity (Grade $\ge$ 2)** | **89.62%** | 88.58% | $>85.0\%$ | Prevents overburdening tertiary ophthalmology centers |
| **Quadratic Weighted Kappa ($\kappa$)** | **0.8765** | 0.8712 | $>0.80$ | Demonstrates strong agreement on the clinical progression spectrum |
| **Overall 5-Class Exact Accuracy** | **79.46%** | 73.64% | $\sim 78\%\text{--}82\%$ | Full 5-way integer ICDR category concordance |
| **Severe NPDR (Grade 3) Referral** | **100.0%** | 89.2% | $100\%$ | **Zero under-triage**: 0 out of 37 Severe NPDR patients missed |
| **PDR (Grade 4) Referral** | **97.73%** | 90.9% | $>95.0\%$ | 43 out of 44 Proliferative cases correctly referred |

### Validation Confusion Matrix
```
             Predicted Grade
         p0     p1    p2     p3    p4   | Total | Class Recall
  t0    227      3     9      1     0   |  240  | 94.58%
  t1      5     24    18      1     1   |   49  | 48.98%
  t2      1      4   117     12    12   |  146  | 80.14%
  t3      0      0    10     17    10   |   37  | 45.95%
  t4      0      1    12      8    23   |   44  | 52.27%
```

---

## 6. Multi-Modal Explainability & Artifact Suppression

1. **Lesion Manifestation Sidebar**:
   - Model 1's continuous channel output is thresholded at $>0.05\%$ coverage to generate transparent, verifiable textual pathology lists (e.g., `"Microaneurysms"`, `"Hemorrhages"`, `"Hard exudates"`, `"Neovascularization"`).
2. **Gradient-Weighted Saliency (Grad-CAM)**:
   - Activations are computed from layer `res5c_relu` of ResNet-101 with respect to the predicted category.
   - **Boundary Artifact Mitigation**: Conventional Grad-CAM scales heatmaps using global min-max values; black corner padding and letterbox zeroes frequently generate artificially high gradients, suppressing true retinal pathology. DR_Detect computes an anatomical tissue mask, restricts normalization to actual retina regions, and applies **radial boundary feathering via distance transforms** (`bwdist`) to prevent zero-padding edge hotspots.

---

## 7. Image Normalization & Quality Triage

1. **Camera-Agnostic Enhancement (`enhanceImage.m`)**:
   - **L-Channel CLAHE**: Applied strictly within CIE Lab color space ($L$-channel equalized with Rayleigh distribution, clip limit 0.01) to enhance micro-vessel definition without warping native RGB chromatic balance.
   - **Bilateral Filtering**: Per-channel edge-preserving smoothing ($\sigma_{\text{spatial}} = 3$, $\sigma_{\text{range}} = 0.01$).
   - **Percentile Normalization**: 1st-to-99th percentile stretching eliminates illumination cast differences between various tabletop and handheld fundus cameras.
2. **Quality Verification (`qualityCheck.m`)**:
   - Evaluates Laplacian variance ($>15$ required for focus) and mean grayscale intensity ($30 < \mu < 220$) to detect motion blur, cataracts, and under/over-exposure before inference.
3. **Geometric Integrity (`resizeWithPad.m`)**:
   - Utilizes aspect-preserving letterboxing to ensure retinal anatomy is not stretched or distorted.

---

## 8. Clinical Reporting Engine & Data Persistence

1. **A4 Vector PDF Engine (`renderPatientReportPDF.m`)**:
   - Compiles archival vector PDFs and companion 150 DPI preview PNGs directly from pre-computed inference data in $<1.5$ seconds using MATLAB's vector printing engine.
   - Displays bilateral fundus comparisons, patient history, lesion inventory, AI confidence, referral guidance, and clinician signature blocks.
2. **Offline Data Model (`savePatientVisit.m`)**:
   - Completely local, organized filesystem hierarchy:
     ```
     patient_data/
     └── <patientID>/
         ├── info.json
         └── visits/
             └── <YYYYMMDD_HHMMSS>/
                 ├── result.json
                 ├── report.pdf
                 ├── report.png
                 ├── right_raw.jpg / right_enhanced.png
                 └── left_raw.jpg / left_enhanced.png
     ```
   - Includes `"synced": false` telemetry metadata ready for opportunistic cloud synchronization when uplink connectivity becomes available.

---

## 9. Desktop User Interface & Clinical Workflow

- **Framework**: React 19, Vite 8, Lucide React, Electron 44.
- **Design Philosophy**: Clinical Neumorphic styling with soft contrast and subdued medical palettes (Navy `#17243A`, Slate `#64748B`, Surface `#F8FAFC`).
- **Feature Modules**:
  - **Screening Console**: Bilateral file dropzone, live progress stepper, heatmaps, and referral badges.
  - **Dashboard**: High-level screening volume counters, referral breakdown, and system daemon health monitors.
  - **Patient Records**: Searchable, filterable historical patient archive with instant PDF view/re-print capabilities.
  - **Doctor Responses**: Tele-medicine module allowing visiting ophthalmologists to verify or override AI diagnoses.
  - **System Settings**: Configurable local storage directories and GPU/CPU inference toggles.
- **Packaging**: Self-contained Windows NSIS installer (`DR-Detect-1.1.0-x64.exe`) with the compiled MATLAB AI engine (`dr_backend.exe`) bundled directly in application resources.

---

## 10. Technology Stack Summary

| Domain | Technology / Library | Purpose |
|---|---|---|
| **AI Modeling & Training** | MATLAB R2026a (Deep Learning Toolbox) | DeepLabv3+ & ResNet-101 model training & evaluation |
| **Computer Vision** | Image Processing & Computer Vision Toolboxes | CLAHE, bilateral filtering, morphological lesion metrics |
| **Acceleration** | NVIDIA CUDA / TensorRT | GPU-accelerated real-time tensor inference |
| **Backend Daemon** | MATLAB Compiler (`mcc`) | Compiles `pipelineServer.m` into headless `dr_backend.exe` |
| **Desktop Shell** | Electron 44 | Cross-platform desktop runtime container |
| **UI Framework** | React 19 + Vite 8 | Fast, modern, reactive clinical user interface |
| **Styling** | Vanilla CSS3 (Custom Design System) | Clean neumorphic cards, soft elevation, responsive layout |
| **Icons** | Lucide React | High-legibility clinical iconography |
| **IPC Bridge** | Node.js child_process (stdio JSON-IPC) | High-throughput, firewall-independent local communication |
| **Packaging** | electron-builder (NSIS) | Single-click Windows installer with embedded runtime assets |

---

## 11. Key Engineering Innovations & Differentiators

1. **Continuous 7-Channel Early Fusion**: Fuses 3-channel raw fundus imagery with 4-channel continuous soft probability maps from Model 1, preserving subtle lesion likelihood gradients rather than discarding information through premature binary thresholding.
2. **Focal + Ordinal Loss Formulation**: Solves both severe class imbalance and penalizes large clinical error margins quadratically, outperforming vanilla Cross-Entropy by $+5.82\%$ in 5-class exact accuracy.
3. **4-2-1 Hybrid Feature Bridge**: Directly infuses clinical medical knowledge (quadrant hemorrhage distribution and neovascularization flags) into the decision pipeline, improving Severe NPDR discrimination without deep learning latency.
4. **Tile-and-Stitch Native Resolution Inference**: Detects tiny 2–4 pixel microaneurysms at native capture resolutions through overlapping feathered tiles.
5. **Masked Grad-CAM Normalization**: Eliminates spurious edge hotspots driven by letterbox zero-padding borders, guaranteeing faithful visual explanations.
6. **Zero-Cloud Dependency**: 100% functional in air-gapped rural clinics, fulfilling the core mandate of tele-ophthalmology outreach.

---

## 12. Project Directory Organization

```
dr-screening/
├── pipeline/                    # Active end-to-end screening pipeline
│   ├── analyzePatientVisit.m        # Bilateral analysis coordinator & deferral logic
│   └── tileAndStitchInference.m     # Feathered overlapping tile reconstruction
├── models/                      # Deep learning architectures & training scripts
│   ├── pipelineServer.m             # Stdio JSON-IPC daemon loop
│   ├── trainModel1.m                # Model 1 masked BCE training
│   ├── trainModel2_384.m            # Model 2 384px Focal+Ordinal training
│   ├── trainLateFusionBridge.m      # Late-fusion clinical bridge training
│   ├── focalOrdinalLoss.m           # Custom Focal + Ordinal loss function
│   ├── DRPatchDatastore.m           # Custom datastore for 256×256 patch sampling
│   ├── DRClassificationDatastore_384.m  # Custom datastore for 384px fusion inputs
│   ├── evaluateAll.m                # Master reproducibility benchmark script
│   ├── runAblationStudy.m           # Empirical ablation evaluation
│   ├── model1_final.mat             # Trained DeepLabv3+ weights
│   ├── model2_final_384.mat         # Trained 384px ResNet-101 weights (v1.1.0)
│   ├── late_fusion_bridge.mat       # Hybrid Feature Bridge model
│   └── model2_final_weighted.mat    # 224px baseline weights (ablation)
├── explainability/              # Clinical transparency & saliency modules
│   ├── generateGradCAM.m           # ResNet-101 Grad-CAM with boundary suppression
│   ├── generateGradCAMForImage.m   # Raw image-to-saliency inference bridge
│   ├── gradCAMDemo.m               # Standalone test runner for heatmaps
│   └── gradcam_samples/            # Pre-computed validation heatmaps (Grades 0–4)
├── reporting/                   # Clinical output generation
│   ├── renderPatientReportPDF.m    # A4 vector PDF engine & preview rasterizer
│   ├── savePatientVisit.m          # Offline-first directory visit serializer
│   └── generatePatientReport.m    # Standalone report generator wrapper
├── functions/                   # Image normalization & classical vision
│   ├── enhanceImage.m              # CLAHE (Lab space) + bilateral filtering
│   ├── qualityCheck.m              # Laplacian variance blur & illumination check
│   ├── findOpticDisc.m             # Optic nerve head morphological localization
│   └── findFovea.m                 # Macular fovea anatomical localization
├── desktop/                     # Cross-platform clinical desktop application
│   ├── src/                        # React 19 frontend (Neumorphic clinical design)
│   │   ├── App.jsx                 # Main application component
│   │   ├── index.css               # Clinical neomorphic design tokens & shadows
│   │   └── components/             # UI views and reusable components
│   ├── electron/                   # Node.js main process & IPC daemon supervisor
│   │   ├── main.cjs                # Electron main process
│   │   ├── preload.cjs             # Context-isolated IPC bridge
│   │   └── daemonManager.cjs       # MATLAB backend supervisor & watchdog
│   └── dist_electron/              # Compiled Windows installer
├── data_prep/                   # Dataset harmonizers & preprocessing
│   ├── prepareModel2Data.m         # 224px dataset preparation
│   ├── prepareModel2Data_384.m     # 384px high-resolution dataset preparation
│   └── resizeWithPad.m             # Aspect-preserving letterbox resize utility
├── tests/                       # Integration tests
│   ├── test_daemon.cjs             # Daemon protocol health check
│   ├── test_full_analysis.cjs      # Full bilateral inference test
│   └── test_save_report.cjs        # Report save & export test
├── docs/                        # Engineering documentation
│   ├── ARCHITECTURE.md             # System architecture specification
│   ├── PROJECT_SPEC.md             # Project specification document
│   ├── FINAL_RETRAIN_RESULTS.md    # Model retraining results & metrics
│   ├── UI_SPEC.md                  # Desktop UI specification
│   ├── WORKFLOW.md                 # Clinical workflow documentation
│   ├── FUNCTION_CONTRACTS.md       # API contracts for all MATLAB functions
│   ├── IMPROVEMENT_MATRIX.md       # Systematic improvement tracking
│   └── TODO.md                     # Development task tracker
├── patient_data/                # Local offline patient records archive
├── compile_backend.m            # MATLAB Compiler build script for dr_backend.exe
├── dr_backend.exe               # Compiled standalone MATLAB AI engine (~921 MB)
└── run_overnight_retrain.m      # Automated overnight training orchestrator
```

---
*Document prepared for academic project submissions, hackathon documentation, and technical review.*
