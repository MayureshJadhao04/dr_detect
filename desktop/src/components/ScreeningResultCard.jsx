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
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#17253D' }}>
            Screening Result
          </h2>
          <span style={{
            background: canRun ? '#DDF5EE' : '#FFF1DC',
            color: canRun ? '#28A88A' : '#C77C22',
            border: canRun ? '1px solid #bbf7d0' : '1px solid #fed7aa',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700
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
          color: '#8A98AC'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: '#F7F9FC',
            boxShadow: '-4px -4px 9px rgba(255,255,255,0.9), 4px 4px 9px rgba(180,190,205,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            border: '1px solid rgba(255, 255, 255, 0.85)'
          }}>
            <Play size={20} color="#315DAA" fill="#315DAA" />
          </div>
          <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#17253D' }}>
            Ready for Bilateral AI Screening
          </p>
          <p style={{ fontSize: '12px', color: '#60708A', marginTop: '4px', maxWidth: '240px', lineHeight: 1.4 }}>
            {canRun 
              ? 'Click below to execute DeepLabv3+ segmentation and ResNet-101 grading.'
              : 'Please upload both Right Eye (OD) and Left Eye (OS) fundus images to begin.'}
          </p>
        </div>

        {!canRun && (
          <div style={{
            background: '#FFF1DC',
            border: '1px solid #fed7aa',
            borderRadius: '8px',
            padding: '8px 10px',
            marginBottom: '12px',
            fontSize: '11.5px',
            color: '#C77C22',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={15} color="#E7A348" style={{ flexShrink: 0 }} />
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
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#17253D' }}>
            Screening Result
          </h2>
          <span style={{
            background: '#FFF1DC',
            color: '#C77C22',
            border: '1px solid #fed7aa',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <RefreshCw size={11} className="spin" />
            Analyzing...
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #E0E7F0', borderTopColor: '#315DAA', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#17253D' }}>
            AI Engine in Progress
          </p>
          <p style={{ fontSize: '11.5px', color: '#60708A', textAlign: 'center', maxWidth: '240px', lineHeight: 1.4 }}>
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
        return { bg: '#DDF5EE', border: '#bbf7d0', textColor: '#28A88A' }; // No DR
      case 1:
        return { bg: '#E7EFFC', border: '#bae6fd', textColor: '#315DAA' }; // Mild
      case 2:
        return { bg: '#FFF1DC', border: '#fed7aa', textColor: '#E7A348' }; // Moderate
      case 3:
      case 4:
      default:
        return { bg: '#FCE1E3', border: '#fecdd3', textColor: '#EF5B63' }; // Severe / Prolif
    }
  };

  const styleOD = getStyleForGrade(rightEye.predictedGrade);
  const styleOS = getStyleForGrade(leftEye.predictedGrade);

  return (
    <div className="ui-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#17253D' }}>
          Screening Result
        </h2>
        <span style={{
          background: '#DDF5EE',
          color: '#28A88A',
          border: '1px solid #bbf7d0',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <CheckCircle2 size={12} color="#28A88A" />
          Analysis Complete
        </span>
      </div>

      {/* Right Eye (OD) Card */}
      <div className="neu-card-sm" style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#17253D' }}>
              Right Eye (OD)
            </div>
            <div style={{ fontSize: '11px', color: '#60708A', marginTop: '1px' }}>
              Confidence: {rightEye.confidence}%
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: styleOD.bg,
            border: `1px solid ${styleOD.border}`,
            borderRadius: '20px',
            padding: '2px 9px',
            fontSize: '11px',
            fontWeight: 700,
            color: styleOD.textColor,
          }}>
            <span>Grade {rightEye.predictedGrade}</span>
            <span style={{ opacity: 0.8, fontSize: '9px', fontWeight: 600 }}>ICDR</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: styleOD.textColor, letterSpacing: '-0.2px', lineHeight: 1.25 }}>
            {rightEye.gradeLabel.replace(/^Level \d+ - /, '')}
          </div>
          <div style={{ fontSize: '10.5px', color: '#8A98AC', marginTop: '2px' }}>
            DeepLabv3+ & ResNet-101 Fusion
          </div>
        </div>
      </div>

      {/* Left Eye (OS) Card */}
      <div className="neu-card-sm" style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#17253D' }}>
              Left Eye (OS)
            </div>
            <div style={{ fontSize: '11px', color: '#60708A', marginTop: '1px' }}>
              Confidence: {leftEye.confidence}%
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: styleOS.bg,
            border: `1px solid ${styleOS.border}`,
            borderRadius: '20px',
            padding: '2px 9px',
            fontSize: '11px',
            fontWeight: 700,
            color: styleOS.textColor,
          }}>
            <span>Grade {leftEye.predictedGrade}</span>
            <span style={{ opacity: 0.8, fontSize: '9px', fontWeight: 600 }}>ICDR</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: styleOS.textColor, letterSpacing: '-0.2px', lineHeight: 1.25 }}>
            {leftEye.gradeLabel.replace(/^Level \d+ - /, '')}
          </div>
          <div style={{ fontSize: '10.5px', color: '#8A98AC', marginTop: '2px' }}>
            DeepLabv3+ & ResNet-101 Fusion
          </div>
        </div>
      </div>

      {/* Referral Banner */}
      <div style={{
        background: isReferable ? '#FCE1E3' : '#DDF5EE',
        border: `1px solid ${isReferable ? '#F6C9CD' : '#bbf7d0'}`,
        borderRadius: '10px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: isReferable ? '#EF5B63' : '#28A88A',
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
          <div style={{ fontSize: '12.5px', fontWeight: 800, color: isReferable ? '#D94750' : '#28A88A' }}>
            {isReferable ? 'Referral Recommended' : 'Routine Follow-up'}
          </div>
          <div style={{ fontSize: '11px', color: isReferable ? '#D94750' : '#28A88A', marginTop: '1px', opacity: 0.9 }}>
            {isReferable 
              ? 'At least one eye has more than mild DR.' 
              : 'No sight-threatening retinopathy detected.'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Button 1: View Report (PDF) */}
          <button
            className="btn btn-outline"
            onClick={onViewReport}
            disabled={isGeneratingPdf}
            style={{ padding: '10px 8px', fontSize: '12px', borderRadius: '8px' }}
            title="Inspect A4 Clinical PDF Report"
          >
            <FileText size={15} color="#315DAA" />
            {isGeneratingPdf ? 'Rendering PDF...' : 'View Report'}
          </button>

          {/* Button 2: Send Report (Database / FIFO Queue) */}
          <button
            className="btn"
            onClick={onSendToDoctor}
            disabled={isSending || sendStatus === 'SENT'}
            style={{
              padding: '10px 8px',
              fontSize: '12px',
              borderRadius: '8px',
              backgroundColor: sendStatus === 'SENT' ? '#28A88A' : sendStatus === 'QUEUED' ? '#E7A348' : '#315DAA',
              borderColor: sendStatus === 'SENT' ? '#28A88A' : sendStatus === 'QUEUED' ? '#E7A348' : '#315DAA',
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
            color: '#C77C22',
            background: '#FFF1DC',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #fed7aa',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Clock size={13} color="#E7A348" style={{ flexShrink: 0 }} />
            <span>Queued in local archive. Auto-syncs FIFO when internet connects.</span>
          </div>
        )}

        {sendStatus === 'SENT' && (
          <div style={{
            fontSize: '11px',
            color: '#28A88A',
            background: '#DDF5EE',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircle2 size={13} color="#28A88A" style={{ flexShrink: 0 }} />
            <span>Report pushed to central database for doctor review.</span>
          </div>
        )}
      </div>
    </div>
  );
}
