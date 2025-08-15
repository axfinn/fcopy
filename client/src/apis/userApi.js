import { request } from '../core/http/request';
const BASE = '/api/users';

export function getUsers(apiKey){ return request(BASE, { headers:{'X-API-Key': apiKey} }); }
export function addUser(payload, apiKey){ return request(BASE, { method:'POST', headers:{'Content-Type':'application/json','X-API-Key': apiKey}, body: JSON.stringify(payload)}); }
export function deleteUser(id, apiKey){ return request(`${BASE}/${id}`, { method:'DELETE', headers:{'X-API-Key': apiKey} }); }
export function updateUserApiKey(id, newKey, apiKey){ return request(`${BASE}/${id}/apikey`, { method:'PUT', headers:{'Content-Type':'application/json','X-API-Key': apiKey}, body: JSON.stringify({ apiKey: newKey })}); }
