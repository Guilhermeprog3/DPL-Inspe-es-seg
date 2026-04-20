import axios from 'axios';
import { getSession } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const session = await getSession() as any;
  
  if (session?.access_token || session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.access_token || session.accessToken}`;
  }
  
  return config;
});

export default api;