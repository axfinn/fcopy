import { defineStore } from 'pinia';
import { fetchClipboard, addText, deleteClipboardItem } from '../apis/clipboardApi';

export const useClipboardStore = defineStore('clipboard', {
  state: () => ({
    items: [],
    page: 1,
    size: 10,
    total: 0,
    search: '',
    type: '',
    loading: false
  }),
  actions: {
    async load(apiKey){
      this.loading = true;
      try {
        const resp = await fetchClipboard({ page: this.page, size: this.size, search: this.search, type: this.type }, apiKey);
        this.items = resp.data?.items || resp.data || resp.items || [];
        this.total = resp.data?.total || resp.total || 0;
      } finally { this.loading = false; }
    },
    async addTextContent(content, apiKey){
      await addText(content, apiKey);
    },
    async remove(id, apiKey){
      await deleteClipboardItem(id, apiKey);
      this.load(apiKey);
    },
    prepend(item){
      const formatted = { ...item, type: item.type || (item.content? 'text':'file') };
      const idx = this.items.findIndex(i=> i.id === formatted.id);
      if(idx !== -1){ this.items.splice(idx,1); }
      this.items.unshift(formatted);
      if(this.items.length>100) this.items.pop();
    }
  }
});
