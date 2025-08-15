import { request } from '../core/http/request';

const BASE = '/api/clipboard';

export function fetchClipboard({ page=1, size=10, search, type }={}, apiKey){
  const qs = new URLSearchParams();
  qs.append('page', page); qs.append('size', size);
  if(search) qs.append('search', search);
  if(type) qs.append('type', type);
  return request(`/api/clipboard?${qs.toString()}`, { headers: { 'X-API-Key': apiKey } });
}

export function addText(content, apiKey){
  return request(`${BASE}/text`, { method:'POST', headers:{'Content-Type':'application/json','X-API-Key': apiKey}, body: JSON.stringify({ content }) });
}

export function deleteClipboardItem(id, apiKey){
  return request(`${BASE}/${id}`, { method:'DELETE', headers:{'X-API-Key': apiKey} });
}
