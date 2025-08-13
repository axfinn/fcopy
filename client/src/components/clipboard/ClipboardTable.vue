<template>
  <el-table 
    :data="data" 
    style="width: 100%"
    v-loading="loading"
    element-loading-text="加载中..."
    :default-sort="{prop: 'created_at', order: 'descending'}"
    class="table-float-rows"
  >
    <el-table-column prop="id" label="ID" width="60" sortable></el-table-column>
    <el-table-column prop="type" label="类型" width="100">
      <template v-slot="scope">
        <el-tag :type="scope.row && scope.row.type === 'text' ? 'primary' : 'success'" v-if="scope.row">
          {{ scope.row.type === 'text' ? '文本' : '文件' }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip>
      <template v-slot="scope">
        <div v-if="scope.row && scope.row.type === 'text'" class="content-preview">
          {{ truncateText(scope.row.content, 100) }}
          <el-button 
            type="text" 
            size="small" 
            @click="$emit('copy', scope.row.content)"
            class="copy-btn"
          >
            复制
          </el-button>
        </div>
        <div v-else-if="scope.row && scope.row.type === 'file'" class="file-preview">
          <div v-if="isImage(scope.row.mime_type)" class="image-preview" @click="$emit('preview-image', scope.row)">
            <img 
              :src="`/api/clipboard/file/${scope.row.id}?apiKey=${apiKey}`" 
              :alt="scope.row.file_name"
              @error="handleImageError"
              style="max-height: 100px; max-width: 150px; border-radius: 4px; cursor: pointer;"
            />
          </div>
          <div v-else>
            <el-icon style="font-size: 40px; color: #409EFF;"><Document /></el-icon>
          </div>
          <div class="file-info">
            <div>{{ scope.row.file_name }}</div>
            <div class="file-meta">
              <span>{{ formatFileSize(scope.row.file_size) }}</span>
              <el-button 
                type="text" 
                size="small" 
                @click="$emit('download', scope.row)"
              >
                下载
              </el-button>
              <el-button 
                v-if="isTextFile(scope.row.mime_type)" 
                type="text" 
                size="small" 
                @click="$emit('preview-text', scope.row)"
              >
                预览
              </el-button>
              <el-button 
                v-else-if="isPdfFile(scope.row.mime_type)" 
                type="text" 
                size="small" 
                @click="$emit('preview-pdf', scope.row)"
              >
                预览
              </el-button>
            </div>
          </div>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="created_at" label="创建时间" width="180" sortable>
      <template v-slot="scope">
        <span v-if="scope.row">{{ formatTime(scope.row.created_at) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="200" fixed="right">
      <template v-slot="scope">
        <div class="action-buttons action-buttons-group" v-if="scope.row">
          <el-tooltip content="复制" v-if="scope.row.type==='text'">
            <el-button 
              type="primary" 
              size="small"
              circle
              icon="el-icon-document-copy"
              @click="$emit('copy', scope.row.content)"
            />
          </el-tooltip>
          <el-tooltip content="下载" v-else>
            <el-button 
              type="primary" 
              size="small"
              circle
              icon="el-icon-download"
              @click="$emit('download', scope.row)"
            />
          </el-tooltip>
          <el-tooltip content="编辑后复制" v-if="scope.row.type==='text'">
            <el-button
              size="small"
              circle
              icon="el-icon-edit"
              @click="$emit('edit', scope.row)"
            />
          </el-tooltip>
          <el-tooltip content="删除">
            <el-button
              size="small"
              circle
              type="danger"
              icon="el-icon-delete"
              @click="$emit('delete', scope.row.id)"
            />
          </el-tooltip>
          <el-dropdown v-if="showMore(scope.row)" trigger="click" @command="(command) => handleCommand(command, scope.row)">
            <el-tooltip content="更多">
              <el-button size="small" circle icon="el-icon-more"/>
            </el-tooltip>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item 
                  v-if="isTextFile(scope.row.mime_type) || scope.row.type === 'text'"
                  command="previewText"
                >预览文本</el-dropdown-item>
                <el-dropdown-item v-if="isPdfFile(scope.row.mime_type)" command="previewPdf">预览PDF</el-dropdown-item>
                <el-dropdown-item v-if="isImage(scope.row.mime_type)" command="previewImage">预览图片</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
import { Document } from '@element-plus/icons-vue';
import { useFileOperations } from '../../composables/useFileOperations.js';

export default {
  name: 'ClipboardTable',
  components: {
    Document
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    apiKey: {
      type: String,
      required: true
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
    },
    
    handleImageError(e) {
      e.target.style.opacity = 0.2;
    },
    
    showMore(row) {
      if (!row) return false;
      return this.isTextFile(row.mime_type) || row.type === 'text' || this.isPdfFile(row.mime_type) || this.isImage(row.mime_type);
    },
    
    handleCommand(cmd, row) {
      switch (cmd) {
        case 'previewText':
          this.$emit('preview-text', row);
          break;
        case 'previewPdf':
          this.$emit('preview-pdf', row);
          break;
        case 'previewImage':
          this.$emit('preview-image', row);
          break;
        case 'delete':
          this.$emit('delete', row.id);
          break;
      }
    }
  }
};
</script>

<style scoped>
.content-preview {
  display: flex;
  align-items: center;
  gap: 10px;
}

.copy-btn {
  flex-shrink: 0;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.image-preview {
  cursor: pointer;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .content-preview {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .file-preview {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>