<template>
  <div class="mobile-list">
    <div 
      v-for="item in data" 
      :key="item.id" 
      class="mobile-item"
    >
      <div class="item-header">
        <div class="item-type">
          <el-tag :type="item.type === 'text' ? 'primary' : 'success'">
            {{ item.type === 'text' ? '文本' : '文件' }}
          </el-tag>
        </div>
        <div class="item-time">
          {{ formatTime(item.created_at) }}
        </div>
      </div>
      
      <div class="item-content">
        <div v-if="item.type === 'text'" class="text-content">
          <div class="text-preview">{{ truncateText(item.content, 100) }}</div>
          <el-button 
            type="primary" 
            size="small"
            @click="$emit('copy', item.content)"
            class="copy-btn-mobile"
          >
            复制
          </el-button>
        </div>
        
        <div v-else class="file-content">
          <div class="file-info">
            <div class="file-name">{{ item.file_name }}</div>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(item.file_size) }}</span>
            </div>
          </div>
          
          <div class="file-actions">
            <el-button 
              type="primary" 
              size="small"
              @click="$emit('download', item)"
            >
              下载
            </el-button>
            
            <el-button 
              v-if="isTextFile(item.mime_type)" 
              size="small"
              @click="$emit('preview-text', item)"
            >
              预览
            </el-button>
            
            <el-button 
              v-else-if="isPdfFile(item.mime_type)" 
              size="small"
              @click="$emit('preview-pdf', item)"
            >
              预览
            </el-button>
            
            <el-button 
              v-else-if="isImage(item.mime_type)" 
              size="small"
              @click="$emit('preview-image', item)"
            >
              预览
            </el-button>
          </div>
        </div>
      </div>
      
      <div class="item-footer">
        <el-button 
          v-if="item.type === 'text'"
          size="small"
          @click="$emit('edit', item)"
        >
          编辑
        </el-button>
        <el-button 
          type="danger" 
          size="small"
          @click="$emit('delete', item.id)"
        >
          删除
        </el-button>
      </div>
    </div>
    
    <div v-if="data.length === 0 && !loading" class="no-data">
      暂无数据
    </div>
  </div>
</template>

<script>
import { useFileOperations } from '../../composables/useFileOperations.js';

export default {
  name: 'ClipboardMobileList',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'copy',
    'download', 
    'preview-text', 
    'preview-pdf', 
    'preview-image',
    'edit',
    'delete'
  ],
  setup() {
    const { formatFileSize, isImage, isPdfFile, isTextFile } = useFileOperations();
    
    return {
      formatFileSize,
      isImage,
      isPdfFile,
      isTextFile
    };
  },
  methods: {
    truncateText(text, len) {
      if (!text) return '';
      return text.length > len ? text.slice(0, len) + '…' : text;
    },
    
    formatTime(ts) {
      if (!ts) return '';
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' });
    }
  }
};
</script>

<style scoped>
.mobile-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.mobile-item {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  background-color: #fafafa;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.item-time {
  font-size: 12px;
  color: #999;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.text-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.text-preview {
  font-size: 14px;
  color: #333;
  word-break: break-all;
  line-height: 1.5;
}

.file-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.file-name {
  font-weight: 500;
  font-size: 14px;
  word-break: break-all;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.item-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.copy-btn-mobile {
  align-self: flex-start;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

/* 暗色模式适配 */
:global(.dark) .mobile-item {
  background-color: #2a2a2a;
  border-color: #444;
}

:global(.dark) .item-header {
  border-bottom-color: #444;
}

:global(.dark) .item-footer {
  border-top-color: #444;
}

:global(.dark) .text-preview {
  color: #ddd;
}
</style>