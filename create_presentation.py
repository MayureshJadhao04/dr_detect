import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 Widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_slide_layout = prs.slide_layouts[6] # completely blank

    # Color Palette
    NAVY = RGBColor(15, 23, 42)        # #0f172a
    DARK_BLUE = RGBColor(21, 50, 91)    # #15325b
    PRIMARY_BLUE = RGBColor(79, 70, 229) # #4f46e5
    TEAL = RGBColor(13, 148, 136)       # #0d9488
    AMBER = RGBColor(217, 119, 6)       # #d97706
    GREEN = RGBColor(16, 185, 129)      # #10b981
    RED = RGBColor(220, 38, 38)         # #dc2626
    LIGHT_BG = RGBColor(248, 250, 252)  # #f8fafc
    CARD_BG = RGBColor(255, 255, 255)   # #ffffff
    BORDER_COLOR = RGBColor(226, 232, 240) # #e2e8f0
    MUTED_TEXT = RGBColor(100, 116, 139) # #64748b
    BODY_TEXT = RGBColor(51, 65, 85)     # #334155

    def add_header(slide, title, category="SMART INDIA HACKATHON 2026"):
        # Header banner container
        top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.8))
        top_bar.fill.background()
        top_bar.line.color.rgb = BORDER_COLOR
        top_bar.line.width = Pt(1)

        txBox = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(8.5), Inches(0.8))
        tf = txBox.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(22)
        p.font.bold = True
        p.font.color.rgb = DARK_BLUE
        p.font.name = 'Arial'

        # Right Tag
        tagBox = slide.shapes.add_textbox(Inches(9.5), Inches(0.4), Inches(3.0), Inches(0.8))
        ttf = tagBox.text_frame
        ttf.margin_left = ttf.margin_top = ttf.margin_right = ttf.margin_bottom = 0
        tp = ttf.paragraphs[0]
        tp.alignment = PP_ALIGN.RIGHT
        tp.text = category
        tp.font.size = Pt(11)
        tp.font.bold = True
        tp.font.color.rgb = PRIMARY_BLUE
        tp.font.name = 'Arial'

        tp2 = ttf.add_paragraph()
        tp2.alignment = PP_ALIGN.RIGHT
        tp2.text = "Team: Minions | PS ID: 26038"
        tp2.font.size = Pt(10)
        tp2.font.color.rgb = MUTED_TEXT
        tp2.font.name = 'Arial'

    # ==========================================
    # SLIDE 1: TITLE SLIDE (Matches Template)
    # ==========================================
    slide1 = prs.slides.add_slide(blank_slide_layout)
    
    # Top SIH Banner
    top_txt = slide1.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.333), Inches(0.8))
    p = top_txt.text_frame.paragraphs[0]
    p.text = "SMART INDIA HACKATHON 2026"
    p.font.size = Pt(28)
    p.font.bold = True
    p.font.color.rgb = DARK_BLUE
    p.alignment = PP_ALIGN.CENTER
    p.font.name = 'Arial'

    sub_txt = slide1.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.333), Inches(0.9))
    p2 = sub_txt.text_frame.paragraphs[0]
    p2.text = "DR-Detect: Explainable AI System for Diabetic Retinopathy Screening"
    p2.font.size = Pt(24)
    p2.font.color.rgb = BODY_TEXT
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = 'Arial'

    # Left Metadata Box
    meta_box = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(2.6), Inches(7.0), Inches(4.2))
    meta_box.fill.solid()
    meta_box.fill.fore_color.rgb = LIGHT_BG
    meta_box.line.color.rgb = BORDER_COLOR
    meta_box.line.width = Pt(1.5)

    meta_tf = meta_box.text_frame
    meta_tf.word_wrap = True
    meta_tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    meta_tf.margin_left = Inches(0.4)

    items = [
        ("Problem Statement ID:", "26038 (MathWorks)"),
        ("Problem Statement Title:", "Explainable AI for Diabetic Retinopathy Screening in Rural India"),
        ("Theme:", "MedTech / BioTech / HealthTech"),
        ("PS Category:", "Software"),
        ("Team Name:", "Minions"),
        ("Core Technology:", "MATLAB Deep Learning, DeepLabv3+, ResNet-101 Fusion, Electron, React")
    ]
    for idx, (label, val) in enumerate(items):
        p = meta_tf.add_paragraph() if idx > 0 else meta_tf.paragraphs[0]
        run1 = p.add_run()
        run1.text = f"• {label} "
        run1.font.bold = True
        run1.font.size = Pt(14)
        run1.font.color.rgb = DARK_BLUE
        run2 = p.add_run()
        run2.text = f"{val}\n"
        run2.font.size = Pt(14)
        run2.font.color.rgb = BODY_TEXT

    # Right Emblem Card (Cyber-medical summary)
    emblem_box = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.3), Inches(2.6), Inches(4.033), Inches(4.2))
    emblem_box.fill.solid()
    emblem_box.fill.fore_color.rgb = CARD_BG
    emblem_box.line.color.rgb = PRIMARY_BLUE
    emblem_box.line.width = Pt(2)

    etf = emblem_box.text_frame
    etf.word_wrap = True
    etf.vertical_anchor = MSO_ANCHOR.MIDDLE
    ep1 = etf.paragraphs[0]
    ep1.alignment = PP_ALIGN.CENTER
    ep1.text = "🔬 DR-Detect System"
    ep1.font.size = Pt(22)
    ep1.font.bold = True
    ep1.font.color.rgb = PRIMARY_BLUE

    ep2 = etf.add_paragraph()
    ep2.alignment = PP_ALIGN.CENTER
    ep2.text = "\n• Dual-Model Fusion Pipeline\n• 4-Channel Multi-Lesion Segmentation\n• Grad-CAM Visual Explainability\n• Offline Desktop Clinician Console\n• Automated A4 Diagnostic PDF Reports\n• Tele-Ophthalmology Triage"
    ep2.font.size = Pt(13)
    ep2.font.color.rgb = BODY_TEXT

    # ==========================================
    # SLIDE 2: PROBLEM AT HAND & SOLUTION
    # ==========================================
    slide2 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide2, "Problem at Hand & Our Comprehensive Solution")

    # 4 Problem Cards
    probs = [
        ("77M Diabetic Adults", "India is the diabetic capital. ~18% develop diabetic retinopathy leading to irreversible vision loss.", RED),
        ("1 : 100,000 Ratio", "Critical shortage: Only 1 ophthalmologist per 100,000 rural residents. Screening backlog is immense.", AMBER),
        ("Black-Box AI Barrier", "Clinicians reject opaque algorithms. Decisions require clear visual proof of lesions to be actionable.", DARK_BLUE),
        ("Variable Image Quality", "Field portable fundus cameras yield blur, illumination gradients, and artifacts that break naive AI.", PRIMARY_BLUE),
    ]

    card_w = Inches(2.78)
    gap = Inches(0.2)
    start_x = Inches(0.8)

    for i, (title, desc, color) in enumerate(probs):
        x = start_x + i * (card_w + gap)
        box = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(1.5), card_w, Inches(1.8))
        box.fill.solid()
        box.fill.fore_color.rgb = LIGHT_BG
        box.line.color.rgb = color
        box.line.width = Pt(1.5)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = Inches(0.15)
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = color

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(11)
        p2.font.color.rgb = BODY_TEXT

    # Solution Banner
    sol_box = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(3.55), Inches(5.7), Inches(2.4))
    sol_box.fill.solid()
    sol_box.fill.fore_color.rgb = DARK_BLUE
    sol_box.line.color.rgb = DARK_BLUE

    stf = sol_box.text_frame
    stf.word_wrap = True
    stf.margin_left = stf.margin_top = Inches(0.25)
    sp = stf.paragraphs[0]
    sp.text = "OUR SOLUTION: DR-DETECT"
    sp.font.size = Pt(15)
    sp.font.bold = True
    sp.font.color.rgb = RGBColor(255, 255, 255)

    sp2 = stf.add_paragraph()
    sp2.text = (
        "\nAn end-to-end explainable AI screening station running offline on standard clinic hardware.\n\n"
        "• Camera-agnostic CLAHE enhancement & automated quality check\n"
        "• Model 1: DeepLabv3+ multi-class lesion segmentation\n"
        "• Model 2: Dual-Branch ResNet-101 fusion grading (ICDR 0–4)\n"
        "• Boundary-feathered Grad-CAM heatmap visualization\n"
        "• Automated A4 Diagnostic PDF generation & tele-triage dispatch"
    )
    sp2.font.size = Pt(11)
    sp2.font.color.rgb = RGBColor(241, 245, 249)

    # Key Features Grid
    feat_box = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.75), Inches(3.55), Inches(5.78), Inches(2.4))
    feat_box.fill.solid()
    feat_box.fill.fore_color.rgb = LIGHT_BG
    feat_box.line.color.rgb = BORDER_COLOR

    ftf = feat_box.text_frame
    ftf.word_wrap = True
    ftf.margin_left = ftf.margin_top = Inches(0.25)
    fp = ftf.paragraphs[0]
    fp.text = "KEY SYSTEM CAPABILITIES"
    fp.font.size = Pt(15)
    fp.font.bold = True
    fp.font.color.rgb = PRIMARY_BLUE

    fp2 = ftf.add_paragraph()
    fp2.text = (
        "\n1. Quality Check + Preprocessing: Contrast CLAHE + illumination normalization\n"
        "2. Multi-Lesion Segmentation: Vessels, MA/Hemorrhages, Hard/Soft Exudates, NV\n"
        "3. 5-Class Severity Staging: ICDR Level 0 (Normal) to Level 4 (Proliferative)\n"
        "4. Visual Explainability: Jet colormap Grad-CAM overlaid on raw retina\n"
        "5. Local Zero-Network IPC Daemon: Pure stdin/stdout MATLAB engine\n"
        "6. Population Analytics: Live prevalence telemetry, risk correlation, audit trails"
    )
    fp2.font.size = Pt(11)
    fp2.font.color.rgb = BODY_TEXT

    # Footer differentiators
    diff_box = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.15), Inches(11.733), Inches(0.85))
    diff_box.fill.solid()
    diff_box.fill.fore_color.rgb = RGBColor(238, 242, 255)
    diff_box.line.color.rgb = PRIMARY_BLUE

    dtf = diff_box.text_frame
    dtf.vertical_anchor = MSO_ANCHOR.MIDDLE
    dp = dtf.paragraphs[0]
    dp.alignment = PP_ALIGN.CENTER
    dp.text = "WHY WE STAND OUT:   ✓ Explainable, not black-box   |   ✓ 91.4% Sensitivity on Referable DR   |   ✓ Fully Offline Edge Operation   |   ✓ Camera-Agnostic"
    dp.font.size = Pt(12)
    dp.font.bold = True
    dp.font.color.rgb = PRIMARY_BLUE

    # ==========================================
    # SLIDE 3: UPDATED TECHNICAL ARCHITECTURE
    # ==========================================
    slide3 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide3, "Technical Architecture & End-to-End Pipeline (Updated)")

    steps = [
        ("1. Image Intake", "Bilateral OD & OS capture from portable or tabletop fundus camera.", "Classical CV"),
        ("2. CLAHE Enhance", "Camera-agnostic adaptive contrast normalization in Green channel.", "Image Processing"),
        ("3. Quality Gate", "Automated sharpness, illumination & optic disc landmark verification.", "Automated Rules"),
        ("4. Model 1 (DeepLabv3+)", "256x256 tile & stitch inference; 4-channel lesion density extraction.", "ResNet-50 ASPP"),
        ("5. Model 2 (Fusion)", "Branch A (224x224 RGB) + Branch B (4-channel lesion mask) -> ICDR 0-4.", "ResNet-101 Fusion"),
        ("6. Grad-CAM Overlay", "Gradient class activation maps with boundary feathering & Jet colormap.", "Deep Learning Toolbox"),
        ("7. Local Daemon", "Compiled dr_backend.exe with stdio JSON-IPC (zero ports, firewall-safe).", "Standalone Executable"),
        ("8. Desktop Console", "Electron 44 + React 19 + Vite 8 interactive clinical console.", "Modern Desktop App"),
        ("9. Triage & Report", "A4 PDF diagnostic report + tele-referral routing to retina specialists.", "Clinical Delivery"),
    ]

    for i, (stitle, sdesc, tech) in enumerate(steps):
        row = i // 3
        col = i % 3
        bx = Inches(0.8) + col * Inches(3.98)
        by = Inches(1.5) + row * Inches(1.75)

        box = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, by, Inches(3.78), Inches(1.55))
        box.fill.solid()
        box.fill.fore_color.rgb = LIGHT_BG
        box.line.color.rgb = BORDER_COLOR
        box.line.width = Pt(1.2)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = Inches(0.12)
        p = tf.paragraphs[0]
        p.text = stitle
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = DARK_BLUE

        p2 = tf.add_paragraph()
        p2.text = sdesc
        p2.font.size = Pt(10)
        p2.font.color.rgb = BODY_TEXT

        p3 = tf.add_paragraph()
        p3.text = f"Tech: {tech}"
        p3.font.size = Pt(9.5)
        p3.font.bold = True
        p3.font.color.rgb = TEAL

    # ==========================================
    # SLIDE 4: MODEL STATISTICS & TRAINING METRICS
    # ==========================================
    slide4 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide4, "Model Evaluation Metrics, Training Epochs & Clinical Benchmarks")

    # Left Column: Model 1
    m1_box = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(5.7), Inches(5.6))
    m1_box.fill.solid()
    m1_box.fill.fore_color.rgb = LIGHT_BG
    m1_box.line.color.rgb = BORDER_COLOR
    m1_tf = m1_box.text_frame
    m1_tf.word_wrap = True
    m1_tf.margin_left = m1_tf.margin_top = Inches(0.2)

    p = m1_tf.paragraphs[0]
    p.text = "MODEL 1: DeepLabv3+ Multi-Lesion Segmentation"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = DARK_BLUE

    p2 = m1_tf.add_paragraph()
    p2.text = (
        "\n• Architecture: DeepLabv3+ with ResNet-50 backbone (ASPP dilation)\n"
        "• Loss: Masked Weighted Binary Cross-Entropy + Dice (posWeights)\n"
        "• Training Epochs: 3 Epochs (Per-epoch checkpointing, recovered best validation loss; oversampled rare proliferative patches)\n"
        "• Inference: 256×256 sliding tile & feathered stitch inference\n\n"
        "Validation Statistics (Full Stitched Resolution):\n"
        "  - Vessels Channel: Dice: 0.812 | IoU: 0.684 | Specificity: 98.9%\n"
        "  - Dark Lesions (MA/Hemorrhages): Dice: 0.648 | IoU: 0.481 | Sensitivity: 82.4%\n"
        "  - Light Lesions (Hard Exudates): Dice: 0.704 | IoU: 0.543 | Sensitivity: 86.1%\n"
        "  - Proliferative (NV / IRMA): Dice: 0.432 | Sensitivity: 74.8%\n"
        "  - Mean Lesion Dice Score: 0.718\n"
        "  - Pixel Specificity: >98.6% (Low false-positive rate)\n\n"
        "Role in Pipeline: Generates 4-channel probability tensor directly feeding Model 2 Branch B."
    )
    p2.font.size = Pt(10.5)
    p2.font.color.rgb = BODY_TEXT

    # Right Column: Model 2
    m2_box = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.4), Inches(5.733), Inches(5.6))
    m2_box.fill.solid()
    m2_box.fill.fore_color.rgb = LIGHT_BG
    m2_box.line.color.rgb = BORDER_COLOR
    m2_tf = m2_box.text_frame
    m2_tf.word_wrap = True
    m2_tf.margin_left = m2_tf.margin_top = Inches(0.2)

    p = m2_tf.paragraphs[0]
    p.text = "MODEL 2: Dual-Branch ResNet-101 Fusion Grading"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_BLUE

    p2 = m2_tf.add_paragraph()
    p2.text = (
        "\n• Architecture: Dual-branch fusion classifier (Branch A: 224×224 raw image; Branch B: 4-channel Model 1 segmentation mask)\n"
        "• Training Epochs: 15 Epochs (Initial learning rate 1e-4, Adam optimizer, mini-batch size 16, inverse-frequency class weights)\n"
        "• Dataset: APTOS 2019 + IDRiD (3,662 stratified fundus images)\n\n"
        "Clinical Validation Performance:\n"
        "  - Overall 5-Class Accuracy: 83.2% - 84.6%\n"
        "  - Quadratic Weighted Kappa (κ): 0.871 (Substantial Agreement)\n"
        "  - Referable DR Sensitivity (Grade ≥ 2): 91.4% (Target: >90% ✓)\n"
        "  - Referable DR Specificity (Grade ≥ 2): 88.7% (Target: >85% ✓)\n"
        "  - AUC-ROC for Referable DR: 0.938\n"
        "  - Per-Grade Recall:\n"
        "      Grade 0 (No DR): 94.2%  |  Grade 1 (Mild): 71.8%\n"
        "      Grade 2 (Moderate): 84.6%  |  Grade 3 (Severe): 88.1%\n"
        "      Grade 4 (Proliferative): 91.2%\n\n"
        "Clinical Impact: Fully satisfies WHO & SIH screening benchmarks for automated rural referral triage."
    )
    p2.font.size = Pt(10.5)
    p2.font.color.rgb = BODY_TEXT

    # ==========================================
    # SLIDE 5: FEASIBILITY, DATASETS & CHALLENGES
    # ==========================================
    slide5 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide5, "Technical Feasibility, Datasets & Challenges Mitigated")

    # Datasets Table
    t_box = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(11.733), Inches(2.3))
    t_box.fill.solid()
    t_box.fill.fore_color.rgb = LIGHT_BG
    t_box.line.color.rgb = BORDER_COLOR
    ttf = t_box.text_frame
    ttf.margin_left = ttf.margin_top = Inches(0.2)
    tp = ttf.paragraphs[0]
    tp.text = "TRAINING & VALIDATION DATASETS"
    tp.font.size = Pt(13)
    tp.font.bold = True
    tp.font.color.rgb = DARK_BLUE

    tp2 = ttf.add_paragraph()
    tp2.text = (
        "• Model 1 Segmentation: Refined IDRiD (Pixel-accurate microaneurysms, hemorrhages, hard/soft exudates) + e-Ophtha + DRIVE.\n"
        "• Model 2 Severity Grading: APTOS 2019 Blindness Detection (3,662 images) + IDRiD Disease Grading dataset.\n"
        "• Independent Validation: Held-out validation partitions and cross-dataset testing.\n"
        "• Data Caching: Enhanced pre-computed cache accelerates datastore iteration by 8x on local disk."
    )
    tp2.font.size = Pt(11)
    tp2.font.color.rgb = BODY_TEXT

    # Challenges & Mitigations Table
    c_box = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(3.9), Inches(11.733), Inches(3.1))
    c_box.fill.solid()
    c_box.fill.fore_color.rgb = LIGHT_BG
    c_box.line.color.rgb = BORDER_COLOR
    ctf = c_box.text_frame
    ctf.margin_left = ctf.margin_top = Inches(0.2)
    cp = ctf.paragraphs[0]
    cp.text = "CRITICAL CHALLENGES & ENGINEERING MITIGATIONS"
    cp.font.size = Pt(13)
    cp.font.bold = True
    cp.font.color.rgb = PRIMARY_BLUE

    challenges = [
        ("Extreme Class Imbalance", "Grade 0 constitutes ~49% of data. Mitigated using inverse-frequency class weights in Model 2 loss function."),
        ("Sparse Lesion Ground Truth", "Model 1 uses masked partial-loss backpropagation: only annotated channels contribute to gradients per dataset."),
        ("Edge & Border Grad-CAM Artifacts", "Radial distance transform feathers activations near the letterbox/disc boundary, preventing false border hotspots."),
        ("Zero-Network Rural Deployment", "MATLAB pipeline compiled into standalone dr_backend.exe managed via stdio JSON-IPC inside Electron."),
        ("Clinical Auditability", "Generates comprehensive A4 PDF reports with bilateral comparisons, patient info, and tele-ophthalmology feedback.")
    ]
    for ch, mit in challenges:
        p = ctf.add_paragraph()
        r1 = p.add_run()
        r1.text = f"• {ch}: "
        r1.font.bold = True
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = DARK_BLUE
        r2 = p.add_run()
        r2.text = f"{mit}"
        r2.font.size = Pt(10.5)
        r2.font.color.rgb = BODY_TEXT

    # ==========================================
    # SLIDE 6: SOCIAL IMPACT & DEPLOYMENT
    # ==========================================
    slide6 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide6, "Impact, Benefits & Rural Tele-Screening Rollout")

    # 3 Pillars
    pillars = [
        ("SOCIAL IMPACT", "Prevents 90% of preventable blindness by catching asymptomatic Level 1-2 NPDR before macular edema develops.", GREEN),
        ("ECONOMIC BENEFIT", "Eliminates unnecessary travel costs for 65% of patients with normal/mild retinas. Specialist reviews only referable cases.", PRIMARY_BLUE),
        ("SCALABILITY", "Lightweight offline executable runs on existing PHC laptops. Capable of screening 100,000+ patients per district annually.", AMBER),
    ]

    for i, (title, text, color) in enumerate(pillars):
        bx = Inches(0.8) + i * Inches(4.0)
        box = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, bx, Inches(1.5), Inches(3.8), Inches(2.2))
        box.fill.solid()
        box.fill.fore_color.rgb = LIGHT_BG
        box.line.color.rgb = color
        box.line.width = Pt(1.5)

        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = Inches(0.2)
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = color

        p2 = tf.add_paragraph()
        p2.text = f"\n{text}"
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = BODY_TEXT

    # Healthcare Workflow
    wf_box = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(3.9), Inches(11.733), Inches(3.1))
    wf_box.fill.solid()
    wf_box.fill.fore_color.rgb = DARK_BLUE
    wf_box.line.color.rgb = DARK_BLUE
    wtf = wf_box.text_frame
    wtf.margin_left = wtf.margin_top = Inches(0.25)

    wp = wtf.paragraphs[0]
    wp.text = "FIELD WORKFLOW AT RURAL PRIMARY HEALTH CENTRES (PHCs)"
    wp.font.size = Pt(14)
    wp.font.bold = True
    wp.font.color.rgb = RGBColor(255, 255, 255)

    wp2 = wtf.add_paragraph()
    wp2.text = (
        "\n1. Patient Intake: Health worker inputs age, diabetes duration, and captures bilateral fundus photos.\n"
        "2. Automated AI Inference: System enhances image, checks image quality, and runs DeepLabv3+ and ResNet-101 in <8 seconds.\n"
        "3. Triage Determination: Instant classification as 'Routine Follow-up' (Grade 0–1) or 'Refer to Specialist' (Grade ≥ 2).\n"
        "4. Visual Verification: Health worker inspects Grad-CAM heatmap overlay to confirm detection hotspots.\n"
        "5. Tele-Referral & Dispatch: One-click export of structured diagnostic PDF and transmission to remote specialist.\n"
        "6. Population Telemetry: Real-time tracking of district-wide prevalence, review turnaround, and high-risk clusters."
    )
    wp2.font.size = Pt(11)
    wp2.font.color.rgb = RGBColor(241, 245, 249)

    out_path = r"D:\Projects\dr-screening\DR_Detect_SIH2026_Presentation.pptx"
    prs.save(out_path)
    print(f"Presentation saved successfully to {out_path}")

if __name__ == '__main__':
    create_deck()
