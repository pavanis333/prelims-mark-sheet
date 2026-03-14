import React, { useState, useMemo } from 'react';
import { Save, Plus, X } from 'lucide-react';
import '../App.css';

// ── UPSC Prelims Subjects ────────────────────────────────────────────────────
export const SUBJECTS = [
    'AMAC',
    'Modern History',
    'Environment',
    'Science & Tech',
    'Economy',
    'Geography',
    'Polity',
    'CSAT',
];

// GS Paper I subjects (no CSAT)
export const GS_SUBJECTS = SUBJECTS.filter(s => s !== 'CSAT');

export const SUBJECT_COLORS = {
    'AMAC':           { bg: 'rgba(251,146,60,0.15)',  color: '#fb923c' },
    'Modern History': { bg: 'rgba(250,204,21,0.15)',  color: '#facc15' },
    'Environment':    { bg: 'rgba(74,222,128,0.15)',  color: '#4ade80' },
    'Science & Tech': { bg: 'rgba(192,132,252,0.15)', color: '#c084fc' },
    'Economy':        { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
    'Geography':      { bg: 'rgba(52,211,153,0.15)',  color: '#34d399' },
    'Polity':         { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
    'CSAT':           { bg: 'rgba(244,114,182,0.15)', color: '#f472b6' },
    '__custom__':     { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
};

const getSubStyle = (name) =>
    SUBJECT_COLORS[name] || SUBJECT_COLORS['__custom__'];

export const normaliseSub = (subject) => {
    const map = {
        'Ancient India': 'AMAC', 'Medieval India': 'AMAC', 'Art & Culture': 'AMAC',
        'Modern India & Freedom Movement': 'Modern History',
        'Indian Constitution & Amendments': 'Polity',
        'Parliament & Legislature': 'Polity', 'Judiciary & Federalism': 'Polity',
        'Governance & Social Justice': 'Polity', 'Panchayati Raj & Local Bodies': 'Polity',
        'Indian Geography': 'Geography', 'World Geography': 'Geography',
        'Physical Geography & Climate': 'Geography', 'Economic & Human Geography': 'Geography',
        'National Income, Growth & Planning': 'Economy', 'Banking & Monetary Policy': 'Economy',
        'Fiscal Policy, Budget & Taxation': 'Economy', 'Agriculture & Rural Economy': 'Economy',
        'International Trade & External Sector': 'Economy',
        'Biodiversity & Conservation': 'Environment', 'Climate Change & Global Warming': 'Environment',
        'Pollution & Environmental Laws': 'Environment', 'Disaster Management': 'Environment',
        'Physics & Chemistry Basics': 'Science & Tech', 'Biology & Life Sciences': 'Science & Tech',
        'Space, Defense & Nuclear': 'Science & Tech', 'IT, Biotechnology & Nanotechnology': 'Science & Tech',
        'National Affairs & Governance': 'Polity', 'International Affairs & IR': 'Polity',
        'Schemes & Government Initiatives': 'Polity',
        'History': 'AMAC', 'General Knowledge': 'AMAC',
        'Current Affairs': 'Modern History',
        'Science & Technology': 'Science & Tech',
        'Environment & Ecology': 'Environment',
    };
    return map[subject] || (SUBJECTS.includes(subject) ? subject : subject);
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const initGsBreakdown = (saved) => {
    const base = {};
    GS_SUBJECTS.forEach(s => {
        base[s] = { correct: saved?.[s]?.correct ?? 0, incorrect: saved?.[s]?.incorrect ?? 0 };
    });
    return base;
};

const initCustomRows = (saved) => {
    if (!saved?.customRows) return [];
    return saved.customRows.map(r => ({ ...r }));
};

const recoverStats = (score, attempts, correct, incorrect, mPQ, nPQ) => {
    if (correct !== undefined) return { c: correct, i: incorrect };
    if (!attempts) return { c: 0, i: 0 };
    const c = Math.round((score + attempts * nPQ) / (mPQ + nPQ));
    return { c: Math.max(0, c), i: Math.max(0, attempts - c) };
};

// ── Component ────────────────────────────────────────────────────────────────
export default function Calculator({ onSave, onUpdate, initialData, onCancelEdit }) {
    const [activeTab, setActiveTab] = useState(
        initialData?.type === 'SUBJECT_TEST' ? 'subject' : 'full'
    );

    // ── Full Mock: GS Paper I standard breakdown ──
    const [gsBreakdown, setGsBreakdown] = useState(() => initGsBreakdown(initialData?.subjectBreakdown));

    // ── Full Mock: custom extra rows ──
    const [customRows, setCustomRows] = useState(() => initCustomRows(initialData?.subjectBreakdown));

    const updateBreakdown = (subject, field, val) => {
        const n = Math.max(0, parseInt(val) || 0);
        setGsBreakdown(prev => ({ ...prev, [subject]: { ...prev[subject], [field]: n } }));
    };

    const updateCustomRow = (idx, field, val) => {
        setCustomRows(prev => {
            const rows = [...prev];
            rows[idx] = { ...rows[idx], [field]: field === 'name' ? val : Math.max(0, parseInt(val) || 0) };
            return rows;
        });
    };

    const addCustomRow = () =>
        setCustomRows(prev => [...prev, { name: '', correct: 0, incorrect: 0 }]);

    const removeCustomRow = (idx) =>
        setCustomRows(prev => prev.filter((_, i) => i !== idx));

    // Derived: GS Paper I totals
    const allRows = useMemo(() => {
        const standard = GS_SUBJECTS.map(s => ({ ...gsBreakdown[s], name: s, isStandard: true }));
        const custom   = customRows.map(r => ({ ...r, isStandard: false }));
        return [...standard, ...custom];
    }, [gsBreakdown, customRows]);

    const p1Correct   = useMemo(() => allRows.reduce((s, r) => s + (r.correct || 0), 0), [allRows]);
    const p1Incorrect = useMemo(() => allRows.reduce((s, r) => s + (r.incorrect || 0), 0), [allRows]);
    const p1Attempts  = p1Correct + p1Incorrect;
    const p1Score     = Math.max(0, p1Correct * 2 - p1Incorrect * (2 / 3));

    const rowScores = useMemo(() => {
        const result = {};
        allRows.forEach(r => {
            result[r.name] = Math.max(0, (r.correct || 0) * 2 - (r.incorrect || 0) * (2 / 3));
        });
        return result;
    }, [allRows]);

    // ── Full Mock: CSAT Paper II ──
    const p2Stats = recoverStats(
        initialData?.p2Score || 0, initialData?.p2Attempts || 0,
        initialData?.p2Correct, initialData?.p2Incorrect, 2.5, 2.5 / 3
    );
    const [p2Correct, setP2Correct]     = useState(p2Stats.c);
    const [p2Incorrect, setP2Incorrect] = useState(p2Stats.i);
    const p2Attempts  = p2Correct + p2Incorrect;
    const p2Score     = p2Correct * 2.5 - p2Incorrect * (2.5 / 3);
    const p2Qualified = p2Score >= 66.67;

    // ── Subject Wise ──
    const rawSub         = initialData?.subject || 'AMAC';
    const initialSubject = normaliseSub(rawSub);
    const isInitialCustom = !SUBJECTS.includes(initialSubject);

    // selectedOption is either one of SUBJECTS or '__custom__'
    const [selectedOption, setSelectedOption]     = useState(isInitialCustom ? '__custom__' : initialSubject);
    const [customSubjectName, setCustomSubjectName] = useState(isInitialCustom ? initialSubject : '');
    const [totalQuestions, setTotalQuestions]       = useState(initialData?.totalQuestions || 50);
    const [testName, setTestName]                   = useState(initialData?.testName || '');

    const isCustomMode = selectedOption === '__custom__';
    const subjectName  = isCustomMode ? (customSubjectName.trim() || 'Custom') : selectedOption;
    const isCSAT       = subjectName === 'CSAT';
    const marksPerQ    = isCSAT ? 2.5 : 2;
    const negativePerQ = isCSAT ? 2.5 / 3 : 2 / 3;

    const subStats = recoverStats(
        initialData?.score || 0, initialData?.attempts || 0,
        initialData?.subCorrect, initialData?.subIncorrect, marksPerQ, negativePerQ
    );
    const [subCorrect, setSubCorrect]     = useState(subStats.c);
    const [subIncorrect, setSubIncorrect] = useState(subStats.i);
    const subScore    = Math.max(0, subCorrect * marksPerQ - subIncorrect * negativePerQ);
    const subAttempts = subCorrect + subIncorrect;

    const subStyle = getSubStyle(isCustomMode ? '__custom__' : subjectName);

    const handleNum = (setter, val, max) => {
        const n = parseInt(val) || 0;
        if (n >= 0 && (!max || n <= max)) setter(n);
    };

    const P1_TOTAL_Q = 100;
    const P2_TOTAL_Q = 80;

    const handleSave = () => {
        const timestamp = initialData?.date || new Date().toISOString();

        if (activeTab === 'full') {
            const payload = {
                type: 'FULL_MOCK', date: timestamp,
                subjectBreakdown: { ...gsBreakdown, customRows },
                p1Correct, p1Incorrect, p2Correct, p2Incorrect,
                p1Score, p2Score, p1Attempts, p2Attempts, p2Qualified,
                totalScore: p2Qualified ? p1Score : 0,
            };
            if (initialData) { onUpdate({ ...payload, id: initialData.id }); alert('Mock Test Updated!'); }
            else { onSave(payload); alert('Mock Test Result Saved!'); }
        } else {
            if (isCustomMode && !customSubjectName.trim()) {
                alert('Please enter a subject name.'); return;
            }
            const payload = {
                type: 'SUBJECT_TEST', date: timestamp,
                subject: subjectName,
                testName: testName.trim() || null,
                totalQuestions,
                subCorrect, subIncorrect,
                score: subScore, attempts: subAttempts,
                accuracy: subAttempts > 0 ? (subCorrect / subAttempts) * 100 : 0,
            };
            if (initialData) { onUpdate({ ...payload, id: initialData.id }); alert('Subject Test Updated!'); }
            else { onSave(payload); alert(`${subjectName} Test Result Saved!`); }
        }
    };

    return (
        <div className="calculator-container fade-in">
            <div className="sub-tabs">
                <button className={`tab-btn-sm ${activeTab === 'full' ? 'active' : ''}`}
                    onClick={() => setActiveTab('full')}>Full Mock</button>
                <button className={`tab-btn-sm ${activeTab === 'subject' ? 'active' : ''}`}
                    onClick={() => setActiveTab('subject')}>Subject Wise</button>
            </div>

            {/* ════════════════ FULL MOCK ════════════════ */}
            {activeTab === 'full' && (
                <div className="full-mock-layout">

                    {/* GS Paper I */}
                    <section className="glass-card paper-card full-width-card">
                        <div className="card-header">
                            <h2>GS Paper I</h2>
                            <span className="badge">Merit Decider</span>
                        </div>

                        <div className="gs-summary">
                            <div className="gs-total-score">
                                <span className="score-big">{p1Score.toFixed(2)}</span>
                                <span className="score-label">/ 200 marks</span>
                            </div>
                            <div className="gs-meta">
                                <span>{p1Attempts} / {P1_TOTAL_Q} attempted</span>
                                <span>·</span>
                                <span>{p1Attempts > 0 ? ((p1Correct / p1Attempts) * 100).toFixed(0) : 0}% accuracy</span>
                            </div>
                            <div className="score-bar" style={{ marginTop: '0.5rem' }}>
                                <div className="progress" style={{ width: `${Math.min((p1Score / 200) * 100, 100)}%` }} />
                            </div>
                        </div>

                        <div className="gs-subject-table">
                            <div className="gs-table-header">
                                <span>Subject</span>
                                <span>Correct <span className="mark-hint">(+2)</span></span>
                                <span>Incorrect <span className="mark-hint">(-0.66)</span></span>
                                <span>Score</span>
                            </div>

                            {/* Standard subject rows */}
                            {GS_SUBJECTS.map(sub => {
                                const style = SUBJECT_COLORS[sub];
                                const { correct, incorrect } = gsBreakdown[sub];
                                const score = rowScores[sub] ?? 0;
                                return (
                                    <div key={sub} className="gs-table-row"
                                        style={{ borderLeft: `3px solid ${style.color}` }}>
                                        <span className="gs-sub-name" style={{ color: style.color }}>{sub}</span>
                                        <input type="number" className="gs-input success-input"
                                            value={correct || ''}
                                            onChange={e => updateBreakdown(sub, 'correct', e.target.value)}
                                            placeholder="0" min="0" />
                                        <input type="number" className="gs-input error-input"
                                            value={incorrect || ''}
                                            onChange={e => updateBreakdown(sub, 'incorrect', e.target.value)}
                                            placeholder="0" min="0" />
                                        <span className="gs-sub-score"
                                            style={{ color: score > 0 ? style.color : '#9ca3af' }}>
                                            {score.toFixed(1)}
                                        </span>
                                    </div>
                                );
                            })}

                            {/* Custom rows */}
                            {customRows.map((row, idx) => {
                                const score = Math.max(0, (row.correct || 0) * 2 - (row.incorrect || 0) * (2 / 3));
                                return (
                                    <div key={`custom-${idx}`} className="gs-table-row gs-custom-row"
                                        style={{ borderLeft: '3px solid #94a3b8' }}>
                                        <input
                                            type="text"
                                            className="gs-name-input"
                                            value={row.name}
                                            onChange={e => updateCustomRow(idx, 'name', e.target.value)}
                                            placeholder="Subject name…"
                                        />
                                        <input type="number" className="gs-input success-input"
                                            value={row.correct || ''}
                                            onChange={e => updateCustomRow(idx, 'correct', e.target.value)}
                                            placeholder="0" min="0" />
                                        <input type="number" className="gs-input error-input"
                                            value={row.incorrect || ''}
                                            onChange={e => updateCustomRow(idx, 'incorrect', e.target.value)}
                                            placeholder="0" min="0" />
                                        <span className="gs-sub-score" style={{ color: '#94a3b8' }}>
                                            {score.toFixed(1)}
                                            <button className="remove-row-btn" onClick={() => removeCustomRow(idx)}
                                                title="Remove row">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    </div>
                                );
                            })}

                            {/* Add custom row button */}
                            <button className="add-row-btn" onClick={addCustomRow}>
                                <Plus size={14} /> Add custom subject
                            </button>
                        </div>
                    </section>

                    {/* CSAT Paper II */}
                    <section className={`glass-card paper-card ${!p2Qualified && p2Attempts > 0 ? 'border-danger' : ''}`}>
                        <div className="card-header">
                            <h2>CSAT Paper II</h2>
                            <span className={`badge ${p2Qualified ? 'badge-success' : 'badge-warn'}`}>
                                {p2Qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
                            </span>
                        </div>
                        <div className="score-display">
                            <div className={`score-value ${p2Qualified ? 'text-success' : 'text-danger'}`}>
                                {p2Score.toFixed(2)}
                            </div>
                            <div className="score-label">Marks (Needs 66.67+)</div>
                            <div className="score-bar">
                                <div className={`progress ${p2Qualified ? 'bg-success' : 'bg-danger'}`}
                                    style={{ width: `${Math.min((p2Score / 200) * 100, 100)}%` }} />
                                <div className="marker" style={{ left: '33.33%' }} title="Passing Mark" />
                            </div>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-label">Attempts</span>
                                <span className="stat-val">{p2Attempts} / {P2_TOTAL_Q}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Accuracy</span>
                                <span className="stat-val">
                                    {p2Attempts > 0 ? ((p2Correct / p2Attempts) * 100).toFixed(0) : 0}%
                                </span>
                            </div>
                        </div>
                        <div className="inputs-wrapper">
                            <div className="input-group">
                                <label className="input-label">Correct (+2.5)</label>
                                <input type="number" className="input-field success-border" value={p2Correct || ''}
                                    onChange={e => handleNum(setP2Correct, e.target.value, P2_TOTAL_Q)} placeholder="0" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Incorrect (-0.83)</label>
                                <input type="number" className="input-field error-border" value={p2Incorrect || ''}
                                    onChange={e => handleNum(setP2Incorrect, e.target.value, P2_TOTAL_Q)} placeholder="0" />
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* ════════════════ SUBJECT WISE ════════════════ */}
            {activeTab === 'subject' && (
                <div className="single-card-container">
                    <section className="glass-card paper-card active-card">
                        <div className="card-header">
                            <h2>Subject Test</h2>
                            <div className="subject-selector">
                                <select
                                    className="dropdown subject-dropdown"
                                    value={selectedOption}
                                    onChange={e => {
                                        setSelectedOption(e.target.value);
                                        if (e.target.value !== '__custom__') setCustomSubjectName('');
                                    }}
                                    style={{
                                        borderColor: (isCustomMode ? '#94a3b8' : subStyle.color) + '88',
                                        color: isCustomMode ? '#94a3b8' : subStyle.color,
                                    }}>
                                    {SUBJECTS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                    <option value="__custom__">＋ Custom…</option>
                                </select>
                                {/* Custom name input — shown only when Custom is selected */}
                                {isCustomMode && (
                                    <input
                                        type="text"
                                        className="custom-subject-input"
                                        value={customSubjectName}
                                        onChange={e => setCustomSubjectName(e.target.value)}
                                        placeholder="Enter subject name…"
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>

                        <div className="subject-pill" style={{ background: subStyle.bg, color: subStyle.color }}>
                            {subjectName === 'AMAC' ? 'Ancient · Medieval · Art & Culture' : subjectName}
                            {isCSAT && ' · Qualifying Paper'}
                            {isCustomMode && ' · Custom Subject'}
                        </div>

                        {/* Test name */}
                        <div className="test-name-row">
                            <label className="test-name-label">Test Name <span className="optional-hint">(optional)</span></label>
                            <input
                                type="text"
                                className="test-name-input"
                                value={testName}
                                onChange={e => setTestName(e.target.value)}
                                placeholder="e.g. Shankar IAS Ch. 4, Drishti Mock 12…"
                                maxLength={80}
                            />
                        </div>

                        <div className="score-display">
                            <div className="score-value">{subScore.toFixed(2)}</div>
                            <div className="score-label">Marks Obtained</div>
                            <div className="score-bar">
                                <div className="progress"
                                    style={{
                                        width: `${Math.min((subScore / (totalQuestions * marksPerQ)) * 100, 100)}%`,
                                        background: subStyle.color,
                                        boxShadow: `0 0 10px ${subStyle.color}`,
                                    }} />
                            </div>
                        </div>

                        <div className="config-row">
                            <div className="config-item">
                                <label>Total Questions</label>
                                <input type="number"
                                    value={totalQuestions === 0 ? '' : totalQuestions}
                                    onChange={e => setTotalQuestions(e.target.value === '' ? 0 : parseInt(e.target.value))}
                                    className="config-input" placeholder="50" />
                            </div>
                            <div className="config-item">
                                <label>Max Marks</label>
                                <div className="static-val">{totalQuestions * marksPerQ}</div>
                            </div>
                            <div className="config-item">
                                <label>Marking</label>
                                <div className="static-val">+{marksPerQ} / -{negativePerQ.toFixed(2)}</div>
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-label">Attempts</span>
                                <span className="stat-val">{subAttempts} / {totalQuestions}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Accuracy</span>
                                <span className="stat-val">
                                    {subAttempts > 0 ? ((subCorrect / subAttempts) * 100).toFixed(0) : 0}%
                                </span>
                            </div>
                        </div>

                        <div className="inputs-wrapper">
                            <div className="input-group">
                                <label className="input-label">Correct (+{marksPerQ})</label>
                                <input type="number" className="input-field success-border" value={subCorrect || ''}
                                    onChange={e => handleNum(setSubCorrect, e.target.value, totalQuestions)}
                                    placeholder="0" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Incorrect (-{negativePerQ.toFixed(2)})</label>
                                <input type="number" className="input-field error-border" value={subIncorrect || ''}
                                    onChange={e => handleNum(setSubIncorrect, e.target.value, totalQuestions)}
                                    placeholder="0" />
                            </div>
                        </div>
                    </section>
                </div>
            )}

            <div className="action-row">
                {onCancelEdit && (
                    <button className="btn-sm" onClick={onCancelEdit} style={{ marginRight: '1rem' }}>Cancel</button>
                )}
                <button className="btn-save" onClick={handleSave}>
                    <Save size={18} />
                    {initialData ? 'Update Result' : 'Save Result'}
                </button>
            </div>
        </div>
    );
}
