import React, { useState, useEffect } from 'react';
import './App.css';
import { getStoredData, saveTestResult, deleteResult, updateResult, clearData } from './lib/storage';
import Calculator from './components/Calculator';
import Dashboard from './components/Dashboard';
import HistoryLog from './components/HistoryLog';

function App() {
  const [activeView, setActiveView] = useState('calculator'); // 'calculator' | 'dashboard' | 'history'
  const [data, setData] = useState({ tests: [] });
  const [editingTest, setEditingTest] = useState(null);

  useEffect(() => {
    // Reload data whenever view changes to ensure sync/migration
    const stored = getStoredData();
    setData(stored);
  }, [activeView]);

  const handleSaveResult = (result) => {
    const newData = saveTestResult(result);
    if (newData) {
      setData(newData);
      setActiveView('dashboard'); // Auto switch to dashboard to show progress
    }
  };

  const handleUpdateResult = (result) => {
    const newData = updateResult(result);
    if (newData) {
      setData(newData);
      setEditingTest(null);
      setActiveView('dashboard');
    }
  };

  const handleDeleteResult = (id) => {
    if (confirm('Are you sure you want to delete this result?')) {
      const newData = deleteResult(id);
      if (newData) setData(newData);
    }
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setActiveView('calculator');
  };

  const handleCancelEdit = () => {
    setEditingTest(null);
    setActiveView('history'); // Go back to history
  };

  const handleClearAll = () => {
    if (confirm('WARNING: This will delete ALL your test history. This action cannot be undone.\n\nAre you sure?')) {
      const newData = clearData();
      setData(newData);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-area">
          <div className="logo-icon">🏛️</div>
          <h1>UPSC Prelims Tracker</h1>
        </div>

        {/* Main Navigation */}
        <nav className="nav-tabs">
          <button
            className={`nav-item ${activeView === 'calculator' ? 'active' : ''}`}
            onClick={() => { setActiveView('calculator'); setEditingTest(null); }}
          >
            Calculator
          </button>
          <button
            className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-item ${activeView === 'history' ? 'active' : ''}`}
            onClick={() => setActiveView('history')}
          >
            History
          </button>
        </nav>
      </header>

      <main className="content-area">
        {activeView === 'calculator' && (
          <Calculator
            key={editingTest ? editingTest.id : 'new'} // Force re-render on edit switch
            onSave={handleSaveResult}
            onUpdate={handleUpdateResult}
            initialData={editingTest}
            onCancelEdit={handleCancelEdit}
          />
        )}

        {activeView === 'dashboard' && (
          <Dashboard data={data} />
        )}

        {activeView === 'history' && (
          <HistoryLog
            data={data}
            onDelete={handleDeleteResult}
            onEdit={handleEdit}
            onClearAll={handleClearAll}
          />
        )}
      </main>

      <footer className="footer">
        <p>Stay Consistent. Stay Focused. <span className="highlight-text">You Got This.</span></p>
      </footer>
    </div>
  );
}

export default App;
