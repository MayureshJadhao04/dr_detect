import React from 'react';
import { FolderClock, FileText, User, ArrowRight, ExternalLink } from 'lucide-react';

export default function RecordsView({ onOpenPath }) {
  // In an offline app, records can be queried or statically listed from the data directory
  const mockVisits = [
    {
      id: 'P0001',
      name: 'Pooja Verma',
      age: 52,
      date: '11 Sep 2026',
      rightGrade: 'Level 2 - Moderate NPDR',
      leftGrade: 'Level 0 - No DR',
      referral: 'REFER',
      pdfPath: 'D:\\Projects\\dr-screening\\patient_data\\P0001\\visits\\test3\\report.pdf'
    },
    {
      id: 'P0003',
      name: 'Anil Deshmukh',
      age: 61,
      date: '10 Sep 2026',
      rightGrade: 'Level 0 - No DR',
      leftGrade: 'Level 1 - Mild NPDR',
      referral: 'Routine Follow-up',
      pdfPath: 'D:\\Projects\\dr-screening\\patient_data\\P0003\\visits\\20260910_112000\\report.pdf'
    }
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderClock size={18} color="var(--accent-cyan)" />
            Local Patient Records & Offline Archive
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Historical visits stored locally in <code>patient_data/</code>. Ready for selective cloud sync.
          </p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '12px 14px' }}>Patient ID</th>
              <th style={{ padding: '12px 14px' }}>Name & Age</th>
              <th style={{ padding: '12px 14px' }}>Screen Date</th>
              <th style={{ padding: '12px 14px' }}>OD (Right Eye)</th>
              <th style={{ padding: '12px 14px' }}>OS (Left Eye)</th>
              <th style={{ padding: '12px 14px' }}>Referral Status</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockVisits.map((v) => (
              <tr 
                key={v.id} 
                style={{ 
                  borderBottom: '1px solid rgba(43, 64, 108, 0.25)',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 26, 49, 0.6)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                  {v.id}
                </td>
                <td style={{ padding: '12px 14px', color: '#f8fafc', fontWeight: 600 }}>
                  {v.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({v.age}y)</span>
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                  {v.date}
                </td>
                <td style={{ padding: '12px 14px', color: '#e2e8f0' }}>
                  {v.rightGrade}
                </td>
                <td style={{ padding: '12px 14px', color: '#e2e8f0' }}>
                  {v.leftGrade}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{
                    background: v.referral === 'REFER' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: v.referral === 'REFER' ? '#f87171' : '#34d399',
                    border: `1px solid ${v.referral === 'REFER' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    borderRadius: '20px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    {v.referral}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => onOpenPath(v.pdfPath)}
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                  >
                    <FileText size={13} />
                    View PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
