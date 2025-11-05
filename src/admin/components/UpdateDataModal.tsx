import { useState, useEffect } from 'react';
import { IconX, IconCheck, IconAlertCircle, IconLoader } from './icons';

interface ThirdPartyIntegration {
    id: number;
    name: string;
    display_name: string;
    is_default: boolean;
    is_active: boolean;
    last_sync_at?: string | null;
}

interface UpdateDataModalProps {
    open: boolean;
    onClose: () => void;
    onSync?: (integrationId: number) => void;
    autoSyncEnabled?: boolean;
    onAutoSyncChange?: (enabled: boolean) => void;
}

export default function UpdateDataModal({ open, onClose, onSync, autoSyncEnabled = false, onAutoSyncChange }: UpdateDataModalProps) {
    const [selectedIntegration, setSelectedIntegration] = useState<string>('kiotviet');
    const [integrations, setIntegrations] = useState<ThirdPartyIntegration[]>([]);
    const [loading, setLoading] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<{ status: 'success' | 'error' | null, message: string }>({ status: null, message: '' });
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [syncProgress, setSyncProgress] = useState<{ stage: 'idle' | 'connecting' | 'fetching' | 'updating' | 'complete', message: string }>({ stage: 'idle', message: '' });
    const [syncResults, setSyncResults] = useState<{ total: number, created?: number, updated: number, deleted?: number, failed: number, skipped?: number } | null>(null);

    useEffect(() => {
        if (open) {
            fetchIntegrations();
        }
    }, [open]);

    const fetchIntegrations = async () => {
        try {
            // Fetch integrations from API
            const response = await fetch('/api/integrations/list');
            if (response.ok) {
                const data = await response.json();
                if (data.integrations && Array.isArray(data.integrations)) {
                    setIntegrations(data.integrations);
                    // Set default selection
                    const defaultIntegration = data.integrations.find((i: ThirdPartyIntegration) => i.is_default);
                    if (defaultIntegration) {
                        setSelectedIntegration(defaultIntegration.name);
                    }
                } else {
                    // Fallback to mock data if API structure is different
                    useMockIntegrations();
                }
            } else {
                // Fallback to mock data if API fails
                useMockIntegrations();
            }
        } catch (error) {
            console.error('Error fetching integrations:', error);
            // Fallback to mock data
            useMockIntegrations();
        }
    };

    const useMockIntegrations = () => {
        const mockIntegrations: ThirdPartyIntegration[] = [
            {
                id: 1,
                name: 'kiotviet',
                display_name: 'KiotViet',
                is_default: true,
                is_active: true,
                last_sync_at: null
            },
            {
                id: 2,
                name: 'other',
                display_name: 'Other',
                is_default: false,
                is_active: false,
                last_sync_at: null
            }
        ];
        setIntegrations(mockIntegrations);
        const defaultIntegration = mockIntegrations.find(i => i.is_default);
        if (defaultIntegration) {
            setSelectedIntegration(defaultIntegration.name);
        }
    };

    const handleIntegrationSelect = (integrationName: string) => {
        if (integrationName === 'other') {
            setShowComingSoon(true);
            return;
        }
        setSelectedIntegration(integrationName);
    };

    const handleTestConnection = async () => {
        if (!selectedIntegration || selectedIntegration === 'other') {
            return;
        }

        const integration = integrations.find(i => i.name === selectedIntegration);
        if (!integration) return;

        setTestingConnection(true);
        setConnectionStatus({ status: null, message: '' });

        try {
            const response = await fetch(`/api/integrations/test?integrationId=${integration.id}`, { 
                method: 'GET' 
            });
            
            const data = await response.json();
            
            if (data.success) {
                setConnectionStatus({
                    status: 'success',
                    message: data.message || 'Connection successful! API is ready to sync data.'
                });
            } else {
                throw new Error(data.message || 'Connection failed');
            }
        } catch (error) {
            console.error('Error testing connection:', error);
            setConnectionStatus({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to connect to API. Please check your credentials and try again.'
            });
        } finally {
            setTestingConnection(false);
        }
    };

    const handleSync = async () => {
        if (!selectedIntegration || selectedIntegration === 'other') {
            return;
        }

        const integration = integrations.find(i => i.name === selectedIntegration);
        if (!integration) return;

        setLoading(true);
        setConnectionStatus({ status: null, message: '' });
        setSyncProgress({ stage: 'connecting', message: 'Connecting to API...' });
        setSyncResults(null);

        try {
            // Stage 1: Connect to API
            setSyncProgress({ stage: 'connecting', message: 'Connecting to KiotViet API...' });
            const testResponse = await fetch(`/api/integrations/test?integrationId=${integration.id}`);
            const testData = await testResponse.json();
            
            if (!testData.success) {
                throw new Error(testData.message || 'Failed to connect to API');
            }

            // Stage 2: Fetch data from API
            setSyncProgress({ stage: 'fetching', message: 'Fetching product data from KiotViet...' });
            
            // Stage 3: Update database
            setSyncProgress({ stage: 'updating', message: 'Updating products in database...' });
            
            const syncResponse = await fetch('/api/integrations/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ integrationId: integration.id })
            });

            const syncData = await syncResponse.json();

            if (!syncResponse.ok) {
                throw new Error(syncData.message || syncData.error || 'Sync failed');
            }

            // Stage 4: Complete
            setSyncProgress({ stage: 'complete', message: 'Sync completed successfully!' });
            setSyncResults(syncData.results || { total: 0, updated: 0, failed: 0 });
            
            // Refresh integrations to get updated last_sync_at
            await fetchIntegrations();
            
            if (onSync) {
                await onSync(integration.id);
            }
            
            // Close modal after successful sync
            setTimeout(() => {
                onClose();
                setSyncProgress({ stage: 'idle', message: '' });
                setSyncResults(null);
            }, 2000);
        } catch (error) {
            console.error('Error syncing data:', error);
            setSyncProgress({ stage: 'idle', message: '' });
            setConnectionStatus({
                status: 'error',
                message: error instanceof Error ? error.message : 'Failed to sync data. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content update-data-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Update Data from Third Party</h2>
                        <button className="modal-close" onClick={onClose}>
                            <IconX />
                        </button>
                    </div>

                    <div className="modal-body">
                        <div className="integration-selector">
                            <label className="form-label">Select Third Party Integration</label>
                            <div className="integration-options">
                                {integrations.map((integration) => (
                                    <button
                                        key={integration.id}
                                        className={`integration-option ${selectedIntegration === integration.name ? 'active' : ''} ${!integration.is_active ? 'disabled' : ''}`}
                                        onClick={() => handleIntegrationSelect(integration.name)}
                                        disabled={!integration.is_active && integration.name !== 'other'}
                                    >
                                        <div className="integration-option-content">
                                            <span className="integration-name">{integration.display_name}</span>
                                            {integration.is_default && (
                                                <span className="default-badge">Default</span>
                                            )}
                                        </div>
                                        {selectedIntegration === integration.name && (
                                            <IconCheck className="check-icon" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedIntegration === 'kiotviet' && (
                            <div className="integration-details">
                                <h3>KiotViet Integration</h3>
                                <div className="integration-info">
                                    <p>Sync product data from KiotViet to update your product catalog.</p>
                                    <div className="info-list">
                                        <div className="info-item">
                                            <span className="info-label">Status:</span>
                                            <span className="info-value status-active">Active</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Last Sync:</span>
                                            <span className="info-value">
                                                {(() => {
                                                    const integration = integrations.find(i => i.name === selectedIntegration);
                                                    if (!integration?.last_sync_at) {
                                                        return 'Never';
                                                    }
                                                    try {
                                                        const date = new Date(integration.last_sync_at);
                                                        return date.toLocaleString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit'
                                                        });
                                                    } catch (e) {
                                                        return 'Never';
                                                    }
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Auto-Sync Toggle */}
                                    <div className="auto-sync-toggle-section">
                                        <div className="toggle-container">
                                            <div className="toggle-header">
                                                <div className="toggle-info">
                                                    <span className="toggle-title">Auto-sync on page load</span>
                                                    <span className="toggle-description">Automatically sync data when you open the product page</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={`toggle-switch ${autoSyncEnabled ? 'active' : ''}`}
                                                    onClick={() => {
                                                        if (!loading && !testingConnection && onAutoSyncChange) {
                                                            onAutoSyncChange(!autoSyncEnabled);
                                                        }
                                                    }}
                                                    disabled={loading || testingConnection}
                                                    aria-label="Toggle auto-sync"
                                                >
                                                    <span className="toggle-slider"></span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connection Test Section */}
                                    <div className="connection-test-section">
                                        <button
                                            className="btn-test-connection"
                                            onClick={handleTestConnection}
                                            disabled={testingConnection || loading}
                                        >
                                            {testingConnection ? (
                                                <>
                                                    <IconLoader className="spinning" />
                                                    <span>Testing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                        <polyline points="22 4 12 14.01 9 11.01" />
                                                    </svg>
                                                    <span>Test Connection</span>
                                                </>
                                            )}
                                        </button>
                                        
                                        {connectionStatus.status && (
                                            <div className={`connection-status ${connectionStatus.status}`}>
                                                {connectionStatus.status === 'success' ? (
                                                    <>
                                                        <IconCheck />
                                                        <span>{connectionStatus.message}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconAlertCircle />
                                                        <span>{connectionStatus.message}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Sync Progress */}
                                    {loading && syncProgress.stage !== 'idle' && (
                                        <div className="sync-progress-section">
                                            <div className="sync-progress-bar">
                                                <div 
                                                    className="sync-progress-fill"
                                                    style={{
                                                        width: syncProgress.stage === 'connecting' ? '25%' :
                                                               syncProgress.stage === 'fetching' ? '50%' :
                                                               syncProgress.stage === 'updating' ? '75%' :
                                                               syncProgress.stage === 'complete' ? '100%' : '0%'
                                                    }}
                                                />
                                            </div>
                                            <div className="sync-progress-message">
                                                <IconLoader className="spinning" />
                                                <span>{syncProgress.message}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sync Results */}
                                    {syncResults && (
                                        <div className="sync-results-section">
                                            <div className="sync-results-item">
                                                <span className="sync-results-label">Total:</span>
                                                <span className="sync-results-value">{syncResults.total}</span>
                                            </div>

                                            {(syncResults.created || 0) > 0 && (
                                                <div className="sync-results-item">
                                                    <span className="sync-results-label">Created:</span>
                                                    <span className="sync-results-value" style={{ color: '#3B82F6' }}>{syncResults.created || 0}</span>
                                                </div>
                                            )}
                                            <div className="sync-results-item">
                                                <span className="sync-results-label">Updated:</span>
                                                <span className="sync-results-value success">{syncResults.updated}</span>
                                            </div>
                                            {(syncResults.deleted || 0) > 0 && (
                                                <div className="sync-results-item">
                                                    <span className="sync-results-label">Deleted:</span>
                                                    <span className="sync-results-value" style={{ color: '#EF4444' }}>{syncResults.deleted || 0}</span>
                                                </div>
                                            )}
                                            {(syncResults.skipped || 0) > 0 && (
                                                <div className="sync-results-item">
                                                    <span className="sync-results-label">Skipped:</span>
                                                    <span className="sync-results-value" style={{ color: '#F59E0B' }}>{syncResults.skipped || 0}</span>
                                                </div>
                                            )}
                                            {syncResults.failed > 0 && (
                                                <div className="sync-results-item">
                                                    <span className="sync-results-label">Failed:</span>
                                                    <span className="sync-results-value error">{syncResults.failed}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button className="btn-secondary" onClick={onClose} disabled={loading || testingConnection}>
                            Cancel
                        </button>
                        <button 
                            className="btn-primary" 
                            onClick={handleSync}
                            disabled={loading || testingConnection || selectedIntegration === 'other'}
                        >
                            {loading ? (
                                <>
                                    <IconLoader className="spinning" />
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                'Sync Data'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Coming Soon Alert */}
            {showComingSoon && (
                <div className="modal-overlay" onClick={() => setShowComingSoon(false)}>
                    <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="alert-icon">
                            <IconAlertCircle />
                        </div>
                        <h3>Coming Soon</h3>
                        <p>This integration feature is currently under development and will be available soon.</p>
                        <button className="btn-primary" onClick={() => setShowComingSoon(false)}>
                            OK
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

