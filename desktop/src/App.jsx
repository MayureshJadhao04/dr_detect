import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import PatientIntake from './components/PatientIntake';
import FundusUpload from './components/FundusUpload';
import ProgressStepper from './components/ProgressStepper';
import ResultsHub from './components/ResultsHub';
import RecordsView from './components/RecordsView';
import SettingsView from './components/SettingsView';
import { Play, Sparkles, AlertTriangle, RotateCcw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('screen');

  // Engine state
  const [engineStatus, setEngineStatus] = useState({
    state: 'BOOTING',
    gpuAvailable: true,
    message: 'Warming AI Engine...',
  });

  // Patient Intake State
  const [patientInfo, setPatientInfo] = useState({
    patientID: 'P0005',
    name: 'Suresh Rao',
    age: 56,
    sex: 'Male',
    diabetesDuration: 11,
  });

  // Image Paths
  const [leftImgPath, setLeftImgPath] = useState('');
  const [rightImgPath, setRightImgPath] = useState('');

  // Execution & Progress State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, stage: '' });
  const [errorInfo, setErrorInfo] = useState(null);

  // Result & Save State
  const [resultData, setResultData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  // Wire push listeners from Electron bridge
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
    } else {
      // Mock status for browser-only dev preview
      const timer = setTimeout(() => {
        setEngineStatus({ state: 'READY', gpuAvailable: true, message: 'Mock Engine Ready' });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Quick helper to fill sample fundus paths
  const handleLoadSample = () => {
    setPatientInfo({
      patientID: 'P0001',
      name: 'Sunita Devi',
      age: 52,
      sex: 'Female',
      diabetesDuration: 9,
    });
    // Reference sample images in repo
    setRightImgPath('D:\\Projects\\dr-screening\\patient_data\\P0001\\visits\\20260911_073000\\right_raw.jpg');
    setLeftImgPath('D:\\Projects\\dr-screening\\patient_data\\P0001\\visits\\20260911_073000\\left_raw.jpg');
  };

  const handleRunScreening = async () => {
    if (!leftImgPath || !rightImgPath) {
      setErrorInfo({
        message: 'Both Right Eye (OD) and Left Eye (OS) fundus images must be selected.',
        remedy: 'Select both image files before running screening.'
      });
      return;
    }

    setIsAnalyzing(true);
    setErrorInfo(null);
    setResultData(null);
    setSaveResult(null);
    setProgress({ percent: 10, stage: 'Initiating bilateral screening...' });

    try {
      if (window.api && window.api.runPipeline) {
        const response = await window.api.runPipeline({
          leftImgPath,
          rightImgPath,
        });
        if (response && response.summary) {
          setResultData(response.summary);
        }
      } else {
        // Fallback simulated execution for browser preview
        let pct = 10;
        const interval = setInterval(() => {
          pct += 25;
          if (pct >= 100) {
            clearInterval(interval);
            setProgress({ percent: 100, stage: 'Complete' });
            setIsAnalyzing(false);
            setResultData({
              overallReferral: 'REFER TO OPHTHALMOLOGIST',
              isReferable: true,
              rightEye: {
                predictedGrade: 2,
                gradeLabel: 'Level 2 - Moderate NPDR',
                confidence: 89.4,
                referral: 'REFER',
                quality: 'Good',
                lesionText: ['Microaneurysms', 'Hard exudates'],
                rawPath: rightImgPath,
                heatmapPath: rightImgPath,
              },
              leftEye: {
                predictedGrade: 0,
                gradeLabel: 'Level 0 - No DR',
                confidence: 96.1,
                referral: 'Routine Follow-up',
                quality: 'Good',
                lesionText: ['No significant lesions detected'],
                rawPath: leftImgPath,
                heatmapPath: leftImgPath,
              }
            });
          } else {
            setProgress({ percent: pct, stage: pct === 35 ? 'Model 1 Segmentation...' : 'Model 2 Severity...' });
          }
        }, 600);
        return;
      }
    } catch (err) {
      console.error('Screening failed:', err);
      setErrorInfo({
        message: err.message || 'Pipeline failed during execution.',
        remedy: 'Verify image files and ensure MATLAB backend is running.'
      });
    } finally {
      setIsAnalyzing(false);
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
        // Mock save
        setTimeout(() => {
          setSaveResult({
            visitPath: 'D:\\Projects\\dr-screening\\patient_data\\P0005\\visits\\20260911_154500',
            pdfPath: 'D:\\Projects\\dr-screening\\patient_data\\P0005\\visits\\20260911_154500\\report.pdf',
          });
          setIsSaving(false);
        }, 1200);
        return;
      }
    } catch (err) {
      console.error('Save visit failed:', err);
      setErrorInfo({ message: err.message, remedy: 'Check write permissions.' });
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

  const handleReset = () => {
    setResultData(null);
    setSaveResult(null);
    setErrorInfo(null);
    setLeftImgPath('');
    setRightImgPath('');
  };

  const canRun = Boolean(leftImgPath && rightImgPath && !isAnalyzing);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-dark)' }}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        engineStatus={engineStatus}
        onRestartEngine={() => window.api?.restartEngine()}
      />

      {/* Main Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar breadcrumb={activeTab === 'screen' ? 'Screen Patient' : activeTab === 'records' ? 'Patient Records' : 'Settings'} />

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeTab === 'screen' && (
            <>
              {/* Error Banner */}
              {errorInfo && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <AlertTriangle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fca5a5' }}>
                      {errorInfo.message}
                    </div>
                    {errorInfo.remedy && (
                      <div style={{ fontSize: '11px', color: '#fda4af', marginTop: '2px' }}>
                        Suggestion: {errorInfo.remedy}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 1. Patient Intake Card */}
              <PatientIntake
                patientInfo={patientInfo}
                setPatientInfo={setPatientInfo}
                disabled={isAnalyzing}
              />

              {/* 2. Fundus Image Dropzones */}
              <FundusUpload
                leftImgPath={leftImgPath}
                setLeftImgPath={setLeftImgPath}
                rightImgPath={rightImgPath}
                setRightImgPath={setRightImgPath}
                disabled={isAnalyzing}
              />

              {/* Action Controls & Sample Auto-fill */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleLoadSample}
                    disabled={isAnalyzing}
                    style={{ fontSize: '12px' }}
                  >
                    <Sparkles size={14} color="#38bdf8" />
                    Load Sample Patient Data
                  </button>
                  {resultData && (
                    <button
                      className="btn btn-secondary"
                      onClick={handleReset}
                      style={{ fontSize: '12px' }}
                    >
                      <RotateCcw size={14} />
                      Reset Screening
                    </button>
                  )}
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleRunScreening}
                  disabled={!canRun}
                  style={{
                    padding: '12px 28px',
                    fontSize: '15px',
                    borderRadius: '10px',
                    boxShadow: canRun ? '0 0 20px rgba(2, 132, 199, 0.4)' : 'none'
                  }}
                >
                  <Play size={18} fill="#fff" />
                  {isAnalyzing ? 'Running AI Screening...' : 'Run Bilateral AI Screening'}
                </button>
              </div>

              {/* 3. Progress Stepper (Visible while analyzing) */}
              {isAnalyzing && (
                <ProgressStepper progress={progress} />
              )}

              {/* 4. Diagnostic Results & Explainability Hub */}
              {resultData && (
                <ResultsHub
                  resultData={resultData}
                  onSaveVisit={handleSaveVisit}
                  isSaving={isSaving}
                  saveResult={saveResult}
                  onOpenPath={handleOpenPath}
                />
              )}
            </>
          )}

          {activeTab === 'records' && (
            <RecordsView onOpenPath={handleOpenPath} />
          )}

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
