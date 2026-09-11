import React, { useState } from 'react';
import { Settings, HardDrive, Shield, Cpu, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function SettingsView({ engineStatus, onRestartEngine }) {
  const [pingResult, setPingResult] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={18} color="var(--accent-cyan)" />
          Application & AI Engine Configuration
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* AI Engine Box */}
          <div style={{ background: 'rgba(11, 19, 38, 0.5)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Cpu size={16} color="#38bdf8" />
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                MATLAB AI Backend Daemon
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>Status: <strong>{engineStatus.state}</strong></div>
              <div>Model 1: <code>model1_final.mat</code> (DeepLabv3+ ResNet-18)</div>
              <div>Model 2: <code>model2_final_weighted.mat</code> (Fusion ResNet-101)</div>
              <div>GPU Support: <strong>{engineStatus.gpuAvailable ? 'NVIDIA RTX Enabled' : 'CPU'}</strong></div>
            </div>
            <div style={{ marginTop: '14px' }}>
              <button className="btn btn-secondary" onClick={onRestartEngine} style={{ fontSize: '12px' }}>
                <RefreshCw size={13} />
                Restart Backend Daemon
              </button>
            </div>
          </div>

          {/* Local Storage & PHI Compliance */}
          <div style={{ background: 'rgba(11, 19, 38, 0.5)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <HardDrive size={16} color="#10b981" />
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                Offline Storage & Data At Rest
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>Archive Path: <code>patient_data/</code></div>
              <div>Export Target: Vector PDF (A4 Portrait) + JSON metadata</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <Shield size={14} color="#f59e0b" />
                <span>PHI Notice: Enable Windows BitLocker on deployment laptop.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
