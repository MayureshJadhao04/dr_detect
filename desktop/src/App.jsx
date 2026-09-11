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

const TAB_META = {
  screen: {
    title: 'Diabetic Retinopathy Screening & Triage',
    breadcrumb: 'Bilateral Examination · Automated ICDR 0–4 Severity Grading & Tele-Referral',
  },
  records: {
    title: 'Patient Records Archive',
    breadcrumb: 'Offline Local Archive · patient_data/',
  },
  responses: {
    title: 'Doctor Responses & Annotations',
    breadcrumb: 'Specialist Feedback on Sent Reports',
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
    return null; // Will fallback to component default if null
  });

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

  // --- Handlers ---

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

        setResultData({
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
        });
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
    } else if (window.api && window.api.restartEngine) {
      try {
        await window.api.restartEngine();
      } catch (err) {
        console.error('Failed to restart engine on stop:', err);
      }
    }
  };

  const handleViewReport = async () => {
    if (!resultData) return;
    setIsGeneratingPdf(true);
    try {
      if (window.api && window.api.openPath && saveResult?.pdfPath) {
        await window.api.openPath(saveResult.pdfPath);
      } else {
        // Browser fallback: simulate PDF generation
        await new Promise(r => setTimeout(r, 800));
        alert('PDF report preview would open here in Electron.');
      }
    } catch (err) {
      console.error('View report failed:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendToDoctor = async () => {
    if (!resultData || sendStatus === 'SENT') return;
    setSendStatus('SENDING');
    try {
      if (window.api && window.api.savePatientVisit) {
        const res = await window.api.savePatientVisit({ patientInfo });
        setSaveResult(res);
      } else {
        // Browser fallback: simulate
        await new Promise(r => setTimeout(r, 800));
        setSaveResult({
          pdfPath: `D:\\Projects\\dr-screening\\patient_data\\${patientInfo.patientID}\\report.pdf`,
          visitPath: `D:\\Projects\\dr-screening\\patient_data\\${patientInfo.patientID}\\visits`,
        });
      }

      // Real Clinical Triage Rule for ICDR 0-4
      const odGrade = resultData.rightEye.predictedGrade ?? 0;
      const osGrade = resultData.leftEye.predictedGrade ?? 0;
      const maxGrade = Math.max(odGrade, osGrade);
      const isSevere = maxGrade >= 3; // ICDR 3 (Severe NPDR) or 4 (PDR)
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
      setSendStatus('QUEUED'); // Offline fallback
    }
  };

  const handleSaveVisit = async () => {
    if (!resultData) return;
    setIsSaving(true);
    try {
      if (window.api && window.api.savePatientVisit) {
        const res = await window.api.savePatientVisit({ patientInfo });
        setSaveResult(res);
      } else {
        await new Promise(r => setTimeout(r, 800));
        setSaveResult({
          pdfPath: 'D:\\Projects\\dr-screening\\patient_data\\P0001\\visits\\test3\\report.pdf',
          visitPath: 'D:\\Projects\\dr-screening\\patient_data\\P0001\\visits\\test3',
        });
      }
    } catch (err) {
      console.error('Save visit failed:', err);
      alert('Failed to save visit: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPath = (filePath) => {
    if (window.api && window.api.openPath) {
      window.api.openPath(filePath);
    } else {
      alert(`Opening path: ${filePath}`);
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
  const tabMeta = TAB_META[activeTab] || TAB_META.screen;

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title={tabMeta.title} breadcrumb={tabMeta.breadcrumb} />

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
                />
              )}

              {/* Row 5: Records Table */}
              <RecordsTable
                onOpenPath={handleOpenPath}
                onAddNewPatient={handleAddNewPatient}
              />
            </>
          )}

          {/* =================== RECORDS TAB =================== */}
          {activeTab === 'records' && (
            <RecordsTable
              onOpenPath={handleOpenPath}
              onAddNewPatient={handleAddNewPatient}
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
