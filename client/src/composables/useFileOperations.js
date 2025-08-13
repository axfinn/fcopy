import { ref } from 'vue';

export function useFileOperations() {
  const downloading = ref(false);

  // 格式化文件大小
  const formatFileSize = (size) => {
    if (size == null) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0, n = size;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return (n.toFixed(n >= 10 ? 0 : 1)) + units[i];
  };

  // 判断文件类型
  const isImage = (mime) => typeof mime === 'string' && mime.startsWith('image/');
  const isPdfFile = (mime) => typeof mime === 'string' && mime.includes('pdf');
  const isTextFile = (mime) => {
    if (!mime) return false;
    return /text|json|xml|yaml|markdown|javascript/.test(mime);
  };

  // 下载文件
  const downloadFile = async (row, apiKey) => {
    try {
      downloading.value = true;
      const fileUrl = `/api/clipboard/file/${row.id}?download=1`;
      const resp = await fetch(fileUrl, { headers: { 'X-API-Key': apiKey }});
      
      if (!resp.ok) throw new Error('status ' + resp.status);
      
      const disposition = resp.headers.get('Content-Disposition') || '';
      let suggested = row.file_name || 'download';
      const m = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
      if (m) {
        suggested = decodeURIComponent(m[1] || m[2] || suggested);
      }
      
      const blob = await resp.blob();
      if (blob.size === 0) throw new Error('empty file');
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = suggested;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 1500);
    } catch (e) {
      console.warn('下载 fetch 失败, 尝试窗口导航', e);
      // 直接跳转 (解决某些浏览器 blob 问题)
      const direct = document.createElement('a');
      direct.href = `/api/clipboard/file/${row.id}?download=1&ts=${Date.now()}`;
      direct.setAttribute('download', '');
      direct.click();
      
      if (window.$message) {
        window.$message.error('下载触发(若仍失败请查看网络日志)');
      }
    } finally {
      downloading.value = false;
    }
  };

  // 上传文件
  const uploadFile = async (file, apiKey) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/clipboard/file', {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
        body: formData
      });
      
      if (!response.ok) throw new Error('上传失败');
      
      const result = await response.json();
      if (window.$message) {
        window.$message.success('文件上传成功');
      }
      return result;
    } catch (error) {
      console.error('文件上传失败:', error);
      if (window.$message) {
        window.$message.error('文件上传失败: ' + error.message);
      }
      throw error;
    }
  };

  return {
    downloading,
    formatFileSize,
    isImage,
    isPdfFile,
    isTextFile,
    downloadFile,
    uploadFile
  };
}