# UI spec — screening app

Built as a programmatic MATLAB app: `uifigure` + `uigridlayout`, not
drag-and-drop App Designer, so it can be scripted/iterated with an AI
coding assistant and kept as plain `.m` files.

## Layout

**Overall**: single `uifigure`, `uigridlayout` with a narrow left sidebar
column and a wide main column.

**Sidebar (left, narrow)**
- App icon/logo
- Icon-only nav elements (visual only for v1 — single screen, no real
  navigation needed): eye icon, scan icon, report icon, chart icon

**Top bar (main column, row 1)**
- Title: "Retina screening console"
- Subtitle: patient ID + camera model (static/placeholder text for demo)
- Status pill: "System ready" (green) / "Processing..." (amber) /
  "Error" (red)

**Pipeline stepper (main column, row 2)**
- 4 stages shown as circles + labels: Enhancement & quality check →
  Segmentation → Grading → Report & routing (matches the pipeline order
  in ARCHITECTURE.md: enhancement runs first, then quality check on the
  enhanced image)
- Each circle: gray (pending) → blue (in progress) → green with checkmark
  (done)
- Updates live as the pipeline runs on a loaded image

**Main content (main column, row 3, split into two columns)**

*Left column:*
- Image display area (`uiimage` or `uiaxes`) showing the loaded fundus
  image with overlay toggles (Grad-CAM heatmap / vessels / lesions shown
  as small pill badges above the image — clickable if time allows,
  otherwise static labels for v1)
- "Load image" button
- "Run screening" button

*Right column:*
- Severity gauge (`uigauge`, circular, 0–4 range) with the grade number in
  the center
- Confidence bar (`uigauge` linear style, or a manually drawn progress bar
  via a colored `uipanel` whose width is set programmatically)
- Referral banner: colored panel (green "no referral needed" / red "refer
  to ophthalmologist") based on `isReferable(grade)`
- "Export report" button

## Interaction flow (matches final pipeline order)
1. User clicks "Load image" → file picker → image loaded (original kept).
2. **Enhancement runs automatically and immediately** (not gated behind
   a button) — every image is enhanced first, stepper stage 1 ("Enhance")
   turns green. Original and enhanced versions both held for later.
3. **Quality check runs on the enhanced image** — stepper stage 2
   ("Quality check") turns green, or shows a rejection message +
   "please retake" if still ungradeable after enhancement.
4. User clicks "Run screening" → optic disc/fovea localization, Model 1
   segmentation, Model 2 grading, Grad-CAM run in sequence, stepper
   updates live through remaining stages, gauge/confidence/banner
   populate once grading completes.
5. If referable (grade ≥2): a routing indicator appears — e.g. "Queued
   for ophthalmologist review" — the telemedicine routing step, shown
   directly in the UI, not a separate screen.
6. User clicks "Export report" → PDF generated via `exportReport()`,
   showing the original image, the enhanced image, Model 1's lesion/
   vessel/proliferative overlays, Model 2's grade + confidence + Grad-CAM
   heatmap, and the referral/routing status together.

## Pipeline stepper — updated stage order
Enhance → Quality check → Segmentation (Model 1) → Grading (Model 2) →
Report/Routing — 5 stages instead of the earlier 4, reflecting
enhancement now running first and unconditionally.

## Segmentation overlay toggles (Model 1 output)
The overlay badges above the image (previously "Grad-CAM / Vessels /
Lesions") should now toggle between: Grad-CAM, Vessels, Dark lesions,
Light lesions, **Proliferative (NV/IRMA)** — the last one specifically
worth visually distinguishing (e.g. a different overlay color) since
neovascularization findings are the most clinically urgent signal.

## Component list (MATLAB App Designer UI components, used programmatically)
- `uifigure`, `uigridlayout`
- `uiimage` (image display)
- `uibutton` (load, run, export)
- `uigauge` (severity, confidence)
- `uilamp` or colored `uipanel` (status pill, referral banner, stepper
  circles)
- `uilabel` (all text)

## Explicit non-goals for v1
- No multi-page navigation — sidebar icons are visual only.
- No drag-and-drop file upload — a standard file picker is enough.
- No live camera feed integration — static image upload only.

## Build ownership
Now built by you, solo, alongside the pipeline — see `WORKFLOW.md` Step
8. Since there's no parallel development happening across two people,
you can skip the stub-function pattern and wire the UI directly to your
real functions as each one is finished, rather than building the whole
UI against stubs first.

## Design bar
This should look like deployed clinical software, not a coursework demo
— sidebar navigation, pipeline stepper, gauges, status pills, consistent
color palette (see the dashboard mockup already agreed). Prioritize the
pipeline stepper and severity gauge first if time is short — they carry
most of the "impressive" perception for the least build effort.
