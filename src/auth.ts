const AUTH_KEY = 'nobleco_auth_token';
const USER_KEY = 'nobleco_user_data';

export interface User {
    id: string | number;
    email: string;
    name: string;
    role: 'user' | 'admin';
    points?: number;
    level?: string;
    status?: string;
    refer_code?: string;
    commission?: number;
    phone?: string;
    address?: string;
    avatar?: string;
    created_at?: string;
}

export function isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(AUTH_KEY));
}

export function getCurrentUser(): User | null {
    try {
        const userData = localStorage.getItem(USER_KEY);
        if (!userData) return null;
        return JSON.parse(userData);
    } catch {
        return null;
    }
}

export function getUserRole(): 'user' | 'admin' | null {
    const user = getCurrentUser();
    return user?.role ?? null;
}

export async function login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!(email.trim() && password.trim())) {
        return { success: false, error: 'Email and password are required' };
    }
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            return { success: false, error: data.error || 'Invalid credentials' };
        }
        
        if (data?.token && data?.user) {
            localStorage.setItem(AUTH_KEY, data.token as string);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            return { success: true, user: data.user };
        }
        return { success: false, error: 'Invalid response from server' };
    } catch (error) {
        return { success: false, error: 'Network error. Please try again.' };
    }
}

export function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
}
