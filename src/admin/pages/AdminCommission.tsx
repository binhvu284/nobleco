import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';

type Level = 'guest' | 'member' | 'unit manager' | 'brand manager';

type CommissionRate = {
    level: Level;
    selfCommission: number;      // Commission from own sales
    level1Commission: number;    // Commission from 1 level down
    level2Commission: number;    // Commission from 2 levels down
};

export default function AdminCommission() {
    const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([
        { level: 'guest', selfCommission: 5, level1Commission: 0, level2Commission: 0 },
        { level: 'member', selfCommission: 10, level1Commission: 2, level2Commission: 0 },
        { level: 'unit manager', selfCommission: 15, level1Commission: 5, level2Commission: 2 },
        { level: 'brand manager', selfCommission: 20, level1Commission: 8, level2Commission: 5 },
    ]);

    const [isEditing, setIsEditing] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const getLevelLabel = (level: Level) => {
        const labels: Record<Level, string> = {
            'guest': 'Guest',
            'member': 'Member',
            'unit manager': 'Unit Manager',
            'brand manager': 'Brand Manager'
        };
        return labels[level];
    };

    const getLevelColor = (level: Level) => {
        const colors: Record<Level, string> = {
            'guest': '#94a3b8',
            'member': '#3b82f6',
            'unit manager': '#8b5cf6',
            'brand manager': '#f59e0b'
        };
        return colors[level];
    };

    const handleRateChange = (level: Level, field: keyof Omit<CommissionRate, 'level'>, value: string) => {
        const numValue = parseFloat(value) || 0;
        setCommissionRates(rates =>
            rates.map(rate =>
                rate.level === level ? { ...rate, [field]: numValue } : rate
            )
        );
    };

    const handleSave = () => {
        // TODO: Save to database
        setIsEditing(false);
        setSuccessMessage('Commission rates updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleCancel = () => {
        // Reset to original values (TODO: fetch from database)
        setIsEditing(false);
    };

    return (
        <AdminLayout title="Commission Management">
            <div className="commission-page">
                {/* Header Section */}
                <div className="commission-header">
                    <div className="commission-header-content">
                        <div className="commission-header-text">
                            <h2 className="commission-title">Commission Rate Settings</h2>
                            <p className="commission-description">
                                Configure commission rates for each user level. Users earn commissions from their own sales 
                                and from their network (1 and 2 levels down).
                            </p>
                        </div>
                        {!isEditing && (
                            <button className="btn-primary" onClick={() => setIsEditing(true)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit Rates
                            </button>
                        )}
                    </div>
                </div>

                {/* Info Cards */}
                <div className="commission-info-cards">
                    <div className="info-card">
                        <div className="info-card-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                        </div>
                        <div className="info-card-content">
                            <div className="info-card-label">Self Commission</div>
                            <div className="info-card-description">Earned from own successful orders</div>
                        </div>
                    </div>
                    <div className="info-card">
                        <div className="info-card-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="info-card-content">
                            <div className="info-card-label">Level 1 Commission</div>
                            <div className="info-card-description">Earned from direct inferiors' orders</div>
                        </div>
                    </div>
                    <div className="info-card">
                        <div className="info-card-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="9" cy="7" r="4" />
                                <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                                <path d="M16 11h6m-3-3v6" />
                            </svg>
                        </div>
                        <div className="info-card-content">
                            <div className="info-card-label">Level 2 Commission</div>
                            <div className="info-card-description">Earned from 2nd level inferiors' orders</div>
                        </div>
                    </div>
                </div>

                {/* Commission Table */}
                <div className="commission-table-container">
                    <table className="commission-table">
                        <thead>
                            <tr>
                                <th style={{ width: '200px' }}>User Level</th>
                                <th>Self Commission</th>
                                <th>Level 1 Down</th>
                                <th>Level 2 Down</th>
                                <th style={{ width: '150px' }}>Total Potential</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commissionRates.map((rate) => (
                                <tr key={rate.level}>
                                    <td>
                                        <div className="level-cell">
                                            <div 
                                                className="level-indicator" 
                                                style={{ backgroundColor: getLevelColor(rate.level) }}
                                            />
                                            <span className="level-name">{getLevelLabel(rate.level)}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {isEditing ? (
                                            <div className="commission-input-group">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                    value={rate.selfCommission}
                                                    onChange={(e) => handleRateChange(rate.level, 'selfCommission', e.target.value)}
                                                    className="commission-input"
                                                />
                                                <span className="input-suffix">%</span>
                                            </div>
                                        ) : (
                                            <span className="commission-value">{rate.selfCommission}%</span>
                                        )}
                                    </td>
                                    <td>
                                        {isEditing ? (
                                            <div className="commission-input-group">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                    value={rate.level1Commission}
                                                    onChange={(e) => handleRateChange(rate.level, 'level1Commission', e.target.value)}
                                                    className="commission-input"
                                                />
                                                <span className="input-suffix">%</span>
                                            </div>
                                        ) : (
                                            <span className="commission-value">{rate.level1Commission}%</span>
                                        )}
                                    </td>
                                    <td>
                                        {isEditing ? (
                                            <div className="commission-input-group">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                    value={rate.level2Commission}
                                                    onChange={(e) => handleRateChange(rate.level, 'level2Commission', e.target.value)}
                                                    className="commission-input"
                                                />
                                                <span className="input-suffix">%</span>
                                            </div>
                                        ) : (
                                            <span className="commission-value">{rate.level2Commission}%</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="total-commission">
                                            {rate.selfCommission + rate.level1Commission + rate.level2Commission}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                    <div className="commission-actions">
                        <button className="btn-secondary" onClick={handleCancel}>
                            Cancel
                        </button>
                        <button className="btn-primary" onClick={handleSave}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>
                            Save Changes
                        </button>
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="notification notification-success">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>{successMessage}</span>
                        <button className="notification-close" onClick={() => setSuccessMessage(null)}>×</button>
                    </div>
                )}

                {/* Example Section */}
                <div className="commission-example">
                    <h3 className="example-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        How It Works
                    </h3>
                    <div className="example-content">
                        <div className="example-scenario">
                            <div className="scenario-header">Example Scenario:</div>
                            <p>
                                <strong>Unit Manager</strong> makes a <strong>$1,000</strong> sale:
                            </p>
                            <ul className="scenario-breakdown">
                                <li>
                                    <span className="breakdown-label">Self Commission:</span>
                                    <span className="breakdown-value">${(1000 * 0.15).toFixed(2)} (15%)</span>
                                </li>
                                <li>
                                    <span className="breakdown-label">Their Member makes $500 sale:</span>
                                    <span className="breakdown-value">${(500 * 0.05).toFixed(2)} (5% of $500)</span>
                                </li>
                                <li>
                                    <span className="breakdown-label">Their Member's Guest makes $300 sale:</span>
                                    <span className="breakdown-value">${(300 * 0.02).toFixed(2)} (2% of $300)</span>
                                </li>
                                <li className="breakdown-total">
                                    <span className="breakdown-label"><strong>Total Earned:</strong></span>
                                    <span className="breakdown-value"><strong>${(150 + 25 + 6).toFixed(2)}</strong></span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
