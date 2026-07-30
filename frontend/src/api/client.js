import axios from 'axios';

export const apiClient = axios.create({ baseURL: '/api' });

apiClient.interceptors.request.use((requestConfig) => {
	const token = localStorage.getItem('viewmax_token');
	if (token) requestConfig.headers.Authorization = `Bearer ${token}`;
	return requestConfig;
});

apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem('viewmax_token');
			window.location.hash = '#/login';
		}
		return Promise.reject(error);
	},
);
