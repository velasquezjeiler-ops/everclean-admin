const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
async function request(path, options = {}, token) {
  const headers = { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) };
  const res = await fetch(API_URL + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
export const api = {
  auth: { login: (email: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, undefined) },
  leads: { list: (token: string, page = 1) => request('/leads?page=' + page + '&limit=20', {}, token) },
  bookings: { list: (token: string, page = 1) => request('/bookings?page=' + page + '&limit=20', {}, token) },
  professionals: { list: (token: string) => request('/professionals', {}, token) },
};