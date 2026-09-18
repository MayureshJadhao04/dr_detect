# DR_Detect: Problem-Solution Improvement Matrix & Decision Guide

A strategic decision matrix evaluating all proposed improvements, trade-offs, and empirical validation protocols for the final submission (Sept 30, 2026).

---

## 1. Problem-Solution Decision Matrix

| # | Clinical / Technical Problem | Candidate Solutions | Time / Compute Cost | Target Gain *(To be empirically verified)* | Recommended? |
|---|---|---|:---:|:---:|:---:|
| **1** | **Model 1 & 2 Integration:** Hard binarization (`maskProb >= 0.5`) wipes out subtle microaneurysms ($0.35\text{--}0.48$). | **A. Continuous Soft Probability Maps:** Pass float $[0.0, 1.0]$ tensor directly into Channels 4–7 without hard thresholding.<br><br>**B. Hybrid Feature Bridge:** Extract native-res lesion counts, area fractions, and 4-2-1 quadrants into a tabular vector for late fusion. | **A:** 20 mins (Zero retraining)<br><br>**B:** 2 days (Network re-architecture) | **A:** Hypothesis: $+1.0\% \text{ to } +2.0\%$ accuracy, richer Grad-CAM dynamics<br><br>**B:** $+3.0\%$, high architectural complexity | **A: PREFERRED (Tier 1)**<br>*(Immediate win, preserves gradient dynamics)*<br><br>B: Secondary (Post-Hackathon Roadmap) |
| **2** | **Inference Variance & Camera Angle Skew:** Single forward pass can fluctuate on borderline lesions. | **A. Prediction Test-Time Augmentation (TTA):** Average softmax predictions across original, horizontal flip, and vertical flip (Grad-CAM runs on upright image).<br><br>**B. Multi-Crop Ensembling:** Predict on 5 overlapping center/corner crops. | **A:** 30 mins (Zero retraining)<br><br>**B:** 1 hour | **A:** Hypothesis: $+1.0\% \text{ to } +2.0\%$ accuracy, variance smoothing<br><br>**B:** $+1.0\%$, $5\times$ latency penalty | **A: PREFERRED (Tier 1)**<br>*(Standard Kaggle/Medical winning trick)*<br><br>B: Rejected (Latency) |
| **3** | **Clinical Safety & Missed Referrals:** Edge-case where CNN grade is borderline but Model 1 finds severe lesions. | **A. Rule-Based Safety Escalation Protocol:** If Model 1 detects Neovascularization ($>0.05\%$) or hemorrhage clusters ($>0.5\%$), escalate triage to Specialist Referral.<br><br>**B. Reliance on CNN alone.** | **A:** 15 mins (Zero retraining)<br><br>**B:** 0 mins | **A:** Protocol-driven safety net for ambiguous cases (empirically calibrated thresholds).<br><br>**B:** Risk of false negative | **A: PREFERRED (Tier 1)**<br>*(Eliminates silent severe misses)* |
| **4** | **Severe Class Imbalance:** Grade 0 has 1,362 images; Grade 3 has 210, Grade 1 has 276. | **A. Focal Loss ($\gamma = 2.0$):** Suppresses easy normal gradients, forces network to focus on hard lesions.<br><br>**B. Class-Balanced Augmentation:** Heavily augment only minority Grades 1, 3, 4.<br><br>**C. DeepDRiD Dataset Retraining:** Pull 2,000 new images from external challenge. | **A:** 4–6 hrs (1 training run)<br><br>**B:** 4–6 hrs (1 training run)<br><br>**C:** 3–5 days (Data wrangling) | **A:** Major boost on minority recall<br><br>**B:** Balances feature diversity<br><br>**C:** Unpredictable domain shift | **A + B: PREFERRED (Tier 2)**<br>*(Combine into 1 single training run)*<br><br>C: Rejected (Time & quota risk) |
| **5** | **Spatial Downsampling Bottleneck:** $224 \times 224$ smears 3-pixel microaneurysms. | **A. Increase Resolution to $384 \times 384$:** Retrain ResNet-101 on $384\text{px}$ aspect-padded frames.<br><br>**B. Patch-based Voting Classifier:** Classify image via patch majority vote. | **A:** 6–8 hrs on RTX GPU<br><br>**B:** 1.5 days | **A:** Target: $+3.0\% \text{ to } +5.0\%$ 5-class accuracy<br><br>**B:** High tile-boundary noise | **A: PREFERRED (Tier 2)**<br>*(Best resolution sweet spot)* |
| **6** | **Ordinal Grading Nature:** Cross-entropy treats classes as arbitrary, penalizing $1 \leftrightarrow 2$ same as $0 \leftrightarrow 4$. | **A. Ordinal Distance Penalty Loss:** Quadratic penalty on class distance.<br><br>**B. Standard Cross-Entropy.** | **A:** 4–6 hrs (combine with Tier 2)<br><br>**B:** 0 mins | **A:** Target: Quadratic Kappa ($\kappa$) above $0.90$<br><br>**B:** Baseline | **A: PREFERRED (Tier 2)**<br>*(Combine with 4A & 5A)* |

---

## 2. Experimental Ablation Benchmark Framework

Empirically measured on the held-out validation set ($N=516$ images):

| Experimental Iteration | 5-Class Accuracy | Referable Sensitivity | Referable Specificity | Clinical Impact |
|---|:---:|:---:|:---:|---|
| **1. Baseline (Direct pass, 224px)** | **73.64%** | **93.39%** | **88.58%** | Standard single-view inference baseline |
| **2. + Prediction TTA (3-Fold, 224px)** | **73.26%** | **94.27%** | **89.27%** | **+0.88% Sensitivity, +0.69% Specificity** (fewer missed referable cases) |
| **3. + Safety Escalation Protocol** | **73.26%** | **94.27%** | **89.27%** | Safety net: NV ($>0.05\%$) or Hemorrhage ($>0.5\%$) forces specialist triage |
| **4. 384px Retrained (Focal + Ordinal)** | **79.07%** | **97.36%** | **89.62%** | **+5.43% Accuracy, +3.97% Sensitivity** ($384\text{px}$ microaneurysm resolution + focal minority weighting) |
| **5. + Hybrid Feature Bridge (Late Fusion)** | **79.46%** | **97.36%** | **89.62%** | Stacking 5 CNN probabilities with 4-2-1 clinical quadrant biomarkers |

---

## 3. Implementation Status

* **Tier 1 (Completed & Shipped Live in Release v1.0.0)**:
  - Continuous Soft Lesion Maps (`generateGradCAMForImage.m`)
  - 3-Fold Prediction TTA (`generateGradCAM.m`)
  - Safety Escalation Protocol (`analyzePatientVisit.m`)
  - Windows Installer `DR-Detect-1.0.0-x64.exe` deployed to GitHub Releases.

* **Tier 2 (Completed & Evaluated on RTX GPU)**:
  - $384 \times 384$ raw fundus dataset + soft continuous masks + 4-2-1 quadrant biomarker cache generated.
  - Model 2 retrained on RTX 5050 GPU with Focal Loss ($\gamma = 2.0$) + Ordinal Distance Loss ($\lambda = 0.20$).
  - Late-Fusion Hybrid Feature Bridge trained and validated: **79.46% Multi-class Accuracy, 97.36% Referable Sensitivity**.
  - Documented in `docs/FINAL_RETRAIN_RESULTS.md`.

