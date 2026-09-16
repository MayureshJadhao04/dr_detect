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
  REVIEWED: { label: 'Reviewed', color: '#28A88A', bg: '#DDF5EE', border: '#bbf7d0', icon: CheckCircle2 },
  PENDING: { label: 'Pending Review', color: '#E7A348', bg: '#FFF1DC', border: '#fed7aa', icon: Clock },
  ACTION_REQUIRED: { label: 'Attention Required', color: '#D94750', bg: '#FCE1E3', border: '#F6C9CD', icon: AlertTriangle },
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
          { key: 'ALL', label: 'Total Sent', color: '#315DAA', bg: '#E7EFFC', border: '#bae6fd' },
          { key: 'REVIEWED', label: 'Reviewed', color: '#28A88A', bg: '#DDF5EE', border: '#bbf7d0' },
          { key: 'PENDING', label: 'Pending', color: '#E7A348', bg: '#FFF1DC', border: '#fed7aa' },
          { key: 'ACTION_REQUIRED', label: 'Attention Required (Grade 3/4)', color: '#EF5B63', bg: '#FCE1E3', border: '#F6C9CD' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className="ui-card"
            style={{
              padding: '14px 18px',
              cursor: 'pointer',
              border: filterStatus === s.key ? `2px solid ${s.color}` : '1px solid rgba(255, 255, 255, 0.70)',
              background: filterStatus === s.key ? s.bg : '#F4F7FB',
              transition: 'all 0.15s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>
              {counts[s.key]}
            </div>
            <div style={{ fontSize: '12px', color: '#60708A', fontWeight: 600, marginTop: '2px' }}>
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
            <MessageSquareText size={16} color="#315DAA" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#17253D' }}>
              Doctor Feedback & Annotations
            </h3>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#EEF3F9', border: '1px solid #E0E7F0',
            boxShadow: 'var(--neu-inset)',
            borderRadius: '10px', padding: '6px 12px', width: '260px'
          }}>
            <Search size={14} color="#8A98AC" />
            <input
              type="text"
              placeholder="Search by Patient ID or Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none', background: 'transparent', outline: 'none', fontSize: '12.5px', width: '100%',
                fontFamily: 'var(--font-sans)', color: '#17253D'
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #E0E7F0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFD', color: '#60708A', textAlign: 'left', borderBottom: '1px solid #E0E7F0' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Date Sent</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Patient</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>OD / OS</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Reviewing Doctor</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, width: '40px' }}></th>
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
                        borderBottom: isExpanded ? 'none' : '1px solid #E8EDF4',
                        background: idx % 2 === 0 ? '#F4F7FB' : '#F8FAFD',
                        cursor: 'pointer',
                        transition: 'background-color 0.12s ease'
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : row.patientId + row.date)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5FA'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#F4F7FB' : '#F8FAFD'}
                    >
                      <td style={{ padding: '12px 14px', color: '#60708A' }}>{row.date}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#17253D' }}>{row.patientName}</div>
                        <div style={{ fontSize: '11px', color: '#60708A' }}>{row.patientId} · {row.ageSex}</div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#17253D', fontWeight: 600 }}>
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
                              color: '#D94750',
                              background: '#FCE1E3',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              Severe Case (Grade 3/4)
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#17253D', fontWeight: 500 }}>
                        {row.doctorName || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <ChevronDown
                          size={16}
                          color="#60708A"
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
                        <td colSpan="6" style={{ padding: '0 14px 14px', borderBottom: '1px solid #E8EDF4' }}>
                          <div style={{
                            background: row.status === 'ACTION_REQUIRED' ? '#FCE1E3' : '#F8FAFD',
                            border: `1px solid ${row.status === 'ACTION_REQUIRED' ? '#F6C9CD' : '#E0E7F0'}`,
                            borderRadius: '8px',
                            padding: '14px 18px'
                          }}>
                            {row.doctorNotes ? (
                              <>
                                <div style={{ fontSize: '11px', color: '#60708A', marginBottom: '6px', fontWeight: 600 }}>
                                  Doctor's Notes · {row.reviewDate}
                                </div>
                                <div style={{
                                  fontSize: '13px',
                                  color: row.status === 'ACTION_REQUIRED' ? '#D94750' : '#17253D',
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
                                    borderTop: '1px solid #F6C9CD',
                                    paddingTop: '10px'
                                  }}>
                                    <span style={{ fontSize: '11px', color: '#D94750', fontWeight: 600 }}>
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
                                        background: '#F4F7FB',
                                        color: '#28A88A',
                                        borderColor: '#bbf7d0'
                                      }}
                                    >
                                      <CheckCheck size={13} color="#28A88A" />
                                      Mark Intervention Handled
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle2 size={13} color="#28A88A" />
                                    <span style={{ fontSize: '11px', color: '#28A88A', fontWeight: 600 }}>
                                      Clinical status verified.
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div style={{ fontSize: '12px', color: '#60708A', fontStyle: 'italic' }}>
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
                  <td colSpan="6" style={{ padding: '32px 14px', textAlign: 'center', color: '#8A98AC', fontSize: '13px' }}>
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
