import React from 'react';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  ShieldCheck,
  Cpu,
  FileText
} from 'lucide-react';

export default function DashboardView({
  patientRecords,
  doctorResponses,
  onStartNewScreening,
  onOpenPath,
  setActiveTab
}) {
  const records = patientRecords || [];
  const responses = doctorResponses || [];

  const totalPatients = records.length;
  const severeCount = records.filter(r => r.odColor === '#EF5B63' || r.osColor === '#EF5B63' || r.od === 'Severe NPDR' || r.os === 'Severe NPDR' || r.od === 'PDR' || r.os === 'PDR').length;
  const normalCount = records.filter(r => r.od === 'No DR' && r.os === 'No DR').length;
  const pendingReviews = responses.filter(r => r.status === 'ACTION_REQUIRED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Welcome & Quick Action Card */}
      <div className="ui-card" style={{
        padding: '22px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#E7EFFC',
            border: '1px solid #c7daf9',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#315DAA',
            marginBottom: '10px'
          }}>
            <Cpu size={13} />
            <span>Dual-Stage AI Tele-Ophthalmology Active</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#17253D', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            Diabetic Retinopathy Screening Hub
          </h2>
          <p style={{ fontSize: '13px', color: '#60708A', marginTop: '6px', lineHeight: 1.5 }}>
            Automated bilateral lesion segmentation (DeepLabv3+) and ICDR severity grading (ResNet-101) with instant clinical PDF generation.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={onStartNewScreening}
          style={{
            padding: '11px 20px',
            fontSize: '13.5px',
            fontWeight: 700,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          New Screening
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {/* Card 1: Total Patients */}
        <div className="ui-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#60708A' }}>Total Screenings</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#E7EFFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="#315DAA" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#17253D', letterSpacing: '-0.5px' }}>
            {totalPatients}
          </div>
          <span style={{ fontSize: '11px', color: '#8A98AC' }}>Local archive visits</span>
        </div>

        {/* Card 2: Severe / Referral Cases */}
        <div className="ui-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#60708A' }}>Severe Cases</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FCE1E3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} color="#EF5B63" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#D94750', letterSpacing: '-0.5px' }}>
            {severeCount}
          </div>
          <span style={{ fontSize: '11px', color: '#EF5B63', fontWeight: 600 }}>Referral recommended</span>
        </div>

        {/* Card 3: Normal / No DR */}
        <div className="ui-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#60708A' }}>No DR (Grade 0)</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#DDF5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} color="#28A88A" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#28A88A', letterSpacing: '-0.5px' }}>
            {normalCount}
          </div>
          <span style={{ fontSize: '11px', color: '#28A88A', fontWeight: 600 }}>Routine follow-up</span>
        </div>

        {/* Card 4: Doctor Reviews Required */}
        <div className="ui-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#60708A' }}>Doctor Attention</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFF1DC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="#E7A348" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#C77C22', letterSpacing: '-0.5px' }}>
            {pendingReviews}
          </div>
          <span style={{ fontSize: '11px', color: '#C77C22', fontWeight: 600 }}>Specialist notes</span>
        </div>
      </div>

      {/* Main Dashboard Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
        {/* Recent Patients Table */}
        <div className="ui-card" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#17253D' }}>
              Recent Screenings
            </h3>
            <button
              onClick={() => setActiveTab('patients')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                color: '#315DAA',
                cursor: 'pointer'
              }}
            >
              View all <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #E0E7F0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#F8FAFD', color: '#60708A', textAlign: 'left', borderBottom: '1px solid #E0E7F0' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Patient ID</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>OD / OS</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Report</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 4).map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #E8EDF4', background: i % 2 === 0 ? '#F4F7FB' : '#F8FAFD' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#17253D' }}>{r.id}</td>
                    <td style={{ padding: '10px 12px', color: '#17253D' }}>{r.name}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                      <span style={{ color: r.odColor || '#17253D' }}>{r.od}</span> / <span style={{ color: r.osColor || '#17253D' }}>{r.os}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button
                        onClick={() => onOpenPath(r.pdfPath)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#315DAA',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11.5px',
                          fontWeight: 600
                        }}
                      >
                        <FileText size={13} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tele-Ophthalmology Triage Status */}
        <div className="ui-card" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#17253D' }}>
              Tele-Referral Stream
            </h3>
            <button
              onClick={() => setActiveTab('responses')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                color: '#315DAA',
                cursor: 'pointer'
              }}
            >
              Doctor Feed <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {responses.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#F8FAFD',
                  border: '1px solid #E0E7F0',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#17253D' }}>
                    {item.patientId} · {item.patientName}
                  </span>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: item.status === 'ACTION_REQUIRED' ? '#D94750' : '#28A88A',
                    background: item.status === 'ACTION_REQUIRED' ? '#FCE1E3' : '#DDF5EE',
                    padding: '2px 7px',
                    borderRadius: '10px'
                  }}>
                    {item.status === 'ACTION_REQUIRED' ? 'Action Required' : 'Reviewed'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#60708A', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.doctorNotes || 'Routine verification completed.'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
