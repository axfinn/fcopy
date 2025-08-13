import { ref } from 'vue';
import api from '../services/api.js';
import store from '../store/index.js';

export function useClipboard() {
  const loading = ref(false);

  // 获取剪贴板历史记录
  const fetchClipboardHistory = async (params = {}) => {
    try {
      loading.value = true;
      store.mutations.SET_LOADING('clipboard', true);
      const response = await api.getClipboardHistory(params);
      
      if (response.success) {
        store.mutations.SET_CLIPBOARD_ITEMS(response.data);
      } else {
        throw new Error(response.error || '获取剪贴板历史失败');
      }
    } catch (error) {
      console.error('获取剪贴板历史失败:', error);
      store.mutations.SET_CLIPBOARD_ITEMS([]);
      if (window.$message) {
        window.$message.error(error.message || '获取剪贴板历史失败');
      }
    } finally {
      loading.value = false;
      store.mutations.SET_LOADING('clipboard', false);
    }
  };

  // 添加文本内容
  const addTextContent = async (content) => {
    try {
      const response = await api.addTextContent(content);
      if (response.id) {
        // 通过WebSocket实时更新，不需要手动刷新列表
        if (window.$message) {
          window.$message.success('内容添加成功');
        }
        return response;
      } else {
        throw new Error(response.error || '添加内容失败');
      }
    } catch (error) {
      console.error('添加内容失败:', error);
      if (window.$message) {
        window.$message.error(error.message || '添加内容失败');
      }
      throw error;
    }
  };

  // 删除剪贴板项目
  const deleteClipboardItem = async (id) => {
    try {
      const response = await api.deleteClipboardItem(id);
      if (response.success) {
        if (window.$message) {
          window.$message.success('删除成功');
        }
        return response;
      } else {
        throw new Error(response.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      if (window.$message) {
        window.$message.error(error.message || '删除失败');
      }
      throw error;
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (content) => {
    return navigator.clipboard.writeText(content).then(() => {
      if (window.$message) {
        window.$message.success('已复制到剪贴板');
      }
    }).catch(err => {
      console.error('复制失败:', err);
      if (window.$message) {
        window.$message.error('复制失败');
      }
      throw err;
    });
  };

  return {
    loading,
    fetchClipboardHistory,
    addTextContent,
    deleteClipboardItem,
    copyToClipboard
  };
}