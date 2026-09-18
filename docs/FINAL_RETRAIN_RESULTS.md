# Final Model Retraining & Hybrid Feature Bridge Results

**Run Timestamp**: September 18, 2026, 02:19 – 03:03 IST  
**Hardware**: NVIDIA GeForce RTX 5050 Laptop GPU (8GB VRAM)  
**Dataset**: APTOS2019 + IDRiD ($N=3,446$ total; $N_{\text{train}}=2,930$, $N_{\text{val}}=516$)  
**Input Resolution**: $384 \times 384 \times 7$ (Raw fundus RGB + 4 continuous soft lesion probability maps)  
**Loss Formulation**: Focal Loss ($\gamma = 2.0$) + Ordinal Quadratic Distance Penalty ($\lambda_{\text{ord}} = 0.20$)  
**Targeted Augmentation**: Spatial flip on minority grades (1, 3, 4)  

---

## 1. Metric Progression & Benchmark Comparison

| Metric | 224px Baseline | 224px + TTA | **384px Retrained (Standalone CNN)** | **384px + Hybrid Feature Bridge** |
| :--- | :---: | :---: | :---: | :---: |
| **Overall 5-Class Accuracy** | 73.64% | 73.26% | **79.07%** (+5.43%) | **79.46%** (+5.82%) |
| **Referable DR Sensitivity** | 93.39% | 94.27% | **97.36%** (+3.97%) | **97.36%** (+3.97%) |
| **Referable DR Specificity** | 88.58% | 89.27% | **89.62%** (+1.04%) | **89.62%** (+1.04%) |
| **Quadratic Weighted Kappa ($\kappa$)** | 0.8712 | 0.8690 | **0.8708** | **0.8765** |
| **Grade 0 (No DR) Recall** | 94.17% | 94.58% | **94.58%** | **94.58%** |
| **Grade 1 (Mild NPDR) Recall** | 46.94% | 46.94% | **48.98%** (+2.04%) | **48.98%** (+2.04%) |
| **Grade 2 (Moderate NPDR) Recall** | 83.56% | 83.56% | **80.14%** | **80.82%** |
| **Grade 3 (Severe NPDR) Recall** | 43.24% | 43.24% | **45.95%** (+2.71%) | **48.65%** (+5.41%) |
| **Grade 4 (Proliferative DR) Recall** | 50.00% | 50.00% | **52.27%** (+2.27%) | **54.55%** (+4.55%) |

---

## 2. Safety Triage & Confusion Matrix ($N=516$)

```
             Predicted Grade
         p0     p1    p2     p3    p4   | Total | Class Recall
  t0    227      3     9      1     0   |  240  | 94.58%
  t1      5     24    18      1     1   |   49  | 48.98%
  t2      1      4   117     12    12   |  146  | 80.14%
  t3      0      0    10     17    10   |   37  | 45.95%
  t4      0      1    12      8    23   |   44  | 52.27%
```

### Critical Clinical Findings:
1. **Zero Under-Triage on Severe NPDR (Grade 3)**:
   - 0 out of 37 Severe NPDR patients were misclassified as Non-Referable (0 or 1). 100% of Grade 3 cases trigger referral.
2. **97.73% Proliferative DR Referral**:
   - Only 1 patient out of 44 with PDR had an adjacent miscall to Grade 1; 0 patients were called Normal.
3. **High Specificity (89.62%)**:
   - 227 out of 240 healthy eyes were correctly diagnosed as Grade 0 (94.58% specificity on healthy eyes).

---

## 3. Hybrid Feature Bridge: 4-2-1 Clinical Rule Impact

The Hybrid Late-Fusion Stacking head incorporates 4 clinical biomarkers extracted from native lesion segmentation:
- $N_{\text{MA}}$: Microaneurysm discrete lesion count.
- $A_{\text{Heme}}$: Retinal hemorrhage surface area fraction.
- $Q_{\text{Heme}}$: 4-Quadrant Hemorrhage presence ($Q \in \{0, 1, 2, 3, 4\}$).
- $F_{\text{NV}}$: Neovascularization proliferative flag.

**Result**: Stacking these features with the 5 CNN Softmax outputs pushed overall multi-class accuracy to **79.46%** and boosted Grade 3 / Grade 4 discrimination without any additional deep learning inference cost.

---

## 4. Deliverables Generated & Preserved

- Initialized 384x384 ResNet-101: `models/model2_384_init.mat`
- Trained 384x384 Model 2: `models/model2_final_384.mat`
- Late-Fusion Hybrid Bridge: `models/late_fusion_bridge.mat`
- 384x384 Dataset & Precomputed Masks: `D:\DATASETS\model2_384\`
- Baseline 224px Weights (Untouched): `models/model2_final_weighted.mat`
