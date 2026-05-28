import { useState } from 'react';

// Convert Cloudinary raw PDF URL to inline-viewable URL
function toInlineUrl(url) {
  if (!url) return url;
  // Cloudinary raw PDF — insert fl_inline so browser displays instead of downloading
  if (url.includes('res.cloudinary.com') && url.includes('/raw/upload/')) {
    return url.replace('/raw/upload/', '/raw/upload/fl_inline/');
  }
  return url;
}

function isPdfUrl(url) {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.pdf') || url.includes('/raw/upload/');
}

export function PreviewModal({ url, onClose }) {
  if (!url) return null;
  const isPdf = isPdfUrl(url);
  const viewUrl = toInlineUrl(url);
  // Use Google Docs viewer as fallback for PDFs that still won't display inline
  const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(viewUrl)}&embedded=true`;

  const download = async () => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = url.split('?')[0].split('.').pop() || 'pdf';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `document.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', maxWidth: 900, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Document Preview</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={download}
              style={{ background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: 7, padding: '5px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              ⬇ Download
            </button>
            <button onClick={onClose}
              style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 7, padding: '5px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', minHeight: 300 }}>
          {isPdf ? (
            <iframe
              src={googleDocsUrl}
              style={{ width: '100%', height: '80vh', border: 'none' }}
              title="Document"
            />
          ) : (
            <img src={url} alt="Document" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }} />
          )}
        </div>
      </div>
    </div>
  );
}

// Drop-in replacement for <a href target="_blank"> View buttons
export function ViewButton({ url, label = 'View', style = {} }) {
  const [open, setOpen] = useState(false);
  if (!url) return null;
  return (
    <>
      <PreviewModal url={open ? url : null} onClose={() => setOpen(false)} />
      <button type="button" onClick={() => setOpen(true)}
        style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', ...style }}>
        {label}
      </button>
    </>
  );
}
