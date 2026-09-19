# Doctor Portal & Central Database for Telemedicine Routing — Architectural Specification

Detailed design and implementation plan for the Central Database, Telemedicine Routing Engine, and Remote Ophthalmologist Review Portal for **DR-Detect** (SIH 2026, PS 26038).

---

## 1. High-Level Telemedicine Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 PERIPHERAL PHC / CHC CLINIC                 │
│                                                             │
│  [Fundus Camera]                                            │
│        │                                                    │
│        ▼                                                    │
│  [DR-Detect Electron Desktop Console]                       │
│  ├── Local Compiled Backend (dr_backend.exe / MATLAB)       │
│  ├── Local Archive (patient_data/<id>/visits/<timestamp>/)  │
│  └── Sync Daemon (Store & Forward, offline queue)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / TLS 1.3 (When online)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 CENTRAL TELEMEDICINE CLOUD                  │
│                                                             │
│  ├── API Gateway & Auth Service (JWT + RBAC, ABHA-aligned)   │
│  ├── Sync & Ingestion Worker (Presigned S3/MinIO upload)    │
│  ├── Intelligent Routing Engine (Severity & Geo Triage)     │
│  ├── Central PostgreSQL Database (Patients, Visits, Triage) │
│  └── S3 / MinIO Storage (Encrypted fundus, masks, PDFs)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ WebSockets / REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             DISTRICT / TERTIARY EYE HOSPITAL                │
│                                                             │
│  [Ophthalmologist Web Portal (React + Vite)]                │
│  ├── Urgent Priority Triage Queue (SLA Countdown)           │
│  ├── Side-by-Side Dual-Eye Deep Diagnostic Workspace        │
│  ├── 4-Layer Inspection (Raw, Enhanced, Lesions, Grad-CAM)  │
│  ├── AI Verification, Grade Override & Clinical Notes       │
│  └── Digital Signature & Counter-signed Referral Slip       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Central Relational Database Schema (PostgreSQL)

```sql
-- 1. Healthcare Facilities (PHCs, CHCs, District & Tertiary Hospitals)
CREATE TABLE facilities (
    facility_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(50) NOT NULL, -- 'PHC', 'CHC', 'DISTRICT_HOSPITAL', 'TERTIARY_EYE_INSTITUTE'
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. System Users & Specialists
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'PHC_OPERATOR', 'GENERAL_OPHTHALMOLOGIST', 'RETINA_SPECIALIST', 'ADMIN'
    full_name VARCHAR(255) NOT NULL,
    medical_council_reg_no VARCHAR(100), -- Medical license for digital sign-off
    facility_id VARCHAR(32) REFERENCES facilities(facility_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Patient Master Index
CREATE TABLE patients (
    patient_id VARCHAR(64) PRIMARY KEY, -- e.g. 'P-10248'
    abha_id VARCHAR(32) UNIQUE,         -- Ayushman Bharat Health Account ID
    full_name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(10) NOT NULL,        -- 'M', 'F', 'Other'
    contact_phone VARCHAR(20),
    diabetes_duration_years NUMERIC(4, 1),
    is_insulin_dependent BOOLEAN DEFAULT FALSE,
    hba1c NUMERIC(4, 2),
    systolic_bp INT,
    diastolic_bp INT,
    registered_facility_id VARCHAR(32) REFERENCES facilities(facility_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Screening Visits & AI Diagnostic Outputs
CREATE TABLE screening_visits (
    visit_id VARCHAR(64) PRIMARY KEY,   -- e.g. 'P10248_20260911_073000'
    patient_id VARCHAR(64) REFERENCES patients(patient_id) ON DELETE CASCADE,
    facility_id VARCHAR(32) REFERENCES facilities(facility_id),
    operator_user_id UUID REFERENCES users(user_id),
    screening_timestamp TIMESTAMPTZ NOT NULL,
    
    -- AI Predictions: Right Eye (OD)
    od_predicted_grade INT NOT NULL,     -- 0 to 4
    od_grade_name VARCHAR(32) NOT NULL,  -- 'No DR', 'Mild', 'Moderate', 'Severe', 'PDR'
    od_confidence NUMERIC(5, 4) NOT NULL,
    od_referral BOOLEAN NOT NULL,
    
    -- AI Predictions: Left Eye (OS)
    os_predicted_grade INT NOT NULL,
    os_grade_name VARCHAR(32) NOT NULL,
    os_confidence NUMERIC(5, 4) NOT NULL,
    os_referral BOOLEAN NOT NULL,
    
    -- Overall Triage Level
    max_severity_grade INT NOT NULL,     -- MAX(od, os)
    triage_priority VARCHAR(20) NOT NULL,-- 'EMERGENCY', 'URGENT', 'ROUTINE', 'QA_SPOTCHECK'
    triage_status VARCHAR(20) NOT NULL,  -- 'QUEUED', 'ASSIGNED', 'REVIEWED', 'REFERRED'
    sla_deadline TIMESTAMPTZ NOT NULL,
    
    -- Deep Biomarker Breakdown (from Model 1 & Hybrid Feature Bridge)
    biomarkers JSONB,                    -- { "od": { "exudates": true, "hems_area": 0.04 }, "os": {...} }
    
    -- Sync Metadata
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    client_version VARCHAR(32)
);

-- 5. Screening Assets & Image Blobs
CREATE TABLE screening_assets (
    asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id VARCHAR(64) REFERENCES screening_visits(visit_id) ON DELETE CASCADE,
    eye VARCHAR(4) NOT NULL,             -- 'OD', 'OS', 'BOTH'
    asset_type VARCHAR(32) NOT NULL,     -- 'RAW_FUNDUS', 'ENHANCED', 'SEGMENTATION_MASK', 'GRADCAM_HEATMAP', 'REPORT_PDF'
    s3_key VARCHAR(512) NOT NULL,
    s3_bucket VARCHAR(128) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Telemedicine Assignments & Queue Management
CREATE TABLE triage_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id VARCHAR(64) REFERENCES screening_visits(visit_id) ON DELETE CASCADE,
    assigned_doctor_id UUID REFERENCES users(user_id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    reassigned_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE' -- 'ACTIVE', 'EXPIRED', 'RELEASED', 'COMPLETED'
);

-- 7. Specialist Clinical Reviews & Feedback
CREATE TABLE doctor_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id VARCHAR(64) REFERENCES screening_visits(visit_id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(user_id),
    review_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Clinical Assessment & AI Concordance
    doctor_od_grade INT NOT NULL,
    doctor_os_grade INT NOT NULL,
    concordance_status VARCHAR(30) NOT NULL, -- 'AGREED', 'UPGRADED', 'DOWNGRADED'
    divergence_reason TEXT,
    
    -- Clinical Plan & Interventions
    action_required VARCHAR(50) NOT NULL,    -- 'ROUTINE_FOLLOWUP', 'LASER_PRP', 'ANTI_VEGF_INJECTION', 'SURGICAL_VITRECTOMY'
    followup_interval_months INT,
    clinical_notes TEXT NOT NULL,
    recommended_tertiary_center_id VARCHAR(32) REFERENCES facilities(facility_id),
    
    -- Security & Sign-off
    digital_signature_hash VARCHAR(256),
    counter_signed_pdf_key VARCHAR(512),
    
    -- Telemedicine Sync Status back to PHC
    delivered_to_phc BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMPTZ
);

-- Query Performance Indexes
CREATE INDEX idx_screening_visits_triage ON screening_visits(triage_status, triage_priority, sla_deadline);
CREATE INDEX idx_screening_visits_facility ON screening_visits(facility_id);
CREATE INDEX idx_doctor_reviews_sync ON doctor_reviews(delivered_to_phc);
```

---

## 3. Telemedicine Routing Engine

### 3.1 Severity Tiers & Response SLA

| Max Grade | Clinical Category | Priority Tag | Maximum SLA | Specialist Pool | Action |
|---|---|---|---|---|---|
| **Grade 4** | Proliferative DR (PDR) | `EMERGENCY` | **< 4 hours** | Vitreoretinal Surgeons | Urgent PRP laser / anti-VEGF referral |
| **Grade 3** | Severe NPDR | `URGENT` | **< 24 hours** | Retina Consultants | Clinical evaluation within 2 weeks |
| **Grade 2** | Moderate NPDR | `PRIORITY` | **< 48 hours** | District Ophthalmologists | Follow-up within 3–6 months |
| **Grade 1** | Mild NPDR | `ROUTINE` | **< 7 days** | General Eye OPD | Annual review + glycemic control |
| **Grade 0** | No Retinopathy | `QA_AUDIT` | **10% Sample** | Audit Pool | Baseline verification |

### 3.2 Dynamic Assignment & Auto-Escalation
1. **District Proximity**: Assigns case to doctors registered to hospitals in the matching administrative district.
2. **Sub-specialist Routing**: If `max_severity_grade == 4` or NV biomarker is present, route exclusively to vitreoretinal specialists.
3. **Queue Balancing**: Directs assignment to the doctor with the fewest pending reviews (< 15 active).
4. **SLA Breach Watchdog**: A background worker audits overdue reviews every 15 minutes. Cases past 75% SLA without review are unassigned and escalated to the regional emergency on-call pool with push alerts.

---

## 4. Offline-to-Cloud Sync Flow

```
PHC Desktop (Offline)
  └─ Visits saved in patient_data/*/visits/*/result.json ("synced": false)
            │
      [Network Detected]
            │
            ▼
    desktop/electron/syncDaemon.cjs
            │
            ├─ 1. Request presigned upload URLs for images & report.pdf
            ├─ 2. Direct HTTPS PUT stream to S3 / MinIO storage
            ├─ 3. POST /api/v1/visits/ingest with structured results
            ├─ 4. Update local result.json -> "synced": true
            │
            ▼
    Central Telemedicine Server
            │
            ├─ Ingest visit & trigger Routing Engine
            └─ Place in Doctor Review Triage Queue
```

### Downlink to PHC Console (`DoctorResponsesView.jsx`):
- Sync daemon queries `GET /api/v1/facilities/{id}/reviews?since={timestamp}`.
- Local client updates `localStorage['dr_doctor_responses']` and triggers in-app notification.
- PHC health worker instantly sees verified doctor notes, recommended laser/anti-VEGF appointments, and counter-signed report.

---

## 5. Doctor Portal Web Application UI Design

- **Triage Worklist**:
  - Color-coded priority badges (`EMERGENCY` red, `URGENT` amber, `PRIORITY` blue).
  - Live SLA countdown timer with visual flashing when deadline approaches.
  - One-click case selection.
- **Deep Diagnostic Viewer**:
  - Side-by-side OD / OS comparison.
  - 4-layer switch: **Raw Fundus** → **Enhanced** → **Model 1 Lesion Mask** → **Grad-CAM Saliency Heatmap** (with opacity slider).
  - Biomarker inspector displaying microaneurysm count, hemorrhage quadrant presence, hard exudates area, and 4-2-1 rule triggers.
- **Clinical Disposition & Sign-Off**:
  - Concordance decision: Agree with AI or Override with documented rationale.
  - Intervention selector (Laser PRP, Anti-VEGF, Vitrectomy, Conservative follow-up).
  - Free-text clinical notes with quick templates.
  - Digital counter-signature: embeds doctor's registration number and updates the master PDF.

---

## 6. Regulatory & Security Compliance

- **ABDM Compliance**: Ayushman Bharat Health Account (ABHA) ID integration for longitudinal records.
- **Encryption**: AES-256 at rest for fundus blobs, TLS 1.3 in transit.
- **Role-Based Access Control (RBAC)**: Strict segregation between PHC operators and credentialed ophthalmologists.
- **Audit Trails**: Non-repudiable logs for every case opened, reviewed, or modified.
