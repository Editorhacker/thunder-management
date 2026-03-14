import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://thunder-management.onrender.com';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export default api;
