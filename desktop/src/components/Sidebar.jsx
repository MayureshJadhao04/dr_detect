import React from 'react';
import { Home, User, MessageSquareText, Settings } from 'lucide-react';
import Logo from './Logo';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'screen', label: 'Screen', icon: Home },
    { id: 'records', label: 'Patient Records', icon: User },
    { id: 'responses', label: 'Doctor Responses', icon: MessageSquareText },
  ];

  const renderNavButton = (item, isSettings = false) => {
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
          padding: '11px 16px',
          borderRadius: '12px',
          border: 'none',
          background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
          color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
          fontSize: '13.5px',
          fontWeight: isActive ? 600 : 500,
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          transition: 'all 0.18s ease',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
            e.currentTarget.style.color = '#1e293b';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--sidebar-text)';
          }
        }}
      >
        {isActive && (
          <span style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '4px',
            height: '22px',
            borderRadius: '0 4px 4px 0',
            backgroundColor: 'var(--sidebar-active-accent)',
          }} />
        )}
        <Icon 
          size={18} 
          color={isActive ? 'var(--sidebar-active-accent)' : '#64748b'} 
          strokeWidth={isActive ? 2.2 : 1.8} 
        />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <aside style={{
      width: '230px',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
      userSelect: 'none',
      borderRadius: '18px 0 0 18px',
    }}>
      {/* Brand Header */}
      <div style={{ padding: '24px 20px 22px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Logo size={32} />
        <div>
          <h1 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15, letterSpacing: '-0.2px' }}>
            DR-Detect
          </h1>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
            Early Detection. Better Vision.
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(item => renderNavButton(item))}
      </nav>

      {/* Settings at Bottom */}
      <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border-light)' }}>
        {renderNavButton({ id: 'settings', label: 'Settings', icon: Settings }, true)}
      </div>
    </aside>
  );
}
