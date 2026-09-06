# Architecture — DR screening pipeline

## Pipeline flow (final)

```
Input image (original — kept, never overwritten)
   │
   ▼
[1] Enhancement (CLAHE, denoise, color normalization) — MANDATORY, every image
   │   produces: enhanced image (both original + enhanced kept for report)
   ▼
[2] Quality check — run on the ENHANCED image
   │ ───reject───▶ "Retake" message to UI (if still ungradeable post-enhancement)
   │ pass
   ▼
[3] Optic disc + fovea localization (classical CV, on enhanced image)
   │
   ▼
[4] Model 1 — U-Net (ResNet18 encoder) segmentation
   │   → vessels, dark lesions, light lesions, proliferative signs (incl. NV)
   ▼
[5] Model 2 — ResNet50 severity grading
   │   → ICDR grade 0–4 + confidence score
   ▼
[6] Explainability — Grad-CAM on Model 2
   │   → heatmap overlay
   ▼
[7] Report generation
   │   → compiles: original image, enhanced image, Model 1 masks,
   │     Model 2 grade/confidence/Grad-CAM
   ▼
[8] Telemedicine routing (rule-based)
   │   → grade ≥2 → flagged, routed/sent to remote doctor
   ▼
UI displays everything; report exportable as PDF
```

**Why enhancement moved before quality check**: enhancement is no longer
a "fix borderline images only" step — it runs on every image as the
pipeline's camera-normalization layer (see PROJECT_SPEC.md,
Camera-agnosticism). Quality is then assessed on the normalized result,
so a genuinely bad capture (not just a camera-quirky one) is what gets
rejected, not images that only looked bad due to a particular camera's
raw output.

## Stage → toolbox/function mapping

| Stage | Method | MATLAB toolbox / function |
|---|---|---|
| 1. Enhancement | CLAHE, denoising, color normalization | `adapthisteq`, `imbilatfilt`/`wiener2`, custom color-jitter-inverse normalization |
| 2. Quality check | Blur (Laplacian variance), brightness histogram — on enhanced image | Image Processing Toolbox |
| 3. Optic disc | Brightest circular region | `imbinarize`, `imfindcircles`, `regionprops` |
| 3. Fovea | Geometric offset from disc center | plain computation |
| 4. Model 1 | U-Net, ResNet18 encoder, 4 output channels, masked loss | `unet`, Deep Learning Toolbox, custom loss function |
| 5. Model 2 | ResNet50, transfer learning | Deep Learning Toolbox |
| 6. Explainability | Grad-CAM on Model 2 | `gradCAM` |
| 7. Report | Compiles all outputs, both image versions | Custom + PDF export |
| 8. Referral routing | Threshold rule (grade ≥ 2) | plain logic, no toolbox |
| UI | Programmatic dashboard app | `uifigure`, `uigridlayout`, `uigauge`, `uibutton`, `uiimage` |

## Models

**Model 1 — segmentation (vessels + lesions + proliferative signs)**
- Architecture: U-Net, ResNet18 pretrained encoder (ImageNet weights,
  fine-tuned)
- Output: 4 channels — vessels, dark lesions (MA + hemorrhages), light
  lesions (hard exudates + cotton-wool spots), proliferative signs
  (neovascularization + IRMA + vitreous hemorrhage)
- Training data (layered, masked loss per channel):
  1. **Refined IDRiD** (primary) — supervises all 4 channels
  2. **e-Ophtha** (secondary) — supervises dark and light lesion
     channels only
  3. **DRIVE** (secondary) — supervises vessels only
  (FGADR was evaluated as a larger proliferative-channel source but
  access could not be secured in time — dropped; the proliferative
  channel is trained on Refined IDRiD alone, accepted as a known
  limitation since referral decisions depend on Model 2, not Model 1)
- Masked-loss mechanism: each training image carries per-channel
  validity flags (from the manifest — see below); loss is only computed
  on channels that image's source dataset actually labeled

**Model 2 — severity grading**
- Architecture: ResNet50, transfer learning
- Output: ICDR grade 0–4, softmax confidence
- Training data: APTOS2019 (primary) + IDRiD Disease Grading (secondary)
- Test/validation (held out): Messidor-2 + Google adjudicated grades

## Unified data prep (Model 1's 3-dataset merge)

To avoid training code having to handle 3 different formats directly:

1. **Standardize** every dataset to one resolution, one FOV-cropping
   convention, one mask encoding (4-channel binary stack), using Refined
   IDRiD's format as the reference standard (smallest but most precise
   source).
2. **One manifest CSV** — every training image gets a row with per-
   channel validity flags:

   | image_path | source | vessels_valid | dark_valid | light_valid | proliferative_valid |
   |---|---|---|---|---|---|
   | img001.png | RefinedIDRiD | 1 | 1 | 1 | 1 |
   | img102.png | DRIVE | 1 | 0 | 0 | 0 |
   | img210.png | eOphtha | 0 | 1 | 1 | 0 |

3. **One custom MATLAB datastore** reads the manifest, returns
   `(image, maskStack, validityFlags)` uniformly — this is the only
   place dataset-specific logic lives (3 small conversion scripts, one
   per source, all writing into this same manifest/folder structure).
   Everything downstream (training loop, `runModel1Segmentation`,
   testing) only ever sees this one unified format.

## File/folder structure (suggested)

```
/data
   /raw                      — original downloads, per dataset (gitignored)
   /manifest.csv              — unified manifest, see above
   /prepared                  — standardized images + 4-channel mask stacks
/functions
   enhanceImage.m
   qualityCheck.m
   findOpticDisc.m
   findFovea.m
/data_prep
   prepareRefinedIDRiD.m
   prepareEOphtha.m
   prepareDRIVE.m
   buildManifest.m
/models
   trainModel1_unet.m
   trainModel2_resnet50.m
   model1_unet.mat
   model2_resnet50.mat
/pipeline
   runModel1Segmentation.m
   gradeSeverity.m
   isReferable.m
   routeForReview.m
/explainability
   runGradCAM.m
/reporting
   exportReport.m
/ui
   ScreeningApp.m
/docs
```

## Data flow contract
Every stage takes and returns plain, documented types — see
`FUNCTION_CONTRACTS.md`. No stage assumes another stage's internal
state; everything passes through arguments/return values so stages can
be tested independently. Now that you're building both pipeline and UI
solo, you can wire the UI directly to real functions without needing
the stub-function pattern (that was only for parallel development).
