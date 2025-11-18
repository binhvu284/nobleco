import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../auth';
import AccessDenied from '../admin/pages/AccessDenied';

interface CoworkerProtectedRouteProps {
    children: React.ReactNode;
}

export default function CoworkerProtectedRoute({ children }: CoworkerProtectedRouteProps) {
    const location = useLocation();
    const currentUser = getCurrentUser();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setHasPermission(false);
            setLoading(false);
            return;
        }

        // Admin has access to everything
        if (currentUser.role === 'admin') {
            setHasPermission(true);
            setLoading(false);
            return;
        }

        // For coworkers, check permissions
        if (currentUser.role === 'coworker') {
            const checkPermission = async () => {
                try {
                    const authToken = localStorage.getItem('nobleco_auth_token');
                    const response = await fetch(`/api/coworker-permissions?coworkerId=${currentUser.id}&pagePath=${location.pathname}`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setHasPermission(data.hasPermission === true);
                    } else {
                        console.error('Failed to check permission:', response.status);
                        setHasPermission(false);
                    }
                } catch (error) {
                    console.error('Error checking permission:', error);
                    setHasPermission(false);
                } finally {
                    setLoading(false);
                }
            };
            checkPermission();
        } else {
            // Regular users don't have access to admin pages
            setHasPermission(false);
            setLoading(false);
        }
    }, [location.pathname, currentUser]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh'
            }}>
                <div>Loading...</div>
            </div>
        );
    }

    if (hasPermission === false) {
        return <AccessDenied />;
    }

    return <>{children}</>;
}

