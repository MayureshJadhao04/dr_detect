import React from 'react';
import { Wand2, Layers, BrainCircuit, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ProgressStepper({ progress }) {
  const steps = [
    { id: 1, label: 'Camera Enhancement', icon: Wand2, range: [0, 30] },
    { id: 2, label: 'Model 1 Segmentation', icon: Layers, range: [30, 65] },
    { id: 3, label: 'Model 2 Severity', icon: BrainCircuit, range: [65, 85] },
    { id: 4, label: 'Grad-CAM Attention', icon: Sparkles, range: [85, 100] },
  ];

  const currentPercent = progress.percent || 0;

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)' }} className="pulse" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
            Pipeline Status: {progress.stage || 'Processing...'}
          </span>
        </div>
        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
          {currentPercent}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div style={{
        height: '6px',
        background: 'rgba(30, 48, 86, 0.5)',
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div style={{
          height: '100%',
          width: `${currentPercent}%`,
          background: 'linear-gradient(90deg, #0284c7 0%, #06b6d4 50%, #10b981 100%)',
          borderRadius: '10px',
          transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 0 12px rgba(6, 182, 212, 0.6)'
        }} />
      </div>

      {/* Steps List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {steps.map((s) => {
          const Icon = s.icon;
          const isDone = currentPercent >= s.range[1];
          const isActive = currentPercent >= s.range[0] && currentPercent < s.range[1];

          let iconColor = '#64748b';
          let borderColor = 'var(--border-card)';
          let bg = 'rgba(11, 19, 38, 0.4)';

          if (isDone) {
            iconColor = '#10b981';
            borderColor = 'rgba(16, 185, 129, 0.4)';
            bg = 'rgba(16, 185, 129, 0.08)';
          } else if (isActive) {
            iconColor = '#38bdf8';
            borderColor = 'rgba(56, 189, 248, 0.6)';
            bg = 'rgba(56, 189, 248, 0.12)';
          }

          return (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                background: bg,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDone ? 'rgba(16, 185, 129, 0.2)' : isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 48, 86, 0.4)'
              }}>
                {isDone ? <CheckCircle2 size={16} color="#10b981" /> : <Icon size={16} color={iconColor} />}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: isDone || isActive ? '#f8fafc' : 'var(--text-muted)', fontWeight: 600 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {isDone ? 'Completed' : isActive ? 'Analyzing...' : 'Waiting'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
