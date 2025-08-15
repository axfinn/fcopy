import { request } from '../core/http/request';

const BASE = '/api';

export function authenticate(apiKey){
  return request(`${BASE}/users/auth`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'X-API-Key': apiKey },
    body: JSON.stringify({ apiKey })
  });
}
