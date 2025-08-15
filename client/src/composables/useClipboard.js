import { ref } from 'vue';
import { fetchClipboard, addText, deleteClipboardItem } from '../apis/clipboardApi';
import { useNotify } from './useNotify';

// DEPRECATED: useClipboard 已被 Pinia clipboardStore 替代，将被删除。
export function useClipboard(){ console.warn('useClipboard 已弃用'); return { items:[], load:()=>{}, addTextContent:()=>{}, removeItem:()=>{} }; }

export function useClipboard(getApiKey){
  const { success, error } = useNotify();
  const items = ref([]);
  const loading = ref(false);
  const page = ref(1); const size = ref(10); const total = ref(0);
  const search = ref(''); const type = ref('');

  async function load(){
    loading.value = true;
    try {
      const resp = await fetchClipboard({ page: page.value, size: size.value, search: search.value, type: type.value }, getApiKey());
      items.value = resp.data || resp.items || resp.data?.items || [];
      total.value = resp.total || resp.data?.total || 0;
    } catch(e){ error(e.message||'加载失败'); } finally { loading.value=false; }
  }

  async function addTextContent(content){
    try { await addText(content, getApiKey()); success('添加成功'); } catch(e){ error(e.message||'添加失败'); }
  }

  async function removeItem(id){
    try { await deleteClipboardItem(id, getApiKey()); success('删除成功'); load(); } catch(e){ error(e.message||'删除失败'); }
  }

  return { items, loading, page, size, total, search, type, load, addTextContent, removeItem };
}
