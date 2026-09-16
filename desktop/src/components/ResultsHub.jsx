import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  Sliders,
  ShieldAlert,
  FolderOpen
} from 'lucide-react';

export default function ResultsHub({ resultData, onSaveVisit, isSaving, saveResult, onOpenPath }) {
  const [blendOD, setBlendOD] = useState(0.5);
  const [blendOS, setBlendOS] = useState(0.5);

  if (!resultData) return null;

  const { leftEye, rightEye, overallReferral, isReferable } = resultData;

  const getGradeColor = (grade) => {
    switch (grade) {
      case 0: return '#28A88A';
      case 1: return '#315DAA';
      case 2: return '#E7A348';
      case 3: return '#EF5B63';
      case 4: return '#D94750';
      default: return '#8A98AC';
    }
  };

  const getGradeBg = (grade) => {
    switch (grade) {
      case 0: return { bg: '#DDF5EE', border: '#bbf7d0' };
      case 1: return { bg: '#E7EFFC', border: '#bae6fd' };
      case 2: return { bg: '#FFF1DC', border: '#fed7aa' };
      case 3:
      case 4: return { bg: '#FCE1E3', border: '#fecdd3' };
      default: return { bg: '#F8FAFD', border: '#E0E7F0' };
    }
  };

  const renderRadialGauge = (grade, confidence) => {
    const color = getGradeColor(grade);
    const radius = 36;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radius;
    const progressPct = ((grade + 1) / 5) * 100;
    const strokeDashoffset = circumference - (progressPct / 100) * circumference;

    return (
      <div style={{ position: 'relative', width: '88px', height: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="44" cy="44" r={radius} fill="transparent" stroke="#E0E7F0" strokeWidth={strokeWidth} />
          <circle
            cx="44" cy="44" r={radius} fill="transparent"
            stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: color, lineHeight: 1 }}>
            L{grade}
          </div>
          <div style={{ fontSize: '10.5px', color: '#60708A', marginTop: '2px', fontWeight: 600 }}>
            {confidence}%
          </div>
        </div>
      </div>
    );
  };

  const renderEyePanel = (title, eye, blend, setBlend) => {
    const color = getGradeColor(eye.predictedGrade);
    const gradeBg = getGradeBg(eye.predictedGrade);
    const rawSrc = eye.rawPath ? (eye.rawPath.startsWith('http') || eye.rawPath.startsWith('blob:') ? eye.rawPath : `media://${encodeURIComponent(eye.rawPath)}`) : '';
    const heatSrc = eye.heatmapPath ? (eye.heatmapPath.startsWith('http') || eye.heatmapPath.startsWith('blob:') ? eye.heatmapPath : `media://${encodeURIComponent(eye.heatmapPath)}`) : '';

    const isOD = title.includes('OD');

    return (
      <div className="ui-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E0E7F0', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isOD ? '#315DAA' : '#60708A',
              display: 'inline-block',
              flexShrink: 0
            }} />
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#17253D' }}>
                {title}
              </h3>
              <span style={{ fontSize: '11px', color: '#60708A' }}>
                Quality: {eye.quality || 'Good'}
              </span>
            </div>
          </div>
          <span style={{
            background: gradeBg.bg,
            color: color,
            border: `1px solid ${gradeBg.border}`,
            borderRadius: '20px',
            padding: '3px 10px',
            fontSize: '11px',
            fontWeight: 700
          }}>
            {eye.referral}
          </span>
        </div>

        {/* Severity Gauge + Grade Label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: gradeBg.bg,
          border: `1px solid ${gradeBg.border}`,
          padding: '14px',
          borderRadius: '10px'
        }}>
          {renderRadialGauge(eye.predictedGrade, eye.confidence)}
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: color }}>
              {eye.gradeLabel}
            </div>
            <div style={{ fontSize: '11.5px', color: '#60708A', marginTop: '4px' }}>
              Model 2 Softmax Confidence: <strong style={{ color: '#17253D' }}>{eye.confidence}%</strong>
            </div>
          </div>
        </div>

        {/* Lesion Tags */}
        <div>
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#60708A', display: 'block', marginBottom: '6px' }}>
            Detected Biomarkers / Lesions:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {eye.lesionText && eye.lesionText.length > 0 ? (
              eye.lesionText.map((lesion, idx) => {
                const isNormal = lesion.toLowerCase().includes('no significant') || lesion.toLowerCase().includes('none');
                return (
                  <span
                    key={idx}
                    style={{
                      background: isNormal ? '#DDF5EE' : '#FCE1E3',
                      color: isNormal ? '#28A88A' : '#D94750',
                      border: `1px solid ${isNormal ? '#bbf7d0' : '#F6C9CD'}`,
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    {lesion}
                  </span>
                );
              })
            ) : (
              <span style={{ fontSize: '11px', color: '#8A98AC' }}>No lesion tags available</span>
            )}
          </div>
        </div>

        {/* Grad-CAM Heatmap Blending */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#17253D', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sliders size={13} color="#315DAA" />
              Grad-CAM Attention Overlay
            </span>
            <span style={{ fontSize: '11px', color: '#60708A', fontFamily: 'var(--font-mono)' }}>
              {Math.round(blend * 100)}% Heatmap
            </span>
          </div>

          <input
            type="range"
            min="0" max="1" step="0.02"
            value={blend}
            onChange={(e) => setBlend(parseFloat(e.target.value))}
            style={{ width: '100%', marginBottom: '8px', accentColor: '#315DAA' }}
          />

          {/* Layered Image Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '200px',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#000000',
            border: '1px solid #E0E7F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {rawSrc && (
              <img
                src={rawSrc}
                alt="Raw Fundus"
                style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )}
            {heatSrc && (
              <img
                src={heatSrc}
                alt="Grad-CAM"
                style={{
                  position: 'absolute', width: '100%', height: '100%', objectFit: 'contain',
                  opacity: blend, mixBlendMode: 'screen', pointerEvents: 'none',
                  transition: 'opacity 0.05s ease'
                }}
              />
            )}
            {!rawSrc && !heatSrc && (
              <span style={{ fontSize: '12px', color: '#60708A' }}>Heatmap images will appear after engine analysis</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Referral Decision Banner */}
      <div className="ui-card" style={{
        padding: '16px 20px',
        background: isReferable ? '#FCE1E3' : '#DDF5EE',
        border: `1px solid ${isReferable ? '#F6C9CD' : '#bbf7d0'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: isReferable ? '#EF5B63' : '#28A88A',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {isReferable ? <ShieldAlert size={20} color="#ffffff" /> : <CheckCircle2 size={20} color="#ffffff" />}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: isReferable ? '#D94750' : '#28A88A' }}>
              {overallReferral}
            </div>
            <div style={{ fontSize: '12px', color: isReferable ? '#D94750' : '#28A88A', marginTop: '1px', opacity: 0.9 }}>
              {isReferable
                ? 'Patient exhibits referable DR. Schedule specialist consultation.'
                : 'No sight-threatening lesions. Routine 12-month follow-up.'}
            </div>
          </div>
        </div>

        {/* Save & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {saveResult ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" onClick={() => onOpenPath(saveResult.pdfPath)} style={{ fontSize: '12px' }}>
                <FileText size={14} color="#315DAA" />
                View PDF
              </button>
              <button className="btn btn-outline" onClick={() => onOpenPath(saveResult.visitPath)} style={{ fontSize: '12px' }}>
                <FolderOpen size={14} color="#60708A" />
                Open Folder
              </button>
            </div>
          ) : (
            <button className="btn btn-success" onClick={onSaveVisit} disabled={isSaving} style={{ fontSize: '12.5px' }}>
              <Download size={15} />
              {isSaving ? 'Generating...' : 'Save & Export PDF'}
            </button>
          )}
        </div>
      </div>

      {/* Bilateral Comparison Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {renderEyePanel('Right Eye (OD)', rightEye, blendOD, setBlendOD)}
        {renderEyePanel('Left Eye (OS)', leftEye, blendOS, setBlendOS)}
      </div>
    </div>
  );
}
