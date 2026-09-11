import React from 'react';
import { UserCheck, Hash, Calendar, Clock, Activity } from 'lucide-react';

export default function PatientIntake({ patientInfo, setPatientInfo, disabled = false }) {
  const handleChange = (field, value) => {
    setPatientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <UserCheck size={18} color="#38bdf8" />
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
          Patient Intake & Clinical Metadata
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '14px'
      }}>
        {/* Patient ID */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Patient ID *
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. P0004"
            value={patientInfo.patientID || ''}
            onChange={(e) => handleChange('patientID', e.target.value)}
            disabled={disabled}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>

        {/* Full Name */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Full Name *
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Ramesh Patil"
            value={patientInfo.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Age */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Age (years) *
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 58"
            min="1"
            max="120"
            value={patientInfo.age || ''}
            onChange={(e) => handleChange('age', e.target.value ? parseInt(e.target.value) : '')}
            disabled={disabled}
          />
        </div>

        {/* Sex */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Sex *
          </label>
          <select
            className="input-field"
            value={patientInfo.sex || 'Female'}
            onChange={(e) => handleChange('sex', e.target.value)}
            disabled={disabled}
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Diabetes Duration */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Diabetes Duration (yrs) *
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 10"
            min="0"
            max="80"
            value={patientInfo.diabetesDuration || ''}
            onChange={(e) => handleChange('diabetesDuration', e.target.value ? parseInt(e.target.value) : '')}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
