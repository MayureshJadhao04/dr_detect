# Context handoff v4 — paste this into a new Claude conversation if you hit a limit

Supersedes CONTEXT_3.md. Step 3 (classical CV functions) is now fully
DONE and validated against ground truth — both findOpticDisc.m and
findFovea.m were debugged this session using full-dataset mean/median
error against IDRiD ground truth masks, not just visual spot-checks.
Current focus is about to shift to Step 4 (Model 1 — segmentation).

---

## Project
SIH Problem Statement 26038 (MathWorks) — "Explainable AI for Diabetic
Retinopathy Screening in Rural India." Software category, team of 6,
all coding (pipeline + UI + Simulink) solo. Deadline: working prototype
due **Sept 8**.

Docs referenced: PROJECT_SPEC.md, ARCHITECTURE.md, FUNCTION_CONTRACTS.md,
UI_SPEC.md, WORKFLOW.md (re-upload if starting fresh — not re-attached
to this handoff).

Environment: MATLAB, Deep Learning Toolbox available, local NVIDIA GPU
for training.

## Status vs. WORKFLOW.md

- **Steps 0-2** — done (dataset prep: 564 images combined from Refined
  IDRiD/DRIVE/e-Ophtha, resized to 512x512, manifest.csv at
  `D:\DATASETS\combined\manifest.csv`)
- **Step 3 (classical CV functions) — FULLY DONE, validated:**
  - `enhanceImage.m` — DONE
  - `qualityCheck.m` — DONE
  - `findOpticDisc.m` — DONE, validated + FIXED this session (see below)
  - `findFovea.m` — DONE, validated + IMPROVED this session (see below)
- **Steps 4-10** — not started. **Currently starting Step 4 (Model 1 —
  segmentation).** Waiting on user to paste ARCHITECTURE.md /
  FUNCTION_CONTRACTS.md sections covering Model 1's class list,
  input/output shapes, and expected function signature before writing
  any training code — a spec exists for this but hasn't been shared in
  chat yet.

## Ground-truth mask label values (Refined IDRiD masks_raw, confirmed empirically)

Determined via `unique(rawMask(:))` cross-referenced against a known-
correct optic disc detection:

| Value | Meaning | Confidence |
|-------|---------|------------|
| 0 | Background | confirmed (most common value) |
| 8 | Whole retina / FOV mask | confirmed (largest non-background count) |
| 16 | Fovea | confirmed |
| 32 | Optic disc | confirmed (22.6px from known-good detection) |
| 24, 63, 127, 255 | Various lesion classes (hemorrhages, hard/soft exudates, microaneurysms) | NOT yet individually confirmed — only their existence as distinct labels is known |

**If picking up Model 1 work**: the 24/63/127/255 mapping to specific
lesion types needs to be confirmed (likely documented in
FUNCTION_CONTRACTS.md/ARCHITECTURE.md, or can be reasoned out the same
empirical way — check centroid/shape/count against known lesion
locations in a labeled example) before building the segmentation
class list.

## findOpticDisc.m — final validated version

**History this session:** original approach selected the bright region
with the largest Area via regionprops. This failed on images where a
hard-exudate cluster (common in DR images, photometrically similar to
the disc: bright, roughly blob-shaped after `imclose`) was LARGER in
area than the true optic disc — confirmed on `train_IDRiD_25` (false
candidate area 4926 vs. true disc 4290) and `test_IDRiD_74f074` (false
candidate area 5416 vs. true disc 4446).

**Approaches tried and rejected:**
- Vessel-convergence full re-scoring (score = vesselDensity × metric
  for every multi-candidate case): fixed the two known-bad images but
  regressed aggregate accuracy (mean 34.3px → 38.6px on n=81) by
  overriding correct picks elsewhere. Rejected — full dataset eval
  caught this even though the visual fix looked right.
- Vessel-density veto (only override primary pick if its vessel
  density is below a guessed threshold of 0.06): abandoned before
  full validation once instrumentation showed vessel density does NOT
  cleanly separate true disc from exudate clusters in this dataset —
  e.g. on train_IDRiD_25 the true disc had density 0.108 while several
  small irrelevant candidates scored 0.55-0.70.

**What worked:** instrumented regionprops output (Area, Circularity,
Solidity, Eccentricity) for the two failing images and compared the
true disc region against the false larger competitor:

```
train_IDRiD_25:      true disc solidity=0.871 circularity=0.688
                      false competitor solidity=0.640 circularity=0.252
test_IDRiD_74f074:   true disc solidity=0.932 circularity=0.680
                      false competitor solidity=0.647 circularity=0.215
```

Circularity gave a large, consistent gap in both cases (exudate
clusters are several separate deposits merged by `imclose` into one
irregular, non-convex blob; the disc is one coherent round structure).
Switched candidate selection to `Area * Circularity` instead of `Area`
alone.

**Result (full dataset, n=81, 0 NaN):**
```
OLD (Area only):              mean 34.3px | median 19.4px
NEW (Area * Circularity):     mean 19.8px | median 19.4px
```
Median unchanged (didn't disturb already-correct cases), mean dropped
significantly (fixed the outliers). This is the shipped version.

```matlab
function [center, radius, found] = findOpticDisc(enhancedImg)
%FINDOPTICDISC Classical CV localization of the optic disc.
%   Detects the brightest large, roughly-circular region in the image.
%
%   Selection combines Area with Circularity, not Area alone. This was
%   validated against IDRiD ground truth (disc mask value 32): in
%   cases where a hard-exudate cluster was LARGER than the true disc
%   (e.g. train_IDRiD_25: competitor area 4926 vs disc 4290;
%   test_IDRiD_74f074: competitor area 5416 vs disc 4446), circularity
%   cleanly separated them (true disc ~0.68-0.69, exudate clump
%   ~0.21-0.25 in both cases) because exudates are several separate
%   deposits merged by imclose into one irregular, non-convex blob,
%   while the disc is one coherent round structure. Vessel-density
%   scoring was tried first and rejected -- it did NOT separate these
%   cases reliably and even favored small irrelevant candidates in
%   some images.
%
%   center - [x, y] coordinates of disc center, [] if not found
%   radius - approximate disc radius in pixels, [] if not found
%   found  - true/false

if size(enhancedImg,3) == 3
    gray = rgb2gray(enhancedImg);
else
    gray = enhancedImg;
end
gray = im2double(gray);

contentMask = gray > 0.03;   % exclude black background/padding

realPixels = gray(contentMask);
brightThreshold = prctile(realPixels, 97);   % top 3% brightest pixels

brightMask = gray > brightThreshold & contentMask;

brightMask = bwareaopen(brightMask, 30);
brightMask = imclose(brightMask, strel('disk', 5));
brightMask = imfill(brightMask, 'holes');

minRadius = round(size(gray,1) * 0.04);
maxRadius = round(size(gray,1) * 0.12);

[centers, radii, metric] = imfindcircles(brightMask, [minRadius maxRadius], ...
    'ObjectPolarity', 'bright', 'Sensitivity', 0.9);

if isempty(centers)
    stats = regionprops(brightMask, gray, 'Centroid', 'EquivDiameter', ...
        'MeanIntensity', 'Area', 'Circularity');
    if isempty(stats)
        center = [];
        radius = [];
        found = false;
        return;
    end

    scores = [stats.Area] .* [stats.Circularity];
    [~, idx] = max(scores);

    center = stats(idx).Centroid;
    radius = stats(idx).EquivDiameter / 2;
    found = true;
else
    center = centers(1,:);
    radius = radii(1);
    found = true;
end
end
```

Note: in practice, on this dataset, `imfindcircles` returned no
candidates for every test case checked (all fell through to the
regionprops fallback branch) — worth being aware the Hough-circle path
may rarely/never fire on your images, though this wasn't exhaustively
confirmed across all 81 rows.

## findFovea.m — final validated version

**History this session:** original plain geometric heuristic (2.75
disc diameters from disc center, direction guessed from which half of
the image the disc sits in) measured mean 81.5px / median 69.3px
(n=80, 1 NaN) — this was the confirmed baseline.

**Approach tried and rejected:** free choice between two full
left/right candidates, picking whichever is locally darker than its
surroundings (excluding background). Measured mean 427.6px / median
556.5px — dramatically worse, because DR images contain hemorrhages/
microaneurysms/vessel crossings that are often darker than the actual
macula, so pathology was winning the comparison, not anatomy.

**What worked:** bounded local refinement — keep the geometric
estimate as an anchor, only search within a small radius (0.6x disc
radius) around it, and score REGIONAL darkness via Gaussian blur
(not raw pixel intensity, so a single dark vessel/microaneurysm pixel
can't win). This can't jump to the wrong side of the disc or latch
onto a distant lesion, unlike the free-choice version.

**Result (full dataset, n=80, 1 NaN):**
```
GEOMETRIC ONLY (3-arg call):        mean 81.5px | median 69.3px
BOUNDED REFINEMENT (4-arg call):    mean 65.4px | median 40.4px
```
Clear improvement, especially in median (nearly halved). This is the
shipped version (call with 4 args, passing enhancedImg).

After the findOpticDisc.m fix above, fovea was re-evaluated end-to-end
with the improved disc detector feeding it, plus a visual check of the
worst 6 remaining cases (overlaying detected disc, true disc, true
fovea, geometric estimate, and refined estimate) — user confirmed
satisfied with the result, no further numeric re-check was pasted back
into chat after that final visual pass.

```matlab
function foveaCenter = findFovea(discCenter, discRadius, imgSize, enhancedImg)
%FINDFOVEA Estimates fovea location from optic disc position.
%   3-arg call: pure geometric heuristic (2.75 disc diameters from disc,
%   direction based on disc's side of the image). Baseline-confirmed
%   mean 81.5px / median 69.3px error on IDRiD (n=80).
%
%   4-arg call: geometric estimate PLUS a bounded local refinement.
%   Unlike an earlier rejected refinement (which freely compared two
%   distant left/right candidates and let hemorrhages/vessels hijack
%   the pick -- measured mean 427.6px/median 556.5px), this version:
%     (a) only searches within a small radius of the geometric prior,
%         so it can never jump to the wrong side of the disc or latch
%         onto a lesion far from the anatomically expected location
%     (b) scores REGIONAL darkness (Gaussian-blurred), not raw pixel
%         intensity, so a single dark vessel/microaneurysm pixel can't
%         win -- it has to be a genuinely dark patch of some size
%
%   Validated: mean 65.4px / median 40.4px on IDRiD (n=80), beating
%   the 3-arg baseline. This is the shipped version (4-arg call).

    imgWidth = imgSize(2);
    imageMidlineX = imgWidth / 2;

    if discCenter(1) < imageMidlineX
        direction = 1;
    else
        direction = -1;
    end

    offsetX = 2.75 * (2 * discRadius) * direction;
    geometricEstimate = [discCenter(1) + offsetX, discCenter(2)];

    if nargin < 4
        foveaCenter = geometricEstimate;
        return;
    end

    if size(enhancedImg,3) == 3
        gray = rgb2gray(enhancedImg);
    else
        gray = enhancedImg;
    end
    gray = im2double(gray);
    contentMask = gray > 0.03;

    searchRadius = round(0.6 * discRadius);
    cx = round(geometricEstimate(1));
    cy = round(geometricEstimate(2));

    xMin = max(1, cx - searchRadius);
    xMax = min(size(gray,2), cx + searchRadius);
    yMin = max(1, cy - searchRadius);
    yMax = min(size(gray,1), cy + searchRadius);

    windowMask = contentMask(yMin:yMax, xMin:xMax);
    if nnz(windowMask) < 0.5 * numel(windowMask)
        foveaCenter = geometricEstimate;
        return;
    end

    blurSigma = max(2, discRadius / 6);
    blurred = imgaussfilt(gray, blurSigma);

    window = blurred(yMin:yMax, xMin:xMax);
    window(~windowMask) = Inf;

    [~, linIdx] = min(window(:));
    [ry, rx] = ind2sub(size(window), linIdx);

    foveaCenter = [xMin + rx - 1, yMin + ry - 1];
end
```

## Working conventions established (carried over + new this session)

- Verify actual folder/file structure via `dir()` before writing any
  path-dependent script
- Test destructive/batch scripts on 2-3 sample files before running on
  the full set
- Verify any AI-drafted script's assumptions against real on-disk
  structure before running
- Compute full-dataset mean/median error, not just worst-N cases, when
  debugging a classical-CV heuristic — worst-N surfaces failure
  patterns but is a misleading signal for whether a fix helped
  overall, since sorting descending always surfaces the hardest cases
  regardless of aggregate improvement
- `manifest.dataset` values are lowercase (`'idrid'`, `'drive'`,
  `'eophtha'`), not the mixed-case folder names used on disk
- Only one copy of each function file exists at `D:\DATASETS\*.m` —
  confirmed via `which <name> -all`
- **New this session**: when a hypothesis about what discriminates two
  cases (e.g. "vessel density separates disc from exudates") is not
  yet measured, instrument the actual candidate values on known
  good/bad examples FIRST — a plausible-sounding mechanism can be
  simply wrong (vessel density did not separate these cases; area was
  actively misleading in some images) and shipping on reasoning alone
  without measurement produced a real regression earlier in the
  session (mean 34.3px → 38.6px)
- **New this session**: keep an `<name>Old.m` copy on the MATLAB path
  as a fixed comparison baseline whenever iterating on a function
  under test, so every candidate change gets a real old-vs-new
  full-dataset comparison rather than trusting "looks better visually"
- **New this session**: when validating a fix visually, overlay BOTH
  the ground-truth and the detected value for every dependent
  quantity (e.g. both true disc and detected disc, not just fovea
  markers) — this makes it possible to tell whether a remaining error
  is caused by the thing you just fixed or by an upstream dependency

## Next step

Building Model 1 (segmentation) in MATLAB Deep Learning Toolbox with
local NVIDIA GPU. A spec exists in ARCHITECTURE.md/FUNCTION_CONTRACTS.md
covering class list, input/output shapes, and expected function
signature — needs to be pasted/shared before writing training code, to
avoid guessing at a contract the rest of the pipeline depends on.

Decision made: fold Optic Disc (mask value 32) and Fovea (mask value
16) in as EXTRA output classes on Model 1 later, as a bonus/possible
improvement — not required. The validated CV functions above remain
the primary/shipped path for OD and fovea regardless of what Model 1
ends up doing, since Model 1 doesn't exist yet and the CV path is
already tested and working.
