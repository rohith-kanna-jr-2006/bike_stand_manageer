import axios from 'axios';

const API_URL = 'http://localhost:3002/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken'); // Assuming you store the JWT here
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const standService = {
    getAll: async (ownerId?: string) => {
        const params = ownerId ? { ownerId } : {};
        const response = await api.get('/stands', { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/stands/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/stands', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/stands/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/stands/${id}`);
        return response.data;
    },
};

export const bookingService = {
    create: async (data: any) => {
        const response = await api.post('/bookings', data);
        return response.data;
    },
    getUserBookings: async (userId: string) => {
        const response = await api.get(`/bookings/user/${userId}`);
        return response.data;
    },
    getStandBookings: async (standId: string) => {
        const response = await api.get(`/bookings/stand/${standId}`);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/bookings/${id}`, data);
        return response.data;
    },
};

export const ticketService = {
    getById: async (id: string) => {
        const response = await api.get(`/tickets/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/tickets', data);
        return response.data;
    },
};

export default api;
