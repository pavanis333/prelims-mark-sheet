import React, { useState, useEffect } from 'react';
import { X, Link, LogOut, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import {
    getGistConfig, setGistConfig, clearGistConfig,
    validatePAT, fetchFromGist, pushToGist,
} from '../lib/gistSync';

export default function Settings({ onClose, onDataSync }) {
    const config = getGistConfig();

    const [pat, setPat]             = useState('');
    const [status, setStatus]       = useState('idle'); // idle | validating | connected | error
    const [username, setUsername]   = useState(config?.username || '');
    const [errorMsg, setErrorMsg]   = useState('');
    const [lastSync, setLastSync]   = useState(config?.lastSync || null);
    const isConnected               = !!(config?.pat);

    const handleConnect = async () => {
        if (!pat.trim()) return;
        setStatus('validating');
        setErrorMsg('');
        try {
            const login = await validatePAT(pat.trim());
            setGistConfig({ pat: pat.trim(), username: login, gistId: config?.gistId || null });
            setUsername(login);
            setStatus('connected');
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message);
        }
    };

    const handleDisconnect = () => {
        if (confirm('Disconnect GitHub Gist sync? Your local data stays, but changes will no longer sync.')) {
            clearGistConfig();
            setUsername('');
            setStatus('idle');
            setPat('');
        }
    };

    const handleManualSync = async () => {
        setStatus('syncing');
        setErrorMsg('');
        try {
            const remote = await fetchFromGist();
            if (remote) {
                onDataSync(remote);
            }
            setLastSync(new Date().toISOString());
            setGistConfig({ ...getGistConfig(), lastSync: new Date().toISOString() });
            setStatus('connected');
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message);
        }
    };

    const formatSync = (iso) => {
        if (!iso) return 'Never';
        const d = new Date(iso);
        return d.toLocaleString();
    };

    return (
        <div className="settings-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="settings-modal glass-card fade-in">
                <div className="settings-header">
                    <h2>⚙️ Settings</h2>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <section className="settings-section">
                    <h3>GitHub Gist Sync</h3>
                    <p className="settings-desc">
                        Your data is saved to a <strong>secret GitHub Gist</strong> automatically.
                        Syncs across all your devices — just enter your PAT once per device.
                    </p>

                    {isConnected ? (
                        <div className="connected-box">
                            <div className="connected-row">
                                <CheckCircle size={18} color="#4ade80" />
                                <span>Connected as <strong>{username || getGistConfig()?.username}</strong></span>
                            </div>
                            <div className="sync-meta">
                                Last synced: {formatSync(lastSync || getGistConfig()?.lastSync)}
                            </div>
                            <div className="settings-actions">
                                <button className="btn-sm" onClick={handleManualSync} disabled={status === 'syncing'}>
                                    <RefreshCw size={13} className={status === 'syncing' ? 'spin' : ''} />
                                    {status === 'syncing' ? 'Syncing…' : 'Sync Now'}
                                </button>
                                <button className="btn-sm danger-text" onClick={handleDisconnect}>
                                    <LogOut size={13} /> Disconnect
                                </button>
                            </div>
                            {status === 'error' && (
                                <div className="settings-error"><AlertCircle size={14} /> {errorMsg}</div>
                            )}
                        </div>
                    ) : (
                        <div className="pat-form">
                            <label className="pat-label">
                                Personal Access Token
                                <a
                                    href="https://github.com/settings/tokens/new?scopes=gist&description=UPSC+Prelims+Tracker"
                                    target="_blank" rel="noreferrer"
                                    className="pat-link"
                                >
                                    <Link size={12} /> Generate one
                                </a>
                            </label>
                            <input
                                type="password"
                                className="pat-input"
                                value={pat}
                                onChange={e => setPat(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleConnect()}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                autoFocus
                            />
                            <p className="pat-hint">
                                Only needs <code>gist</code> scope. Stored locally on this device only.
                            </p>
                            {status === 'error' && (
                                <div className="settings-error"><AlertCircle size={14} /> {errorMsg}</div>
                            )}
                            <button
                                className="btn-save"
                                onClick={handleConnect}
                                disabled={!pat.trim() || status === 'validating'}
                                style={{ marginTop: '0.75rem' }}
                            >
                                {status === 'validating' ? 'Connecting…' : 'Connect'}
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
