import { request } from '../core/http/request';

export function getAccessLogs({ page=1, size=10 }={}, apiKey){
  const qs = new URLSearchParams();
  qs.append('page', page); qs.append('size', size);
  return request(`/api/logs/access?${qs.toString()}`, { headers:{'X-API-Key': apiKey} });
}

export function getActiveUsers(apiKey){
  return request('/api/active-users', { headers:{'X-API-Key': apiKey} });
}
