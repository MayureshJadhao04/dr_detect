# Workflow — step-by-step build guide

This is the actual sequence to follow, start to finish, for the full
build — pipeline, UI, and Simulink — now that you're doing all three
solo. No team split for the coding anymore.

**Honest flag on scope**: adding UI and Simulink to your own workload
on top of the pipeline is a real, meaningful increase over the original
plan. If Day 3 (integration) is running tight, cut Simulink down to the
simplest possible version (a basic queue model, see Step 10) rather
than let it threaten the pipeline+UI, which is what the PS actually
grades hardest on (classification accuracy, explainability). A working
pipeline+UI with a simple Simulink model beats a broken attempt at all
three being sophisticated.

---

## Step 0 — MATLAB installation

Install MATLAB with these products selected:
- Image Processing Toolbox
- Computer Vision Toolbox
- Deep Learning Toolbox
- Statistics and Machine Learning Toolbox
- **Parallel Computing Toolbox** — required for GPU training, easy to
  miss since Deep Learning Toolbox alone does not enable GPU use, even
  for a single local GPU
- MATLAB Compiler — needed later for the final standalone bundle

Do NOT install (not needed for this repo):
- Medical Imaging Toolbox — nothing in this architecture uses it

DO install (previously listed as teammate's, now yours since you're
doing Simulink too):
- Simulink
- Simulink Event-Based Simulation Support (provides SimEvents blocks)

After MATLAB is installed, go to Home tab -> Add-Ons -> Get Add-Ons and
install these separately (not part of the main installer):
- Deep Learning Toolbox Model for ResNet-18 Network (Model 1's encoder)
- Deep Learning Toolbox Model for ResNet-50 Network (Model 2)

---

## Step 1 — Dataset access and download

- Refined IDRiD: Zenodo, DOI 10.5281/zenodo.17615903 (open, no wait)
- e-Ophtha: adcis.net/en/Download-Third-Party/E-Ophtha.html or Kaggle mirror
- DRIVE: andrewmvd Kaggle mirror (NOT the -256 resized one), or
  grand-challenge.org (may need free account)
- APTOS2019: kaggle.com/c/aptos2019-blindness-detection
- IDRiD Disease Grading: IEEE DataPort
- Messidor-2 images: adcis.net/en/third-party/messidor2/
- Messidor-2 labels: kaggle.com/google-brain/messidor2-dr-grades

FGADR was attempted but access could not be secured in time — dropped.
Do not block on it.

Do this FIRST, today, since access delays are the one thing outside your
control that can silently eat a day.

---

## Step 2 — Bulk preprocessing (do NOT touch images by hand)

Pattern: `imageDatastore` + one transformation function + a loop, per
source dataset. You write the resize/normalize function once; MATLAB
applies it across every file automatically.

```matlab
imds = imageDatastore('data/raw/RefinedIDRiD/images');
for i = 1:numel(imds.Files)
    img = readimage(imds, i);
    processed = prepareImage(img);   % your resize/normalize function, written once
    imwrite(processed, fullfile('data/prepared', ...));
end
```

Write 3 such scripts:
- `prepareRefinedIDRiD.m` — standardize resolution/format, this dataset
  sets the reference standard (smallest but most precise source)
- `prepareEOphtha.m` — resize to match, map MA/EX masks into the dark/
  light lesion channels
- `prepareDRIVE.m` — resize to match, map vessel masks into the vessel
  channel

Each script, in the same loop, appends a row to `manifest.csv` with
per-channel validity flags (which channels that image actually has
ground truth for). This manifest is what the masked-loss training step
reads later — see Step 4.

Do the same (separate, simpler) standardization for APTOS2019 + IDRiD
Disease Grading for Model 2 — just resize to one common resolution, no
manifest/masking needed since both datasets share the same label format
(single grade 0-4).

Antigravity can draft all of these scripts from this spec — verify each
on 2-3 sample images before running the full batch.

---

## Step 3 — Classical CV functions (no training needed, build first for momentum)

Build and test on real sample images, in this order:
1. `qualityCheck.m` — blur (Laplacian variance) + brightness histogram
2. `enhanceImage.m` — CLAHE, denoise, color normalization (runs on
   EVERY image, mandatory, not just borderline ones)
3. `findOpticDisc.m` — `imbinarize`, `imfindcircles`, `regionprops`
4. `findFovea.m` — geometric offset from disc center

Test each against `FUNCTION_CONTRACTS.md`'s exact signature before
moving on.

---

## Step 4 — Train Model 1 (segmentation) — ONE combined training run

Do NOT train separately per dataset. One `unet` model, trained once, on
all 3 prepared datasets mixed together in shuffled batches — this is
what achieves camera generalization, not a shortcut around it.

- Architecture: `unet(imageSize, numClasses, "EncoderNetwork", "resnet18")`
- Load `manifest.csv`, build a custom datastore that returns
  `(image, maskStack, validityFlags)` for each entry
- Write a custom masked-loss function: for each image, only compute
  loss on the channels its `_valid` flags mark as 1 — skip the rest
  entirely for that image, do not treat them as empty/negative
- Add color/illumination augmentation (not just geometric) during
  training — this is what reduces camera-specific overfitting
- Output: 4 channels — vessels, dark lesions, light lesions,
  proliferative (incl. neovascularization)

This is the highest-risk item on the timeline. If it is not converging
reasonably by end of Day 2, fall back to a simplified version (e.g.
train on Refined IDRiD alone, or reduce to 2 channels) rather than
keep pushing blindly — document the reduction as a scope decision.

---

## Step 5 — Train Model 2 (grading) — ONE combined training run

- Architecture: ResNet50, transfer learning (replace final layers)
- Train on APTOS2019 + IDRiD Disease Grading, merged (standard image
  classification, no manifest/masking needed here)
- Never train on Messidor-2 — it is evaluation-only
- After training, run the finished model once against Messidor-2 +
  Google's adjudicated grades to get your reported sensitivity/
  specificity numbers

---

## Step 6 — Explainability + decision logic

- `runGradCAM.m` — built-in `gradCAM` function on the finished Model 2,
  needs Model 2 to exist first
- `isReferable.m` — grade >= 2 -> true, trivial logic
- Referral/telemedicine routing UI element stays a non-functional
  placeholder for now (backend/portal deferred, see PROJECT_SPEC.md)

---

## Step 7 — Report generation

- `exportReport.m` — compiles original image, enhanced image, Model 1
  masks, Model 2 grade/confidence/Grad-CAM into one PDF
- Even though the backend/portal is deferred, keep this output format
  as the eventual thing you would POST to a backend later — saves
  rework when that gets built

---

## Step 8 — Build the UI (now yours, no stub functions needed)

Since you're building both sides, you can skip the stub-function
pattern entirely (that was only needed for parallel development across
two people) — build `ScreeningApp.m` directly against your real,
already-working functions from Steps 3-7.

- Build the static layout first per `UI_SPEC.md` (sidebar, pipeline
  stepper, severity gauge, confidence bar, referral banner, overlay
  toggles, export button) using `uifigure`/`uigridlayout`
- Wire "Load image" -> `qualityCheck`/`enhanceImage`
- Wire "Run screening" -> the full pipeline in sequence
- Wire "Export report" -> `exportReport`
- Keep the "Send to Doctor" button visible but non-functional (backend/
  portal deferred — see PROJECT_SPEC.md)
- Test end-to-end on your 5 fixed sample images (healthy, severe,
  borderline-quality, +2 more) after each button is wired, not all at
  once at the end

---

## Step 9 — Simulink capacity model (simplified scope, solo)

Given you're doing this alongside everything else, keep this
deliberately simple — a basic SimEvents queue model, not a
sophisticated one:

- One entity generator (patients arriving at a PHC, e.g. fixed rate/day)
- One "server" block representing AI screening (near-instant processing
  time)
- A probability split (~15-20%, based on published referable-DR rates)
  routing a fraction of patients to a second queue
- A second "server" block representing doctor review (configurable
  service time)
- Output: a simple chart of queue length or wait time vs. number of
  doctors, to answer "how many doctors does a district of X patients
  need"

This is intentionally minimal — a working basic model with one clear
chart beats a complex model you run out of time to finish. If time is
very tight, a single static SimEvents diagram + one results chart is
enough to demonstrate the concept in your submission.

---

## Step 10 — MATLAB Compiler bundling

- Package the finished, integrated app (pipeline + UI) via MATLAB
  Compiler
- Choose the bundled-runtime installer option (not web-download) so the
  entire install works fully offline
- Test the packaged installer on a machine without the full MATLAB
  development environment, if possible, to confirm it actually runs
  standalone before submission
- Leave real buffer time for this step — first-time packaging often
  surfaces surprises
- The Simulink model does not need to be part of this standalone
  bundle — it's a planning artifact you run/demo separately in MATLAB,
  not something the end-user app needs at runtime

---

## Testing discipline throughout

Keep 3-5 fixed sample images (one clearly healthy, one clearly severe,
one borderline-quality) and re-test every function against these same
images after every change — catches regressions immediately, and gives
you a consistent demo set for Sept 8.
