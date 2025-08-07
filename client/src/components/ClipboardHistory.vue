import axios from 'axios';

let apiKey = null;

const apiClient = axios.create({
  baseURL: '/api', // 根据你的实际API路径修改
  timeout: 10000, // 10秒超时
});

// 设置API密钥
function setApiKey(newApiKey) {
  apiKey = newApiKey;
  // 也可以同时设置到axios实例的headers中
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
}

// 获取剪贴板历史
async function getClipboardHistory(params = {}) {
  try {
    const response = await apiClient.get('/clipboard/history', { 
      params,
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}

export default {
  setApiKey,
  getClipboardHistory
};
<template>
  <div class="card">
    <div class="card-header">
      <h3><i class="el-icon-document"></i> 剪贴板历史</h3>
    </div>
    
    <!-- 添加搜索框 -->
    <div style="margin-bottom: 20px;">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索剪贴板内容..."
        clearable
        @clear="resetSearch"
        @keyup.enter="searchClipboard"
        style="width: 300px; margin-right: 10px;"
      >
        <template #append>
          <el-button icon="el-icon-search" @click="searchClipboard"></el-button>
        </template>
      </el-input>
      <el-button @click="resetSearch">重置</el-button>
    </div>
    
    <el-table 
      :data="clipboardItems" 
      style="width: 100%" 
      :default-sort="{prop: 'created_at', order: 'descending'}"
      stripe
    >
      <el-table-column prop="id" label="ID" width="60" sortable></el-table-column>
      <el-table-column prop="type" label="类型" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.type === 'text' ? 'primary' : 'success'">
            {{ scope.row.type === 'text' ? '文本' : '文件' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip>
        <template #default="scope">
          <div v-if="scope.row.type === 'text'" class="content-preview">
            {{ truncateText(scope.row.content, 100) }}
            <el-button 
              type="text" 
              size="small" 
              @click="$emit('copy-to-clipboard', scope.row.content)"
              style="margin-left: 10px"
            >
              复制
            </el-button>
          </div>
          <div v-else-if="scope.row.type === 'file'" class="file-preview">
            <div v-if="isImage(scope.row.mime_type)" class="image-preview">
              <img 
                :src="`/api/clipboard/file/${scope.row.id}`" 
                :alt="scope.row.filename"
                @error="handleImageError"
                style="max-height: 100px; max-width: 150px; border-radius: 4px;"
              />
            </div>
            <div v-else>
              <i class="el-icon-document" style="font-size: 40px; color: #409EFF;"></i>
            </div>
            <div class="file-info">
              <div>{{ scope.row.filename }}</div>
              <div class="file-meta">
                <span>{{ formatFileSize(scope.row.size) }}</span>
                <el-button 
                  type="text" 
                  size="small" 
                  @click="$emit('download-file', scope.row.id, scope.row.filename, scope.row.mime_type)"
                >
                  下载
                </el-button>
                <el-button 
                  v-if="isTextFile(scope.row.mime_type)" 
                  type="text" 
                  size="small" 
                  @click="$emit('preview-text-file', scope.row)"
                >
                  预览
                </el-button>
                <el-button 
                  v-else-if="isPdfFile(scope.row.mime_type)" 
                  type="text" 
                  size="small" 
                  @click="$emit('preview-pdf-file', scope.row)"
                >
                  预览
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" sortable>
        <template #default="scope">
          {{ formatToShanghaiTime(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="scope">
          <el-button 
            type="danger" 
            icon="el-icon-delete" 
            circle 
            size="small"
            @click="$emit('delete-item', scope.row.id)"
          ></el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 添加分页组件 -->
    <div style="margin-top: 20px; text-align: center;">
      <el-pagination
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        :total="totalItems"
        layout="total, sizes, prev, pager, next, jumper"
      >
      </el-pagination>
    </div>
  </div>
</template>

<script>
import { formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import api from '../services/api.js';

export default {
  name: 'ClipboardHistory',
  props: {
    apiKey: String,
    clipboardItems: Array
  },
  data() {
    return {
      searchKeyword: '',
      currentPage: 1,
      pageSize: 10,
      totalItems: 0
    };
  },
  mounted() {
    // 组件挂载时设置API密钥
    if (this.apiKey) {
      api.setApiKey(this.apiKey);
      this.fetchClipboardHistory({ page: 1, size: this.pageSize });
    }
  },
  watch: {
    apiKey(newVal) {
      if (newVal) {
        api.setApiKey(newVal);
        this.currentPage = 1; // 重置页码
        this.fetchClipboardHistory({ page: 1, size: this.pageSize });
      }
    },
    clipboardItems: {
      handler(newVal) {
        // 监听clipboardItems变化，如果数据为空且不是第一页，则回到第一页
        if (!newVal || newVal.length === 0) {
          if (this.currentPage > 1) {
            this.handlePageChange(1);
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchClipboardHistory({ page, size: this.pageSize });
    },
    
    handleSizeChange(size) {
      this.pageSize = size;
      this.fetchClipboardHistory({ page: 1, size });
    },
    
    searchClipboard() {
      this.fetchClipboardHistory({ 
        page: 1, 
        size: this.pageSize, 
        search: this.searchKeyword 
      });
    },
    
    resetSearch() {
      this.searchKeyword = '';
      this.fetchClipboardHistory({ page: 1, size: this.pageSize });
    },
    
    // 获取剪贴板历史记录（添加分页和搜索支持）
    async fetchClipboardHistory(params = {}) {
      try {
        // 使用传入的参数或默认值
        const fetchParams = {
          page: params.page !== undefined ? params.page : this.currentPage,
          size: params.size !== undefined ? params.size : this.pageSize,
          search: params.search !== undefined ? params.search : this.searchKeyword
        };
        
        // 调用API获取数据
        const data = await api.getClipboardHistory(fetchParams);
        
        // 更新分页状态
        this.currentPage = data.page;
        this.pageSize = data.size;
        this.totalItems = data.total;
        
        // 发送事件到父组件更新数据
        this.$emit('update-clipboard-items', data.data);
      } catch (error) {
        console.error('获取剪贴板历史失败:', error);
        this.$message.error('获取剪贴板历史失败: ' + (error.message || ''));
      }
    },
    
    isImage(mimeType) {
      return mimeType && mimeType.startsWith('image/');
    },

    /**
     * 格式化时间为上海时区
     * @param {string} dateString - ISO格式的时间字符串
     * @returns {string} 格式化后的时间字符串（YYYY-MM-DD HH:mm:ss）
     */
    formatToShanghaiTime(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(date);
    },
    
    isTextFile(mimeType) {
      if (!mimeType) return false;
      return mimeType.startsWith('text/') || 
             mimeType === 'application/json' || 
             mimeType === 'application/xml';
    },
    
    isPdfFile(mimeType) {
      if (!mimeType) return false;
      return mimeType === 'application/pdf';
    },
    
    formatFileSize(size) {
      if (size < 1024) {
        return size + ' B';
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB';
      } else {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
      }
    },
    
    truncateText(text, maxLength) {
      if (text.length <= maxLength) {
        return text;
      }
      return text.substr(0, maxLength) + '...';
    },
    
    handleImageError(event) {
      event.target.src = '/images/image-placeholder.png';
    }
  }
};
</script>

<style scoped>
.card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 20px;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.card:hover {
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header h3 i {
  color: #409EFF;
}

.content-preview {
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 15px;
  line-height: 1.6;
  color: #333;
}

.file-preview {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.file-preview:hover {
  background-color: #eef1f6;
  transform: translateY(-2px);
}

.file-preview i {
  font-size: 2rem;
  color: #409EFF;
  display: block;
  margin-bottom: 10px;
}

.file-preview .preview-hint {
  font-size: 0.8rem;
  color: #999;
  margin-top: 5px;
}
</style>
```