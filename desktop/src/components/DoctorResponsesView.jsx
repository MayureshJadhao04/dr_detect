import React, { useState } from 'react';
import { Search, MessageSquareText, CheckCircle2, Clock, AlertTriangle, ChevronDown, CheckCheck } from 'lucide-react';

export function isSevereCase(row) {
  if (row.isSevere !== undefined) return row.isSevere;
  if (row.odNumericGrade >= 3 || row.osNumericGrade >= 3) return true;
  const severeKeywords = ['severe', 'proliferative', 'pdr', 'level 3', 'level 4'];
  const text = `${row.odGrade || ''} ${row.osGrade || ''}`.toLowerCase();
  return severeKeywords.some(kw => text.includes(kw));
}

const DEFAULT_RESPONSES = [
  {
    date: '11 Sep 2026',
    patientId: 'P-10248',
    patientName: 'Ramesh Kumar',
    ageSex: '54 / M',
    odGrade: 'Moderate NPDR',
    osGrade: 'Severe NPDR',
    odNumericGrade: 2,
    osNumericGrade: 3,
    status: 'ACTION_REQUIRED',
    isSevere: true,
    doctorName: 'Dr. Sanjay Mehta (Retina Consultant)',
    doctorNotes: 'URGENT ATTENTION REQUIRED: Severe NPDR identified in Left Eye (OS). Venous beading and extensive hemorrhages. Recommend urgent panretinal photocoagulation (PRP) laser and FFA within 2 weeks to prevent vitreous bleeding.',
    reviewDate: '11 Sep 2026, 2:45 PM',
  },
  {
    date: '10 Sep 2026',
    patientId: 'P-10247',
    patientName: 'Savitri Devi',
    ageSex: '62 / F',
    odGrade: 'Mild NPDR',
    osGrade: 'Mild NPDR',
    odNumericGrade: 1,
    osNumericGrade: 1,
    status: 'REVIEWED',
    isSevere: false,
    doctorName: 'Dr. Sanjay Mehta',
    doctorNotes: 'Bilateral mild NPDR confirmed (microaneurysms only). Continue glycemic and blood pressure control. Re-screen in 6 months.',
    reviewDate: '10 Sep 2026, 5:10 PM',
  },
  {
    date: '08 Sep 2026',
    patientId: 'P-10246',
    patientName: 'Arun Patil',
    ageSex: '48 / M',
    odGrade: 'No DR',
    osGrade: 'Mild NPDR',
    odNumericGrade: 0,
    osNumericGrade: 1,
    status: 'PENDING',
    isSevere: false,
    doctorName: null,
    doctorNotes: null,
    reviewDate: null,
  },
  {
    date: '05 Sep 2026',
    patientId: 'P-10245',
    patientName: 'Meera Joshi',
    ageSex: '71 / F',
    odGrade: 'Severe NPDR',
    osGrade: 'PDR',
    odNumericGrade: 3,
    osNumericGrade: 4,
    status: 'ACTION_REQUIRED',
    isSevere: true,
    doctorName: 'Dr. Priya Kapoor (Vitreoretinal Surgeon)',
    doctorNotes: 'EMERGENCY ATTENTION REQUIRED: Active neovascularization of the disc (NVD) OS, Severe NPDR OD. High risk of tractional retinal detachment. Immediate vitreo-retinal referral. Intravitreal anti-VEGF injection scheduled.',
    reviewDate: '06 Sep 2026, 9:30 AM',
  },
];

const statusConfig = {
  REVIEWED: { label: 'Reviewed', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: CheckCircle2 },
  PENDING: { label: 'Pending Review', color: '#d97706', bg: '#fefce8', border: '#fef08a', icon: Clock },
  ACTION_REQUIRED: { label: 'Attention Required', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: AlertTriangle },
};

export default function DoctorResponsesView({ onOpenPath, responses: customResponses, onUpdateResponses }) {
  const [internalResponses, setInternalResponses] = useState(() => {
    try {
      const saved = localStorage.getItem('dr_doctor_responses');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_RESPONSES;
  });

  const responses = customResponses || internalResponses;
  const updateList = (newItems) => {
    if (onUpdateResponses) onUpdateResponses(newItems);
    else {
      setInternalResponses(newItems);
      try {
        localStorage.setItem('dr_doctor_responses', JSON.stringify(newItems));
      } catch {}
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  // Toggle status for attention required items
  const handleResolveAttention = (patientId) => {
    const updated = responses.map(r => {
      if (r.patientId === patientId) {
        const nextStatus = r.status === 'ACTION_REQUIRED' ? 'REVIEWED' : 'ACTION_REQUIRED';
        return {
          ...r,
          status: nextStatus,
          doctorNotes: nextStatus === 'REVIEWED' 
            ? `${r.doctorNotes}\n\n[CLINICIAN UPDATE: Attention item addressed & specialist appointment confirmed.]`
            : r.doctorNotes
        };
      }
      return r;
    });
    updateList(updated);
  };

  const filtered = responses.filter(r => {
    const matchesSearch =
      r.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const counts = {
    ALL: responses.length,
    REVIEWED: responses.filter(r => r.status === 'REVIEWED').length,
    PENDING: responses.filter(r => r.status === 'PENDING').length,
    ACTION_REQUIRED: responses.filter(r => r.status === 'ACTION_REQUIRED' || (isSevereCase(r) && r.status !== 'REVIEWED')).length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { key: 'ALL', label: 'Total Sent', color: 'var(--accent-blue)', bg: '#eff6ff', border: '#bfdbfe' },
          { key: 'REVIEWED', label: 'Reviewed', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
          { key: 'PENDING', label: 'Pending', color: '#d97706', bg: '#fefce8', border: '#fef08a' },
          { key: 'ACTION_REQUIRED', label: 'Attention Required (Grade 3/4)', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className="ui-card"
            style={{
              padding: '14px 18px',
              cursor: 'pointer',
              border: filterStatus === s.key ? `2px solid ${s.color}` : '1px solid var(--border-color)',
              background: filterStatus === s.key ? s.bg : 'var(--card-bg)',
              transition: 'all 0.15s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>
              {counts[s.key]}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
              {s.label}
            </div>
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="ui-card" style={{ padding: '16px 20px 20px' }}>
        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquareText size={16} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
              Doctor Feedback & Annotations
            </h3>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#ffffff', border: '1px solid var(--border-color)',
            borderRadius: '6px', padding: '6px 12px', width: '260px'
          }}>
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by Patient ID or Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none', outline: 'none', fontSize: '12.5px', width: '100%',
                fontFamily: 'var(--font-sans)', color: 'var(--text-main)'
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Date Sent</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Patient</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>OD / OS</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Reviewing Doctor</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                const sc = statusConfig[row.status];
                const StatusIcon = sc.icon;
                const isExpanded = expandedId === row.patientId + row.date;

                return (
                  <React.Fragment key={idx}>
                    <tr
                      style={{
                        borderBottom: isExpanded ? 'none' : '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease'
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : row.patientId + row.date)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{row.date}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{row.patientName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.patientId} · {row.ageSex}</div>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {row.odGrade} / {row.osGrade}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: sc.bg, color: sc.color,
                            border: `1px solid ${sc.border}`,
                            padding: '3px 10px', borderRadius: '20px',
                            fontSize: '11px', fontWeight: 700
                          }}>
                            <StatusIcon size={12} />
                            {sc.label}
                          </span>
                          {isSevereCase(row) && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#b91c1c',
                              background: '#fee2e2',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              Severe Case (Grade 3/4)
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-main)', fontWeight: 500 }}>
                        {row.doctorName || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <ChevronDown
                          size={16}
                          color="#94a3b8"
                          style={{
                            transition: 'transform 0.2s ease',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)'
                          }}
                        />
                      </td>
                    </tr>

                    {/* Expanded Doctor Notes */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="6" style={{ padding: '0 14px 14px', borderBottom: '1px solid var(--border-light)' }}>
                          <div style={{
                            background: row.status === 'ACTION_REQUIRED' ? '#fef2f2' : '#f8fafc',
                            border: `1px solid ${row.status === 'ACTION_REQUIRED' ? '#fecaca' : 'var(--border-color)'}`,
                            borderRadius: '8px',
                            padding: '14px 18px'
                          }}>
                            {row.doctorNotes ? (
                              <>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                                  Doctor's Notes · {row.reviewDate}
                                </div>
                                <div style={{
                                  fontSize: '13px',
                                  color: row.status === 'ACTION_REQUIRED' ? '#991b1b' : 'var(--text-main)',
                                  fontWeight: row.status === 'ACTION_REQUIRED' ? 600 : 400,
                                  lineHeight: 1.5,
                                  whiteSpace: 'pre-line'
                                }}>
                                  {row.doctorNotes}
                                </div>

                                {row.status === 'ACTION_REQUIRED' ? (
                                  <div style={{
                                    marginTop: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderTop: '1px solid #fecaca',
                                    paddingTop: '10px'
                                  }}>
                                    <span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 600 }}>
                                      ⚠️ Sight-threatening case flagged by AI triage engine (Grade 3/4). Immediate referral recommended.
                                    </span>
                                    <button
                                      className="btn btn-outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleResolveAttention(row.patientId);
                                      }}
                                      style={{
                                        padding: '5px 12px',
                                        fontSize: '11.5px',
                                        borderRadius: '6px',
                                        background: '#ffffff',
                                        color: '#16a34a',
                                        borderColor: '#86efac'
                                      }}
                                    >
                                      <CheckCheck size={13} color="#16a34a" />
                                      Mark Intervention Handled
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle2 size={13} color="#16a34a" />
                                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                                      Clinical status verified.
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Awaiting doctor review. Report has been pushed to central database.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No matching doctor responses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
