import { useNotify } from './useNotify';

export function useUpload(getApiKey){
  const { success, error } = useNotify();
  const action = '/api/clipboard/file';
  const headers = ()=> ({ 'X-API-Key': getApiKey() });

  function onSuccess(){ success('文件上传成功'); }
  function onError(e){ error('文件上传失败'); console.error(e); }

  async function handlePaste(evt){
    const items = (evt.clipboardData||evt.originalEvent?.clipboardData).items;
    for(const it of items){
      if(it.kind==='file'){
        const file = it.getAsFile();
        const fd = new FormData(); fd.append('file', file);
        try {
          const resp = await fetch(action, { method:'POST', headers: headers(), body: fd });
          const js = await resp.json();
          if(!js.success) throw new Error(js.error||'上传失败');
          success('文件上传成功');
        } catch(err){ error(err.message||'上传失败'); }
      }
    }
  }

  return { action, headers, onSuccess, onError, handlePaste };
}
