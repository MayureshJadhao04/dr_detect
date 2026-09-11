import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Download, 
  Sliders, 
  Eye, 
  ExternalLink,
  ShieldAlert,
  FolderOpen
} from 'lucide-react';

export default function ResultsHub({ resultData, onSaveVisit, isSaving, saveResult, onOpenPath }) {
  const [blendOD, setBlendOD] = useState(0.5); // 0 = raw, 1 = heatmap
  const [blendOS, setBlendOS] = useState(0.5);

  if (!resultData) return null;

  const { leftEye, rightEye, overallReferral, isReferable } = resultData;

  const getGradeColor = (grade) => {
    switch (grade) {
      case 0: return '#10b981'; // Emerald
      case 1: return '#0284c7'; // Blue
      case 2: return '#f59e0b'; // Amber
      case 3: return '#ea580c'; // Orange
      case 4: return '#e11d48'; // Crimson
      default: return '#94a3b8';
    }
  };

  const renderRadialGauge = (grade, confidence) => {
    const color = getGradeColor(grade);
    const radius = 38;
    const strokeWidth = 7;
    const circumference = 2 * Math.PI * radius;
    // Map grade 0-4 to 0-100% of circle
    const progressPct = ((grade + 1) / 5) * 100;
    const strokeDashoffset = circumference - (progressPct / 100) * circumference;

    return (
      <div style={{ position: 'relative', width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="transparent"
            stroke="rgba(30, 48, 86, 0.5)"
            strokeWidth={strokeWidth}
          />
          {/* Arc */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
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
    const rawSrc = eye.rawPath ? (eye.rawPath.startsWith('http') ? eye.rawPath : `media://${encodeURIComponent(eye.rawPath)}`) : '';
    const heatSrc = eye.heatmapPath ? (eye.heatmapPath.startsWith('http') ? eye.heatmapPath : `media://${encodeURIComponent(eye.heatmapPath)}`) : '';

    return (
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-card)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
              {title}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Quality: {eye.quality || 'Good'}
            </span>
          </div>
          <span style={{
            background: `${color}22`,
            color: color,
            border: `1px solid ${color}66`,
            borderRadius: '20px',
            padding: '3px 10px',
            fontSize: '11px',
            fontWeight: 700
          }}>
            {eye.referral}
          </span>
        </div>

        {/* Severity Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', background: 'rgba(11, 19, 38, 0.5)', padding: '12px', borderRadius: '10px' }}>
          {renderRadialGauge(eye.predictedGrade, eye.confidence)}
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: color }}>
              {eye.gradeLabel}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Model 2 Softmax Confidence: <strong>{eye.confidence}%</strong>
            </div>
          </div>
        </div>

        {/* Lesions Detected */}
        <div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Detected Biomarkers / Lesions:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {eye.lesionText && eye.lesionText.length > 0 ? (
              eye.lesionText.map((lesion, idx) => (
                <span
                  key={idx}
                  style={{
                    background: lesion.toLowerCase().includes('no significant') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: lesion.toLowerCase().includes('no significant') ? '#34d399' : '#f87171',
                    border: `1px solid ${lesion.toLowerCase().includes('no significant') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  {lesion}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No lesion tags available</span>
            )}
          </div>
        </div>

        {/* Interactive Grad-CAM Heatmap Blending */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sliders size={13} color="var(--accent-cyan)" />
              Grad-CAM Attention Overlay
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {Math.round(blend * 100)}% Heatmap
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={blend}
            onChange={(e) => setBlend(parseFloat(e.target.value))}
            style={{ width: '100%', marginBottom: '10px', accentColor: 'var(--accent-cyan)' }}
          />

          {/* Layered Image Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '220px',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#000',
            border: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Raw fundus image */}
            {rawSrc && (
              <img
                src={rawSrc}
                alt="Raw Fundus"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            )}
            {/* Grad-CAM heatmap overlay */}
            {heatSrc && (
              <img
                src={heatSrc}
                alt="Grad-CAM"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: blend,
                  mixBlendMode: 'screen',
                  pointerEvents: 'none',
                  transition: 'opacity 0.05s ease'
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Referral Decision Banner */}
      <div style={{
        background: isReferable ? 'linear-gradient(90deg, rgba(225, 29, 72, 0.25) 0%, rgba(225, 29, 72, 0.05) 100%)' : 'linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.05) 100%)',
        border: `1px solid ${isReferable ? 'rgba(225, 29, 72, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`,
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: isReferable ? 'rgba(225, 29, 72, 0.3)' : 'rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isReferable ? <ShieldAlert size={22} color="#f43f5e" /> : <CheckCircle2 size={22} color="#10b981" />}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: isReferable ? '#fda4af' : '#6ee7b7' }}>
              {overallReferral}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {isReferable 
                ? 'Action: Patient exhibits referable diabetic retinopathy. Schedule specialist consultation.' 
                : 'Action: No immediate sight-threatening lesions detected. Routine 12-month follow-up.'}
            </div>
          </div>
        </div>

        {/* Save & Export Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {saveResult ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => onOpenPath(saveResult.pdfPath)}
                style={{ fontSize: '13px' }}
              >
                <FileText size={16} color="#38bdf8" />
                View A4 PDF Report
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => onOpenPath(saveResult.visitPath)}
                style={{ fontSize: '13px' }}
              >
                <FolderOpen size={16} />
                Open Visit Folder
              </button>
            </div>
          ) : (
            <button
              className="btn btn-emerald"
              onClick={onSaveVisit}
              disabled={isSaving}
              style={{ fontSize: '13px' }}
            >
              <Download size={16} />
              {isSaving ? 'Generating PDF...' : 'Save & Export Clinical PDF'}
            </button>
          )}
        </div>
      </div>

      {/* Bilateral Comparison Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
        {renderEyePanel('Right Eye (OD)', rightEye, blendOD, setBlendOD)}
        {renderEyePanel('Left Eye (OS)', leftEye, blendOS, setBlendOS)}
      </div>
    </div>
  );
}
