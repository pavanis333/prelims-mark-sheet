import React, { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, Award, Activity, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import '../App.css';

export default function Dashboard({ data }) {
    const { tests } = data;

    // -- Process Data for Charts --
    const fullMocks = useMemo(() =>
        tests.filter(t => t.type === 'FULL_MOCK').reverse(), // Oldest first for line chart
        [tests]);

    const subjectTests = useMemo(() =>
        tests.filter(t => t.type === 'SUBJECT_TEST'),
        [tests]);

    // Overall Stats
    const totaltests = tests.length;
    const bestMockScore = fullMocks.length > 0 ? Math.max(...fullMocks.map(t => t.p1Score)) : 0;
    const avgMockScore = fullMocks.length > 0
        ? (fullMocks.reduce((acc, curr) => acc + curr.p1Score, 0) / fullMocks.length).toFixed(1)
        : 0;

    // Chart Data: Full Mock Trend
    const trendData = fullMocks.map((t, idx) => ({
        name: `Test ${idx + 1}`,
        date: format(new Date(t.date), 'MMM d'),
        score: t.p1Score,
        qualified: t.p2Qualified
    }));

    // Chart Data: Subject Performance (Average Score per Subject)
    const subjectPerformance = useMemo(() => {
        const grouped = {};
        subjectTests.forEach(t => {
            if (!grouped[t.subject]) grouped[t.subject] = { total: 0, count: 0 };
            grouped[t.subject].total += t.score;
            grouped[t.subject].count += 1;
        });
        return Object.keys(grouped).map(sub => ({
            name: sub,
            avg: (grouped[sub].total / grouped[sub].count).toFixed(1)
        }));
    }, [subjectTests]);

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

            {/* Key Metrics */}
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
                        <span className="value">{totaltests}</span>
                    </div>
                </div>
            </div>

            {/* Charts Row 1: Mock Trend */}
            <section className="chart-section glass-card">
                <h3>GS Paper I Performance Trend</h3>
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ca8a04" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ca8a04" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="score" stroke="#ca8a04" fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Charts Row 2: Subject Wise */}
            {subjectPerformance.length > 0 && (
                <section className="chart-section glass-card">
                    <h3>Subject-wise Average Score</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={subjectPerformance}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                />
                                <Bar dataKey="avg" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

        </div>
    );
}
