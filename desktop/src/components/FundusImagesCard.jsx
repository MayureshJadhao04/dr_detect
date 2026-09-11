import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Upload, Eye } from 'lucide-react';

export default function FundusImagesCard({
  leftImgPath,
  setLeftImgPath,
  rightImgPath,
  setRightImgPath,
  disabled = false
}) {
  const [loadErrors, setLoadErrors] = useState({ left: false, right: false });

  // Reset error flags whenever paths change
  useEffect(() => {
    setLoadErrors(prev => ({ ...prev, left: false }));
  }, [leftImgPath]);

  useEffect(() => {
    setLoadErrors(prev => ({ ...prev, right: false }));
  }, [rightImgPath]);

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
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const p = file.path || URL.createObjectURL(file);
            if (eye === 'left') setLeftImgPath(p);
            else setRightImgPath(p);
          }
        };
        input.click();
      }
    } catch (err) {
      console.error('File selection failed:', err);
    }
  };

  const renderEyeBox = (title, imgPath, eyeKey) => {
    const hasPath = Boolean(imgPath && imgPath.trim());
    const hasError = loadErrors[eyeKey];
    const isReady = hasPath && !hasError;

    const imgSrc = hasPath
      ? (imgPath.startsWith('http') || imgPath.startsWith('blob:')
          ? imgPath
          : `media://${encodeURIComponent(imgPath)}`)
      : null;

    return (
      <div style={{
        flex: 1,
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '16px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
              {title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
              {hasError ? (
                <>
                  <AlertCircle size={13} color="#dc2626" />
                  <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>
                    Image failed to load
                  </span>
                </>
              ) : isReady ? (
                <>
                  <CheckCircle2 size={13} color="#16a34a" />
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                    Image added
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  No image selected
                </span>
              )}
            </div>
          </div>

          <button
            className="btn btn-outline"
            onClick={() => handleSelect(eyeKey)}
            disabled={disabled}
            style={{ padding: '5px 12px', fontSize: '11.5px', borderRadius: '6px' }}
          >
            {isReady ? (
              <>
                <RefreshCw size={12} color="#475569" />
                Replace Image
              </>
            ) : hasError ? (
              <>
                <RefreshCw size={12} color="#dc2626" />
                Select Another
              </>
            ) : (
              <>
                <Upload size={12} color="#475569" />
                Add Image
              </>
            )}
          </button>
        </div>

        {/* Retinal Image Container matching mockup's square black view */}
        <div
          onClick={() => !isReady && handleSelect(eyeKey)}
          style={{
            width: '100%',
            height: '240px',
            background: '#000000',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: !isReady ? 'pointer' : 'default',
            border: hasError ? '1px solid #fca5a5' : '1px solid #1e293b'
          }}
        >
          {isReady ? (
            <img
              key={imgPath}
              src={imgSrc}
              alt={title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
              onError={() => {
                setLoadErrors(prev => ({ ...prev, [eyeKey]: true }));
              }}
            />
          ) : hasError ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#f87171', padding: '16px', textAlign: 'center' }}>
              <AlertCircle size={32} strokeWidth={1.5} color="#ef4444" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#fca5a5' }}>
                Image file could not be loaded
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Click here to choose another file
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#64748b' }}>
              <Eye size={36} strokeWidth={1.2} />
              <span style={{ fontSize: '12px', fontWeight: 500 }}>
                Click to load {title}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="ui-card" style={{ padding: '20px 24px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px' }}>
        Fundus Images
      </h2>

      <div style={{ display: 'flex', gap: '16px' }}>
        {renderEyeBox('Right Eye (OD)', rightImgPath, 'right')}
        {renderEyeBox('Left Eye (OS)', leftImgPath, 'left')}
      </div>
    </div>
  );
}
