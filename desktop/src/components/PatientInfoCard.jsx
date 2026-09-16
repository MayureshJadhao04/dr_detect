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
        <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#17253D' }}>
          Patient Information
        </h2>
        <button
          className="btn btn-outline"
          onClick={() => setIsEditing(!isEditing)}
          style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px' }}
        >
          {isEditing ? (
            <>
              <Check size={14} color="#28A88A" />
              Done Editing
            </>
          ) : (
            <>
              <SquarePen size={14} color="#60708A" />
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
          <div style={{ fontSize: '11.5px', color: '#8A98AC', marginBottom: '4px', fontWeight: 500 }}>
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
            <div style={{ fontSize: '14px', fontWeight: 700, color: patientInfo.patientID ? '#17253D' : '#8A98AC' }}>
              {patientInfo.patientID || '—'}
            </div>
          )}
        </div>

        {/* Full Name */}
        <div>
          <div style={{ fontSize: '11.5px', color: '#8A98AC', marginBottom: '4px', fontWeight: 500 }}>
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
            <div style={{ fontSize: '14px', fontWeight: 700, color: patientInfo.name ? '#17253D' : '#8A98AC' }}>
              {patientInfo.name || '—'}
            </div>
          )}
        </div>

        {/* Age */}
        <div>
          <div style={{ fontSize: '11.5px', color: '#8A98AC', marginBottom: '4px', fontWeight: 500 }}>
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
            <div style={{ fontSize: '14px', fontWeight: 700, color: patientInfo.age ? '#17253D' : '#8A98AC' }}>
              {patientInfo.age || '—'}
            </div>
          )}
        </div>

        {/* Gender */}
        <div>
          <div style={{ fontSize: '11.5px', color: '#8A98AC', marginBottom: '4px', fontWeight: 500 }}>
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
            <div style={{ fontSize: '14px', fontWeight: 700, color: patientInfo.sex ? '#17253D' : '#8A98AC' }}>
              {patientInfo.sex || '—'}
            </div>
          )}
        </div>

        {/* Diabetes Duration */}
        <div>
          <div style={{ fontSize: '11.5px', color: '#8A98AC', marginBottom: '4px', fontWeight: 500 }}>
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
            <div style={{ fontSize: '14px', fontWeight: 700, color: patientInfo.diabetesDuration ? '#17253D' : '#8A98AC' }}>
              {patientInfo.diabetesDuration || '—'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
