import React from 'react';
import { 
  Eye, 
  FileText, 
  FolderClock, 
  Settings, 
  Cpu, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  WifiOff
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, engineStatus, onRestartEngine }) {
  const navItems = [
    { id: 'screen', label: 'Screen Patient', icon: Eye },
    { id: 'records', label: 'Patient Records', icon: FolderClock },
    { id: 'settings', label: 'Settings & Storage', icon: Settings },
  ];

  const getStatusDisplay = () => {
    switch (engineStatus.state) {
      case 'READY':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          dot: 'bg-emerald-400',
          label: 'AI Engine Ready',
          sub: engineStatus.gpuAvailable ? 'NVIDIA GPU Accelerated' : 'CPU Mode',
        };
      case 'BOOTING':
        return {
          icon: RefreshCw,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/30',
          dot: 'bg-amber-400 pulse',
          label: 'Booting Engine...',
          sub: 'Warming MCR & Models',
        };
      case 'CRASHED':
      default:
        return {
          icon: AlertCircle,
          color: 'text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/30',
          dot: 'bg-rose-400',
          label: 'Engine Dropped',
          sub: 'Click to restart',
        };
    }
  };

  const status = getStatusDisplay();
  const StatusIcon = status.icon;

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-card)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
          }}>
            <Eye size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px', color: '#fff' }}>
              DR Screen
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Rural Retinopathy AI
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0.05) 100%)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} color={isActive ? '#38bdf8' : '#94a3b8'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Offline Mode Indicator */}
      <div style={{ padding: '12px 16px', margin: '0 12px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <WifiOff size={14} color="#94a3b8" />
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            100% Offline Mode
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            On-device local inference
          </div>
        </div>
      </div>

      {/* AI Engine Status Card */}
      <div style={{ padding: '14px', margin: '0 12px 16px', background: 'rgba(16, 26, 49, 0.85)', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: engineStatus.state === 'READY' ? '#10b981' : engineStatus.state === 'BOOTING' ? '#f59e0b' : '#f43f5e' }} className={engineStatus.state === 'BOOTING' ? 'pulse' : ''} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
              {status.label}
            </span>
          </div>
          {engineStatus.state === 'CRASHED' && (
            <button 
              onClick={onRestartEngine}
              style={{ background: 'rgba(244, 63, 94, 0.2)', border: '1px solid #f43f5e', color: '#f43f5e', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}
            >
              Restart
            </button>
          )}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Cpu size={12} />
          <span>{status.sub}</span>
        </div>
      </div>
    </aside>
  );
}
