<template>
  <div>
    <ClipboardHistoryImproved
      :api-key="auth.apiKey"
      :items="clipboard.items"
      :loading="clipboard.loading"
      :page="clipboard.page"
      :size="clipboard.size"
      :total="clipboard.total"
      :search="clipboard.search"
      :type="clipboard.type"
      @update:search="v=> clipboard.search = v"
      @update:type="v=> clipboard.type = v"
      @update:page="v=> { clipboard.page = v; }"
      @update:size="v=> { clipboard.size = v; }"
      @refresh="clipboard.load(auth.apiKey)"
      @copy="c => copyToClipboard(c)"
      @delete="id => { clipboard.remove(id, auth.apiKey); }"
      @download="handleDownload"
      @preview-text="handlePreviewText"
      @preview-pdf="handlePreviewPdf"
      @preview-image="handlePreviewImage"
    />

    <!-- 文本预览对话框 -->
    <el-dialog v-model="textVisible" title="文本预览" width="60%" @close="close">
      <pre style="white-space: pre-wrap; word-break: break-word; max-height: 60vh; overflow:auto;">{{ textContent }}</pre>
      <template #footer>
        <span class="dialog-footer"><el-button @click="close">关闭</el-button></span>
      </template>
    </el-dialog>

    <!-- PDF 预览对话框 -->
    <el-dialog v-model="pdfVisible" title="PDF预览" width="80%" @close="close">
      <iframe v-if="file" :src="pdfSrc" style="width:100%;height:70vh;border:none;"></iframe>
      <template #footer>
        <span class="dialog-footer"><el-button @click="close">关闭</el-button></span>
      </template>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="imageVisible" title="图片预览" width="70%" @close="close" class="image-preview-dialog">
      <div v-if="imageUrl" style="text-align:center;max-height:70vh;overflow:auto;">
        <img :src="imageUrl" :alt="file?.file_name" style="max-width:100%;max-height:70vh;object-fit:contain;" />
      </div>
      <template #footer>
        <span class="dialog-footer"><el-button @click="close">关闭</el-button></span>
      </template>
    </el-dialog>
  </div>
</template>
<script>
import { computed } from 'vue';
import { useClipboardStore } from '../../../stores/clipboardStore';
import { useAuthStore } from '../../../stores/authStore';
import ClipboardHistoryImproved from '../../../components/ClipboardHistoryImproved.vue';
import { usePreviewDialogs } from '../../../composables/usePreviewDialogs';

export default {
  name:'ClipboardList',
  components:{ ClipboardHistoryImproved },
  setup(){
    const clipboard = useClipboardStore();
    const auth = useAuthStore();
    if(auth.apiKey && !clipboard.items.length){ clipboard.load(auth.apiKey); }

    const { textVisible, pdfVisible, imageVisible, file, textContent, imageUrl, openText, openPdf, openImage, close } = usePreviewDialogs();

    function copyToClipboard(text){ navigator.clipboard.writeText(text).catch(()=>{}); }

    async function handleDownload({ id, name }){
      try {
        const resp = await fetch(`/api/clipboard/file/${id}?apiKey=${auth.apiKey}`);
        if(!resp.ok) throw new Error('下载失败');
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = name || file.value?.file_name || 'download';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(()=> URL.revokeObjectURL(url), 1000);
      } catch(e){ console.error(e); }
    }

    async function fetchFileBlob(id){
      const resp = await fetch(`/api/clipboard/file/${id}?apiKey=${auth.apiKey}`);
      if(!resp.ok) throw new Error('获取文件失败');
      return resp.blob();
    }

    async function handlePreviewText(item){
      try {
        const blob = await fetchFileBlob(item.id);
        const text = await blob.text();
        openText(item, text);
      } catch(e){ console.error(e); }
    }

    async function handlePreviewPdf(item){
      // 直接 openPdf，iframe 使用接口地址
      openPdf(item);
    }

    async function handlePreviewImage(item){
      try {
        const blob = await fetchFileBlob(item.id);
        const url = URL.createObjectURL(blob);
        openImage(item, url);
      } catch(e){ console.error(e); }
    }

    const pdfSrc = computed(()=> file.value ? `/api/clipboard/file/${file.value.id}?apiKey=${auth.apiKey}` : '');

    return { clipboard, auth, copyToClipboard, handleDownload, handlePreviewText, handlePreviewPdf, handlePreviewImage, textVisible, pdfVisible, imageVisible, file, textContent, imageUrl, pdfSrc, close };
  }
};
</script>
<style scoped>
.image-preview-dialog .el-dialog__body { text-align:center; }
</style>
