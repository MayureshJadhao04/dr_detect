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
      odColor: '#E7A348',
      osColor: '#EF5B63',
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
      odColor: '#315DAA',
      osColor: '#315DAA',
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
      odColor: '#28A88A',
      osColor: '#315DAA',
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
    <div className="ui-card" style={{ padding: '18px 22px 22px' }}>
      {/* Top Controls Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(180, 192, 210, 0.22)',
        paddingBottom: '14px',
        marginBottom: '14px'
      }}>
        {/* Left Title */}
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#17253D' }}>
          Patient Records
        </h3>

        {/* Right Search & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#EEF3F9',
            boxShadow: 'var(--neu-inset)',
            border: '1px solid rgba(180, 192, 210, 0.30)',
            borderRadius: '12px',
            padding: '6px 14px',
            width: '260px'
          }}>
            <Search size={14} color="#8A98AC" />
            <input
              type="text"
              placeholder="Search by Patient ID or Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12.5px',
                width: '100%',
                fontFamily: 'var(--font-sans)',
                color: '#17253D'
              }}
            />
          </div>

          <button
            className="btn btn-coral"
            onClick={onAddNewPatient}
            style={{ padding: '8px 16px', fontSize: '12.5px' }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Add New Patient
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.30)', boxShadow: 'inset 1px 1px 3px rgba(180, 192, 210, 0.15)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F8FAFD', color: '#60708A', textAlign: 'left', borderBottom: '1px solid rgba(180, 192, 210, 0.20)' }}>
              <th style={{ padding: '11px 14px', fontWeight: 700 }}>Date</th>
              <th style={{ padding: '11px 14px', fontWeight: 700 }}>Patient ID</th>
              <th style={{ padding: '11px 14px', fontWeight: 700 }}>Name</th>
              <th style={{ padding: '11px 14px', fontWeight: 700 }}>Age/Sex</th>
              <th style={{ padding: '11px 14px', fontWeight: 700 }}>Result (OD)</th>
              <th style={{ padding: '11px 14px', fontWeight: 700 }}>Result (OS)</th>
              <th style={{ padding: '11px 14px', fontWeight: 700 }}>Report Sent</th>
              <th style={{ padding: '11px 14px', fontWeight: 700, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => (
              <tr 
                key={idx}
                style={{ 
                  borderBottom: '1px solid #E8EDF4',
                  background: idx % 2 === 0 ? '#F4F7FB' : '#F8FAFD',
                  transition: 'background-color 0.12s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5FA'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#F4F7FB' : '#F8FAFD'}
              >
                <td style={{ padding: '12px 14px', color: '#60708A' }}>{row.date}</td>
                <td style={{ padding: '12px 14px', color: '#17253D', fontWeight: 700 }}>{row.id}</td>
                <td style={{ padding: '12px 14px', color: '#17253D', fontWeight: 600 }}>{row.name}</td>
                <td style={{ padding: '12px 14px', color: '#60708A' }}>{row.ageSex}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: row.odColor || '#17253D' }}>{row.od}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: row.osColor || '#17253D' }}>{row.os}</td>
                <td style={{ padding: '12px 14px' }}>
                  {row.sent === 'Yes' || row.sent === 'Sent' ? (
                    <span style={{ color: '#28A88A', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={13} strokeWidth={2.5} /> Yes
                    </span>
                  ) : String(row.sent).includes('Queued') ? (
                    <span style={{ color: '#C77C22', fontWeight: 600, background: '#FFF1DC', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', display: 'inline-block' }}>
                      Queued (Offline)
                    </span>
                  ) : (
                    <span style={{ color: '#60708A' }}>{row.sent}</span>
                  )}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                  <button
                    onClick={() => onOpenPath(row.pdfPath)}
                    title="View Report PDF"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60708A',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#315DAA'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#60708A'}
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
