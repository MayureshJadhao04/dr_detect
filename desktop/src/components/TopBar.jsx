import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, User } from 'lucide-react';

export default function TopBar({
  title = 'New Screening',
  breadcrumb = 'Bilateral Examination · Automated ICDR 0–4 Severity Grading & Tele-Referral',
  onNavigateTab
}) {
  const [timeStr, setTimeStr] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }));
    };
    updateTime();
    const timer = setInterval(updateTime, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header style={{
      height: '66px',
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      flexShrink: 0,
      userSelect: 'none'
    }}>
      {/* Left: Title & Breadcrumbs */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#17253D', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
          {title}
        </h1>
        <div style={{ fontSize: '12px', color: '#60708A', marginTop: '2px', fontWeight: 500 }}>
          {breadcrumb}
        </div>
      </div>

      {/* Right: Date/Time + Notification Bell + Operator Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Live Date/Time */}
        <div style={{ fontSize: '12.5px', color: '#60708A', fontWeight: 600 }}>
          {timeStr || '16 Sept 2026, 06:45 pm'}
        </div>

        {/* Notification Bell Button */}
        <div
          style={{
            position: 'relative',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#F4F7FB',
            boxShadow: 'var(--neu-flat-sm)',
            border: '1px solid rgba(255, 255, 255, 0.70)',
          }}
          title="Notifications"
        >
          <Bell size={16} color="#60708A" />
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '9px',
            width: '6px',
            height: '6px',
            background: '#EF5B63',
            borderRadius: '50%',
            border: '1.5px solid #ffffff'
          }} />
        </div>

        {/* Operator Profile Card */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              background: '#F4F7FB',
              padding: '5px 14px 5px 6px',
              borderRadius: '10px',
              boxShadow: 'var(--neu-flat-sm)',
              border: '1px solid rgba(255, 255, 255, 0.70)',
              transition: 'all 0.16s ease'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: '#315DAA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}>
              <User size={16} color="#ffffff" />
            </div>

            {/* Label */}
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#17253D', lineHeight: 1.2 }}>
                Operator
              </div>
              <div style={{ fontSize: '10.5px', color: '#8A98AC', fontWeight: 500 }}>
                Administrator
              </div>
            </div>

            <ChevronDown size={14} color="#60708A" style={{ marginLeft: '2px' }} />
          </div>

          {/* Menu Dropdown */}
          {isMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: 0,
                width: '160px',
                background: '#F4F7FB',
                borderRadius: '12px',
                boxShadow: 'var(--neu-flat)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                padding: '6px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
              onMouseLeave={() => setIsMenuOpen(false)}
            >
              <button
                onClick={() => { setIsMenuOpen(false); onNavigateTab?.('settings'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#60708A',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5FA'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
