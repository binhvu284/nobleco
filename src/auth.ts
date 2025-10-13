const AUTH_KEY = 'nobleco_auth_token';

export function isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(AUTH_KEY));
}

export async function login(username: string, password: string): Promise<boolean> {
    if (!(username.trim() && password.trim())) return false;
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) return false;
        const data = await res.json();
        if (data?.token) {
            localStorage.setItem(AUTH_KEY, data.token as string);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

export function logout() {
    localStorage.removeItem(AUTH_KEY);
}
