import React from 'react';
import { CheckCircle2, Wand2, Layers, BrainCircuit, Sparkles, Square } from 'lucide-react';

export default function ProgressStepper({ progress, onStop }) {
  const steps = [
    { id: 1, label: 'CLAHE Enhancement', icon: Wand2, range: [0, 30] },
    { id: 2, label: 'Model 1: DeepLabv3+', icon: Layers, range: [30, 65] },
    { id: 3, label: 'Model 2: ResNet-101', icon: BrainCircuit, range: [65, 85] },
    { id: 4, label: 'Grad-CAM Attention', icon: Sparkles, range: [85, 100] },
  ];

  const currentPercent = progress.percent || 0;

  return (
    <div className="ui-card" style={{ padding: '18px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)' }} className="pulse" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
            Pipeline: {progress.stage || 'Processing...'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
            {currentPercent}%
          </span>
          {onStop && (
            <button
              className="btn btn-danger"
              onClick={onStop}
              style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '6px' }}
              title="Stop current execution"
            >
              <Square size={12} fill="#ffffff" />
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '6px',
        background: '#e2e8f0',
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '16px'
      }}>
        <div style={{
          height: '100%',
          width: `${currentPercent}%`,
          background: 'linear-gradient(90deg, #2563eb 0%, #06b6d4 50%, #10b981 100%)',
          borderRadius: '10px',
          transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 0 8px rgba(37, 99, 235, 0.3)'
        }} />
      </div>

      {/* Step Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {steps.map((s) => {
          const Icon = s.icon;
          const isDone = currentPercent >= s.range[1];
          const isActive = currentPercent >= s.range[0] && currentPercent < s.range[1];

          let iconColor = '#94a3b8';
          let borderColor = 'var(--border-color)';
          let bg = '#ffffff';
          let labelColor = 'var(--text-muted)';

          if (isDone) {
            iconColor = '#16a34a';
            borderColor = '#bbf7d0';
            bg = '#f0fdf4';
            labelColor = '#15803d';
          } else if (isActive) {
            iconColor = '#2563eb';
            borderColor = '#bfdbfe';
            bg = '#eff6ff';
            labelColor = '#1d4ed8';
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
                background: isDone ? '#dcfce7' : isActive ? '#dbeafe' : '#f1f5f9'
              }}>
                {isDone ? <CheckCircle2 size={15} color="#16a34a" /> : <Icon size={15} color={iconColor} />}
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: labelColor, fontWeight: 600 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-light)' }}>
                  {isDone ? 'Done' : isActive ? 'Running...' : 'Waiting'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
