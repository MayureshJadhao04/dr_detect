import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, Search } from 'lucide-react';

export default function TopBar({
  title = 'Diabetic Retinopathy Screening & Triage',
  breadcrumb = 'Bilateral Examination · Automated ICDR 0–4 Severity Grading & Tele-Referral'
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleDateString('en-GB', {
        day: '2-digit',
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
      flexShrink: 0
    }}>
      {/* Left: Title & Breadcrumbs */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
          {title}
        </h1>
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
          {breadcrumb}
        </div>
      </div>

      {/* Center: Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#ffffff',
        borderRadius: '12px',
        padding: '8px 16px',
        width: '280px',
        boxShadow: '0 1px 6px rgba(26, 31, 55, 0.06)',
      }}>
        <Search size={15} color="#9ba2c0" />
        <input
          type="text"
          placeholder="Search..."
          style={{
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            width: '100%',
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-main)',
            background: 'transparent',
          }}
        />
      </div>

      {/* Right: Date/Time + Notification + Operator Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {timeStr || '10 Sep 2026, 11:24 AM'}
        </div>

        {/* Bell Icon */}
        <div style={{
          position: 'relative',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: '#ffffff',
          boxShadow: '0 1px 4px rgba(26, 31, 55, 0.06)',
        }}>
          <Bell size={17} color="#6b7194" />
          <span style={{
            position: 'absolute',
            top: '6px',
            right: '8px',
            width: '7px',
            height: '7px',
            background: '#ef4444',
            borderRadius: '50%',
            border: '1.5px solid #ffffff'
          }} />
        </div>

        {/* Operator Profile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          background: '#ffffff',
          padding: '6px 14px 6px 6px',
          borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(26, 31, 55, 0.06)',
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #5b6abf, #7c8cf5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
              Operator
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Administrator
            </div>
          </div>
          <ChevronDown size={14} color="#9ba2c0" />
        </div>
      </div>
    </header>
  );
}
