import axios from 'axios';
import { getSession } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 300000,
  headers: {
    'Content-Type': 'application/json',
    // ADICIONE ESTA LINHA ABAIXO:
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use(async (config) => {
  const session = await getSession() as any;
  
  const token = session?.user?.access_token || session?.user?.accessToken || session?.access_token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;