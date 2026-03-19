import React, { useState } from 'react';
import { X, LogOut, RefreshCw, CheckCircle, AlertCircle, Link } from 'lucide-react';
import {
    getGistConfig, setGistConfig, clearGistConfig,
    connectAndDiscover, fetchFromGist,
} from '../lib/gistSync';

export default function Settings({ onClose, onDataSync }) {
    const config = getGistConfig();

    const [pat, setPat]           = useState('');
    const [status, setStatus]     = useState('idle'); // idle | connecting | connected | syncing | error
    const [username, setUsername] = useState(config?.username || '');
    const [errorMsg, setErrorMsg] = useState('');
    const [lastSync, setLastSync] = useState(config?.lastSync || null);
    const [syncMsg, setSyncMsg]   = useState('');
    const isConnected             = !!config?.pat;

    const handleConnect = async () => {
        if (!pat.trim()) return;
        setStatus('connecting');
        setErrorMsg('');
        setSyncMsg('');
        try {
            const { username: login, gistId, data } = await connectAndDiscover(pat.trim());
            setUsername(login);

            if (data) {
                onDataSync(data);
                const now = new Date().toISOString();
                setLastSync(now);
                setSyncMsg(`Found existing Gist — ${data.tests?.length ?? 0} test(s) loaded ✓`);
            } else if (gistId) {
                setSyncMsg('Connected to existing Gist. No data found.');
            } else {
                setSyncMsg('Connected. A new Gist will be created on your first save.');
            }
            setStatus('connected');
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message);
        }
    };

    const handleDisconnect = () => {
        if (confirm('Disconnect GitHub Gist sync? Your local data stays, but changes will no longer sync to GitHub.')) {
            clearGistConfig();
            setUsername('');
            setStatus('idle');
            setPat('');
            setSyncMsg('');
        }
    };

    const handleManualSync = async () => {
        setStatus('syncing');
        setErrorMsg('');
        setSyncMsg('');
        try {
            const remote = await fetchFromGist();
            if (remote) {
                onDataSync(remote);
                const now = new Date().toISOString();
                setGistConfig({ ...getGistConfig(), lastSync: now });
                setLastSync(now);
                setSyncMsg(`Synced — ${remote.tests?.length ?? 0} test(s) loaded ✓`);
            } else {
                setSyncMsg('No data found in Gist.');
            }
            setStatus('connected');
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message);
        }
    };

    const formatSync = (iso) => {
        if (!iso) return 'Never';
        return new Date(iso).toLocaleString();
    };

    const isBusy = status === 'connecting' || status === 'syncing';

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
                        Data is saved to a <strong>secret GitHub Gist</strong> automatically.
                        Enter your PAT on any device — the app auto-discovers your existing data.
                    </p>

                    {isConnected ? (
                        <div className="connected-box">
                            <div className="connected-row">
                                <CheckCircle size={18} color="#4ade80" />
                                <span>Connected as <strong>{config?.username}</strong></span>
                            </div>
                            <div className="sync-meta">
                                Gist ID: <code style={{ fontSize: '0.7rem', opacity: 0.6 }}>{config?.gistId || 'will be created on first save'}</code>
                            </div>
                            <div className="sync-meta">
                                Last synced: {formatSync(lastSync || config?.lastSync)}
                            </div>
                            {syncMsg && <div className="sync-ok-msg">✓ {syncMsg}</div>}
                            {status === 'error' && (
                                <div className="settings-error"><AlertCircle size={14} /> {errorMsg}</div>
                            )}
                            <div className="settings-actions">
                                <button className="btn-sm" onClick={handleManualSync} disabled={isBusy}>
                                    <RefreshCw size={13} className={status === 'syncing' ? 'spin' : ''} />
                                    {status === 'syncing' ? 'Syncing…' : 'Pull from Gist'}
                                </button>
                                <button className="btn-sm danger-text" onClick={handleDisconnect}>
                                    <LogOut size={13} /> Disconnect
                                </button>
                            </div>
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
                                onKeyDown={e => e.key === 'Enter' && !isBusy && handleConnect()}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                autoFocus
                            />
                            <p className="pat-hint">
                                Only needs <code>gist</code> scope. On connect, the app automatically
                                finds your existing Gist and loads your data.
                            </p>
                            {status === 'error' && (
                                <div className="settings-error"><AlertCircle size={14} /> {errorMsg}</div>
                            )}
                            {syncMsg && <div className="sync-ok-msg">{syncMsg}</div>}
                            <button
                                className="btn-save"
                                onClick={handleConnect}
                                disabled={!pat.trim() || isBusy}
                                style={{ marginTop: '0.75rem' }}
                            >
                                {isBusy ? (
                                    <><RefreshCw size={15} className="spin" /> Connecting…</>
                                ) : 'Connect & Sync'}
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
