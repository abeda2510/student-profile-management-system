import { useState, useEffect } from 'react';

function isPdfUrl(url) {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.pdf') || url.includes('/raw/upload/');
}

function PdfViewer({ url }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    setLoading(true); setErr(false);
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('fetch failed');
        return r.blob();
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        setBlobUrl(objectUrl);
        setLoading(false);
      })
      .catch(() => { setErr(true); setLoading(false); });
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url]);

  if (loading) return (
    <div style={{ color: '#64748b', fontSize: 14, padding: 40 }}>Loading PDF...</div>
  );
  if (err) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>Cannot preview this PDF in browser.</div>
      <a href={url} target="_blank" rel="noreferrer"
        style={{ background: '#1e40af', color: '#fff', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
        Open PDF in new tab
      </a>
    </div>
  );
  return (
    <iframe src={blobUrl} style={{ width: '100%', height: '80vh', border: 'none' }} title="PDF" />
  );
}

export function PreviewModal({ url, onClose }) {
  if (!url) return null;
  const isPdf = isPdfUrl(url);

  const download = () => {
    fetch(url)
      .then(r => r.blob())
      .then(blob => {
        const ext = url.split('?')[0].split('.').pop() || (isPdf ? 'pdf' : 'jpg');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `document.${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => window.open(url, '_blank'));
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', maxWidth: 900, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

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

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', minHeight: 300 }}>
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
