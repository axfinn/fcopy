// 统一 request 封装（超时 + 错误包装）
const DEFAULT_TIMEOUT = 15000;

class HttpError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(url, { method='GET', headers={}, body, timeout=DEFAULT_TIMEOUT } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), timeout);
  try {
    const resp = await fetch(url, { method, headers, body, signal: controller.signal });
    const isJson = resp.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await resp.json().catch(()=> ({})) : await resp.text();
    if(!resp.ok) throw new HttpError(data?.error || resp.statusText || 'Request Error', resp.status, data);
    return data;
  } catch(e) {
    if(e.name === 'AbortError') throw new HttpError('请求超时', 408);
    if(!(e instanceof HttpError)) throw new HttpError(e.message||'网络错误', 500);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export { request, HttpError };
