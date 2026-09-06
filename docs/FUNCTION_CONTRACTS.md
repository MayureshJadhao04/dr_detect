# Function contracts

Fixed input/output signatures for every pipeline function. Update this
file FIRST if a signature needs to change — don't let implementations
drift silently, especially when generating code with an AI assistant
across multiple sessions. The stub-function section below is now
optional — it was for parallel UI/pipeline development across two
people; since you're building both solo, you can wire the UI directly
to your real functions as you finish each one.

| Function | Inputs | Outputs | Purpose |
|---|---|---|---|
| `enhanceImage(img)` | `img` (RGB image matrix, original) | `enhancedImg` (RGB image matrix) | CLAHE + denoise + illumination norm — runs on EVERY image, not just borderline ones. Original `img` is kept separately — never overwritten — since the report shows both. This runs FIRST, before quality check. |
| `qualityCheck(enhancedImg)` | `enhancedImg` (RGB image matrix, post-enhancement) | `isGradable` (logical), `blurScore` (double), `illumScore` (double) | Reject/accept image — runs on the ENHANCED image, after `enhanceImage`. |
| `findOpticDisc(img)` | `img` (RGB or grayscale) | `center` ([x,y]), `radius` (double) | Locate optic disc, classical CV |
| `findFovea(img, discCenter, discRadius)` | `img`, `discCenter`, `discRadius` | `foveaCenter` ([x,y]) | Locate fovea from disc geometry |
| `runModel1Segmentation(img, model1)` | `img`, `model1` (loaded U-Net) | `masks` (struct with fields: `vessels`, `darkLesions`, `lightLesions`, `proliferative` — each a binary/probability mask same size as `img`) | Model 1 inference, all 4 channels in one call |
| `gradeSeverity(img, model2)` | `img`, `model2` (loaded ResNet50) | `grade` (int 0–4), `confidence` (double 0–1) | Model 2 inference |
| `runGradCAM(img, model2, grade)` | `img`, `model2`, `grade` | `heatmap` (same size as `img`) | Explainability overlay for Model 2 |
| `isReferable(grade)` | `grade` (int) | `referable` (logical) | grade >= 2 → true |
| `routeForReview(referable, patientId)` | `referable` (logical), `patientId` (string) | `routingStatus` (string: `"none"` / `"queued_for_review"`) | Telemedicine routing stage — sets status, does not need real network transmission for the demo |
| `exportReport(originalImg, enhancedImg, masks, grade, confidence, heatmap, routingStatus, path)` | all result fields, output `path` | writes PDF, returns `success` (logical) | Final report — shows both image versions and both models' outputs together, so a doctor sees why the grade was given |

## Conventions
- All images: `uint8` RGB unless explicitly stated as grayscale/binary.
- All masks: logical/probability images, same height/width as input image.
- `masks` struct fields are always present, even if a channel found
  nothing — in that case the mask is all-zero, not omitted.
- All scores/confidences: `double`, range 0–1 (grade is an integer 0–4,
  not normalized).
- No function reads/writes global state — everything passes through
  arguments and return values.
- Model files (`.mat`) are loaded once at app startup, passed into
  inference functions as arguments — not reloaded per call.

## Stub functions (for parallel UI development)
For every function above, a stub exists in `/stubs` with the same name
and signature but hardcoded return values. Example:

```matlab
function enhancedImg = enhanceImage(img)
    enhancedImg = img; % stub just passes through unchanged
end

function [isGradable, blurScore, illumScore] = qualityCheck(enhancedImg)
    isGradable = true;
    blurScore = 0.2;
    illumScore = 0.8;
end

function [grade, confidence] = gradeSeverity(img, model2)
    grade = 3;
    confidence = 0.91;
end

function masks = runModel1Segmentation(img, model1)
    sz = size(img, [1 2]);
    masks.vessels = false(sz);
    masks.darkLesions = false(sz);
    masks.lightLesions = false(sz);
    masks.proliferative = false(sz);
end
```

Stubs are deleted and replaced with real implementations at integration
time — filenames and signatures must match exactly, or integration
breaks.
