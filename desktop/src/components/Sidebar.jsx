import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  FileText,
  HeartPulse,
  BarChart3,
  Activity,
  Settings
} from 'lucide-react';
import Logo from './Logo';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'screen', label: 'New Screening', icon: PlusCircle },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'responses', label: 'Doctor Review', icon: HeartPulse },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'model-info', label: 'Model Insights', icon: Activity },
  ];

  const isItemActive = (id) => {
    if (id === 'patients' && (activeTab === 'patients' || activeTab === 'records')) return true;
    return activeTab === id;
  };

  const renderNavButton = (item, isSettings = false) => {
    const Icon = item.icon;
    const isActive = isItemActive(item.id);

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 14px',
          borderRadius: '12px',
          border: isActive
            ? '1px solid #F6C9CD'
            : '1px solid transparent',
          background: isActive
            ? '#FCE1E3'
            : 'transparent',
          boxShadow: isActive
            ? '-2px -2px 6px rgba(255, 255, 255, 0.9), 2px 2px 6px rgba(217, 71, 80, 0.16)'
            : 'none',
          color: isActive ? '#D94750' : '#60708A',
          fontSize: '13px',
          fontWeight: isActive ? 700 : 600,
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          transition: 'all 0.16s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = '#F1F5FA';
            e.currentTarget.style.boxShadow = '-2px -2px 5px rgba(255, 255, 255, 0.9), 2px 2px 5px rgba(180, 192, 210, 0.25)';
            e.currentTarget.style.color = '#17253D';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.color = '#60708A';
          }
        }}
      >
        <div style={{
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          background: isActive ? '#FCE1E3' : 'transparent',
        }}>
          <Icon
            size={17}
            color={isActive ? '#D94750' : '#60708A'}
            strokeWidth={isActive ? 2.4 : 1.9}
          />
        </div>
        <span style={{ flex: 1, letterSpacing: '-0.1px' }}>{item.label}</span>
      </button>
    );
  };

  return (
    <aside style={{
      width: '240px',
      background: '#EEF3F9',
      borderRight: '1px solid rgba(255, 255, 255, 0.85)',
      boxShadow: '4px 0 16px rgba(180, 192, 210, 0.18)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
      userSelect: 'none',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Brand Header */}
      <Logo width={130} />

      {/* Nav List with ~25-30px space after logo */}
      <nav style={{
        flex: 1,
        padding: '0 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 2
      }}>
        {navItems.map(item => renderNavButton(item))}
      </nav>

      {/* Bottom Settings Navigation */}
      <div style={{
        padding: '16px 14px 20px',
        position: 'relative',
        zIndex: 2,
        borderTop: '1px solid #E0E7F0'
      }}>
        {renderNavButton({ id: 'settings', label: 'Settings', icon: Settings }, true)}
      </div>
    </aside>
  );
}
