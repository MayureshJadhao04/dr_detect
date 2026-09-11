import React, { useState } from 'react';
import { Settings, HardDrive, Shield, Cpu, RefreshCw, CheckCircle2, Activity, Wifi, WifiOff } from 'lucide-react';

export default function SettingsView({ engineStatus, onRestartEngine }) {
  const [pingResult, setPingResult] = useState(null);
  const [isPinging, setIsPinging] = useState(false);

  const handlePing = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      if (window.api && window.api.getEngineStatus) {
        const s = await window.api.getEngineStatus();
        setPingResult({ ok: s.isReady, state: s.state });
      } else {
        // Browser fallback
        await new Promise(r => setTimeout(r, 600));
        setPingResult({ ok: true, state: 'READY (simulated)' });
      }
    } catch {
      setPingResult({ ok: false, state: 'UNREACHABLE' });
    } finally {
      setIsPinging(false);
    }
  };

  const statusColor = {
    BOOTING: '#d97706',
    READY: '#16a34a',
    BUSY: '#2563eb',
    STOPPED: '#dc2626',
    ERROR: '#dc2626',
  }[engineStatus.state] || '#64748b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Settings size={20} color="var(--accent-blue)" />
        <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
          Application & AI Engine Configuration
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* AI Engine Card */}
        <div className="ui-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                MATLAB AI Backend Daemon
              </h3>
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 700,
              color: statusColor,
              background: `${statusColor}15`,
              border: `1px solid ${statusColor}40`,
              padding: '3px 10px',
              borderRadius: '20px'
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: statusColor,
                display: 'inline-block'
              }} />
              {engineStatus.state}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Model 1</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>
                DeepLabv3+ ResNet-18
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Model 2</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>
                Fusion ResNet-101 (Weighted)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>GPU Acceleration</span>
              <span style={{ fontWeight: 600, color: engineStatus.gpuAvailable ? '#16a34a' : '#d97706' }}>
                {engineStatus.gpuAvailable ? 'NVIDIA CUDA Enabled' : 'CPU Fallback'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Communication</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>stdio (JSON-line)</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '18px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <button className="btn btn-outline" onClick={onRestartEngine} style={{ fontSize: '12px', padding: '7px 14px' }}>
              <RefreshCw size={13} />
              Restart Daemon
            </button>
            <button
              className="btn btn-outline"
              onClick={handlePing}
              disabled={isPinging}
              style={{ fontSize: '12px', padding: '7px 14px' }}
            >
              <Activity size={13} />
              {isPinging ? 'Pinging...' : 'Ping Engine'}
            </button>
          </div>

          {pingResult && (
            <div style={{
              marginTop: '10px',
              fontSize: '11.5px',
              padding: '8px 12px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: pingResult.ok ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${pingResult.ok ? '#bbf7d0' : '#fecaca'}`,
              color: pingResult.ok ? '#16a34a' : '#dc2626',
              fontWeight: 600
            }}>
              {pingResult.ok ? <CheckCircle2 size={13} /> : <WifiOff size={13} />}
              Engine: {pingResult.state}
            </div>
          )}
        </div>

        {/* Storage & PHI Card */}
        <div className="ui-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <HardDrive size={16} color="#10b981" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
              Offline Storage & Data Security
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Archive Path</span>
              <code style={{ fontSize: '12px', color: 'var(--text-main)', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                patient_data/
              </code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Report Format</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                Vector PDF (A4) + JSON metadata
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Image Storage</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                Raw + Segmentation masks + Grad-CAM
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Network Mode</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wifi size={13} color="#16a34a" /> Offline-first
              </span>
            </div>
          </div>

          {/* PHI Warning */}
          <div style={{
            marginTop: '18px',
            padding: '12px 14px',
            borderRadius: '8px',
            background: '#fefce8',
            border: '1px solid #fef08a',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <Shield size={16} color="#ca8a04" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e' }}>
                PHI Compliance Notice
              </div>
              <div style={{ fontSize: '11px', color: '#a16207', marginTop: '2px' }}>
                Enable Windows BitLocker on deployment laptop. All patient data stored locally — no cloud upload without explicit operator action.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Info Footer */}
      <div className="ui-card" style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          DR-Detect v1.0.0 · Electron + Vite + React · MATLAB Runtime R2024b
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-light)', fontFamily: 'var(--font-mono)' }}>
          Pipeline: CLAHE → DeepLabv3+ → ResNet-101 → Grad-CAM
        </div>
      </div>
    </div>
  );
}
