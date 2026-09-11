import React, { useState } from 'react';
import { SquarePen, Check } from 'lucide-react';

export default function PatientInfoCard({ patientInfo, setPatientInfo }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (field, value) => {
    setPatientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="ui-card" style={{ padding: '18px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
          Patient Information
        </h2>
        <button
          className="btn btn-outline"
          onClick={() => setIsEditing(!isEditing)}
          style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '6px' }}
        >
          {isEditing ? (
            <>
              <Check size={14} color="#16a34a" />
              Done Editing
            </>
          ) : (
            <>
              <SquarePen size={14} color="#334155" />
              Edit Patient Details
            </>
          )}
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '20px'
      }}>
        {/* Patient ID */}
        <div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>
            Patient ID
          </div>
          {isEditing ? (
            <input
              type="text"
              className="form-input"
              value={patientInfo.patientID}
              onChange={(e) => handleChange('patientID', e.target.value)}
              style={{ width: '100%' }}
            />
          ) : (
            <div style={{ fontSize: '14px', fontWeight: 700, color: patientInfo.patientID ? 'var(--text-main)' : 'var(--text-light)' }}>
              {patientInfo.patientID || '—'}
            </div>
          )}
        </div>

        {/* Full Name */}
        <div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>
            Full Name
          </div>
          {isEditing ? (
            <input
              type="text"
              className="form-input"
              value={patientInfo.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={{ width: '100%' }}
            />
          ) : (
            <div style={{ fontSize: '14px', fontWeight: 700, color: patientInfo.name ? 'var(--text-main)' : 'var(--text-light)' }}>
              {patientInfo.name || '—'}
            </div>
          )}
        </div>

        {/* Age */}
        <div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>
            Age
          </div>
          {isEditing ? (
            <input
              type="number"
              className="form-input"
              value={patientInfo.age}
              onChange={(e) => handleChange('age', parseInt(e.target.value) || '')}
              style={{ width: '100%' }}
            />
          ) : (
            <div style={{ fontSize: '14px', fontWeight: 700, color: patientInfo.age ? 'var(--text-main)' : 'var(--text-light)' }}>
              {patientInfo.age || '—'}
            </div>
          )}
        </div>

        {/* Gender */}
        <div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>
            Gender
          </div>
          {isEditing ? (
            <select
              className="form-input"
              value={patientInfo.sex || ''}
              onChange={(e) => handleChange('sex', e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          ) : (
            <div style={{ fontSize: '14px', fontWeight: 700, color: patientInfo.sex ? 'var(--text-main)' : 'var(--text-light)' }}>
              {patientInfo.sex || '—'}
            </div>
          )}
        </div>

        {/* Diabetes Duration */}
        <div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>
            Diabetes Duration (years)
          </div>
          {isEditing ? (
            <input
              type="number"
              className="form-input"
              value={patientInfo.diabetesDuration}
              onChange={(e) => handleChange('diabetesDuration', parseInt(e.target.value) || '')}
              style={{ width: '100%' }}
            />
          ) : (
            <div style={{ fontSize: '14px', fontWeight: 700, color: patientInfo.diabetesDuration ? 'var(--text-main)' : 'var(--text-light)' }}>
              {patientInfo.diabetesDuration || '—'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
