import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { getStoredData, saveTestResult, deleteResult, updateResult, clearData, exportData, importData } from './lib/storage';
import { isGistConfigured, fetchFromGist, pushToGist, getGistConfig } from './lib/gistSync';
import Calculator from './components/Calculator';
import Dashboard from './components/Dashboard';
import HistoryLog from './components/HistoryLog';
import Settings from './components/Settings';

function App() {
  const [activeView, setActiveView]     = useState('calculator');
  const [data, setData]                 = useState({ tests: [] });
  const [editingTest, setEditingTest]   = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [syncStatus, setSyncStatus]     = useState('idle'); // idle|syncing|synced|error
  const [syncError, setSyncError]       = useState('');

  // ── On mount: load from Gist if configured ──
  useEffect(() => {
    const load = async () => {
      if (isGistConfigured()) {
        setSyncStatus('syncing');
        try {
          const remote = await fetchFromGist();
          if (remote) {
            localStorage.setItem('upsc_tracker_data', JSON.stringify(remote));
            setData(remote);
          } else {
            setData(getStoredData());
          }
          setSyncStatus('synced');
        } catch (err) {
          setSyncStatus('error');
          setSyncError(err.message);
          setData(getStoredData());
        }
      } else {
        setData(getStoredData());
      }
    };
    load();
  }, []);

  // ── Reload local data when switching views ──
  useEffect(() => {
    setData(getStoredData());
  }, [activeView]);

  // ── Push to Gist — always await and surface errors ──
  const syncToGist = useCallback(async (newData) => {
    if (!isGistConfigured()) return;
    setSyncStatus('syncing');
    setSyncError('');
    try {
      await pushToGist(newData);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      setSyncError(err.message || 'Sync failed — click ⚙️ to retry');
    }
  }, []);

  const handleSaveResult = (result) => {
    const newData = saveTestResult(result);
    if (newData) {
      setData(newData);
      syncToGist(newData);
      setActiveView('dashboard');
    }
  };

  const handleUpdateResult = (result) => {
    const newData = updateResult(result);
    if (newData) {
      setData(newData);
      setEditingTest(null);
      syncToGist(newData);   // push updated data
      setActiveView('dashboard');
    }
  };

  const handleDeleteResult = (id) => {
    if (confirm('Delete this result?')) {
      const newData = deleteResult(id);
      if (newData) {
        setData(newData);
        syncToGist(newData);
      }
    }
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setActiveView('calculator');
  };

  const handleCancelEdit = () => {
    setEditingTest(null);
    setActiveView('history');
  };

  const handleClearAll = () => {
    if (confirm('WARNING: This will delete ALL your test history. This action cannot be undone.\n\nAre you sure?')) {
      const newData = clearData();
      setData(newData);
      syncToGist(newData);
    }
  };

  const handleExport = () => exportData();

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const mode = confirm(
          'How do you want to import?\n\nOK = Merge  |  Cancel = Replace all'
        ) ? 'merge' : 'replace';
        const result = importData(ev.target.result, mode);
        const newData = result.data || result;
        setData(newData);
        syncToGist(newData);
      } catch (err) {
        alert(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Called by Settings after a manual pull or fresh connect
  const handleDataSync = (remote) => {
    localStorage.setItem('upsc_tracker_data', JSON.stringify(remote));
    setData(remote);
    setSyncStatus('synced');
    setSyncError('');
  };

  // Called by Settings "Push Now" button
  const handleForcePush = async () => {
    const current = getStoredData();
    await syncToGist(current);
  };

  const syncLabel = {
    idle:    null,
    syncing: { text: '↻ Syncing…',   cls: 'sync-syncing' },
    synced:  { text: '✓ Synced',      cls: 'sync-synced'  },
    error:   { text: '⚠ Sync failed', cls: 'sync-error'   },
  }[syncStatus];

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-area">
          <div className="logo-icon">🏛️</div>
          <h1>UPSC Prelims Tracker</h1>
        </div>

        <nav className="nav-tabs">
          <button className={`nav-item ${activeView === 'calculator' ? 'active' : ''}`}
            onClick={() => { setActiveView('calculator'); setEditingTest(null); }}>
            Calculator
          </button>
          <button className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}>
            Dashboard
          </button>
          <button className={`nav-item ${activeView === 'history' ? 'active' : ''}`}
            onClick={() => setActiveView('history')}>
            History
          </button>
        </nav>

        <div className="header-right">
          {syncLabel && (
            <span
              className={`sync-pill ${syncLabel.cls}`}
              title={syncStatus === 'error' ? syncError : ''}
            >
              {syncLabel.text}
            </span>
          )}
          <button
            className={`settings-btn ${isGistConfigured() ? 'settings-btn-active' : ''}`}
            onClick={() => setShowSettings(true)}
            title="Settings / Gist Sync"
          >
            ⚙️ {isGistConfigured() ? getGistConfig()?.username : 'Sync'}
          </button>
        </div>
      </header>

      {/* Sync error banner */}
      {syncStatus === 'error' && syncError && (
        <div className="sync-error-banner">
          <span>⚠ {syncError}</span>
          <button className="btn-sm" onClick={handleForcePush}>Retry</button>
          <button className="sync-banner-close" onClick={() => { setSyncStatus('idle'); setSyncError(''); }}>✕</button>
        </div>
      )}

      <main className="content-area">
        {activeView === 'calculator' && (
          <Calculator
            key={editingTest ? editingTest.id : 'new'}
            onSave={handleSaveResult}
            onUpdate={handleUpdateResult}
            initialData={editingTest}
            onCancelEdit={handleCancelEdit}
          />
        )}
        {activeView === 'dashboard' && <Dashboard data={data} />}
        {activeView === 'history' && (
          <HistoryLog
            data={data}
            onDelete={handleDeleteResult}
            onEdit={handleEdit}
            onClearAll={handleClearAll}
            onExport={handleExport}
            onImport={handleImport}
          />
        )}
      </main>

      <footer className="footer">
        <p>Stay Consistent. Stay Focused. <span className="highlight-text">You Got This.</span></p>
      </footer>

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onDataSync={handleDataSync}
          onForcePush={handleForcePush}
          currentData={data}
        />
      )}
    </div>
  );
}

export default App;
