import React, { useMemo } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, AreaChart, Area, Cell,
} from 'recharts';
import { TrendingUp, Award, Activity, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import '../App.css';
import { SUBJECTS, GS_SUBJECTS, SUBJECT_COLORS, normaliseSub } from './Calculator';

export default function Dashboard({ data }) {
    const { tests } = data;

    const fullMocks = useMemo(() =>
        tests.filter(t => t.type === 'FULL_MOCK').reverse(), [tests]);

    const subjectTests = useMemo(() =>
        tests.filter(t => t.type === 'SUBJECT_TEST'), [tests]);

    // Normalise legacy subject names in stored data
    const normalisedSubjectTests = useMemo(() =>
        subjectTests.map(t => ({ ...t, subject: normaliseSub(t.subject) })),
        [subjectTests]);

    // Stats
    const bestMockScore = fullMocks.length > 0 ? Math.max(...fullMocks.map(t => t.p1Score)) : 0;
    const avgMockScore  = fullMocks.length > 0
        ? (fullMocks.reduce((a, t) => a + t.p1Score, 0) / fullMocks.length).toFixed(1) : 0;
    const subjectsCovered = useMemo(() =>
        new Set(normalisedSubjectTests.map(t => t.subject)).size, [normalisedSubjectTests]);

    // Mock trend
    const trendData = fullMocks.map((t, i) => ({
        name: `Test ${i + 1}`,
        date: format(new Date(t.date), 'MMM d'),
        score: parseFloat(t.p1Score.toFixed(2)),
    }));

    // Per-subject aggregation — combine subject tests + full mock breakdowns
    const subjectPerformance = useMemo(() => {
        const grouped = {};

        // From standalone subject tests
        normalisedSubjectTests.forEach(t => {
            if (!grouped[t.subject]) grouped[t.subject] = { total: 0, count: 0 };
            grouped[t.subject].total += t.score;
            grouped[t.subject].count += 1;
        });

        // From full mock subject breakdowns
        fullMocks.forEach(mock => {
            if (!mock.subjectBreakdown) return;
            GS_SUBJECTS.forEach(sub => {
                const bd = mock.subjectBreakdown[sub];
                if (!bd) return;
                const score = Math.max(0, bd.correct * 2 - bd.incorrect * (2 / 3));
                if (bd.correct === 0 && bd.incorrect === 0) return; // skip blank rows
                if (!grouped[sub]) grouped[sub] = { total: 0, count: 0 };
                grouped[sub].total += score;
                grouped[sub].count += 1;
            });
        });

        return SUBJECTS.map(sub => {
            const g = grouped[sub];
            return {
                name: sub,
                avg: g ? parseFloat((g.total / g.count).toFixed(1)) : null,
                count: g ? g.count : 0,
                covered: !!g,
                color: (SUBJECT_COLORS[sub] || {}).color || '#94a3b8',
                bg: (SUBJECT_COLORS[sub] || {}).bg || 'rgba(148,163,184,0.15)',
            };
        });
    }, [normalisedSubjectTests, fullMocks]);

    const coveredSubjects = subjectPerformance.filter(s => s.covered && s.name !== 'CSAT');
    const weakSubjects    = coveredSubjects.filter(s => s.avg < 40);
    const strongSubjects  = coveredSubjects.filter(s => s.avg >= 60);

    if (tests.length === 0) {
        return (
            <div className="empty-state glass-card">
                <Activity size={48} className="empty-icon" />
                <h3>No Data Available</h3>
                <p>Take your first mock test to see analytics.</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container fade-in">

            {/* ── Metrics ── */}
            <div className="metrics-grid">
                <div className="metric-card glass-card">
                    <div className="metric-icon"><Award size={24} /></div>
                    <div className="metric-info">
                        <span className="label">Best GS Score</span>
                        <span className="value text-highlight">{bestMockScore.toFixed(2)}</span>
                    </div>
                </div>
                <div className="metric-card glass-card">
                    <div className="metric-icon"><TrendingUp size={24} /></div>
                    <div className="metric-info">
                        <span className="label">Avg GS Score</span>
                        <span className="value">{avgMockScore}</span>
                    </div>
                </div>
                <div className="metric-card glass-card">
                    <div className="metric-icon"><BookOpen size={24} /></div>
                    <div className="metric-info">
                        <span className="label">Tests Taken</span>
                        <span className="value">{tests.length}</span>
                    </div>
                </div>
                <div className="metric-card glass-card">
                    <div className="metric-icon"><Activity size={24} /></div>
                    <div className="metric-info">
                        <span className="label">Subjects Covered</span>
                        <span className="value">{subjectsCovered} / {SUBJECTS.length}</span>
                    </div>
                </div>
            </div>

            {/* ── Weak / Strong alerts ── */}
            {(weakSubjects.length > 0 || strongSubjects.length > 0) && (
                <div className="category-alerts-row">
                    {weakSubjects.length > 0 && (
                        <div className="alert-card alert-weak glass-card">
                            <div className="alert-header">
                                <AlertTriangle size={18} /> Needs Attention
                            </div>
                            <div className="alert-tags">
                                {weakSubjects.map(s => (
                                    <span key={s.name} className="alert-tag"
                                        style={{ background: s.bg, color: s.color }}>
                                        {s.name} · avg {s.avg}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {strongSubjects.length > 0 && (
                        <div className="alert-card alert-strong glass-card">
                            <div className="alert-header">
                                <CheckCircle size={18} /> Strong Areas
                            </div>
                            <div className="alert-tags">
                                {strongSubjects.map(s => (
                                    <span key={s.name} className="alert-tag"
                                        style={{ background: s.bg, color: s.color }}>
                                        {s.name} · avg {s.avg}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Subject Score Cards ── */}
            <section className="chart-section glass-card">
                <h3>Subject Overview</h3>
                <div className="subject-score-grid">
                    {subjectPerformance.map(s => (
                        <div key={s.name} className={`subj-card ${!s.covered ? 'subj-card-empty' : ''}`}
                            style={{ borderColor: s.color + (s.covered ? '66' : '22'), background: s.covered ? s.bg : 'rgba(255,255,255,0.02)' }}>
                            <div className="subj-name" style={{ color: s.covered ? s.color : s.color + '55' }}>
                                {s.name}
                            </div>
                            <div className="subj-score" style={{ opacity: s.covered ? 1 : 0.25 }}>
                                {s.covered ? s.avg : '—'}
                            </div>
                            <div className="subj-meta">
                                {s.covered ? `${s.count} test${s.count > 1 ? 's' : ''}` : 'No tests yet'}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Mock Trend ── */}
            {fullMocks.length > 0 && (
                <section className="chart-section glass-card">
                    <h3>GS Paper I Performance Trend</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#ca8a04" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ca8a04" stopOpacity={0}   />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" domain={[0, 200]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#ca8a04"
                                    fillOpacity={1} fill="url(#scoreGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            {/* ── Subject Bar Chart ── */}
            {subjectPerformance.some(s => s.covered) && (
                <section className="chart-section glass-card">
                    <h3>Subject-wise Average Score <span style={{fontSize:'0.75rem', color:'#9ca3af', fontWeight:400}}>(across all tests)</span></h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={subjectPerformance.filter(s => s.covered)}
                                margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                    formatter={(val) => [val, 'Avg Score']}
                                />
                                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                                    {subjectPerformance.filter(s => s.covered).map((s, i) => (
                                        <Cell key={i} fill={s.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            {/* ── Per-Mock Subject Breakdown ── */}
            {fullMocks.some(m => m.subjectBreakdown) && (
                <section className="chart-section glass-card">
                    <h3>Mock-wise Subject Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
                        {fullMocks.map((mock, idx) => {
                            if (!mock.subjectBreakdown) return null;
                            return (
                                <div key={mock.date || idx} className="mock-breakdown-row">
                                    <div className="mock-breakdown-label">
                                        <span className="mock-num">Mock {fullMocks.length - idx}</span>
                                        <span className="mock-date">{format(new Date(mock.date), 'MMM d, yyyy')}</span>
                                        <span className="mock-total" style={{ color: '#ca8a04' }}>{mock.p1Score?.toFixed(1)} pts</span>
                                    </div>
                                    <div className="mock-sub-bars">
                                        {GS_SUBJECTS.map(sub => {
                                            const bd = mock.subjectBreakdown[sub] || { correct: 0, incorrect: 0 };
                                            const score = Math.max(0, bd.correct * 2 - bd.incorrect * (2 / 3));
                                            const style = SUBJECT_COLORS[sub];
                                            return (
                                                <div key={sub} className="mock-sub-item">
                                                    <span className="mock-sub-name" style={{ color: style.color }}>{sub}</span>
                                                    <div className="mock-sub-bar-bg">
                                                        <div className="mock-sub-bar-fill"
                                                            style={{ width: `${Math.min((score / 40) * 100, 100)}%`, background: style.color }} />
                                                    </div>
                                                    <span className="mock-sub-val">{score.toFixed(1)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

        </div>
    );
}
