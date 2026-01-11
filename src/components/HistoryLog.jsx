import React from 'react';
import { format } from 'date-fns';
import { Trash2, Edit2 } from 'lucide-react';

export default function HistoryLog({ data, onDelete, onEdit, onClearAll }) {
    const { tests } = data;

    if (tests.length === 0) {
        return (
            <div className="empty-history">
                <p>No history yet.</p>
            </div>
        );
    }

    return (
        <div className="history-container fade-in">
            <div className="history-toolbar">
                <h3>Recent Tests</h3>
                <button className="btn-sm danger-text" onClick={onClearAll}>
                    <Trash2 size={14} /> Clear All History
                </button>
            </div>

            {tests.map((test) => (
                <div key={test.id} className="history-card glass-card">
                    <div className="history-header">
                        <div className="header-left">
                            <span className={`tag ${test.type === 'FULL_MOCK' ? 'tag-mock' : 'tag-subject'} `}>
                                {test.type === 'FULL_MOCK' ? 'Full Mock' : test.subject}
                            </span>
                            <span className="date">{format(new Date(test.date), 'MMM d, h:mm a')}</span>
                        </div>
                        <div className="header-actions">
                            <button className="btn-icon" onClick={() => onEdit(test)} title="Edit">
                                <Edit2 size={16} />
                            </button>
                            <button className="btn-icon danger" onClick={() => onDelete(test.id)} title="Delete">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="history-body">
                        {test.type === 'FULL_MOCK' ? (
                            <>
                                <div className="res-row">
                                    <span className="text-muted">Attempts:</span>
                                    <span>{test.p1Attempts}</span>
                                </div>
                                <div className="res-row">
                                    <span>GS Score:</span>
                                    <span className="val-high">{test.p1Score.toFixed(2)}</span>
                                </div>
                                {test.p1Correct !== undefined && (
                                    <div className="res-sub-row">
                                        <span className="text-success text-xs">{test.p1Correct} C</span> /
                                        <span className="text-danger text-xs"> {test.p1Incorrect} W</span>
                                    </div>
                                )}
                                <div className="divider"></div>
                                <div className="res-row">
                                    <span>CSAT:</span>
                                    <span className={test.p2Qualified ? 'text-success' : 'text-danger'}>
                                        {test.p2Score.toFixed(2)}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="res-row">
                                    <span>Score:</span>
                                    <span className="val-high">{test.score.toFixed(2)}</span>
                                </div>
                                <div className="res-row">
                                    <span>Accuracy:</span>
                                    <span>{test.accuracy ? test.accuracy.toFixed(0) : 0}%</span>
                                </div>
                                {test.subCorrect !== undefined && (
                                    <div className="res-sub-row">
                                        <span className="text-success text-xs">{test.subCorrect} Correct</span>
                                        <span className="text-danger text-xs">{test.subIncorrect} Wrong</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
