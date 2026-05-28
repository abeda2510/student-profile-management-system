import { useState, useEffect } from 'react';
import api from '../api';

function isPdfUrl(url) {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.pdf') || url.includes('/raw/upload/');
}

function PdfViewer({ url }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objUrl = null;
    setLoading(true); setError(false); setBlobUrl(null);

    // Use axios api instance (has auth token) with responseType arraybuffer
    api.get(`/proxy-pdf?url=${encodeURIComponent(url)}`, { responseType: 'arraybuffer' })
      .then(res => {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        objUrl = URL.createObjectURL(blob);
        setBlobUrl(objUrl);
        setLoading(false);
      })
      .catch(err => {
        console.error('PDF proxy error:', err.response?.data || err.message);
        setError(true);
        setLoading(false);
      });

    return () => { if (objUrl) URL.revokeObjectURL(objUrl); };
  }, [url]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 48, color: '#64748b' }}>
      <div style={{ fontSize: 36 }}>📄</div>
      <div style={{ fontSize: 14 }}>Loading PDF...</div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
      <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Could not load PDF preview.</div>
      <a href={url} download
        style={{ background: '#059669', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
        ⬇ Download PDF
      </a>
    </div>
  );

  return <iframe src={blobUrl} style={{ width: '100%', height: '80vh', border: 'none' }} title="PDF Preview" />;
}

export function PreviewModal({ url, onClose }) {
  if (!url) return null;
  const isPdf = isPdfUrl(url);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', maxWidth: 900, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Document Preview</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={url} download
              style={{ background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: 7, padding: '5px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13, textDecoration: 'none' }}>
              ⬇ Download
            </a>
            <button onClick={onClose}
              style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 7, padding: '5px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              ✕ Close
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', minHeight: 400 }}>
          {isPdf
            ? <PdfViewer url={url} />
            : <img src={url} alt="Document" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }} />
          }
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
      <PreviewModal url={open ? url : null} onClose={() => setOpen(false)} />
      <button type="button" onClick={() => setOpen(true)}
        style={{ background: '#dbeafe', color: '#1e40af', border: 'none', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', ...style }}>
        {label}
      </button>
    </>
  );
}
