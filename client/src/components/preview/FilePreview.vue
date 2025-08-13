<template>
  <div class="file-preview">
    <!-- 文本/Markdown 预览对话框 -->
    <el-dialog 
      v-model="textPreviewVisible" 
      :title="textPreviewTitle" 
      width="70%" 
      append-to-body 
      class="text-preview-dialog"
    >
      <div v-if="textPreviewLoading" class="preview-loading">加载中...</div>
      <div v-else class="text-preview-scroll" :class="{ markdown: textPreviewIsMarkdown }">
        <pre v-if="!textPreviewIsMarkdown" class="plain-text"><code>{{ textPreviewContent }}</code></pre>
        <div v-else class="markdown-body" v-html="markdownHtml"></div>
      </div>
      <template #footer>
        <el-button @click="textPreviewVisible=false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- PDF 预览对话框 -->
    <el-dialog 
      v-model="pdfPreviewVisible" 
      title="PDF 预览" 
      width="80%" 
      append-to-body 
      class="pdf-preview-dialog"
    >
      <div v-if="pdfPreviewLoading" class="preview-loading">加载中...</div>
      <iframe v-else :src="pdfPreviewUrl" class="pdf-frame"></iframe>
      <template #footer>
        <el-button @click="pdfPreviewVisible=false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="imagePreviewVisible"
      title="图片预览"
      width="80%"
      class="image-preview-dialog"
      :before-close="handleImagePreviewClose"
    >
      <div class="image-preview-container">
        <img 
          :src="imagePreviewUrl" 
          :alt="previewFile?.file_name"
          class="image-preview-large"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="imagePreviewVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import bash from 'highlight.js/lib/languages/bash';
import jsonLang from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import markdownLang from 'highlight.js/lib/languages/markdown';
import 'highlight.js/styles/github.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', jsonLang);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('markdown', markdownLang);

marked.setOptions({
  breaks: true,
  gfm: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

export default {
  name: 'FilePreview',
  props: {
    apiKey: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      // 文本预览相关数据
      textPreviewVisible: false,
      textPreviewLoading: false,
      textPreviewContent: '',
      textPreviewIsMarkdown: false,
      markdownHtml: '',
      textPreviewTitle: '文本预览',
      
      // PDF预览相关数据
      pdfPreviewVisible: false,
      pdfPreviewLoading: false,
      pdfPreviewUrl: '',
      
      // 图片预览相关数据
      imagePreviewVisible: false,
      imagePreviewUrl: '',
      previewFile: null
    };
  },
  methods: {
    // 预览文本文件
    async previewTextFile(row) {
      this.textPreviewVisible = true;
      this.textPreviewLoading = true;
      this.textPreviewIsMarkdown = false;
      this.textPreviewContent = '';
      this.markdownHtml = '';
      this.textPreviewTitle = row.file_name || '文本预览';
      
      try {
        const rawUrl = `/api/clipboard/file/${row.id}/raw`;
        let jsonResult = null;
        
        try {
          const response = await fetch(rawUrl, { 
            headers: { 'X-API-Key': this.apiKey }
          });
          if (response.ok) {
            jsonResult = await response.json();
          }
        } catch (e) {
          console.warn('Raw API failed, falling back to blob', e);
        }
        
        if (jsonResult && jsonResult.success && jsonResult.content) {
          this.textPreviewContent = jsonResult.content;
        } else {
          // fallback 获取 blob
          const response = await fetch(`/api/clipboard/file/${row.id}`, { 
            headers: { 'X-API-Key': this.apiKey }
          });
          if (!response.ok) throw new Error('获取文件失败');
          const blob = await response.blob();
          this.textPreviewContent = await blob.text();
        }
        
        const isMarkdown = /\.md$/i.test(row.file_name || '') || /markdown/.test(row.mime_type || '');
        if (isMarkdown) {
          this.textPreviewIsMarkdown = true;
          this.markdownHtml = marked.parse(this.textPreviewContent || '');
        }
      } catch (error) {
        console.error('预览失败:', error);
        this.$message.error('预览失败: ' + error.message);
      } finally {
        this.textPreviewLoading = false;
      }
    },
    
    // 预览PDF文件
    previewPdfFile(row) {
      this.pdfPreviewVisible = true;
      this.pdfPreviewLoading = true;
      this.pdfPreviewUrl = '';
      
      const url = `/api/clipboard/file/${row.id}?apiKey=${this.apiKey}`;
      // 直接赋值即可 (浏览器内嵌 PDF 插件)
      setTimeout(() => {
        this.pdfPreviewUrl = url;
        this.pdfPreviewLoading = false;
      }, 50);
    },
    
    // 预览图片
    previewImage(row) {
      this.previewFile = row;
      this.imagePreviewUrl = `/api/clipboard/file/${row.id}?apiKey=${this.apiKey}`;
      this.imagePreviewVisible = true;
    },
    
    // 关闭图片预览
    handleImagePreviewClose() {
      this.imagePreviewVisible = false;
      this.previewFile = null;
    }
  }
};
</script>

<style scoped>
/* 预览对话框样式 */
.preview-loading {
  padding: 40px;
  text-align: center;
  color: #888;
}

.text-preview-scroll {
  max-height: 70vh;
  overflow-y: auto;
}

.plain-text {
  background: #1e1e1e;
  color: #f1f1f1;
  padding: 16px;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.markdown-body {
  font-size: 14px;
  line-height: 1.6;
}

.pdf-frame {
  width: 100%;
  height: 70vh;
  border: none;
}

.image-preview-container {
  text-align: center;
  max-height: 70vh;
  overflow: auto;
}

.image-preview-large {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

/* 暗色模式 */
:global(.dark) .plain-text {
  background: #0f1418;
  color: #e6e6e6;
}

:global(.dark) .markdown-body {
  color: #d0d6dc;
}

:global(.dark) .markdown-body a {
  color: #6aa8ff;
}

:global(.dark) .markdown-body code:not(pre code) {
  background: #2d3338;
  color: #e6e6e6;
}

:global(.dark) .pdf-preview-dialog :deep(.el-dialog__body) {
  background: #1f2529;
}
</style>