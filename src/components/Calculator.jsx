import React, { useState } from 'react';
import { Save } from 'lucide-react';
import '../App.css';

// ── Subjects ─────────────────────────────────────────────────────────────────
export const SUBJECTS = [
    'AMAC',
    'Modern History',
    'Environment',
    'Science & Tech',
    'Economy',
    'Geography',
    'Polity',
    'GS Paper I',
    'CSAT Paper II',
];

export const SUBJECT_COLORS = {
    'AMAC':           { bg: 'rgba(251,146,60,0.15)',  color: '#fb923c' },
    'Modern History': { bg: 'rgba(250,204,21,0.15)',  color: '#facc15' },
    'Environment':    { bg: 'rgba(74,222,128,0.15)',  color: '#4ade80' },
    'Science & Tech': { bg: 'rgba(192,132,252,0.15)', color: '#c084fc' },
    'Economy':        { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
    'Geography':      { bg: 'rgba(52,211,153,0.15)',  color: '#34d399' },
    'Polity':         { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
    'GS Paper I':     { bg: 'rgba(202,138,4,0.15)',   color: '#ca8a04' },
    'CSAT Paper II':  { bg: 'rgba(244,114,182,0.15)', color: '#f472b6' },
    '__custom__':     { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
};

const getSubStyle = (name) => SUBJECT_COLORS[name] || SUBJECT_COLORS['__custom__'];

export const normaliseSub = (subject) => {
    const map = {
        'Ancient India': 'AMAC', 'Medieval India': 'AMAC', 'Art & Culture': 'AMAC',
        'Modern India & Freedom Movement': 'Modern History',
        'Indian Constitution & Amendments': 'Polity',
        'Parliament & Legislature': 'Polity', 'Judiciary & Federalism': 'Polity',
        'Governance & Social Justice': 'Polity', 'Panchayati Raj & Local Bodies': 'Polity',
        'Indian Geography': 'Geography', 'World Geography': 'Geography',
        'Physical Geography & Climate': 'Geography',
        'National Income, Growth & Planning': 'Economy', 'Banking & Monetary Policy': 'Economy',
        'Fiscal Policy, Budget & Taxation': 'Economy', 'Agriculture & Rural Economy': 'Economy',
        'Biodiversity & Conservation': 'Environment', 'Climate Change & Global Warming': 'Environment',
        'Pollution & Environmental Laws': 'Environment', 'Disaster Management': 'Environment',
        'Physics & Chemistry Basics': 'Science & Tech', 'Biology & Life Sciences': 'Science & Tech',
        'Space, Defense & Nuclear': 'Science & Tech', 'IT, Biotechnology & Nanotechnology': 'Science & Tech',
        'History': 'AMAC', 'General Knowledge': 'AMAC',
        'Current Affairs': 'Modern History',
        'Science & Technology': 'Science & Tech',
        'Environment & Ecology': 'Environment',
        // legacy full mock → keep as-is
        'FULL_MOCK': 'GS Paper I',
        'CSAT': 'CSAT Paper II',
    };
    return map[subject] || (SUBJECTS.includes(subject) ? subject : subject);
};

// Per-subject config
const getSubjectConfig = (name) => {
    if (name === 'GS Paper I')    return { marksPerQ: 2,   negPerQ: 2/3,     totalQ: 100, maxMarks: 200 };
    if (name === 'CSAT Paper II') return { marksPerQ: 2.5, negPerQ: 2.5/3,   totalQ: 80,  maxMarks: 200 };
    return                               { marksPerQ: 2,   negPerQ: 2/3,     totalQ: 50,  maxMarks: null };
};

const recoverStats = (score, attempts, correct, incorrect, mPQ, nPQ) => {
    if (correct !== undefined) return { c: correct, i: incorrect };
    if (!attempts) return { c: 0, i: 0 };
    const c = Math.round((score + attempts * nPQ) / (mPQ + nPQ));
    return { c: Math.max(0, c), i: Math.max(0, attempts - c) };
};

// ── Component ────────────────────────────────────────────────────────────────
export default function Calculator({ onSave, onUpdate, initialData, onCancelEdit }) {
    const rawSub          = initialData?.subject
        || (initialData?.type === 'FULL_MOCK' ? 'GS Paper I' : 'AMAC');
    const initialSubject  = normaliseSub(rawSub);
    const isInitialCustom = !SUBJECTS.includes(initialSubject);

    const [selectedOption, setSelectedOption]       = useState(isInitialCustom ? '__custom__' : initialSubject);
    const [customSubjectName, setCustomSubjectName] = useState(isInitialCustom ? initialSubject : '');
    const [testName, setTestName]                   = useState(initialData?.testName || '');

    const isCustomMode = selectedOption === '__custom__';
    const subjectName  = isCustomMode ? (customSubjectName.trim() || 'Custom') : selectedOption;
    const cfg          = getSubjectConfig(subjectName);
    const subStyle     = getSubStyle(isCustomMode ? '__custom__' : subjectName);

    const isCSAT   = subjectName === 'CSAT Paper II';
    const isGSP1   = subjectName === 'GS Paper I';

    const [totalQuestions, setTotalQuestions] = useState(
        initialData?.totalQuestions || cfg.totalQ
    );

    const subStats = recoverStats(
        initialData?.score ?? initialData?.p1Score ?? 0,
        initialData?.attempts ?? initialData?.p1Attempts ?? 0,
        initialData?.subCorrect ?? initialData?.p1Correct,
        initialData?.subIncorrect ?? initialData?.p1Incorrect,
        cfg.marksPerQ, cfg.negPerQ
    );
    const [correct, setCorrect]     = useState(subStats.c);
    const [incorrect, setIncorrect] = useState(subStats.i);

    const score    = Math.max(0, correct * cfg.marksPerQ - incorrect * cfg.negPerQ);
    const attempts = correct + incorrect;
    const accuracy = attempts > 0 ? (correct / attempts) * 100 : 0;
    const maxMarks = cfg.maxMarks ?? (totalQuestions * cfg.marksPerQ);
    const cSATPass = isCSAT && score >= 66.67;

    const handleSubjectChange = (val) => {
        setSelectedOption(val);
        if (val !== '__custom__') setCustomSubjectName('');
        const c = getSubjectConfig(val);
        setTotalQuestions(c.totalQ);
        setCorrect(0);
        setIncorrect(0);
    };

    const handleNum = (setter, val, max) => {
        const n = parseInt(val) || 0;
        if (n >= 0 && (!max || n <= max)) setter(n);
    };

    const handleSave = () => {
        if (isCustomMode && !customSubjectName.trim()) return;
        const timestamp = initialData?.date || new Date().toISOString();
        const payload = {
            type: 'SUBJECT_TEST',
            date: timestamp,
            subject: subjectName,
            testName: testName.trim() || null,
            totalQuestions,
            subCorrect: correct,
            subIncorrect: incorrect,
            score, attempts, accuracy,
        };
        if (initialData) onUpdate({ ...payload, id: initialData.id });
        else onSave(payload);
    };

    return (
        <div className="calculator-container fade-in">
            <div className="single-card-container">
                <section className="glass-card paper-card active-card">

                    {/* Header: subject selector */}
                    <div className="card-header">
                        <h2>Score Entry</h2>
                        <div className="subject-selector">
                            <select
                                className="dropdown subject-dropdown"
                                value={selectedOption}
                                onChange={e => handleSubjectChange(e.target.value)}
                                style={{
                                    borderColor: (isCustomMode ? '#94a3b8' : subStyle.color) + '88',
                                    color: isCustomMode ? '#94a3b8' : subStyle.color,
                                }}>
                                {SUBJECTS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                                <option value="__custom__">＋ Custom…</option>
                            </select>
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

                    {/* Subject pill */}
                    <div className="subject-pill" style={{ background: subStyle.bg, color: subStyle.color }}>
                        {subjectName === 'AMAC'         ? 'Ancient · Medieval · Art & Culture'    :
                         subjectName === 'GS Paper I'   ? 'GS Paper I · 100 Qs · Merit Decider'   :
                         subjectName === 'CSAT Paper II'? 'CSAT Paper II · 80 Qs · Qualifying (66.67+)' :
                         subjectName}
                        {isCustomMode && ' · Custom'}
                    </div>

                    {/* Test name */}
                    <div className="test-name-row">
                        <label className="test-name-label">
                            Test Name <span className="optional-hint">(optional)</span>
                        </label>
                        <input
                            type="text"
                            className="test-name-input"
                            value={testName}
                            onChange={e => setTestName(e.target.value)}
                            placeholder="e.g. Drishti Mock 5, Shankar IAS Ch. 4…"
                            maxLength={80}
                        />
                    </div>

                    {/* Score display */}
                    <div className="score-display">
                        <div className={`score-value ${isCSAT ? (cSATPass ? 'text-success' : 'text-danger') : ''}`}>
                            {score.toFixed(2)}
                        </div>
                        <div className="score-label">
                            {isCSAT
                                ? `Marks · ${cSATPass ? '✓ Qualified' : `Needs ${66.67 - score > 0 ? (66.67 - score).toFixed(2) : 0} more`}`
                                : `Marks Obtained`}
                        </div>
                        <div className="score-bar">
                            <div className="progress" style={{
                                width: `${Math.min((score / maxMarks) * 100, 100)}%`,
                                background: isCSAT
                                    ? (cSATPass ? 'var(--color-success)' : 'var(--color-error)')
                                    : subStyle.color,
                                boxShadow: `0 0 10px ${subStyle.color}`,
                            }} />
                            {isCSAT && (
                                <div className="marker" style={{ left: '33.33%' }} title="66.67 qualifying mark" />
                            )}
                        </div>
                    </div>

                    {/* Config row */}
                    <div className="config-row">
                        <div className="config-item">
                            <label>Total Questions</label>
                            {(isGSP1 || isCSAT) ? (
                                <div className="static-val">{totalQuestions}</div>
                            ) : (
                                <input type="number"
                                    value={totalQuestions === 0 ? '' : totalQuestions}
                                    onChange={e => setTotalQuestions(e.target.value === '' ? 0 : parseInt(e.target.value))}
                                    className="config-input" placeholder="50" />
                            )}
                        </div>
                        <div className="config-item">
                            <label>Max Marks</label>
                            <div className="static-val">{maxMarks}</div>
                        </div>
                        <div className="config-item">
                            <label>Marking</label>
                            <div className="static-val">+{cfg.marksPerQ} / -{cfg.negPerQ.toFixed(2)}</div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">Attempts</span>
                            <span className="stat-val">{attempts} / {totalQuestions}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Accuracy</span>
                            <span className="stat-val">{accuracy.toFixed(0)}%</span>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="inputs-wrapper">
                        <div className="input-group">
                            <label className="input-label">Correct (+{cfg.marksPerQ})</label>
                            <input type="number" className="input-field success-border"
                                value={correct || ''}
                                onChange={e => handleNum(setCorrect, e.target.value, totalQuestions)}
                                placeholder="0" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Incorrect (-{cfg.negPerQ.toFixed(2)})</label>
                            <input type="number" className="input-field error-border"
                                value={incorrect || ''}
                                onChange={e => handleNum(setIncorrect, e.target.value, totalQuestions)}
                                placeholder="0" />
                        </div>
                    </div>
                </section>
            </div>

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
