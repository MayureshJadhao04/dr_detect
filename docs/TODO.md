# TODO

Status legend: [ ] not started · [~] in progress · [x] done

**Where things stand (Sept 5):** PPT and 1-minute video are DONE and
submitted. Working prototype deadline is **Sept 8** — 3-day build
window. You are now building the pipeline, UI, AND Simulink model
solo — no team split for the coding. Actual MATLAB coding has not
started yet. Follow `WORKFLOW.md` in order — this file tracks the same
steps as a checklist.

**Honest scope flag**: this is a heavier solo workload than originally
planned. If Day 3 gets tight, cut Simulink down to the simplest version
(Step 9 in WORKFLOW.md) rather than risk the pipeline+UI, which is what
the PS grades hardest on.

FGADR access could not be secured — DROPPED from the plan. Final Model 1
lineup is Refined IDRiD -> e-Ophtha -> DRIVE. Do not spend more time
chasing FGADR.

---

## Day 1 (Sept 5, remaining hours) — Foundation

### Step 0 — MATLAB install
- [x] Install MATLAB with: Image Processing, Computer Vision, Deep
      Learning, Statistics and ML, **Parallel Computing** (required for
      GPU training) Toolboxes, plus MATLAB Compiler
- [ ] Via Add-On Explorer (separate from main installer): Deep Learning
      Toolbox Model for ResNet-18 Network, and for ResNet-50 Network

### Step 1 — Datasets
- [ ] Refined IDRiD — Zenodo, DOI 10.5281/zenodo.17615903
- [ ] e-Ophtha — adcis.net or Kaggle mirror
- [ ] DRIVE — andrewmvd Kaggle mirror (NOT the -256 version)
- [ ] APTOS2019 — Kaggle
- [ ] IDRiD Disease Grading — IEEE DataPort
- [ ] Messidor-2 images — adcis.net
- [ ] Messidor-2 labels — kaggle.com/google-brain/messidor2-dr-grades

### Step 2 — Bulk preprocessing
- [ ] Write `prepareRefinedIDRiD.m` (datastore + loop pattern, sets the
      reference resolution/format standard)
- [ ] Write `prepareEOphtha.m` (resize to match, map MA/EX into dark/
      light channels)
- [ ] Write `prepareDRIVE.m` (resize to match, map vessel masks)
- [ ] Build `manifest.csv` with per-channel validity flags (same loop
      as the prep scripts)
- [ ] Standardize APTOS2019 + IDRiD Disease Grading to one resolution
      for Model 2 (simpler — no manifest/masking needed, same label
      format)

### Step 3 — Classical CV functions
- [ ] `qualityCheck.m`
- [ ] `enhanceImage.m` (mandatory on every image, not just borderline)
- [ ] `findOpticDisc.m`
- [ ] `findFovea.m`
- [ ] Test all 4 on 5 fixed sample images (1 good, 1 blurry, 1 dark, 1
      overexposed, 1 borderline) — keep these same 5 images for every
      later test too

**Checkpoint tonight:** datasets ready, classical CV stage working.

---

## Day 2 (Sept 6) — Model 2 first, Model 1 started

### Step 5 — Model 2 (do this before Model 1 — lower risk, builds momentum)
- [ ] Train ResNet50 (transfer learning) on APTOS2019 + IDRiD Disease
      Grading, merged, ONE training run
- [ ] `gradeSeverity.m`, test on the 5 fixed sample images
- [ ] Do NOT train on Messidor-2 — evaluation only, later

### Step 4 — Model 1 (highest-risk item, start today)
- [ ] Build custom datastore reading `manifest.csv`, returning
      `(image, maskStack, validityFlags)`
- [ ] Write custom masked-loss function (skip channels marked invalid
      per image, don't treat as negative)
- [ ] Add color/illumination augmentation (not just geometric)
- [ ] Start training `unet` with ResNet18 encoder, ONE combined run on
      all 3 datasets mixed/shuffled together
- [ ] **Decide fallback trigger now**: if not converging reasonably by
      end of today, fall back to a simplified version (e.g. Refined
      IDRiD alone, or fewer channels) rather than keep pushing

**Checkpoint tonight:** Model 2 working end-to-end; Model 1 training
running (even if not finished converging).

---

## Day 3 (Sept 7) — Finish Model 1, explainability, UI

- [ ] Finish/tune Model 1, get `runModel1Segmentation.m` producing real
      4-channel masks
- [ ] If Model 1 still isn't working well: apply the fallback decided
      on Day 2, document it as a scope decision, move on
- [ ] `runGradCAM.m` (needs Model 2, straightforward once it exists)
- [ ] `isReferable.m` (trivial: grade >= 2)
- [ ] `routeForReview.m` — local status flag only, NOT real network
      send (backend/portal deferred, see PROJECT_SPEC.md)
- [ ] `exportReport.m` — compiles original + enhanced image, Model 1
      masks, Model 2 grade/confidence/Grad-CAM into one PDF
- [ ] Build `ScreeningApp.m` UI per `UI_SPEC.md`, wired directly to
      your real functions (no stubs needed, you're the only one coding)
- [ ] Test end-to-end on your 5 fixed sample images

**Checkpoint tonight:** full pipeline running end-to-end inside the UI.

---

## Day 4 (Sept 8) — Bundle and submit

- [ ] Build the simplified Simulink/SimEvents model (Step 9 in
      WORKFLOW.md) — basic queue, one results chart. Cut this further
      or first if time is short.
- [ ] Package via MATLAB Compiler, bundled-runtime installer option
      (not web-download) so the whole install works offline
- [ ] Test the packaged installer on a machine without full MATLAB, if
      possible, before submitting
- [ ] Re-run all 5 fixed sample images through the final packaged app
      one more time
- [ ] Prep whatever the submission actually requires (repo, demo
      recording, etc.)
- [ ] Pick a clean, strong grade-4 example image for the demo — the
      proliferative-channel overlay is your weakest visual, don't let
      it be the one judges see first

---

## Explicitly deferred (do not build now)
- [ ] ~~Telemedicine backend + database~~ — future work
- [ ] ~~Doctor-facing web portal~~ — future work
- [ ] ~~Real "Send to Doctor" network functionality~~ — UI placeholder
      only for now
- [ ] ~~Report validation status workflow~~ — future work
