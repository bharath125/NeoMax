import { createContext, useContext, useState, useCallback } from 'react';
import { apiClient } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(() => localStorage.getItem('neomax_token'));

	const persistSession = useCallback((data) => {
		localStorage.setItem('neomax_token', data.token);
		setToken(data.token);
		setUser(data.user);
	}, []);

	const login = useCallback(
		async (email, password) => {
			const { data } = await apiClient.post('/auth/login', { email, password });
			persistSession(data.data);
		},
		[persistSession],
	);

	const register = useCallback(
		async (email, password) => {
			const { data } = await apiClient.post('/auth/register', { email, password });
			persistSession(data.data);
		},
		[persistSession],
	);

	const loginWithGoogle = useCallback(
		async (credential) => {
			const { data } = await apiClient.post('/auth/google', { credential });
			persistSession(data.data);
		},
		[persistSession],
	);

	const logout = useCallback(() => {
		localStorage.removeItem('neomax_token');
		setToken(null);
		setUser(null);
	}, []);

	return (
		<AuthContext.Provider value={{ user, token, login, register, loginWithGoogle, logout }}>{children}</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
