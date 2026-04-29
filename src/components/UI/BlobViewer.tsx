import { useState } from 'react';
import { X, FileCode, ImageIcon, Cpu, Download } from 'lucide-react';

interface BlobViewerProps {
  data: Uint8Array | number[];
  onClose: () => void;
}

export default function BlobViewer({ data, onClose }: BlobViewerProps) {
  const [view, setView] = useState<'hex' | 'preview'>('hex');
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  
  const isImage = () => {
    // Basic check for PNG, JPG, GIF, WEBP signatures
    const hex = Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex.startsWith('89504e47') || // PNG
           hex.startsWith('ffd8ff') ||    // JPG
           hex.startsWith('47494638') ||  // GIF
           hex.startsWith('52494646');    // WEBP/RIFF
  };

  const getHexDump = () => {
    const lines = [];
    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.slice(i, i + 16);
      const hex = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join(' ');
      const ascii = Array.from(chunk).map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
      const offset = i.toString(16).padStart(8, '0');
      lines.push(`${offset}  ${hex.padEnd(48)}  |${ascii}|`);
    }
    return lines.join('\n');
  };

  const downloadBlob = () => {
    const blob = new Blob([bytes as any], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.bin';
    a.click();
    URL.revokeObjectURL(url);
  };

  const imageUrl = isImage() ? URL.createObjectURL(new Blob([bytes as any])) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box blob-viewer" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <Cpu size={18} className="icon-cyan" />
            <h3>BLOB Content Viewer</h3>
            <span className="size-badge">{bytes.length} bytes</span>
          </div>
          <div className="flex-spacer" />
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab ${view === 'hex' ? 'active' : ''}`} onClick={() => setView('hex')}>
            <FileCode size={14} /> Hex Dump
          </button>
          {isImage() && (
            <button className={`modal-tab ${view === 'preview' ? 'active' : ''}`} onClick={() => setView('preview')}>
              <ImageIcon size={14} /> Image Preview
            </button>
          )}
        </div>

        <div className="modal-body blob-content">
          {view === 'hex' ? (
            <pre className="hex-dump">{getHexDump()}</pre>
          ) : (
            <div className="image-preview-container">
              {imageUrl && <img src={imageUrl} alt="BLOB Preview" className="blob-image" />}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={downloadBlob}>
            <Download size={14} /> Download Binary
          </button>
          <div className="flex-spacer" />
          <button className="btn-gradient" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
