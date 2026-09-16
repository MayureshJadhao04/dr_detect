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
      <div className="fundus-eye-panel" style={{
        flex: 1,
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#17253D' }}>
              {title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
              {hasError ? (
                <>
                  <AlertCircle size={13} color="#D94750" />
                  <span style={{ fontSize: '11px', color: '#D94750', fontWeight: 600 }}>
                    Image failed to load
                  </span>
                </>
              ) : isReady ? (
                <>
                  <CheckCircle2 size={13} color="#28A88A" />
                  <span style={{ fontSize: '11px', color: '#28A88A', fontWeight: 600 }}>
                    Image added
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '11px', color: '#8A98AC' }}>
                  No image selected
                </span>
              )}
            </div>
          </div>

          <button
            className="btn btn-outline"
            onClick={() => handleSelect(eyeKey)}
            disabled={disabled}
            style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '8px' }}
          >
            {isReady ? (
              <>
                <RefreshCw size={12} color="#60708A" />
                Replace Image
              </>
            ) : hasError ? (
              <>
                <RefreshCw size={12} color="#D94750" />
                Select Another
              </>
            ) : (
              <>
                <Upload size={12} color="#315DAA" />
                <span style={{ color: '#315DAA' }}>Add Image</span>
              </>
            )}
          </button>
        </div>

        {/* Retinal Image Container */}
        <div
          onClick={() => !isReady && handleSelect(eyeKey)}
          style={{
            width: '100%',
            height: '240px',
            background: '#000000',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: !isReady ? 'pointer' : 'default',
            border: hasError ? '1px solid #F6C9CD' : '1px solid #1E293B',
            position: 'relative',
            zIndex: 1
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#EF5B63', padding: '16px', textAlign: 'center' }}>
              <AlertCircle size={32} strokeWidth={1.5} color="#EF5B63" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#EF5B63' }}>
                Image file could not be loaded
              </span>
              <span style={{ fontSize: '11px', color: '#8A98AC' }}>
                Click here to choose another file
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#60708A' }}>
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
      <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#17253D', marginBottom: '14px' }}>
        Fundus Images
      </h2>

      <div style={{ display: 'flex', gap: '16px' }}>
        {renderEyeBox('Right Eye (OD)', rightImgPath, 'right')}
        {renderEyeBox('Left Eye (OS)', leftImgPath, 'left')}
      </div>
    </div>
  );
}
