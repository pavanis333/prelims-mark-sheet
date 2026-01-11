import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import '../App.css';

const SUBJECTS = [
    'Polity', 'History', 'Geography', 'Economy',
    'Environment', 'Science & Tech', 'Current Affairs', 'General Knowledge', 'CSAT'
];

export default function Calculator({ onSave, onUpdate, initialData, onCancelEdit }) {
    const [activeTab, setActiveTab] = useState(initialData?.type === 'SUBJECT_TEST' ? 'subject' : 'full');

    // --- Helper to recover legacy data ---
    const recoverStats = (score, attempts, correct, incorrect, marksPerQ, negPerQ) => {
        if (correct !== undefined) return { c: correct, i: incorrect };
        // Solve: (C * Pos) - ((Attempts - C) * Neg) = Score
        // C * Pos - Attempts*Neg + C*Neg = Score
        // C (Pos + Neg) = Score + Attempts*Neg
        // C = (Score + Attempts*Neg) / (Pos + Neg)
        if (!attempts) return { c: 0, i: 0 };

        const c = Math.round((score + (attempts * negPerQ)) / (marksPerQ + negPerQ));
        const i = attempts - c;
        return { c: Math.max(0, c), i: Math.max(0, i) };
    };

    const p1Stats = recoverStats(
        initialData?.p1Score || 0,
        initialData?.p1Attempts || 0,
        initialData?.p1Correct,
        initialData?.p1Incorrect,
        2,
        2 / 3
    );

    // --- Full Length Mock State ---
    const [p1Correct, setP1Correct] = useState(p1Stats.c);
    const [p1Incorrect, setP1Incorrect] = useState(p1Stats.i);

    // For P2, we don't always have score/attempts consistently in legacy full mock? 
    // Usually P2 was calculated. Let's assume P2 Legacy might be missing too.
    const p2Stats = recoverStats(
        initialData?.p2Score || 0,
        initialData?.p2Attempts || 0,
        initialData?.p2Correct,
        initialData?.p2Incorrect,
        2.5,
        2.5 / 3 // 0.833
    );

    const [p2Correct, setP2Correct] = useState(p2Stats.c);
    const [p2Incorrect, setP2Incorrect] = useState(p2Stats.i);

    // --- Subject Wise State ---
    const initialSubject = initialData?.subject || 'Polity';
    // CSAT Check for migration
    const isSubCSAT = initialSubject === 'CSAT';
    const subMarks = isSubCSAT ? 2.5 : 2;
    const subNeg = isSubCSAT ? (2.5 / 3) : (2 / 3);

    const subStats = recoverStats(
        initialData?.score || 0,
        initialData?.attempts || 0,
        initialData?.subCorrect,
        initialData?.subIncorrect,
        subMarks,
        subNeg
    );

    const [subjectName, setSubjectName] = useState(initialSubject);
    const [totalQuestions, setTotalQuestions] = useState(initialData?.totalQuestions || 50);
    const [subCorrect, setSubCorrect] = useState(subStats.c);
    const [subIncorrect, setSubIncorrect] = useState(subStats.i);

    // --- Derived State (Full Mock) ---
    const [p1Score, setP1Score] = useState(0);
    const [p2Score, setP2Score] = useState(0);
    const [p1Attempts, setP1Attempts] = useState(0);
    const [p2Attempts, setP2Attempts] = useState(0);
    const [p2Qualified, setP2Qualified] = useState(false);

    // --- Derived State (Subject) ---
    const [subScore, setSubScore] = useState(0);
    const [subAttempts, setSubAttempts] = useState(0);

    const P1_TOTAL_Q = 100;
    const P2_TOTAL_Q = 80;
    const P2_QUALIFYING_MARKS = 66.67;

    const isCSAT = subjectName === 'CSAT';
    const marksPerQ = isCSAT ? 2.5 : 2;
    const negativePerQ = isCSAT ? (2.5 / 3) : (2 / 3);

    // Calculate Full Mock Scores
    useEffect(() => {
        // GS Paper 1
        const p1Raw = (p1Correct * 2) - (p1Incorrect * (2 / 3));
        setP1Score(Math.max(0, p1Raw));
        setP1Attempts(p1Correct + p1Incorrect);

        // CSAT Paper 2
        const p2Raw = (p2Correct * 2.5) - (p2Incorrect * (2.5 / 3));
        setP2Score(p2Raw);
        setP2Attempts(p2Correct + p2Incorrect);
        setP2Qualified(p2Raw >= P2_QUALIFYING_MARKS);

    }, [p1Correct, p1Incorrect, p2Correct, p2Incorrect]);

    // Calculate Subject Wise Scores
    useEffect(() => {
        const raw = (subCorrect * marksPerQ) - (subIncorrect * negativePerQ);
        setSubScore(Math.max(0, raw));
        setSubAttempts(subCorrect + subIncorrect);
    }, [subCorrect, subIncorrect, marksPerQ, negativePerQ]);


    const handleInputChange = (setter, val, max) => {
        const num = parseInt(val) || 0;
        if (num >= 0 && (!max || num <= max)) {
            setter(num);
        }
    };

    const handleSave = () => {
        const timestamp = initialData?.date || new Date().toISOString();

        if (activeTab === 'full') {
            const payload = {
                type: 'FULL_MOCK',
                date: timestamp,
                p1Correct, p1Incorrect, // Save raw inputs
                p2Correct, p2Incorrect,
                p1Score, p2Score,
                p1Attempts, p2Attempts,
                p2Qualified,
                totalScore: p2Qualified ? p1Score : 0
            };

            if (initialData) {
                onUpdate({ ...payload, id: initialData.id });
                alert('Mock Test Updated!');
            } else {
                onSave(payload);
                alert('Mock Test Result Saved!');
            }

        } else {
            const payload = {
                type: 'SUBJECT_TEST',
                date: timestamp,
                subject: subjectName,
                totalQuestions,
                subCorrect, subIncorrect, // Save raw inputs
                score: subScore,
                attempts: subAttempts,
                accuracy: subAttempts > 0 ? (subCorrect / subAttempts) * 100 : 0
            };

            if (initialData) {
                onUpdate({ ...payload, id: initialData.id });
                alert('Subject Test Updated!');
            } else {
                onSave(payload);
                alert(`${subjectName} Test Result Saved!`);
            }
        }
    };

    return (
        <div className="calculator-container fade-in">

            {/* Navigation Tabs (Sub-tabs for calculator) */}
            <div className="sub-tabs">
                <button
                    className={`tab-btn-sm ${activeTab === 'full' ? 'active' : ''}`}
                    onClick={() => setActiveTab('full')}
                >
                    Full Mock
                </button>
                <button
                    className={`tab-btn-sm ${activeTab === 'subject' ? 'active' : ''}`}
                    onClick={() => setActiveTab('subject')}
                >
                    Subject Wise
                </button>
            </div>

            {/* --- FULL LENGTH TEST VIEW --- */}
            {activeTab === 'full' && (
                <div className="grid-container">
                    {/* Paper 1 Section */}
                    <section className="glass-card paper-card">
                        <div className="card-header">
                            <h2>GS Paper I</h2>
                            <span className="badge">Merit Decider</span>
                        </div>

                        <div className="score-display">
                            <div className="score-value">{p1Score.toFixed(2)}</div>
                            <div className="score-label">Marks Obtained</div>
                            <div className="score-bar">
                                <div className="progress" style={{ width: `${Math.min((p1Score / 200) * 100, 100)}%` }}></div>
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
                                <input
                                    type="number"
                                    className="input-field success-border"
                                    value={p1Correct || ''}
                                    onChange={(e) => handleInputChange(setP1Correct, e.target.value, P1_TOTAL_Q)}
                                    placeholder="0"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Incorrect (-0.66)</label>
                                <input
                                    type="number"
                                    className="input-field error-border"
                                    value={p1Incorrect || ''}
                                    onChange={(e) => handleInputChange(setP1Incorrect, e.target.value, P1_TOTAL_Q)}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Paper 2 Section */}
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
                            <div className="score-label">Marks (Needs {P2_QUALIFYING_MARKS}+)</div>
                            <div className="score-bar">
                                <div
                                    className={`progress ${p2Qualified ? 'bg-success' : 'bg-danger'}`}
                                    style={{ width: `${Math.min((p2Score / 200) * 100, 100)}%` }}
                                ></div>
                                <div className="marker" style={{ left: '33.33%' }} title="Passing Mark"></div>
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
                                <input
                                    type="number"
                                    className="input-field success-border"
                                    value={p2Correct || ''}
                                    onChange={(e) => handleInputChange(setP2Correct, e.target.value, P2_TOTAL_Q)}
                                    placeholder="0"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Incorrect (-0.83)</label>
                                <input
                                    type="number"
                                    className="input-field error-border"
                                    value={p2Incorrect || ''}
                                    onChange={(e) => handleInputChange(setP2Incorrect, e.target.value, P2_TOTAL_Q)}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* --- SUBJECT WISE TEST VIEW --- */}
            {activeTab === 'subject' && (
                <div className="single-card-container">
                    <section className="glass-card paper-card active-card">
                        <div className="card-header">
                            <h2>Subject Test</h2>
                            <div className="select-container">
                                <select
                                    className="dropdown"
                                    value={subjectName}
                                    onChange={(e) => setSubjectName(e.target.value)}
                                >
                                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="score-display">
                            <div className="score-value">{subScore.toFixed(2)}</div>
                            <div className="score-label">Marks Obtained</div>
                            <div className="score-bar">
                                <div className="progress" style={{ width: `${Math.min((subScore / (totalQuestions * marksPerQ)) * 100, 100)}%` }}></div>
                            </div>
                        </div>

                        <div className="config-row">
                            <div className="config-item">
                                <label>Total Questions</label>
                                <input
                                    type="number"
                                    value={totalQuestions === 0 ? '' : totalQuestions}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setTotalQuestions(val === '' ? 0 : parseInt(val));
                                    }}
                                    className="config-input"
                                    placeholder="50"
                                />
                            </div>
                            <div className="config-item">
                                <label>Max Marks</label>
                                <div className="static-val">{totalQuestions * marksPerQ}</div>
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
                                <label className="input-label">Correct Answers (+{marksPerQ})</label>
                                <input
                                    type="number"
                                    className="input-field success-border"
                                    value={subCorrect || ''}
                                    onChange={(e) => handleInputChange(setSubCorrect, e.target.value, totalQuestions)}
                                    placeholder="0"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Incorrect Answers (-{negativePerQ.toFixed(2)})</label>
                                <input
                                    type="number"
                                    className="input-field error-border"
                                    value={subIncorrect || ''}
                                    onChange={(e) => handleInputChange(setSubIncorrect, e.target.value, totalQuestions)}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </section>
                </div>
            )}

            <div className="action-row">
                <button className="btn-save" onClick={handleSave}>
                    <Save size={18} />
                    {initialData ? 'Update Result' : 'Save Result'}
                </button>
            </div>
        </div>
    );
}
