import { useState } from 'react';

function isRawPdf(url) {
  if (!url) return false;
  return url.includes('/raw/upload/');
}

export function PreviewModal({ url, onClose }) {
  const [imgError, setImgError] = useState(false);
  if (!url) return null;

  const raw = isRawPdf(url);
  // For raw Cloudinary PDFs, add fl_inline so browser can display
  const displayUrl = raw && !url.includes('fl_inline')
    ? url.replace('/raw/upload/', '/raw/upload/fl_inline/')
    : url;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', maxWidth: 900, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Document Preview</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={displayUrl} download target="_blank" rel="noreferrer"
              style={{ background: '#d1fae5', color: '#065f46', borderRadius: 7, padding: '5px 14px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              ⬇ Download
            </a>
            <button onClick={onClose}
              style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 7, padding: '5px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              ✕ Close
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', minHeight: 400 }}>
          {raw ? (
            // Raw PDF — embed directly in iframe with fl_inline
            <iframe
              src={displayUrl}
              style={{ width: '100%', height: '80vh', border: 'none' }}
              title="Document"
            />
          ) : imgError ? (
            // Image failed — show download fallback
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Cannot preview this file.</div>
              <a href={url} download target="_blank" rel="noreferrer"
                style={{ background: '#059669', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                ⬇ Download
              </a>
            </div>
          ) : (
            <img
              src={url}
              alt="Document"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block', borderRadius: 4 }}
              onError={() => setImgError(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function ViewButton({ url, label = 'View', style = {} }) {
  const [open, setOpen] = useState(false);
  if (!url) return null;
  return (
    <>
      {open && <PreviewModal url={url} onClose={() => setOpen(false)} />}
      <button type="button" onClick={() => setOpen(true)}
        style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', ...style }}>
        {label}
      </button>
    </>
  );
}
