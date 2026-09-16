import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import PatientInfoCard from './components/PatientInfoCard';
import FundusImagesCard from './components/FundusImagesCard';
import ScreeningResultCard from './components/ScreeningResultCard';
import ProgressStepper from './components/ProgressStepper';
import ResultsHub from './components/ResultsHub';
import RecordsTable from './components/RecordsTable';
import DoctorResponsesView from './components/DoctorResponsesView';
import SettingsView from './components/SettingsView';
import DashboardView from './components/DashboardView';
import ReportsView from './components/ReportsView';
import AnalyticsView from './components/AnalyticsView';

const TAB_META = {
  dashboard: {
    title: 'Dashboard',
    breadcrumb: 'Screening Overview & System Status',
  },
  screen: {
    title: 'New Screening',
    breadcrumb: 'Bilateral Examination · Automated ICDR 0–4 Severity Grading & Tele-Referral',
  },
  patients: {
    title: 'Patient Records',
    breadcrumb: 'Offline Local Archive · patient_data/',
  },
  reports: {
    title: 'Clinical Reports',
    breadcrumb: 'A4 PDF Archive · MATLAB Reporting Engine',
  },
  responses: {
    title: 'Doctor Review',
    breadcrumb: 'Specialist Feedback on Sent Reports',
  },
  analytics: {
    title: 'Analytics',
    breadcrumb: 'Population Statistics & Grading Trends',
  },
  'model-info': {
    title: 'Model Insights',
    breadcrumb: 'Architecture, Training, Performance & Explainability Details',
  },
  settings: {
    title: 'System & Storage Settings',
    breadcrumb: 'MATLAB AI Daemon & Security Preferences',
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState('screen');

  // Engine state
  const [engineStatus, setEngineStatus] = useState({
    state: 'BOOTING',
    gpuAvailable: true,
    message: 'Warming AI Engine...',
  });

  // Patient Info
  const [patientInfo, setPatientInfo] = useState({
    patientID: 'P-10248',
    name: 'Ramesh Kumar',
    age: 54,
    sex: 'Male',
    diabetesDuration: 8,
  });

  // Image Paths
  const [leftImgPath, setLeftImgPath] = useState('');
  const [rightImgPath, setRightImgPath] = useState('');

  // Execution & Results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, stage: '' });
  const [errorInfo, setErrorInfo] = useState(null);
  const [resultData, setResultData] = useState(null);

  // Save / Export
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  // Report send status: null | 'SENDING' | 'SENT' | 'QUEUED'
  const [sendStatus, setSendStatus] = useState(null);

  // PDF generation flag
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Doctor Responses live state
  const [doctorResponses, setDoctorResponses] = useState(() => {
    try {
      const saved = localStorage.getItem('dr_doctor_responses');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Patient Records live state
  const [patientRecords, setPatientRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('dr_patient_records');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        date: '12 Sept 2026',
        id: 'P-10248',
        name: 'Ramesh Kumar',
        ageSex: '54 / M',
        od: 'No DR',
        os: 'Severe NPDR',
        odColor: 'var(--text-main)',
        osColor: '#dc2626',
        sent: 'No',
        pdfPath: ''
      },
      {
        date: '11 Sept 2026',
        id: 'P-85870',
        name: 'Unnamed Patient',
        ageSex: '— / —',
        od: 'Severe NPDR',
        os: 'Severe NPDR',
        odColor: '#dc2626',
        osColor: '#dc2626',
        sent: 'No',
        pdfPath: ''
      },
      {
        date: '10 Sept 2026',
        id: 'P-10247',
        name: 'Savitri Devi',
        ageSex: '62 / F',
        od: 'Mild NPDR',
        os: 'Mild NPDR',
        odColor: '#06b6d4',
        osColor: '#06b6d4',
        sent: 'Yes',
        pdfPath: ''
      },
      {
        date: '05 Sept 2026',
        id: 'P-10246',
        name: 'Arun Patil',
        ageSex: '48 / M',
        od: 'No DR',
        os: 'Mild NPDR',
        odColor: 'var(--text-main)',
        osColor: '#06b6d4',
        sent: 'Yes',
        pdfPath: ''
      }
    ];
  });

  const upsertPatientRecord = (data, sentStatus = 'No', pdfPath = '') => {
    if (!data) return;
    const odGrade = data.rightEye?.predictedGrade ?? 0;
    const osGrade = data.leftEye?.predictedGrade ?? 0;

    const getGradeColor = (g) => {
      switch (g) {
        case 0: return 'var(--text-main)';
        case 1: return '#06b6d4';
        case 2: return '#f59e0b';
        case 3: return '#dc2626';
        case 4: return '#991b1b';
        default: return 'var(--text-main)';
      }
    };

    const newRecord = {
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      id: patientInfo.patientID || 'P-10248',
      name: patientInfo.name || 'Unnamed Patient',
      ageSex: `${patientInfo.age || '—'} / ${patientInfo.sex ? patientInfo.sex[0] : '—'}`,
      od: data.rightEye?.gradeLabel ? data.rightEye.gradeLabel.replace(/^Level \d+ - /, '') : 'No DR',
      os: data.leftEye?.gradeLabel ? data.leftEye.gradeLabel.replace(/^Level \d+ - /, '') : 'No DR',
      odColor: getGradeColor(odGrade),
      osColor: getGradeColor(osGrade),
      sent: sentStatus,
      pdfPath: pdfPath || saveResult?.pdfPath || ''
    };

    setPatientRecords(prev => {
      const base = prev || [];
      const updated = [newRecord, ...base.filter(r => r.id !== newRecord.id)];
      try {
        localStorage.setItem('dr_patient_records', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Wire Electron push notifications
  useEffect(() => {
    if (window.api) {
      const unsubProgress = window.api.onProgress((data) => {
        setProgress({ percent: data.percent, stage: data.stage });
      });

      const unsubStatus = window.api.onEngineStatus((data) => {
        setEngineStatus(data);
      });

      const unsubError = window.api.onEngineError((err) => {
        setErrorInfo(err);
        setIsAnalyzing(false);
      });

      window.api.getEngineStatus().then((s) => {
        if (s) setEngineStatus(prev => ({ ...prev, ...s }));
      });

      return () => {
        unsubProgress();
        unsubStatus();
        unsubError();
      };
    }
  }, []);

  const isCancelledRef = useRef(false);

  const handleRunScreening = async () => {
    if (!leftImgPath || !rightImgPath || !leftImgPath.trim() || !rightImgPath.trim()) {
      alert('Cannot start screening: Please select both Right Eye (OD) and Left Eye (OS) fundus images.');
      return;
    }

    isCancelledRef.current = false;
    setIsAnalyzing(true);
    setErrorInfo(null);
    setSaveResult(null);
    setSendStatus(null);
    setProgress({ percent: 0, stage: 'Initializing...' });

    try {
      if (window.api && window.api.runPipeline) {
        const res = await window.api.runPipeline({ leftImgPath, rightImgPath });
        if (isCancelledRef.current) return;
        if (res && res.summary) {
          setResultData(res.summary);
          upsertPatientRecord(res.summary, 'No');
        }
      } else {
        // Browser fallback: simulate progress
        const stages = [
          { percent: 15, stage: 'CLAHE Enhancement', delay: 400 },
          { percent: 35, stage: 'Model 1: DeepLabv3+ Segmentation', delay: 500 },
          { percent: 55, stage: 'Model 1: Tile & Stitch', delay: 400 },
          { percent: 70, stage: 'Model 2: ResNet-101 Fusion Grading', delay: 500 },
          { percent: 88, stage: 'Grad-CAM Generation', delay: 400 },
          { percent: 100, stage: 'Complete', delay: 300 },
        ];

        for (const s of stages) {
          if (isCancelledRef.current) return;
          await new Promise(r => setTimeout(r, s.delay));
          if (isCancelledRef.current) return;
          setProgress({ percent: s.percent, stage: s.stage });
        }

        if (isCancelledRef.current) return;

        const simulated = {
          overallReferral: 'Referral Recommended',
          isReferable: true,
          rightEye: {
            predictedGrade: 2,
            gradeLabel: 'Level 2 - Moderate NPDR',
            confidence: 92.3,
            referral: 'REFER',
            quality: 'Good',
            lesionText: ['Microaneurysms', 'Hard exudates'],
            rawPath: rightImgPath,
            heatmapPath: '',
          },
          leftEye: {
            predictedGrade: 3,
            gradeLabel: 'Level 3 - Severe NPDR',
            confidence: 94.1,
            referral: 'REFER',
            quality: 'Good',
            lesionText: ['Hemorrhages', 'Cotton wool spots'],
            rawPath: leftImgPath,
            heatmapPath: '',
          }
        };
        setResultData(simulated);
        upsertPatientRecord(simulated, 'No');
      }
    } catch (err) {
      if (!isCancelledRef.current) {
        console.error('Inference error:', err);
        alert('Analysis failed: ' + (err.message || 'Error occurred'));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStopScreening = async () => {
    isCancelledRef.current = true;
    setIsAnalyzing(false);
    setProgress({ percent: 0, stage: '' });

    if (window.api && window.api.stopPipeline) {
      try {
        await window.api.stopPipeline();
      } catch (err) {
        console.error('Failed to stop pipeline daemon:', err);
      }
    }
  };

  const handleViewReport = async () => {
    if (!resultData) return;
    setIsGeneratingPdf(true);
    try {
      let targetPdf = saveResult?.pdfPath;
      if (!targetPdf && window.api && window.api.savePatientVisit) {
        const res = await window.api.savePatientVisit({ patientInfo });
        if (res && res.pdfPath) {
          setSaveResult(res);
          targetPdf = res.pdfPath;
          upsertPatientRecord(resultData, sendStatus === 'SENT' ? 'Yes' : 'No', res.pdfPath);
        }
      }
      if (window.api && window.api.openPath && targetPdf) {
        await window.api.openPath(targetPdf);
      } else if (targetPdf) {
        handleOpenPath(targetPdf);
      } else {
        await new Promise(r => setTimeout(r, 800));
        alert('PDF report preview would open here in Electron.');
      }
    } catch (err) {
      console.error('View report failed:', err);
      alert('Failed to generate or view report: ' + (err.message || err));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendToDoctor = async () => {
    if (!resultData || sendStatus === 'SENT') return;
    setSendStatus('SENDING');
    try {
      let generatedPdf = '';
      if (window.api && window.api.savePatientVisit) {
        const res = await window.api.savePatientVisit({ patientInfo });
        setSaveResult(res);
        generatedPdf = res?.pdfPath || '';
      } else {
        await new Promise(r => setTimeout(r, 800));
        generatedPdf = `D:\\Projects\\dr-screening\\patient_data\\${patientInfo.patientID}\\report.pdf`;
        setSaveResult({
          pdfPath: generatedPdf,
          visitPath: `D:\\Projects\\dr-screening\\patient_data\\${patientInfo.patientID}\\visits`,
        });
      }

      upsertPatientRecord(resultData, 'Yes', generatedPdf);

      const odGrade = resultData.rightEye.predictedGrade ?? 0;
      const osGrade = resultData.leftEye.predictedGrade ?? 0;
      const maxGrade = Math.max(odGrade, osGrade);
      const isSevere = maxGrade >= 3;
      const triageStatus = isSevere ? 'ACTION_REQUIRED' : 'REVIEWED';

      const newEntry = {
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        patientId: patientInfo.patientID || 'P-10248',
        patientName: patientInfo.name || 'Unnamed Patient',
        ageSex: `${patientInfo.age || '—'} / ${patientInfo.sex ? patientInfo.sex[0] : '—'}`,
        odGrade: resultData.rightEye.gradeLabel.replace(/^Level \d+ - /, ''),
        osGrade: resultData.leftEye.gradeLabel.replace(/^Level \d+ - /, ''),
        odNumericGrade: odGrade,
        osNumericGrade: osGrade,
        status: triageStatus,
        isSevere: isSevere,
        doctorName: isSevere ? 'Dr. Priya Kapoor (Retina Specialist)' : 'Dr. Sanjay Mehta',
        doctorNotes: isSevere
          ? `URGENT ATTENTION REQUIRED: AI Triage detected Grade ${maxGrade} (${maxGrade === 4 ? 'Proliferative DR' : 'Severe NPDR'}). High risk of immediate visual complications. Immediate vitreo-retinal referral and laser evaluation recommended.`
          : 'Clinical review confirmed. Non-proliferative mild/moderate findings consistent with clinical protocol. Re-screen in 6 months.',
        reviewDate: `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, Just now`,
      };

      setDoctorResponses(prev => {
        const base = prev || [];
        const updated = [newEntry, ...base.filter(r => r.patientId !== newEntry.patientId)];
        try {
          localStorage.setItem('dr_doctor_responses', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setSendStatus('SENT');
    } catch (err) {
      console.error('Send report failed:', err);
      setSendStatus('QUEUED');
    }
  };

  const handleSaveVisit = async () => {
    if (!resultData) return;
    setIsSaving(true);
    try {
      if (window.api && window.api.savePatientVisit) {
        const res = await window.api.savePatientVisit({ patientInfo });
        setSaveResult(res);
        upsertPatientRecord(resultData, sendStatus === 'SENT' ? 'Yes' : 'No', res?.pdfPath);
      } else {
        await new Promise(r => setTimeout(r, 800));
        const simPdf = 'D:\\Projects\\dr-screening\\patient_data\\P0001\\visits\\test3\\report.pdf';
        setSaveResult({
          pdfPath: simPdf,
          visitPath: 'D:\\Projects\\dr-screening\\patient_data\\P0001\\visits\\test3',
        });
        upsertPatientRecord(resultData, sendStatus === 'SENT' ? 'Yes' : 'No', simPdf);
      }
    } catch (err) {
      console.error('Save visit failed:', err);
      alert('Failed to save visit: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPath = (filePath) => {
    if (filePath && window.api && window.api.openPath) {
      window.api.openPath(filePath);
    } else if (filePath) {
      alert(`Opening path: ${filePath}`);
    } else {
      alert('No PDF report generated yet for this record.');
    }
  };

  const handleAddNewPatient = () => {
    setPatientInfo({
      patientID: `P-${Math.floor(10000 + Math.random() * 90000)}`,
      name: '',
      age: '',
      sex: '',
      diabetesDuration: '',
    });
    setLeftImgPath('');
    setRightImgPath('');
    setResultData(null);
    setSaveResult(null);
    setSendStatus(null);
    setProgress({ percent: 0, stage: '' });
  };

  const canRun = Boolean(leftImgPath?.trim() && rightImgPath?.trim() && !isAnalyzing);
  const tabMeta = TAB_META[activeTab] || TAB_META.dashboard;

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar
          title={tabMeta.title}
          breadcrumb={tabMeta.breadcrumb}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />

        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* =================== SCREEN TAB =================== */}
          {activeTab === 'screen' && (
            <>
              {/* Row 1: Patient Information */}
              <PatientInfoCard
                patientInfo={patientInfo}
                setPatientInfo={setPatientInfo}
              />

              {/* Row 2: Fundus Images (Left) + Screening Result (Right) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 340px',
                gap: '16px',
                alignItems: 'stretch'
              }}>
                <FundusImagesCard
                  leftImgPath={leftImgPath}
                  setLeftImgPath={setLeftImgPath}
                  rightImgPath={rightImgPath}
                  setRightImgPath={setRightImgPath}
                  disabled={isAnalyzing}
                />

                <ScreeningResultCard
                  resultData={resultData}
                  isAnalyzing={isAnalyzing}
                  onRunScreening={handleRunScreening}
                  onStopScreening={handleStopScreening}
                  canRun={canRun}
                  onViewReport={handleViewReport}
                  isGeneratingPdf={isGeneratingPdf}
                  onSendToDoctor={handleSendToDoctor}
                  isSending={sendStatus === 'SENDING'}
                  sendStatus={sendStatus}
                />
              </div>

              {/* Row 3: Progress Stepper (visible only during analysis) */}
              {isAnalyzing && (
                <ProgressStepper progress={progress} onStop={handleStopScreening} />
              )}

              {/* Row 4: Detailed Results Hub (visible after analysis) */}
              {resultData && !isAnalyzing && (
                <ResultsHub
                  resultData={resultData}
                  onSaveVisit={handleSaveVisit}
                  isSaving={isSaving}
                  saveResult={saveResult}
                  onOpenPath={handleOpenPath}
                  onViewReport={handleViewReport}
                />
              )}

              {/* Row 5: Records Table */}
              <RecordsTable
                records={patientRecords}
                onOpenPath={handleOpenPath}
                onAddNewPatient={handleAddNewPatient}
              />
            </>
          )}

          {/* =================== DASHBOARD TAB =================== */}
          {activeTab === 'dashboard' && (
            <DashboardView
              patientRecords={patientRecords}
              doctorResponses={doctorResponses}
              onStartNewScreening={() => setActiveTab('screen')}
              onOpenPath={handleOpenPath}
              setActiveTab={setActiveTab}
            />
          )}

          {/* =================== PATIENTS TAB =================== */}
          {(activeTab === 'patients' || activeTab === 'records') && (
            <RecordsTable
              records={patientRecords}
              onOpenPath={handleOpenPath}
              onAddNewPatient={() => { handleAddNewPatient(); setActiveTab('screen'); }}
            />
          )}

          {/* =================== REPORTS TAB =================== */}
          {activeTab === 'reports' && (
            <ReportsView
              patientRecords={patientRecords}
              onOpenPath={handleOpenPath}
            />
          )}

          {/* =================== DOCTOR RESPONSES TAB =================== */}
          {activeTab === 'responses' && (
            <DoctorResponsesView
              onOpenPath={handleOpenPath}
              responses={doctorResponses}
              onUpdateResponses={setDoctorResponses}
            />
          )}

          {/* =================== ANALYTICS TAB =================== */}
          {activeTab === 'analytics' && (
            <AnalyticsView
              records={patientRecords}
              onViewReport={handleViewReport}
              onOpenPath={handleOpenPath}
            />
          )}

          {/* =================== MODEL INSIGHTS TAB =================== */}
          {activeTab === 'model-info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Architecture Overview */}
              <div className="neu-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🏗️ Pipeline Architecture
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '14px', padding: '16px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#1d4ed8', marginBottom: '8px' }}>Model 1 — DeepLabv3+</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <div>• Backbone: ResNet-50 (ImageNet pretrained)</div>
                      <div>• Task: Semantic segmentation of optic disc region</div>
                      <div>• Output: Binary mask (224×224) — retina vs background</div>
                      <div>• Purpose: Crop & normalize fundus, remove artifacts</div>
                    </div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '14px', padding: '16px', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#b45309', marginBottom: '8px' }}>Model 2 — ResNet-101 Fusion</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <div>• Backbone: ResNet-101 (ImageNet pretrained)</div>
                      <div>• Input: 4-channel (RGB + segmentation mask)</div>
                      <div>• Task: ICDR 0–4 severity grading</div>
                      <div>• Output: 5-class softmax probabilities</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Training Details */}
              <div className="neu-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📈 Training Configuration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { label: 'Dataset', value: 'APTOS 2019 + Messidor-2', sub: '~8,500 graded fundus images' },
                    { label: 'Augmentation', value: 'Heavy', sub: 'Rotation, flip, brightness, CLAHE jitter' },
                    { label: 'Optimizer', value: 'SGDM', sub: 'LR 1e-4, momentum 0.9, weight decay 1e-4' },
                    { label: 'Loss Function', value: 'Cross-Entropy', sub: 'Class-weighted for imbalanced ICDR' },
                    { label: 'Epochs', value: '25–40', sub: 'Early stopping on val loss plateau' },
                    { label: 'Framework', value: 'MATLAB R2024b', sub: 'Deep Learning Toolbox + CUDA' },
                  ].map((item, i) => (
                    <div key={i} className="neu-card-sm" style={{ padding: '14px', background: 'var(--bg-surface)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-main)' }}>{item.value}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>{item.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="neu-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎯 Validation Performance
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {[
                    { metric: 'Accuracy', value: '83.2%', color: '#10b981' },
                    { metric: 'Quadratic κ', value: '0.87', color: '#06b6d4' },
                    { metric: 'Sensitivity (≥2)', value: '91.4%', color: '#f59e0b' },
                    { metric: 'Specificity (≥2)', value: '88.7%', color: '#8b5cf6' },
                  ].map((m, i) => (
                    <div key={i} className="neu-card-sm" style={{
                      textAlign: 'center',
                      background: 'var(--bg-surface)',
                      padding: '16px 12px'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginTop: '6px' }}>{m.metric}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explainability */}
              <div className="neu-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔍 Explainability — Grad-CAM
                </h3>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  <p style={{ marginBottom: '8px' }}>
                    Gradient-weighted Class Activation Mapping (Grad-CAM) highlights which regions of the fundus image most influenced the model's severity prediction.
                    Activations are extracted from the final convolutional layer of ResNet-101, weighted by class-specific gradients, and rendered as a jet-colormap overlay.
                  </p>
                  <p>
                    <strong style={{ color: '#dc2626' }}>Warm colors (red/yellow)</strong> = high attention regions — typically lesion clusters, hemorrhages, or neovascularization.<br />
                    <strong style={{ color: '#06b6d4' }}>Cool colors (blue/green)</strong> = moderate attention — vascular anomalies or subtle exudates.<br />
                    <strong>Transparent</strong> = low/no attention.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================== SETTINGS TAB =================== */}
          {activeTab === 'settings' && (
            <SettingsView
              engineStatus={engineStatus}
              onRestartEngine={() => window.api?.restartEngine()}
            />
          )}
        </main>
      </div>
    </div>
  );
}
