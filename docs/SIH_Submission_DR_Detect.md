# SIH 2026 Round 1 — Idea Submission
## Problem Statement: SIH26038 — Explainable AI for Diabetic Retinopathy Screening in Rural India
## Organization: MathWorks (Ministry of Education's Innovation Cell)

---

## IDEA TITLE

DR_Detect — Offline-First Explainable AI Screening for Diabetic Retinopathy in Rural India

---

## IDEA DESCRIPTION

India has over 77 million diagnosed diabetic adults — the second highest count globally. About 18% of this population develops diabetic retinopathy (DR), a progressive retinal disease and the leading cause of preventable blindness in the working-age population. Early screening can prevent up to 90% of severe vision loss, but the infrastructure to deliver that screening at scale simply does not exist in most parts of the country. Rural India has roughly one ophthalmologist per 100,000 people. Primary health centers (PHCs), which serve as the first point of medical contact for hundreds of millions, almost never have a retinal specialist on staff, rarely have reliable internet, and have no existing workflow for AI-assisted diagnostics.

Existing AI-based DR screening solutions do not adequately address this deployment context. Cloud-dependent tools require stable broadband to transmit fundus images for remote inference — impractical in settings where connectivity is intermittent or absent. Black-box classifiers that output a grade or a binary referral decision without spatial evidence are clinically insufficient for telemedicine, where the reviewing specialist cannot re-examine the patient and must rely entirely on the AI-generated report. Binary referable/non-referable models discard the granularity of the five-level ICDR severity scale, collapsing clinically distinct treatment pathways into a single yes-or-no answer. And systems trained on downsampled 224-pixel RGB thumbnails lose the spatial resolution needed to detect microaneurysms — the earliest DR lesion, often just 2 to 4 pixels wide in a standard fundus photograph.

DR_Detect addresses each of these gaps. It is a fully offline, edge-deployed desktop application that performs bilateral five-class ICDR severity grading, localizes retinal lesions at the pixel level, generates Grad-CAM visual explanations of its predictions, and produces a printable single-page A4 clinical report — all in under 15 seconds on a standard Windows laptop with an NVIDIA GPU. No internet connection is required at any point.

The system has three layers: a MATLAB-based AI inference backend, an Electron desktop frontend, and a JSON-IPC communication bridge between them.

**AI Backend (MATLAB, compiled to standalone .exe)**

The inference pipeline is written in MATLAB and compiled into a headless executable using MATLAB Compiler, eliminating the need for a MATLAB license at deployment sites. Two deep learning models run in sequence:

Model 1 is a DeepLabv3+ semantic segmentation network with a ResNet-18 encoder, trained on a combined pool of three public retinal datasets: IDRiD Refined (which provides ground-truth masks for all four lesion channels — vessels, dark lesions, light lesions, and neovascularization), DRIVE (vessel segmentation masks only), and e-Ophtha (microaneurysm and exudate masks). Each dataset contributes annotations for the channels it covers, and the training loss masks out channels without ground truth for a given image. The model takes a fundus image and produces four continuous soft probability maps at the image's native resolution: retinal vessels, dark lesions (microaneurysms and hemorrhages), light lesions (hard exudates and cotton-wool spots), and proliferative lesions (neovascularization). To preserve fine spatial detail — critical for detecting microaneurysms — the full-resolution image is divided into overlapping 256×256 tiles with 25% overlap, each predicted independently and stitched back using feathered edge blending to eliminate seam artifacts. No downsampling is applied before segmentation.

Model 2 is a ResNet-101 classifier modified to accept 7-channel input: the raw RGB fundus (3 channels) concatenated with Model 1's four lesion probability maps, all resized to 384×384 pixels with aspect-preserving letterbox padding. This early fusion gives the classifier both raw retinal appearance and explicit lesion structure in a single forward pass. Model 2 was originally trained at 224×224 resolution on the APTOS 2019 and IDRiD disease grading datasets combined (3,446 images total, graded 0–4 on the ICDR scale). We recently retrained the classification pipeline at 384×384 resolution with a custom Focal-Ordinal loss formulation and late-fusion clinical biomarker bridge on the exact same patient split, advancing overall five-class accuracy from 73.64% to 79.46% and referable sensitivity from 93.39% to 97.36%. The model is trained with a custom loss combining multi-class Focal Loss (gamma=2.0, inverse-frequency class weights) and an Ordinal Quadratic Distance Penalty (lambda=0.20). Focal Loss suppresses gradient from easily classified healthy images, focusing learning on rare severe cases. The ordinal penalty makes the loss function aware that confusing Grade 4 with Grade 0 is far more dangerous than confusing it with Grade 3 — a clinical asymmetry that standard cross-entropy ignores entirely.

A Hybrid Feature Bridge sits on top of Model 2. This late-fusion stacking classifier takes the five softmax probabilities from the CNN and combines them with four clinical biomarkers extracted from Model 1's segmentation output: discrete microaneurysm count, hemorrhage surface area fraction, a 4-quadrant hemorrhage distribution score (encoding the clinical 4-2-1 rule used by ophthalmologists for diagnosing Severe NPDR), and a binary neovascularization flag. This adds negligible inference cost while explicitly encoding domain knowledge that a CNN may not learn from a small training set.

At inference time, test-time augmentation runs Model 2 three times — on the original image, a vertical flip, and a horizontal flip — and averages the softmax distributions to stabilize borderline predictions.

**Explainability**

The system provides two complementary forms of clinical transparency. First, Model 1's segmentation maps are converted to a readable list of detected pathology — if a lesion channel exceeds 0.05% pixel coverage, it is explicitly reported (e.g., "Microaneurysms detected," "Neovascularization detected"). Second, Grad-CAM heatmaps are extracted from Model 2's final convolutional layer with respect to the predicted grade, showing which retinal regions most influenced the severity decision. A specific implementation detail: standard Grad-CAM on letterbox-padded fundus images produces spurious hotspots at the image border due to zero-padding edge effects. Our implementation builds a tissue content mask, restricts min/max normalization to real retinal tissue, and applies radial feathering via a distance transform to suppress boundary artifacts before upsampling. This ensures the heatmap highlights real pathology rather than padding noise.

**Clinical Safety System**

To prevent missed pathology in unassisted rural settings, the referral pipeline enforces three primary fail-safe mechanisms alongside an exploratory lesion heuristic:

1. Confidence-based deferral gate — The 65% threshold is an engineering deferral threshold rather than a clinically validated cutoff. It was selected conservatively to avoid forcing automated decisions when the classifier's probability mass is substantially distributed across competing grades. If top-1 softmax confidence falls below 65%, the case is flagged as "Refer: Low Confidence / Clinical Deferral" for human specialist review. It has not yet been externally calibrated on an independent clinical cohort.
2. Hemorrhage density escalation — If Model 1 detects extensive dark lesion / hemorrhage coverage exceeding 0.5% of the retinal area, referral is escalated to at least Grade 2 regardless of Model 2's output, preventing under-triage when severe intraretinal bleeding coexists with optical blur.
3. Bilateral worst-case aggregation — Because diabetic retinopathy is a bilateral disease that frequently manifests asymmetrically, patient-level triage is governed by the more severely affected eye. If either eye triggers referral through disease grade, confidence deferral, or lesion density, the entire screening visit escalates to specialist referral.

*Exploratory safety heuristic:* In addition to these three primary fail-safes, if Model 1 detects neovascularization channel activation exceeding 0.05% coverage, the system triggers a precautionary escalation flag. As documented below, this is an exploratory safeguard rather than a validated detector, reflecting data scarcity in public PDR annotations.

**Desktop Application**

The frontend is a React application inside Electron, designed for healthcare workers with no ophthalmology or technical background. The workflow is: enter patient demographics, upload bilateral fundus images (right eye and left eye), press "Run Screening," and wait for results. A real-time progress stepper shows pipeline stages. Results display per-eye severity grades, detected lesion lists, confidence scores, Grad-CAM heatmaps with adjustable opacity overlay, and the referral recommendation. The operator can save the visit (persisting all data locally) and generate a printable report.

The frontend and backend communicate over standard I/O using newline-delimited JSON — no HTTP server, no open ports, no firewall configuration needed. A Node.js daemon supervisor manages the backend process lifecycle with health-check pings, a 2-minute watchdog timer, request queuing, and automatic crash restart.

**Automated Clinical Reporting**

Every bilateral screening produces a single-page A4 vector PDF containing: patient demographics, per-eye ICDR grade and referral decision, original and CLAHE-enhanced fundus photographs, Grad-CAM overlay, detected lesion sidebar, AI confidence score, image quality assessment, and clinician signature blocks. The report is generated programmatically in under 1.5 seconds and exported at 300 DPI.

**Validation Results**

To substantiate the full diagnostic pipeline, we evaluate both the upstream lesion segmentation network (Model 1) and the downstream disease classification network (Model 2) on independent held-out validation splits.

*Model 1 Segmentation Performance (Evaluated on 4,132 native-resolution 256×256 validation patches):*

| Channel / Lesion Target | Sensitivity | Specificity | Dice Score | IoU | Positive Patches |
|---|---|---|---|---|---|
| Retinal Vessels | 89.43% | 95.77% | 0.7617 | 0.6152 | 950 / 952 |
| Dark Lesions (MA, Hemorrhages) | 63.46% | 99.73% | 0.5291 | 0.3597 | 915 / 2,815 |
| Light Lesions (Exudates, Cotton-Wool) | 88.18% | 98.91% | 0.4197 | 0.2655 | 655 / 2,215 |
| Proliferative (Neovascularization)* | 0.83% | 100.00% | 0.0163 | 0.0082 | 49 / 925 |

*Note on Proliferative channel: The near-zero sensitivity (0.83%) and low Dice score (0.0163) reflect severe ground-truth scarcity in public annotations: the training set contains only 5,842 positive neovascular pixels across 479 images, and the held-out validation set contains only 49 positive patches (out of 925 patches evaluated for this channel). Consequently, Model 1 cannot function as an autonomous segmenter for neovascularization. Instead, its output serves purely as an exploratory heuristic warning trigger (>0.05% coverage) for safety escalation, while primary Grade 4 PDR detection relies on Model 2's holistic 7-channel classifier (which successfully identified 43 of 44 PDR cases for referral).

High specificity across all channels (>95% to 99.9%) ensures that false lesion artifacts do not corrupt Model 2's fused inputs. High sensitivity on vessels (89.43%) and light lesions (88.18%) enables reliable vascular tracking and exudate localization. Dark lesion sensitivity (63.46%) captures the majority of microaneurysm clusters and blot hemorrhages while suppressing background noise.

*Model 2 Severity Classification Performance (Evaluated on held-out stratified split, N=516 images, APTOS 2019 + IDRiD):*

- Referable DR sensitivity (Grade >= 2): 97.36%
- Referable DR specificity: 89.62%
- Quadratic weighted kappa (QWK): 0.8765
- Overall 5-class exact accuracy: 79.46%

Zero patients with Severe NPDR (Grade 3) were misclassified as non-referable (0% under-triage). 43 of 44 Proliferative DR (Grade 4) cases were correctly identified for urgent specialist referral.

**Known Limitations**

All metrics are from the internal APTOS+IDRiD validation split — no external clinical validation on independent benchmarks (e.g., Messidor-2) or prospective PHC data has been conducted yet. DME (Diabetic Macular Edema) is not detected; the report explicitly states "DME: Not assessed." Grade 1 (Mild NPDR) recall is 48.98% — distinguishing isolated microaneurysms from a clean fundus is difficult even for expert graders, who agree only 60–70% of the time on these borderline cases. Training data is limited to public datasets with heavy class imbalance; in particular, ground-truth annotations for neovascularization are scarce (5,842 positive pixels across 479 training images; 49 positive patches in validation), rendering Model 1's proliferative channel an uncalibrated heuristic rather than a validated segmenter.

**Planned Future Work**

Each local screening result already includes a "synced: false" flag, designed as a hook for a store-and-forward sync layer. The plan is to build a cloud sync backend using Supabase for database and file storage, enabling PHC stations to upload completed visits when internet connectivity is available. A telemedicine routing engine would triage incoming cases by severity tier and assign them to registered ophthalmologists at district or tertiary hospitals, with SLA-based escalation. A web-based specialist review portal would allow doctors to inspect fundus images with AI overlays (raw, enhanced, lesion masks, Grad-CAM), confirm or override the AI grade, write clinical notes, and digitally sign the report — with the signed review syncing back to the originating PHC. The desktop app already has a "Doctor Responses" view in its interface, currently with placeholder data, ready to display real specialist feedback once the backend is connected.

We also plan to use Simulink to model and simulate the screening pipeline flow — from image capture through classification and telemedicine routing — as a system-level block diagram, for validating throughput constraints and modeling queuing dynamics in multi-PHC deployment scenarios. This work has not yet been started.

The core system — offline screening, classification, explainability, reporting, and desktop packaging — is functional and ships as a single Windows installer today.

---

## ABSTRACT / SUMMARY

DR_Detect is a fully offline desktop application for automated bilateral diabetic retinopathy screening, designed for deployment in rural primary health centers and tele-ophthalmology clinics where specialist access is limited and internet connectivity is unreliable. The complete screening pipeline — from fundus image upload to printed clinical report — runs on a standard Windows laptop with a GPU, with no cloud dependency.

The AI backend, written in MATLAB and compiled to a standalone executable, uses two deep learning models in sequence. A DeepLabv3+ segmentation network (ResNet-18 encoder) performs full-resolution tiled inference to produce pixel-level lesion probability maps across four channels: vessels, hemorrhages, exudates, and neovascularization. A 384-pixel ResNet-101 classifier grades each eye on the five-level ICDR severity scale using a 7-channel early-fusion input combining the raw fundus with lesion maps, trained with a focal loss and ordinal distance penalty. A late-fusion Hybrid Feature Bridge integrates segmentation-derived clinical biomarkers — microaneurysm counts, hemorrhage distribution, and neovascularization flags — with CNN output, encoding the clinical 4-2-1 rule. Explainability is provided through lesion-level evidence and artifact-corrected Grad-CAM attention maps. A three-tier safety system (confidence deferral, lesion-density escalation, bilateral worst-case aggregation) ensures the system errs toward referral over missed pathology.

On held-out validation (N=516, APTOS 2019 + IDRiD), the system achieves 97.36% referable DR sensitivity, 89.62% specificity, and a quadratic weighted kappa of 0.8765. Each screening produces a printable A4 clinical report with complete diagnostic evidence in under 15 seconds.

The application ships as a single-click Windows installer. Planned extensions include a Supabase-backed telemedicine sync layer with severity-based specialist routing and a doctor review portal, plus Simulink-based pipeline flow modeling for multi-site deployment. External clinical validation remains the key step toward field deployment.
