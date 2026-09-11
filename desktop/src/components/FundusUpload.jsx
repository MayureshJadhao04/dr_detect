import React from 'react';
import { Upload, Eye, CheckCircle, Image as ImageIcon, X } from 'lucide-react';

export default function FundusUpload({ leftImgPath, setLeftImgPath, rightImgPath, setRightImgPath, disabled = false }) {
  const handleSelect = async (eye) => {
    if (disabled) return;
    try {
      if (window.api && window.api.selectFile) {
        const filePath = await window.api.selectFile();
        if (filePath) {
          if (eye === 'left') setLeftImgPath(filePath);
          else setRightImgPath(filePath);
        }
      } else {
        // Fallback file input for browser testing
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            // For mock/dev fallback: use path if available, or object URL
            const p = file.path || URL.createObjectURL(file);
            if (eye === 'left') setLeftImgPath(p);
            else setRightImgPath(p);
          }
        };
        input.click();
      }
    } catch (err) {
      console.error('File selection error:', err);
    }
  };

  const getFileName = (fullPath) => {
    if (!fullPath) return '';
    return fullPath.split(/[\\/]/).pop();
  };

  const renderEyeCard = (title, subtitle, path, eyeKey) => {
    const isLoaded = Boolean(path);
    const fileName = getFileName(path);

    return (
      <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={16} color={eyeKey === 'right' ? '#38bdf8' : '#a855f7'} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                {title}
              </h3>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{subtitle}</p>
          </div>
          {isLoaded && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '20px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600
            }}>
              <CheckCircle size={12} />
              Loaded
            </span>
          )}
        </div>

        {/* Dropzone / Preview Area */}
        <div
          onClick={() => handleSelect(eyeKey)}
          style={{
            height: '160px',
            borderRadius: '10px',
            border: isLoaded ? '1px solid rgba(56, 189, 248, 0.4)' : '2px dashed var(--border-card)',
            background: isLoaded ? 'rgba(7, 12, 24, 0.8)' : 'rgba(11, 19, 38, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.2s ease'
          }}
        >
          {isLoaded ? (
            <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Image preview */}
              <img
                src={path.startsWith('http') || path.startsWith('blob:') ? path : `media://${encodeURIComponent(path)}`}
                onError={(e) => {
                  // Fallback icon if local absolute file path protocol isn't enabled
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
                alt="Fundus"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={32} color="#38bdf8" />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Retinal Image Loaded</span>
              </div>
              
              {/* Overlay with file name */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(7, 12, 24, 0.85)',
                padding: '6px 10px',
                fontSize: '11px',
                color: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)'
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fileName}
                </span>
                {!disabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (eyeKey === 'left') setLeftImgPath('');
                      else setRightImgPath('');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}>
                <Upload size={20} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                  Click to select image
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  PNG, JPG, TIFF (Macula-centered)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {renderEyeCard('Right Eye (OD - Oculus Dexter)', 'Select or drop right eye fundus capture', rightImgPath, 'right')}
      {renderEyeCard('Left Eye (OS - Oculus Sinister)', 'Select or drop left eye fundus capture', leftImgPath, 'left')}
    </div>
  );
}
