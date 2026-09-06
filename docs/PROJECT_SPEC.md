# Project spec — explainable DR screening pipeline (SIH PS 26038)

## What this is
A MATLAB-based pipeline that screens fundus (retina) images for Diabetic
Retinopathy (DR), grades severity on the ICDR 0–4 scale, explains its
decision visually, flags referable cases (grade 2+), and routes them for
telemedicine review — all within one desktop app. Built for SIH problem
statement 26038 (MathWorks).

You now own the entire build solo — pipeline, UI, and the Simulink
capacity model. There is no team split for the coding.

Simulink capacity/workforce modeling is now IN SCOPE, in this repo.

## Who this is for
- Rural PHC nurse/technician: captures the image, needs a fast pass/refer
  decision they can act on without medical training.
- Remote ophthalmologist: reviews only flagged (referable) cases via the
  telemedicine routing step, uses the explainability output to verify the
  AI's call quickly.

## Pipeline flow (final)
```
Image → Enhancement → Quality check → Optic disc/fovea (CV) →
Model 1 (segmentation) → Model 2 (grading) →
Explainability + Report → Send to remote doctor (if referable)
```
Enhancement now runs BEFORE quality check (not after) — every image is
enhanced first (CLAHE, denoise, color normalization) as a mandatory
camera-normalization step, and quality is assessed on the enhanced
result. This also means enhancement is no longer "only for borderline
images" — it's applied uniformly, which is deliberate: it's the layer
that makes the pipeline camera-agnostic (see Camera-agnosticism section
below). The original (pre-enhancement) image is always kept alongside
the enhanced one for the report.

## Core requirements (from PS)
1. Image quality assessment — reject/flag ungradeable images (post-
   enhancement), route to a "retake" message.
2. Structure + lesion segmentation — vessels, dark lesions, light
   lesions, proliferative lesions (including neovascularization).
3. Severity grading — ICDR 0–4, target >90% sensitivity / >85%
   specificity for referable DR (grade 2+).
4. Explainability — Grad-CAM heatmap, lesion evidence, confidence score,
   annotated report comparing original vs. enhanced image and both
   models' outputs.
5. Telemedicine routing — referable cases flagged and routed for remote
   review, inside the app itself.
6. UI — dashboard-styled `uifigure` app tying all of the above together.
7. Simulink model — district-scale capacity planning. Now built by you,
   in this repo, alongside the pipeline and UI.

## Pipeline stages and ownership

| Stage | Method | Model/tool |
|---|---|---|
| 1. Enhancement | Classical CV (CLAHE, denoise, color norm) — mandatory, every image | No model |
| 2. Quality check | Classical CV, run on enhanced image | No model |
| 3. Optic disc + fovea | Classical CV | No model |
| 4. Segmentation (vessels, lesions, proliferative incl. NV) | Trained | **Model 1** |
| 5. Severity grading | Trained CNN | **Model 2** |
| 6. Explainability | Grad-CAM on Model 2 | No separate model |
| 7. Report generation | Compiles original + enhanced image, both models' output | No model |
| 8. Telemedicine routing | Rule-based on grade | No model |

**2 trained models total.** Everything else is classical CV or built on
top of these two.

## Model 1 — lesion/structure segmentation
- **Architecture**: U-Net with **ResNet18** pretrained encoder
  (`unet(imageSize, numClasses, "EncoderNetwork", "resnet18")`)
- **Output channels**: vessels, dark lesions (MA + hemorrhages), light
  lesions (hard exudates + cotton-wool spots), proliferative signs
  (neovascularization + IRMA + vitreous hemorrhage)
- **Training data (final)**: Refined IDRiD (primary) → e-Ophtha (secondary,
  dark/light lesion channels only) → DRIVE (secondary, vessel channel
  only) — see Datasets section. FGADR was evaluated as a way to boost
  the proliferative (NV/IRMA) channel specifically, but access could not
  be secured in time — dropped, not pursued further. This is an accepted
  limitation, not an open problem: the referral decision comes from
  Model 2's grade, not Model 1's segmentation quality, so a smaller
  proliferative-channel dataset does not affect referral accuracy — only
  the visual polish of that one Grad-CAM/segmentation overlay.
- **Training technique**: masked/partial loss — each image only
  supervises the channels its source dataset actually labeled (see
  ARCHITECTURE.md)
- **Why ResNet18**: small/medium combined dataset — a lighter encoder
  overfits less and trains faster on a laptop GPU

## Model 2 — severity grading
- **Architecture**: **ResNet50**, transfer learning
- **Training data**: APTOS2019 (primary) + IDRiD Disease Grading
  (secondary)
- **Test/validation (held out, never trained on)**: Messidor-2 + Google
  adjudicated grades — this produces the final reported sensitivity/
  specificity and is compared against published benchmarks

## Datasets — final (Model 1)

| Dataset | Role | Channels covered | Access |
|---|---|---|---|
| Refined IDRiD | Primary | Vessels, dark, light, proliferative (incl. vitreous hemorrhage) | Zenodo, open, DOI 10.5281/zenodo.17615903 |
| e-Ophtha | Secondary | Dark lesions (MA), light lesions (EX) only | adcis.net third-party download, Kaggle mirror backup |
| DRIVE | Secondary | Vessels only | andrewmvd Kaggle mirror (not the -256 version), or grand-challenge.org, may need free account |

FGADR was evaluated (would have boosted dark/light/proliferative channels
with far more volume) but access could not be secured in time — dropped.

## Datasets — final (Model 2)
| Dataset | Role |
|---|---|
| APTOS2019 | Primary training |
| IDRiD Disease Grading | Secondary training |
| Messidor-2 + Google adjudicated grades | Test/validation only, never trained on |

## Camera-agnosticism — deliberate design goal
The pipeline is trained across multiple independently sourced datasets
(different cameras/populations: Refined IDRiD's Kowa VX-10 in India,
e-Ophtha's separate source, DRIVE's Canon CR5) specifically so it doesn't
overfit to one camera's color/illumination signature. Supporting
measures:
- Mandatory enhancement stage (CLAHE, denoise, color normalization) for
  every image, not just borderline ones
- Color/illumination augmentation during training (not just geometric)
- Consistent field-of-view cropping/masking before training, so the
  model never learns background-border shape as an accidental camera cue
- Messidor-2 (different camera/population) as Model 2's held-out test —
  validates real generalization, not memorization

## Tech stack
- **Core platform**: MATLAB (desktop), no web/deployment layer
- **Toolboxes**: Image Processing Toolbox, Computer Vision Toolbox, Deep
  Learning Toolbox, Statistics and Machine Learning Toolbox
- **Support packages**: Deep Learning Toolbox Model for ResNet-50
  Network, Deep Learning Toolbox Model for ResNet-18 Network
- **Model 1**: `unet` (Computer Vision Toolbox) with ResNet18 encoder,
  custom masked-loss function
- **Model 2**: ResNet50 via transfer learning (Deep Learning Toolbox)
- **Explainability**: `gradCAM` (Deep Learning Toolbox)
- **UI**: `uifigure`, `uigridlayout`, `uigauge`, `uibutton`, `uiimage`
  (programmatic, not drag-and-drop App Designer)
- **Simulink**: SimEvents — now built by you, in this repo (see
  ARCHITECTURE.md and WORKFLOW.md for the simplified scope given solo
  ownership and the timeline)
- **Version control**: GitHub
- **AI coding assistant**: Antigravity — drafts code only, all
  execution/debugging happens in MATLAB directly
- **Hardware**: local GPU for training where available; MATLAB Online /
  cloud GPU as fallback if local training is too slow

## Target metrics
Sensitivity >90%, specificity >85% for referable DR (grade 2+), measured
on the Messidor-2 held-out test set, compared against published
benchmarks.

## Deadlines
- **Sept 2** — PPT + 1-minute video
- **Sept 8** — working prototype submission

## Explicit scope decisions
- Optic disc/fovea stay classical CV even though multiple source
  datasets include labels for them — replacing a solved, cheap technique
  with a data-hungry one is not worth it here.
- Neovascularization/IRMA/vitreous hemorrhage (the proliferative channel)
  is trained only on Refined IDRiD's ~81-image subset — smaller than the
  other 3 channels. Accepted, not being fixed: referral decisions come
  from Model 2's grade, independent of Model 1's segmentation quality,
  so this does not affect the >90%/>85% sensitivity/specificity target —
  only the visual polish of that one overlay in the explainability demo.
- Vessel channel is similarly data-limited (only Refined IDRiD + DRIVE)
  — acceptable, vessels are a well-understood, lower-ambiguity structure
  compared to subtle proliferative lesions.
- Telemedicine routing is rule-based (referral flag → local routing
  state via `isReferable`/`routeForReview`) inside the app itself — this
  is a lightweight placeholder, not a real network send. The actual
  backend, database, and doctor-facing web portal (see "Deferred to
  future work" below) are NOT being built for this prototype.
  District-scale capacity planning (Simulink) is now built by you too —
  see the simplified-scope note in ARCHITECTURE.md/WORKFLOW.md given
  you're doing this solo alongside the pipeline and UI.

## Deferred to future work (explicit, not forgotten)
- Telemedicine backend + database (report storage, status tracking)
- Doctor-facing web portal (browser-only, no MATLAB needed) — architecture
  already worked out: MATLAB app -> REST call (`webwrite`/
  `matlab.net.http`) -> backend API + database <- separate portal
- Real "Send to Doctor" network functionality (UI keeps a visible but
  non-functional placeholder button so the full workflow reads as
  designed, not missing)
- Report status workflow (pending -> validated/rejected with doctor
  comments)
`exportReport.m`'s output format is being kept ready for this — same PDF
+ data structure that would eventually get POSTed to a backend, so no
rework needed when this gets built later.
