# Function Contracts — Pipeline & Server API

## 1. MATLAB Daemon IPC Interface (`models/pipelineServer.m`)

The server reads newline-delimited JSON messages from `stdin` and emits response messages to `stdout`.

### `analyze` Request
```json
{
  "id": "req-101",
  "action": "analyze",
  "leftImage": "D:\\images\\left.jpg",
  "rightImage": "D:\\images\\right.jpg",
  "patientInfo": {
    "patientID": "P-10248",
    "name": "Ramesh Kumar",
    "age": 54,
    "sex": "Male",
    "diabetesDuration": 8
  }
}
```

### `analysis_complete` Response
```json
{
  "id": "req-101",
  "event": "analysis_complete",
  "result": {
    "rightEye": {
      "predictedGrade": 2,
      "gradeLabel": "Moderate NPDR",
      "confidence": 0.924,
      "referral": true,
      "quality": { "isGradable": true, "blurScore": 0.12, "illumScore": 0.88 },
      "detectedLesions": ["Microaneurysms", "Hard Exudates"],
      "heatmap": "...",
      "maskProb": "..."
    },
    "leftEye": {
      "predictedGrade": 3,
      "gradeLabel": "Severe NPDR",
      "confidence": 0.941,
      "referral": true,
      "quality": { "isGradable": true, "blurScore": 0.10, "illumScore": 0.89 },
      "detectedLesions": ["Hemorrhages", "Cotton Wool Spots"],
      "heatmap": "...",
      "maskProb": "..."
    }
  }
}
```

### `save` Request
```json
{
  "id": "req-102",
  "action": "save",
  "analysisData": { ... },
  "patientInfo": { ... }
}
```

### `saved` Response
```json
{
  "id": "req-102",
  "event": "saved",
  "visitDir": "D:\\Projects\\dr-screening\\patient_data\\P-10248\\visits\\20260917_103000",
  "pdfPath": "D:\\Projects\\dr-screening\\patient_data\\P-10248\\visits\\20260917_103000\\report.pdf"
}
```

---

## 2. Core MATLAB Function Signatures

| Function | Signature | Purpose |
|---|---|---|
| `analyzePatientVisit` | `analysis = analyzePatientVisit(net1, net2, leftImgPath, rightImgPath, patientInfo)` | Executes bilateral quality checks, enhancement, DeepLabv3+ segmentation, ResNet-101 grading, and Grad-CAM generation. |
| `renderPatientReportPDF` | `renderPatientReportPDF(analysis, patientInfo, outPdfPath)` | Compiles bilateral images, heatmaps, lesion metrics, and clinician signature fields into standard A4 vector PDF and companion PNG. |
| `savePatientVisit` | `[savedDir, pdfPath] = savePatientVisit(analysis, patientInfo, baseDir)` | Persists structured JSON, segmented binary masks, Grad-CAM overlays, and PDF into local offline store. |
| `enhanceImage` | `enhancedImg = enhanceImage(img)` | Mandatory camera-normalization via CLAHE, bilateral filtering, and color balance. |
| `qualityCheck` | `[isGradable, blurScore, illumScore] = qualityCheck(img)` | Computes Laplacian variance blur index and illumination histogram uniformity. |
| `findOpticDisc` | `[center, radius] = findOpticDisc(img)` | Locates brightest circular optic nerve head via morphological segmentation. |
| `findFovea` | `foveaCenter = findFovea(img, discCenter, discRadius)` | Projects anatomical macular coordinate based on temporal-inferior offset. |
| `generateGradCAM` | `heatmap = generateGradCAM(net, img, classIdx)` | Backpropagates class gradients to last conv layer, rendering jet-colormap attention heatmap. |

---

## 3. Electron IPC Bridge Contracts (`window.api`)

Exposed via `desktop/electron/preload.cjs` with context isolation:

- `window.api.runScreening(leftPath, rightPath, patientInfo)`: Returns `Promise<analysisResult>`.
- `window.api.stopPipeline()`: Sends abort signal to daemon.
- `window.api.savePatientVisit(analysisData, patientInfo)`: Returns `Promise<{ visitDir, pdfPath }>`.
- `window.api.getPatientHistory(patientID)`: Returns `Promise<Array<Visit>>`.
- `window.api.openPath(targetPath)`: Opens file or folder in Windows native shell.
- `window.api.selectFile()`: Opens native file picker dialog for fundus images.
- `window.api.getDaemonStatus()`: Returns `Promise<{ status, gpuAvailable, uptime }>`.
