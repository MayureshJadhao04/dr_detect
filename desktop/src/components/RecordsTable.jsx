import React, { useState } from 'react';
import { Search, Plus, Eye, Check } from 'lucide-react';

export default function RecordsTable({ onOpenPath, onAddNewPatient, records: customRecords }) {
  const [searchQuery, setSearchQuery] = useState('');

  const defaultRecords = [
    {
      date: '10 Sep 2026',
      id: 'P-10248',
      name: 'Ramesh Kumar',
      ageSex: '54 / M',
      od: 'Moderate NPDR',
      os: 'Severe NPDR',
      odColor: '#d97706',
      osColor: '#dc2626',
      sent: 'Yes',
      pdfPath: 'D:\\Projects\\dr-screening\\patient_data\\P0001\\visits\\20260911_073000\\report.pdf'
    },
    {
      date: '08 Sep 2026',
      id: 'P-10247',
      name: 'Savitri Devi',
      ageSex: '62 / F',
      od: 'Mild NPDR',
      os: 'Mild NPDR',
      odColor: '#0284c7',
      osColor: '#0284c7',
      sent: 'Yes',
      pdfPath: 'D:\\Projects\\dr-screening\\patient_data\\P10247\\visits\\20260908_141500\\report.pdf'
    },
    {
      date: '05 Sep 2026',
      id: 'P-10246',
      name: 'Arun Patil',
      ageSex: '48 / M',
      od: 'No DR',
      os: 'Mild NPDR',
      odColor: 'var(--text-main)',
      osColor: '#0284c7',
      sent: 'Yes',
      pdfPath: 'D:\\Projects\\dr-screening\\patient_data\\P10246\\visits\\20260905_100000\\report.pdf'
    }
  ];

  const recordsList = customRecords || defaultRecords;

  const filtered = recordsList.filter(r => 
    r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ui-card" style={{ padding: '16px 20px 20px' }}>
      {/* Top Controls Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '12px',
        marginBottom: '14px'
      }}>
        {/* Left Title */}
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
          Patient Records
        </h3>

        {/* Right Search & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '6px 12px',
            width: '260px'
          }}>
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by Patient ID or Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '12.5px',
                width: '100%',
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-main)'
              }}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={onAddNewPatient}
            style={{ padding: '7px 14px', fontSize: '12.5px', borderRadius: '6px' }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Add New Patient
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Patient ID</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Age/Sex</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Result (OD)</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Result (OS)</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Report Sent</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => (
              <tr 
                key={idx}
                style={{ 
                  borderBottom: '1px solid var(--border-light)',
                  transition: 'background-color 0.1s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '12px 14px', color: '#475569' }}>{row.date}</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-main)', fontWeight: 600 }}>{row.id}</td>
                <td style={{ padding: '12px 14px', color: 'var(--text-main)', fontWeight: 600 }}>{row.name}</td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>{row.ageSex}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: row.odColor }}>{row.od}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: row.osColor }}>{row.os}</td>
                <td style={{ padding: '12px 14px' }}>
                  {row.sent === 'Yes' || row.sent === 'Sent' ? (
                    <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Check size={13} strokeWidth={2.5} /> Yes
                    </span>
                  ) : String(row.sent).includes('Queued') ? (
                    <span style={{ color: '#d97706', fontWeight: 600, background: '#fef3c7', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', display: 'inline-block' }}>
                      Queued (Offline)
                    </span>
                  ) : (
                    <span style={{ color: '#64748b' }}>{row.sent}</span>
                  )}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                  <button
                    onClick={() => onOpenPath(row.pdfPath)}
                    title="View Report PDF"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1e40af'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                  >
                    <Eye size={17} />
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
