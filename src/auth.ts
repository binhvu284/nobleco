const AUTH_KEY = 'nobleco_auth_token';

export function isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(AUTH_KEY));
}

export function login(username: string, password: string): boolean {
    // Simple mock validation: accept any non-empty credentials
    if (username.trim() && password.trim()) {
        localStorage.setItem(AUTH_KEY, 'ok');
        return true;
    }
    return false;
}

export function logout() {
    localStorage.removeItem(AUTH_KEY);
}
