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
    BOOTING: '#E7A348',
    READY: '#28A88A',
    BUSY: '#315DAA',
    STOPPED: '#EF5B63',
    ERROR: '#EF5B63',
  }[engineStatus.state] || '#60708A';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Settings size={20} color="#315DAA" />
        <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#17253D' }}>
          Application & AI Engine Configuration
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* AI Engine Card */}
        <div className="ui-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="#315DAA" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#17253D' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#60708A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Model 1</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#17253D', fontWeight: 600 }}>
                DeepLabv3+ ResNet-18
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Model 2</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#17253D', fontWeight: 600 }}>
                Fusion ResNet-101 (Weighted)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>GPU Acceleration</span>
              <span style={{ fontWeight: 600, color: engineStatus.gpuAvailable ? '#28A88A' : '#E7A348' }}>
                {engineStatus.gpuAvailable ? 'NVIDIA CUDA Enabled' : 'CPU Fallback'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Communication</span>
              <span style={{ fontWeight: 600, color: '#17253D' }}>stdio (JSON-line)</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '18px', borderTop: '1px solid #E0E7F0', paddingTop: '14px' }}>
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
              background: pingResult.ok ? '#DDF5EE' : '#FCE1E3',
              border: `1px solid ${pingResult.ok ? '#bbf7d0' : '#F6C9CD'}`,
              color: pingResult.ok ? '#28A88A' : '#D94750',
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
            <HardDrive size={16} color="#28A88A" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#17253D' }}>
              Offline Storage & Data Security
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#60708A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Archive Path</span>
              <code style={{ fontSize: '12px', color: '#17253D', background: '#EEF3F9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #E0E7F0' }}>
                patient_data/
              </code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Report Format</span>
              <span style={{ fontWeight: 600, color: '#17253D' }}>
                Vector PDF (A4) + JSON metadata
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Image Storage</span>
              <span style={{ fontWeight: 600, color: '#17253D' }}>
                Raw + Segmentation masks + Grad-CAM
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Network Mode</span>
              <span style={{ fontWeight: 600, color: '#17253D', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wifi size={13} color="#28A88A" /> Offline-first
              </span>
            </div>
          </div>

          {/* PHI Warning */}
          <div style={{
            marginTop: '18px',
            padding: '12px 14px',
            borderRadius: '8px',
            background: '#FFF1DC',
            border: '1px solid #fed7aa',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <Shield size={16} color="#E7A348" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#C77C22' }}>
                PHI Compliance Notice
              </div>
              <div style={{ fontSize: '11px', color: '#C77C22', marginTop: '2px' }}>
                Enable Windows BitLocker on deployment laptop. All patient data stored locally — no cloud upload without explicit operator action.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Info Footer */}
      <div className="ui-card" style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '12px', color: '#60708A' }}>
          DR-Detect v1.0.0 · Electron + Vite + React · MATLAB Runtime R2024b
        </div>
        <div style={{ fontSize: '11px', color: '#8A98AC', fontFamily: 'var(--font-mono)' }}>
          Pipeline: CLAHE → DeepLabv3+ → ResNet-101 → Grad-CAM
        </div>
      </div>
    </div>
  );
}
