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
      <div v-if="textPreviewLoading" class="preview-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        加载中...
      </div>
      <div v-else class="text-preview-container">
        <!-- 文件信息 -->
        <div class="file-info-bar">
          <div class="file-details">
            <el-tag size="small">{{ formatFileSize(previewFile?.file_size) }}</el-tag>
            <el-tag size="small" type="info">{{ getFileEncoding() }}</el-tag>
            <el-tag size="small" type="warning" v-if="isPartialPreview">部分预览</el-tag>
          </div>
          <div class="preview-actions">
            <el-button size="small" @click="detectEncoding" :loading="detectingEncoding">
              <el-icon><Refresh /></el-icon>
              重新检测编码
            </el-button>
            <el-select v-model="selectedEncoding" size="small" @change="changeEncoding" style="width: 120px">
              <el-option label="UTF-8" value="utf-8" />
              <el-option label="GBK" value="gbk" />
              <el-option label="GB2312" value="gb2312" />
              <el-option label="Big5" value="big5" />
              <el-option label="Shift_JIS" value="shift_jis" />
            </el-select>
          </div>
        </div>

        <!-- 预览内容 -->
        <div class="text-preview-scroll" :class="{ markdown: textPreviewIsMarkdown }">
          <pre v-if="!textPreviewIsMarkdown" class="plain-text" :class="{ truncated: isPartialPreview }">
            <code>{{ displayContent }}</code>
          </pre>
          <div v-else class="markdown-body" v-html="markdownHtml"></div>
        </div>

        <!-- 展开更多按钮 -->
        <div v-if="isPartialPreview && !showingFullContent" class="expand-more">
          <el-button type="primary" @click="loadFullContent" :loading="loadingFullContent">
            <el-icon><ArrowDown /></el-icon>
            展开全部内容 ({{ Math.ceil((totalLines - previewLines) / 100) }}% 剩余)
          </el-button>
          <el-button @click="loadMoreContent" :loading="loadingMoreContent">
            <el-icon><More /></el-icon>
            加载更多 ({{ moreContentLines }}行)
          </el-button>
        </div>

        <!-- 内容统计 -->
        <div class="content-stats">
          <span>行数: {{ totalLines || displayContent.split('\n').length }}</span>
          <span>字符: {{ displayContent.length }}</span>
          <span>大小: {{ formatFileSize(displayContent.length) }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="copyContent" v-if="displayContent">
          <el-icon><DocumentCopy /></el-icon>
          复制内容
        </el-button>
        <el-button @click="downloadContent" v-if="displayContent">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
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
      <div v-if="pdfPreviewLoading" class="preview-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        加载中...
      </div>
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
        <el-button @click="downloadCurrentImage" v-if="previewFile">
          <el-icon><Download /></el-icon>
          下载图片
        </el-button>
        <el-button @click="imagePreviewVisible = false">关闭</el-button>
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
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';
import { Loading, Refresh, ArrowDown, More, DocumentCopy, Download } from '@element-plus/icons-vue';
import 'highlight.js/styles/github.css';

// 注册更多语言支持
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', jsonLang);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('markdown', markdownLang);
hljs.registerLanguage('python', python);
hljs.registerLanguage('css', css);
hljs.registerLanguage('sql', sql);

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
  components: {
    Loading,
    Refresh,
    ArrowDown,
    More,
    DocumentCopy,
    Download
  },
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
      textPreviewContent: '', // 完整内容
      displayContent: '', // 显示内容（可能是部分）
      textPreviewIsMarkdown: false,
      markdownHtml: '',
      textPreviewTitle: '文本预览',
      
      // 编码相关
      selectedEncoding: 'utf-8',
      detectedEncoding: 'utf-8',
      detectingEncoding: false,
      rawBlob: null,
      
      // 部分预览相关
      isPartialPreview: false,
      showingFullContent: false,
      previewLines: 100, // 初始预览行数
      moreContentLines: 200, // 每次加载更多的行数
      totalLines: 0,
      loadingFullContent: false,
      loadingMoreContent: false,
      currentDisplayLines: 100,
      
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
      this.displayContent = '';
      this.markdownHtml = '';
      this.textPreviewTitle = row.file_name || '文本预览';
      this.previewFile = row;
      this.isPartialPreview = false;
      this.showingFullContent = false;
      this.currentDisplayLines = this.previewLines;
      this.selectedEncoding = 'utf-8';
      this.detectedEncoding = 'utf-8';
      
      try {
        await this.loadTextContent(row);
      } catch (error) {
        console.error('预览失败:', error);
        this.$message.error('预览失败: ' + error.message);
      } finally {
        this.textPreviewLoading = false;
      }
    },
    
    // 加载文本内容
    async loadTextContent(row, encoding = 'utf-8') {
      const rawUrl = `/api/clipboard/file/${row.id}/raw`;
      let content = '';
      
      try {
        // 尝试使用raw API
        const response = await fetch(rawUrl, { 
          headers: { 'X-API-Key': this.apiKey }
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.content) {
            content = result.content;
            this.detectedEncoding = 'utf-8';
          }
        }
      } catch (e) {
        console.warn('Raw API failed, falling back to blob', e);
      }
      
      // 如果raw API失败，使用blob方式
      if (!content) {
        const response = await fetch(`/api/clipboard/file/${row.id}`, { 
          headers: { 'X-API-Key': this.apiKey }
        });
        if (!response.ok) throw new Error('获取文件失败');
        
        this.rawBlob = await response.blob();
        content = await this.decodeBlob(this.rawBlob, encoding);
        this.detectedEncoding = this.detectTextEncoding(content);
      }
      
      this.textPreviewContent = content;
      this.totalLines = content.split('\n').length;
      
      // 判断是否需要部分预览
      const fileSize = row.file_size || 0;
      const shouldPartialPreview = fileSize > 50 * 1024 || this.totalLines > this.previewLines;
      
      if (shouldPartialPreview && !this.showingFullContent) {
        this.isPartialPreview = true;
        this.displayContent = content.split('\n').slice(0, this.currentDisplayLines).join('\n');
      } else {
        this.isPartialPreview = false;
        this.displayContent = content;
      }
      
      // 处理Markdown
      const isMarkdown = /\.(md|markdown)$/i.test(row.file_name || '') || /markdown/.test(row.mime_type || '');
      if (isMarkdown) {
        this.textPreviewIsMarkdown = true;
        this.markdownHtml = marked.parse(this.displayContent);
      }
    },
    
    // 解码Blob
    async decodeBlob(blob, encoding = 'utf-8') {
      if (encoding === 'utf-8') {
        return await blob.text();
      }
      
      // 对于其他编码，我们需要使用TextDecoder
      const arrayBuffer = await blob.arrayBuffer();
      try {
        const decoder = new TextDecoder(encoding);
        return decoder.decode(arrayBuffer);
      } catch (e) {
        console.warn(`解码失败 (${encoding}), 回退到UTF-8:`, e);
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(arrayBuffer);
      }
    },
    
    // 检测文本编码（简单检测）
    detectTextEncoding(content) {
      // 简单的启发式检测
      if (/[\u4e00-\u9fff]/.test(content) && /[\ufffd�]/.test(content)) {
        return 'gbk'; // 可能是GBK编码被错误解析为UTF-8
      }
      return 'utf-8';
    },
    
    // 重新检测编码
    async detectEncoding() {
      if (!this.rawBlob) return;
      
      this.detectingEncoding = true;
      try {
        const encodings = ['utf-8', 'gbk', 'gb2312', 'big5', 'shift_jis'];
        let bestEncoding = 'utf-8';
        let bestScore = 0;
        
        for (const encoding of encodings) {
          try {
            const content = await this.decodeBlob(this.rawBlob, encoding);
            const score = this.scoreTextQuality(content);
            if (score > bestScore) {
              bestScore = score;
              bestEncoding = encoding;
            }
          } catch (e) {
            continue;
          }
        }
        
        this.selectedEncoding = bestEncoding;
        this.detectedEncoding = bestEncoding;
        await this.changeEncoding();
        
      } finally {
        this.detectingEncoding = false;
      }
    },
    
    // 评估文本质量（简单评分）
    scoreTextQuality(content) {
      if (!content) return 0;
      
      let score = 0;
      // 减分：有替换字符
      score -= (content.match(/[\ufffd�]/g) || []).length * 10;
      // 加分：有正常的中文字符
      score += (content.match(/[\u4e00-\u9fff]/g) || []).length * 2;
      // 加分：有正常的英文单词
      score += (content.match(/[a-zA-Z]{2,}/g) || []).length;
      // 减分：有太多控制字符
      score -= (content.match(/[\x00-\x08\x0e-\x1f]/g) || []).length * 5;
      
      return Math.max(0, score);
    },
    
    // 更改编码
    async changeEncoding() {
      if (!this.rawBlob || !this.previewFile) return;
      
      this.textPreviewLoading = true;
      try {
        await this.loadTextContent(this.previewFile, this.selectedEncoding);
      } finally {
        this.textPreviewLoading = false;
      }
    },
    
    // 加载完整内容
    async loadFullContent() {
      this.loadingFullContent = true;
      try {
        this.showingFullContent = true;
        this.isPartialPreview = false;
        this.displayContent = this.textPreviewContent;
        
        if (this.textPreviewIsMarkdown) {
          this.markdownHtml = marked.parse(this.displayContent);
        }
        
        this.$message.success('已加载完整内容');
      } finally {
        this.loadingFullContent = false;
      }
    },
    
    // 加载更多内容
    async loadMoreContent() {
      this.loadingMoreContent = true;
      try {
        this.currentDisplayLines += this.moreContentLines;
        const lines = this.textPreviewContent.split('\n');
        this.displayContent = lines.slice(0, this.currentDisplayLines).join('\n');
        
        if (this.currentDisplayLines >= this.totalLines) {
          this.isPartialPreview = false;
          this.showingFullContent = true;
        }
        
        if (this.textPreviewIsMarkdown) {
          this.markdownHtml = marked.parse(this.displayContent);
        }
        
        this.$message.success(`已加载 ${Math.min(this.currentDisplayLines, this.totalLines)} / ${this.totalLines} 行`);
      } finally {
        this.loadingMoreContent = false;
      }
    },
    
    // 获取文件编码显示
    getFileEncoding() {
      return this.selectedEncoding.toUpperCase();
    },
    
    // 格式化文件大小
    formatFileSize(size) {
      if (!size) return '0B';
      const units = ['B', 'KB', 'MB', 'GB'];
      let i = 0;
      while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
      }
      return size.toFixed(i === 0 ? 0 : 1) + units[i];
    },
    
    // 复制内容
    async copyContent() {
      try {
        await navigator.clipboard.writeText(this.displayContent);
        this.$message.success('内容已复制到剪贴板');
      } catch (error) {
        console.error('复制失败:', error);
        this.$message.error('复制失败');
      }
    },
    
    // 下载内容
    downloadContent() {
      const blob = new Blob([this.displayContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.previewFile?.file_name || 'preview.txt';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 1500);
      
      this.$message.success('下载已触发');
    },
    
    // 预览PDF文件
    previewPdfFile(row) {
      this.pdfPreviewVisible = true;
      this.pdfPreviewLoading = true;
      this.pdfPreviewUrl = '';
      
      const url = `/api/clipboard/file/${row.id}?apiKey=${this.apiKey}`;
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
    
    // 下载当前图片
    downloadCurrentImage() {
      if (this.previewFile) {
        const a = document.createElement('a');
        a.href = this.imagePreviewUrl + '&download=1';
        a.download = this.previewFile.file_name || 'image';
        a.click();
      }
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.text-preview-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 12px;
}

.file-details {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.text-preview-scroll {
  max-height: 60vh;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.plain-text {
  background: #f8f9fa;
  color: #333;
  padding: 16px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.plain-text.truncated {
  border-bottom: 2px dashed #dee2e6;
  position: relative;
}

.plain-text.truncated::after {
  content: '... 内容已截断 ...';
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  color: #6c757d;
  font-size: 12px;
  background: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.markdown-body {
  font-size: 14px;
  line-height: 1.6;
  padding: 16px;
}

.expand-more {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.content-stats {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 12px;
  color: #6c757d;
  flex-wrap: wrap;
  gap: 12px;
}

.pdf-frame {
  width: 100%;
  height: 70vh;
  border: none;
  border-radius: 8px;
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
  border-radius: 8px;
}

/* 暗色模式 */
:global(.dark) .plain-text {
  background: #1e1e1e;
  color: #e6e6e6;
}

:global(.dark) .file-info-bar {
  background: #2d3748;
  border-color: #4a5568;
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

:global(.dark) .expand-more {
  background: #2d3748;
  border-color: #4a5568;
}

:global(.dark) .content-stats {
  background: #2d3748;
  border-color: #4a5568;
  color: #a0aec0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .file-info-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .preview-actions {
    justify-content: stretch;
  }
  
  .preview-actions .el-select {
    flex: 1;
  }
  
  .expand-more {
    flex-direction: column;
  }
  
  .content-stats {
    justify-content: center;
    text-align: center;
  }
  
  .text-preview-scroll {
    max-height: 50vh;
  }
}
</style>