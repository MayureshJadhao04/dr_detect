# Project Spec — DR Detect: Explainable AI Tele-Ophthalmology Screening

## Overview
DR Detect is an end-to-end medical desktop application designed for rural Primary Health Centers (PHCs) and community vision centers across India. It performs automated bilateral Diabetic Retinopathy (DR) screening, produces 5-class ICDR severity grading, highlights microvascular lesions via DeepLabv3+ semantic segmentation, explains AI decisions via Grad-CAM heatmaps, and renders instant clinical A4 PDF reports for local printing or remote ophthalmologist referral.

Built for **SIH Problem Statement 26038 (MathWorks)**.

---

## 1. Core Clinical Requirements & Architecture

1. **Camera-Agnostic Preprocessing**:
   - Uniform mandatory enhancement (`CLAHE`, bilateral filtering, illumination normalization) removes sensor color cast across diverse fundus cameras (Kowa, Canon, Topcon, portable smartphone scopes).
2. **Quality Triage**:
   - Laplacian variance blur detection and illumination histogram checks prevent ungradable captures from reaching the classifier.
3. **Dual-Stage Deep Learning Pipeline**:
   - **Model 1 (DeepLabv3+ ResNet-50)**: 4-channel segmentation detecting microaneurysms, hemorrhages, hard/soft exudates, and neovascularization.
   - **Model 2 (ResNet-101 Fusion)**: 5-class classification on the International Clinical Diabetic Retinopathy (ICDR) scale:
     - Grade 0: No DR
     - Grade 1: Mild NPDR
     - Grade 2: Moderate NPDR
     - Grade 3: Severe NPDR
     - Grade 4: Proliferative DR (PDR)
4. **Explainable AI (XAI)**:
   - Grad-CAM saliency heatmaps visualize model attention on the fundus surface with real-time blending opacity control (0–100%).
5. **Tele-Ophthalmology Referral Logic**:
   - Automated referral flag triggered on `Grade >= 2` (Moderate NPDR or higher).
   - Doctor triage dashboard filters urgent high-risk cases (`Grade >= 3`) with `ACTION REQUIRED` alerts.
6. **Clinical Reporting**:
   - Automated A4 vector PDF with side-by-side OD/OS captures, Grad-CAM overlays, quantitative lesion lists, AI confidence, and clinician sign-off blocks.
7. **Offline-First Resilience**:
   - Zero cloud or internet dependency. Fully self-contained on Windows laptop hardware with local file-based patient archives (`patient_data/`).

---

## 2. Technology Stack & Integration

- **AI Runtime & Models**: MATLAB R2026a, NVIDIA TensorRT/CUDA GPU acceleration, Deep Learning Toolbox, Computer Vision Toolbox, Image Processing Toolbox.
- **Backend Service**: `models/pipelineServer.m` compiled to standalone binary `dr_backend.exe` via `mcc`. Communicates over standard I/O (stdin/stdout) via structured newline-delimited JSON messages.
- **Frontend Client**: React 19, Vite 8, Lucide React, CSS3 clinical neomorphic design tokens.
- **Desktop Container**: Electron 44 with secure context-isolated IPC bridge (`preload.cjs`).
- **Packaging**: `electron-builder` Windows installer (`DR-Detect-1.0.0-x64.exe`, 713 MB) bundling the compiled MATLAB engine inside `resources/`.

---

## 3. Performance & Evaluation Metrics

- **Referable DR (Grade 2+) Target**: Sensitivity >90%, Specificity >85% evaluated on held-out Messidor-2 benchmark.
- **Bilateral Inference Speed**: <15 seconds end-to-end on local RTX 5050 Laptop GPU (preprocessing, bilateral segmentation, bilateral classification, Grad-CAM generation, and disk export).
- **Report Generation Time**: <1.5 seconds for complete A4 vector PDF compilation.
