import React, { useState } from 'react';
import { Save } from 'lucide-react';
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
];

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

const getSubStyle = (name) => SUBJECT_COLORS[name] || SUBJECT_COLORS['__custom__'];

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

    // ── Full Mock ──
    const p1Stats = recoverStats(
        initialData?.p1Score || 0, initialData?.p1Attempts || 0,
        initialData?.p1Correct, initialData?.p1Incorrect, 2, 2 / 3
    );
    const p2Stats = recoverStats(
        initialData?.p2Score || 0, initialData?.p2Attempts || 0,
        initialData?.p2Correct, initialData?.p2Incorrect, 2.5, 2.5 / 3
    );

    const [p1Correct, setP1Correct]     = useState(p1Stats.c);
    const [p1Incorrect, setP1Incorrect] = useState(p1Stats.i);
    const [p2Correct, setP2Correct]     = useState(p2Stats.c);
    const [p2Incorrect, setP2Incorrect] = useState(p2Stats.i);
    const [mockTestName, setMockTestName] = useState(initialData?.testName || '');

    const p1Attempts  = p1Correct + p1Incorrect;
    const p2Attempts  = p2Correct + p2Incorrect;
    const p1Score     = Math.max(0, p1Correct * 2 - p1Incorrect * (2 / 3));
    const p2Score     = p2Correct * 2.5 - p2Incorrect * (2.5 / 3);
    const p2Qualified = p2Score >= 66.67;

    // ── Subject Wise ──
    const rawSub          = initialData?.subject || 'AMAC';
    const initialSubject  = normaliseSub(rawSub);
    const isInitialCustom = !SUBJECTS.includes(initialSubject);

    const [selectedOption, setSelectedOption]       = useState(isInitialCustom ? '__custom__' : initialSubject);
    const [customSubjectName, setCustomSubjectName] = useState(isInitialCustom ? initialSubject : '');
    const [totalQuestions, setTotalQuestions]       = useState(initialData?.totalQuestions || 50);
    const [testName, setTestName]                   = useState(initialData?.testName || '');

    const isCustomMode = selectedOption === '__custom__';
    const subjectName  = isCustomMode ? (customSubjectName.trim() || 'Custom') : selectedOption;
    const marksPerQ    = 2;
    const negativePerQ = 2 / 3;

    const handleSubjectChange = (val) => {
        setSelectedOption(val);
        if (val !== '__custom__') setCustomSubjectName('');
        setTotalQuestions(50);
    };

    const subStats = recoverStats(
        initialData?.score || 0, initialData?.attempts || 0,
        initialData?.subCorrect, initialData?.subIncorrect, marksPerQ, negativePerQ
    );
    const [subCorrect, setSubCorrect]     = useState(subStats.c);
    const [subIncorrect, setSubIncorrect] = useState(subStats.i);
    const subScore    = Math.max(0, subCorrect * marksPerQ - subIncorrect * negativePerQ);
    const subAttempts = subCorrect + subIncorrect;

    const subStyle = getSubStyle(isCustomMode ? '__custom__' : subjectName);

    const P1_TOTAL_Q = 100;
    const P2_TOTAL_Q = 80;

    const handleNum = (setter, val, max) => {
        const n = parseInt(val) || 0;
        if (n >= 0 && (!max || n <= max)) setter(n);
    };

    const handleSave = () => {
        const timestamp = initialData?.date || new Date().toISOString();

        if (activeTab === 'full') {
            const payload = {
                type: 'FULL_MOCK', date: timestamp,
                testName: mockTestName.trim() || null,
                p1Correct, p1Incorrect, p2Correct, p2Incorrect,
                p1Score, p2Score, p1Attempts, p2Attempts, p2Qualified,
                totalScore: p2Qualified ? p1Score : 0,
            };
            if (initialData) onUpdate({ ...payload, id: initialData.id });
            else onSave(payload);
        } else {
            if (isCustomMode && !customSubjectName.trim()) return;
            const payload = {
                type: 'SUBJECT_TEST', date: timestamp,
                subject: subjectName,
                testName: testName.trim() || null,
                totalQuestions,
                subCorrect, subIncorrect,
                score: subScore, attempts: subAttempts,
                accuracy: subAttempts > 0 ? (subCorrect / subAttempts) * 100 : 0,
            };
            if (initialData) onUpdate({ ...payload, id: initialData.id });
            else onSave(payload);
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
                <div className="grid-container">

                    {/* Test name — spans full width */}
                    <div className="full-mock-test-name">
                        <label className="test-name-label">
                            Mock Test Name <span className="optional-hint">(optional)</span>
                        </label>
                        <input
                            type="text"
                            className="test-name-input"
                            value={mockTestName}
                            onChange={e => setMockTestName(e.target.value)}
                            placeholder="e.g. Drishti Mock 5, Vision IAS Full Test…"
                            maxLength={80}
                        />
                    </div>

                    {/* GS Paper I */}
                    <section className="glass-card paper-card">
                        <div className="card-header">
                            <h2>GS Paper I</h2>
                            <span className="badge">Merit Decider</span>
                        </div>
                        <div className="score-display">
                            <div className="score-value">{p1Score.toFixed(2)}</div>
                            <div className="score-label">Marks Obtained</div>
                            <div className="score-bar">
                                <div className="progress"
                                    style={{ width: `${Math.min((p1Score / 200) * 100, 100)}%` }} />
                            </div>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-label">Attempts</span>
                                <span className="stat-val">{p1Attempts} / {P1_TOTAL_Q}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Accuracy</span>
                                <span className="stat-val">
                                    {p1Attempts > 0 ? ((p1Correct / p1Attempts) * 100).toFixed(0) : 0}%
                                </span>
                            </div>
                        </div>
                        <div className="inputs-wrapper">
                            <div className="input-group">
                                <label className="input-label">Correct (+2)</label>
                                <input type="number" className="input-field success-border"
                                    value={p1Correct || ''}
                                    onChange={e => handleNum(setP1Correct, e.target.value, P1_TOTAL_Q)}
                                    placeholder="0" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Incorrect (-0.66)</label>
                                <input type="number" className="input-field error-border"
                                    value={p1Incorrect || ''}
                                    onChange={e => handleNum(setP1Incorrect, e.target.value, P1_TOTAL_Q)}
                                    placeholder="0" />
                            </div>
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
                                <input type="number" className="input-field success-border"
                                    value={p2Correct || ''}
                                    onChange={e => handleNum(setP2Correct, e.target.value, P2_TOTAL_Q)}
                                    placeholder="0" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Incorrect (-0.83)</label>
                                <input type="number" className="input-field error-border"
                                    value={p2Incorrect || ''}
                                    onChange={e => handleNum(setP2Incorrect, e.target.value, P2_TOTAL_Q)}
                                    placeholder="0" />
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

                        <div className="subject-pill" style={{ background: subStyle.bg, color: subStyle.color }}>
                            {subjectName === 'AMAC' ? 'Ancient · Medieval · Art & Culture' : subjectName}
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
                                <input type="number" className="input-field success-border"
                                    value={subCorrect || ''}
                                    onChange={e => handleNum(setSubCorrect, e.target.value, totalQuestions)}
                                    placeholder="0" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Incorrect (-{negativePerQ.toFixed(2)})</label>
                                <input type="number" className="input-field error-border"
                                    value={subIncorrect || ''}
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
