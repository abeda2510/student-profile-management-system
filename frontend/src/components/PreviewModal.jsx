import { useState, useEffect } from 'react';

const BACKEND = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

function isRawPdf(url) {
  return url && url.includes('/raw/upload/');
}

function PdfViewer({ url }) {
  const [src, setSrc] = useState(null);
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSrc(null); setErr(false); setLoading(true);
    const proxyUrl = `${BACKEND}/proxy-pdf?url=${encodeURIComponent(url)}`;
    console.log('Fetching PDF via proxy:', proxyUrl);
    fetch(proxyUrl)
      .then(r => {
        console.log('Proxy response status:', r.status);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then(blob => {
        console.log('PDF blob size:', blob.size);
        setSrc(URL.createObjectURL(blob));
        setLoading(false);
      })
      .catch(e => {
        console.error('PDF proxy failed:', e.message);
        setErr(true);
        setLoading(false);
      });
  }, [url]);

  if (loading) return <div style={{ padding: 48, color: '#64748b', fontSize: 14, textAlign: 'center' }}>📄 Loading PDF...</div>;
  if (err) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
      <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Cannot preview PDF. Use Download instead.</div>
      <a href={url} target="_blank" rel="noreferrer"
        style={{ background: '#059669', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
        ⬇ Download PDF
      </a>
    </div>
  );
  return <iframe src={src} style={{ width: '100%', height: '80vh', border: 'none' }} title="PDF" />;
}

export function PreviewModal({ url, onClose }) {
  const [imgErr, setImgErr] = useState(false);
  if (!url) return null;

  const raw = isRawPdf(url);

  const handleDownload = async () => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = url.split('?')[0].split('.').pop() || 'file';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `document.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      // fallback — open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', maxWidth: 900, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Document Preview</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleDownload}
              style={{ background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: 7, padding: '5px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              ⬇ Download
            </button>
            <button onClick={onClose}
              style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 7, padding: '5px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              ✕ Close
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', minHeight: 400 }}>
          {raw ? (
            <PdfViewer url={url} />
          ) : imgErr ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Cannot preview this file.</div>
              <a href={url} download target="_blank" rel="noreferrer"
                style={{ background: '#059669', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                ⬇ Download
              </a>
            </div>
          ) : (
            <img src={url} alt="Document"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
              onError={() => { console.error('Image failed to load:', url); setImgErr(true); }} />
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
