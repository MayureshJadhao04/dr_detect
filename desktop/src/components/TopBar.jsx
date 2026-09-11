import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Building2, Clock } from 'lucide-react';

export default function TopBar({ breadcrumb = 'Screen Patient' }) {
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
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header style={{
      height: '64px',
      background: 'rgba(11, 19, 38, 0.7)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-card)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      flexShrink: 0
    }}>
      {/* Left: Breadcrumbs / Title */}
      <div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
          {breadcrumb}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Clinical AI Triage & Grading · SIH 26038
        </div>
      </div>

      {/* Right: Facility / Operator Metadata */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <Building2 size={14} color="#38bdf8" />
          <span>PHC Center 04</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <User size={14} color="#10b981" />
          <span>Operator Tech</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <Clock size={13} />
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
}
