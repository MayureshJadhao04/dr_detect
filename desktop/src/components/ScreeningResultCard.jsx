import React from 'react';
import { CheckCircle2, AlertCircle, Send, Play, RefreshCw, FileText, Clock, Square } from 'lucide-react';

export default function ScreeningResultCard({
  resultData,
  isAnalyzing,
  onRunScreening,
  onStopScreening,
  canRun,
  onViewReport,
  isGeneratingPdf,
  onSendToDoctor,
  isSending,
  sendStatus
}) {
  // If not analyzed yet, show pending action card
  if (!resultData && !isAnalyzing) {
    return (
      <div className="ui-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
            Screening Result
          </h2>
          <span style={{
            background: canRun ? '#f1f5f9' : '#fff7ed',
            color: canRun ? '#64748b' : '#c2410c',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600
          }}>
            {canRun ? 'Ready to Analyze' : 'Images Required'}
          </span>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px 12px',
          color: 'var(--text-muted)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <Play size={20} color="#15325b" fill="#15325b" />
          </div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            Ready for Bilateral AI Screening
          </p>
          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '240px' }}>
            {canRun 
              ? 'Click below to execute DeepLabv3+ segmentation and ResNet-101 grading.'
              : 'Please upload both Right Eye (OD) and Left Eye (OS) fundus images to begin.'}
          </p>
        </div>

        {!canRun && (
          <div style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '6px',
            padding: '8px 10px',
            marginBottom: '10px',
            fontSize: '11px',
            color: '#9a3412',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertCircle size={14} color="#ea580c" style={{ flexShrink: 0 }} />
            <span>Upload OD and OS captures to enable screening.</span>
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={onRunScreening}
          disabled={!canRun}
          style={{ width: '100%', padding: '11px', fontSize: '13.5px', marginTop: 'auto' }}
          title={canRun ? 'Run Bilateral AI Analysis' : 'Upload both OD and OS images first'}
        >
          <Play size={16} fill="#ffffff" />
          Run Screening
        </button>
      </div>
    );
  }

  // If analyzing
  if (isAnalyzing) {
    return (
      <div className="ui-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
            Screening Result
          </h2>
          <span style={{
            background: '#fef3c7',
            color: '#b45309',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <RefreshCw size={11} className="spin" />
            Analyzing...
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#15325b', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            AI Engine in Progress
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '240px' }}>
            Running CLAHE, DeepLabv3+ segmentation, and ResNet-101 fusion grading...
          </p>
        </div>

        <button
          className="btn btn-danger"
          onClick={onStopScreening}
          style={{
            width: '100%',
            padding: '11px',
            fontSize: '13.5px',
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          title="Abort AI screening immediately"
        >
          <Square size={14} fill="#ffffff" />
          Stop Screening
        </button>
      </div>
    );
  }

  const { leftEye, rightEye, isReferable } = resultData;

  const getStyleForGrade = (grade) => {
    switch (grade) {
      case 0:
        return { bg: '#f0fdf4', border: '#bbf7d0', textColor: '#16a34a' }; // No DR
      case 1:
        return { bg: '#f0f9ff', border: '#bae6fd', textColor: '#0284c7' }; // Mild
      case 2:
        return { bg: '#fefce8', border: '#fef08a', textColor: '#d97706' }; // Moderate (mockup yellow)
      case 3:
      case 4:
      default:
        return { bg: '#fff1f2', border: '#fecdd3', textColor: '#dc2626' }; // Severe / Prolif (mockup pink)
    }
  };

  const styleOD = getStyleForGrade(rightEye.predictedGrade);
  const styleOS = getStyleForGrade(leftEye.predictedGrade);

  return (
    <div className="ui-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
          Screening Result
        </h2>
        <span style={{
          background: '#dcfce7',
          color: '#15803d',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <CheckCircle2 size={12} color="#15803d" />
          Analysis Complete
        </span>
      </div>

      {/* Right Eye (OD) Card — Styled like the vibrant blue top panel in reference */}
      <div style={{
        background: 'linear-gradient(135deg, #4f5ef7 0%, #3a4ae4 100%)',
        borderRadius: '14px',
        padding: '14px 16px',
        color: '#ffffff',
        boxShadow: '0 6px 20px -4px rgba(79, 94, 247, 0.35)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Subtle decorative bar chart watermark from reference card */}
        <svg
          style={{ position: 'absolute', right: '10px', bottom: '8px', opacity: 0.18, pointerEvents: 'none' }}
          width="80" height="36" viewBox="0 0 90 42" fill="none"
        >
          <rect x="0" y="24" width="4" height="18" rx="2" fill="#ffffff" />
          <rect x="9" y="16" width="4" height="26" rx="2" fill="#ffffff" />
          <rect x="18" y="8" width="4" height="34" rx="2" fill="#ffffff" />
          <rect x="27" y="2" width="4" height="40" rx="2" fill="#ffffff" />
          <rect x="36" y="10" width="4" height="32" rx="2" fill="#ffffff" />
          <rect x="45" y="6" width="4" height="36" rx="2" fill="#ffffff" />
          <rect x="54" y="14" width="4" height="28" rx="2" fill="#ffffff" />
          <rect x="63" y="4" width="4" height="38" rx="2" fill="#ffffff" />
          <rect x="72" y="12" width="4" height="30" rx="2" fill="#ffffff" />
          <rect x="81" y="20" width="4" height="22" rx="2" fill="#ffffff" />
        </svg>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
              Right Eye (OD)
            </div>
            <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.72)', marginTop: '1px' }}>
              Confidence: {rightEye.confidence}%
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.18)',
            border: '1px solid rgba(255, 255, 255, 0.32)',
            borderRadius: '20px',
            padding: '2px 9px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#ffffff',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
          }}>
            <span>Grade {rightEye.predictedGrade}</span>
            <span style={{ opacity: 0.75, fontSize: '9px', fontWeight: 600 }}>ICDR</span>
          </div>
        </div>

        <div style={{ zIndex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px', lineHeight: 1.25 }}>
            {rightEye.gradeLabel.replace(/^Level \d+ - /, '')}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '2px' }}>
            DeepLabv3+ & ResNet-101 Fusion
          </div>
        </div>
      </div>

      {/* Left Eye (OS) Card — Styled like the dark slate charcoal bottom panel in reference */}
      <div style={{
        background: 'linear-gradient(135deg, #525c6a 0%, #3e4652 100%)',
        borderRadius: '14px',
        padding: '14px 16px',
        color: '#ffffff',
        boxShadow: '0 6px 20px -4px rgba(45, 53, 64, 0.32)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Subtle decorative dumbbell graph watermark from reference card */}
        <svg
          style={{ position: 'absolute', right: '12px', bottom: '10px', opacity: 0.22, pointerEvents: 'none' }}
          width="80" height="34" viewBox="0 0 90 38" fill="none"
        >
          <circle cx="6" cy="10" r="3" fill="#ffffff" />
          <line x1="6" y1="10" x2="6" y2="28" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="6" cy="28" r="3" fill="#ffffff" />

          <circle cx="22" cy="6" r="3" fill="#ffffff" />
          <line x1="22" y1="6" x2="22" y2="32" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="22" cy="32" r="3" fill="#ffffff" />

          <circle cx="38" cy="12" r="3" fill="#ffffff" />
          <line x1="38" y1="12" x2="38" y2="26" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="38" cy="26" r="3" fill="#ffffff" />

          <circle cx="54" cy="8" r="3" fill="#ffffff" />
          <line x1="54" y1="8" x2="54" y2="30" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="54" cy="30" r="3" fill="#ffffff" />

          <circle cx="70" cy="14" r="3" fill="#ffffff" />
          <line x1="70" y1="14" x2="70" y2="24" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="70" cy="24" r="3" fill="#ffffff" />

          <circle cx="84" cy="10" r="3" fill="#ffffff" />
          <line x1="84" y1="10" x2="84" y2="28" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="84" cy="28" r="3" fill="#ffffff" />
        </svg>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
              Left Eye (OS)
            </div>
            <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.72)', marginTop: '1px' }}>
              Confidence: {leftEye.confidence}%
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(34, 197, 94, 0.18)',
            border: '1px solid rgba(74, 222, 128, 0.4)',
            borderRadius: '20px',
            padding: '2px 9px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#4ade80',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <span>Grade {leftEye.predictedGrade}</span>
            <span style={{ opacity: 0.85, fontSize: '9px', fontWeight: 600 }}>ICDR</span>
          </div>
        </div>

        <div style={{ zIndex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px', lineHeight: 1.25 }}>
            {leftEye.gradeLabel.replace(/^Level \d+ - /, '')}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '2px' }}>
            DeepLabv3+ & ResNet-101 Fusion
          </div>
        </div>
      </div>

      {/* Referral Banner */}
      <div style={{
        background: isReferable ? 'var(--alert-red-bg)' : '#f0fdf4',
        border: `1px solid ${isReferable ? 'var(--alert-red-border)' : '#bbf7d0'}`,
        borderRadius: '8px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: isReferable ? '#dc2626' : '#16a34a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '12px',
          flexShrink: 0,
          marginTop: '1px'
        }}>
          !
        </div>
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 800, color: isReferable ? '#991b1b' : '#166534' }}>
            {isReferable ? 'Referral Recommended' : 'Routine Follow-up'}
          </div>
          <div style={{ fontSize: '11px', color: isReferable ? '#7f1d1d' : '#15803d', marginTop: '1px' }}>
            {isReferable 
              ? 'At least one eye has more than mild DR.' 
              : 'No sight-threatening retinopathy detected.'}
          </div>
        </div>
      </div>

      {/* Action Buttons: View Report (PDF) & Send Report (Database / Queue) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Button 1: View Report (PDF) */}
          <button
            className="btn btn-outline"
            onClick={onViewReport}
            disabled={isGeneratingPdf}
            style={{ padding: '10px 8px', fontSize: '12.5px', borderRadius: '6px' }}
            title="Inspect A4 Clinical PDF Report"
          >
            <FileText size={15} color="#2563eb" />
            {isGeneratingPdf ? 'Rendering PDF...' : 'View Report'}
          </button>

          {/* Button 2: Send Report (Database / FIFO Queue) */}
          <button
            className="btn"
            onClick={onSendToDoctor}
            disabled={isSending || sendStatus === 'SENT'}
            style={{
              padding: '10px 8px',
              fontSize: '12.5px',
              borderRadius: '6px',
              backgroundColor: sendStatus === 'SENT' ? '#16a34a' : sendStatus === 'QUEUED' ? '#d97706' : 'var(--primary)',
              borderColor: sendStatus === 'SENT' ? '#16a34a' : sendStatus === 'QUEUED' ? '#d97706' : 'var(--primary)',
              color: '#ffffff',
              cursor: sendStatus === 'SENT' ? 'default' : 'pointer'
            }}
            title={sendStatus === 'QUEUED' ? 'Queued offline. Will sync FIFO when online' : 'Push to doctor review database'}
          >
            {sendStatus === 'SENT' ? (
              <>
                <CheckCircle2 size={14} color="#ffffff" />
                Sent to Doctor
              </>
            ) : sendStatus === 'QUEUED' ? (
              <>
                <Clock size={14} color="#ffffff" />
                Queued (Offline)
              </>
            ) : (
              <>
                <Send size={14} />
                {isSending ? 'Pushing...' : 'Send Report'}
              </>
            )}
          </button>
        </div>

        {/* Sync / Queue status feedback banner */}
        {sendStatus === 'QUEUED' && (
          <div style={{
            fontSize: '11px',
            color: '#b45309',
            background: '#fef3c7',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Clock size={13} color="#d97706" style={{ flexShrink: 0 }} />
            <span>Queued in local archive. Auto-syncs FIFO when internet connects.</span>
          </div>
        )}

        {sendStatus === 'SENT' && (
          <div style={{
            fontSize: '11px',
            color: '#15803d',
            background: '#dcfce7',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircle2 size={13} color="#16a34a" style={{ flexShrink: 0 }} />
            <span>Report pushed to central database for doctor review.</span>
          </div>
        )}
      </div>
    </div>
  );
}
