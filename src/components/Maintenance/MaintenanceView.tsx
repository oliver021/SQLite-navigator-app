import { useState, useEffect } from 'react';
import { 
  ShieldCheck, Zap, Info, 
  HardDrive, FileText, CheckCircle, AlertTriangle 
} from 'lucide-react';
import './MaintenanceView.css';

interface DbStats {
  path: string;
  sizeBytes: number;
  journalMode: string;
  synchronous: number;
  foreignKeys: number;
  pageSize: number;
  pageCount: number;
}

export default function MaintenanceView() {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadStats = async () => {
    try {
      const s = await window.sqlitenav.getDatabaseStats();
      setStats(s);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleMaintenance = async (task: 'vacuum' | 'optimize' | 'integrity') => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await window.sqlitenav.runMaintenance(task);
      if (task === 'integrity') {
        const ok = Array.isArray(res) && res[0]?.integrity_check === 'ok';
        setMessage({ 
          text: ok ? 'Integrity Check: PASSED' : 'Integrity Check: FAILED (See logs)', 
          type: ok ? 'success' : 'error' 
        });
      } else {
        setMessage({ text: `${task.toUpperCase()} completed successfully`, type: 'success' });
      }
      loadStats();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!stats) return <div className="maintenance-loading">Loading database statistics...</div>;

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIdx = 0;
    while (size > 1024 && unitIdx < units.length - 1) {
      size /= 1024;
      unitIdx++;
    }
    return `${size.toFixed(2)} ${units[unitIdx]}`;
  };

  return (
    <div className="maintenance-view fade-in">
      <div className="maintenance-header">
        <h2 className="maintenance-title">Database Health & Maintenance</h2>
        <p className="maintenance-subtitle">Monitor performance and perform optimization tasks</p>
      </div>

      <div className="maintenance-grid">
        {/* --- Stats Cards --- */}
        <div className="stats-card">
          <div className="stats-icon purple"><HardDrive size={20} /></div>
          <div className="stats-info">
            <label>Database Size</label>
            <span>{formatSize(stats.sizeBytes)}</span>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon blue"><FileText size={20} /></div>
          <div className="stats-info">
            <label>Journal Mode</label>
            <span className="uppercase">{stats.journalMode}</span>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon green"><ShieldCheck size={20} /></div>
          <div className="stats-info">
            <label>Foreign Keys</label>
            <span>{stats.foreignKeys ? 'ENABLED' : 'DISABLED'}</span>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon cyan"><Zap size={20} /></div>
          <div className="stats-info">
            <label>Page Count</label>
            <span>{stats.pageCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`maintenance-message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {message.text}
        </div>
      )}

      <div className="maintenance-sections">
        {/* --- Optimization Section --- */}
        <div className="maintenance-section">
          <div className="section-header">
            <Zap size={18} className="icon-cyan" />
            <h3>Optimization</h3>
          </div>
          <div className="section-content">
            <div className="task-item">
              <div className="task-info">
                <h4>VACUUM</h4>
                <p>Rebuilds the database file, reclaiming unused space and defragmenting the file.</p>
              </div>
              <button className="task-btn" disabled={isLoading} onClick={() => handleMaintenance('vacuum')}>
                Run Vacuum
              </button>
            </div>

            <div className="task-item">
              <div className="task-info">
                <h4>PRAGMA Optimize</h4>
                <p>Analyzes tables to improve query planner decisions. Best used before closing connection.</p>
              </div>
              <button className="task-btn" disabled={isLoading} onClick={() => handleMaintenance('optimize')}>
                Optimize
              </button>
            </div>
          </div>
        </div>

        {/* --- Health Section --- */}
        <div className="maintenance-section">
          <div className="section-header">
            <ShieldCheck size={18} className="icon-green" />
            <h3>Integrity & Safety</h3>
          </div>
          <div className="section-content">
            <div className="task-item">
              <div className="task-info">
                <h4>Integrity Check</h4>
                <p>Scans the entire database for corruption, mismatched indices, and malformed data.</p>
              </div>
              <button className="task-btn secondary" disabled={isLoading} onClick={() => handleMaintenance('integrity')}>
                Check Integrity
              </button>
            </div>
            
            <div className="info-box">
              <Info size={16} />
              <p>Current Path: <code>{stats.path}</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
