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
      case 0: return '#10b981';
      case 1: return '#0284c7';
      case 2: return '#d97706';
      case 3: return '#ea580c';
      case 4: return '#dc2626';
      default: return '#94a3b8';
    }
  };

  const getGradeBg = (grade) => {
    switch (grade) {
      case 0: return { bg: '#f0fdf4', border: '#bbf7d0' };
      case 1: return { bg: '#f0f9ff', border: '#bae6fd' };
      case 2: return { bg: '#fefce8', border: '#fef08a' };
      case 3: return { bg: '#fff7ed', border: '#fed7aa' };
      case 4: return { bg: '#fef2f2', border: '#fecaca' };
      default: return { bg: '#f8fafc', border: '#e2e8f0' };
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
          <circle cx="44" cy="44" r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth={strokeWidth} />
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
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isOD ? '#4f5ef7' : '#525c6a',
              display: 'inline-block',
              flexShrink: 0
            }} />
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                {title}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Quality: {eye.quality || 'Good'}
              </span>
            </div>
          </div>
          <span style={{
            background: `${color}15`,
            color: color,
            border: `1px solid ${color}40`,
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
            <div style={{ fontSize: '14px', fontWeight: 800, color: color }}>
              {eye.gradeLabel}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Model 2 Softmax Confidence: <strong style={{ color: 'var(--text-main)' }}>{eye.confidence}%</strong>
            </div>
          </div>
        </div>

        {/* Lesion Tags */}
        <div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
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
                      background: isNormal ? '#f0fdf4' : '#fef2f2',
                      color: isNormal ? '#16a34a' : '#dc2626',
                      border: `1px solid ${isNormal ? '#bbf7d0' : '#fecaca'}`,
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
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No lesion tags available</span>
            )}
          </div>
        </div>

        {/* Grad-CAM Heatmap Blending */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sliders size={13} color="var(--accent-blue)" />
              Grad-CAM Attention Overlay
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {Math.round(blend * 100)}% Heatmap
            </span>
          </div>

          <input
            type="range"
            min="0" max="1" step="0.02"
            value={blend}
            onChange={(e) => setBlend(parseFloat(e.target.value))}
            style={{ width: '100%', marginBottom: '8px', accentColor: 'var(--accent-blue)' }}
          />

          {/* Layered Image Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '200px',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#000',
            border: '1px solid var(--border-color)',
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
              <span style={{ fontSize: '12px', color: '#64748b' }}>Heatmap images will appear after engine analysis</span>
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
        background: isReferable ? '#fef2f2' : '#f0fdf4',
        border: `1px solid ${isReferable ? '#fecaca' : '#bbf7d0'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: isReferable ? '#fee2e2' : '#dcfce7',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {isReferable ? <ShieldAlert size={20} color="#dc2626" /> : <CheckCircle2 size={20} color="#16a34a" />}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: isReferable ? '#991b1b' : '#166534' }}>
              {overallReferral}
            </div>
            <div style={{ fontSize: '12px', color: isReferable ? '#b91c1c' : '#15803d', marginTop: '1px' }}>
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
                <FileText size={14} color="#2563eb" />
                View PDF
              </button>
              <button className="btn btn-outline" onClick={() => onOpenPath(saveResult.visitPath)} style={{ fontSize: '12px' }}>
                <FolderOpen size={14} />
                Open Folder
              </button>
            </div>
          ) : (
            <button className="btn btn-emerald" onClick={onSaveVisit} disabled={isSaving} style={{ fontSize: '12.5px' }}>
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
