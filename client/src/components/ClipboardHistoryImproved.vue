<template>
  <div class="clipboard-history">
    <div class="card">
      <div class="card-header">
        <h3><el-icon><Document /></el-icon> 剪贴板历史</h3>
      </div>

      <!-- 搜索区域 -->
      <div class="search-area">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索剪贴板内容..."
          clearable
          @clear="resetSearch"
          @keyup.enter="handleSearch"
          class="search-input"
        >
          <template #append>
            <el-button 
              :icon="Search" 
              @click="handleSearch"
            ></el-button>
          </template>
        </el-input>
        <el-button @click="resetSearch" class="reset-btn">重置</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table 
        :data="tableData" 
        style="width: 100%"
        v-loading="loading"
        element-loading-text="加载中..."
        :default-sort="{prop: 'created_at', order: 'descending'}"
        stripe
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
                @click="copyToClipboard(scope.row.content)"
                style="margin-left: 10px"
              >
                复制
              </el-button>
            </div>
            <div v-else-if="scope.row && scope.row.type === 'file'" class="file-preview">
              <div v-if="isImage(scope.row.mime_type)" class="image-preview">
                <img 
                  :src="`/api/clipboard/file/${scope.row.id}`" 
                  :alt="scope.row.filename"
                  @error="handleImageError"
                  style="max-height: 100px; max-width: 150px; border-radius: 4px;"
                />
              </div>
              <div v-else>
                <el-icon style="font-size: 40px; color: #409EFF;"><Document /></el-icon>
              </div>
              <div class="file-info">
                <div>{{ scope.row.filename }}</div>
                <div class="file-meta">
                  <span>{{ formatFileSize(scope.row.size) }}</span>
                  <el-button 
                    type="text" 
                    size="small" 
                    @click="downloadFile(scope.row.id, scope.row.filename, scope.row.mime_type)"
                  >
                    下载
                  </el-button>
                  <el-button 
                    v-if="isTextFile(scope.row.mime_type)" 
                    type="text" 
                    size="small" 
                    @click="previewTextFile(scope.row)"
                  >
                    预览
                  </el-button>
                  <el-button 
                    v-else-if="isPdfFile(scope.row.mime_type)" 
                    type="text" 
                    size="small" 
                    @click="previewPdfFile(scope.row)"
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
            <span v-if="scope.row">{{ formatToShanghaiTime(scope.row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template v-slot="scope">
            <el-button 
              type="danger" 
              :icon="Delete" 
              circle 
              size="small"
              @click="deleteItem(scope.row.id)"
              v-if="scope.row"
            ></el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="pagination-area">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
        >
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api.js';

export default {
  name: 'ClipboardHistoryImproved',
  props: {
    apiKey: String
  },
  emits: ['copy-to-clipboard', 'download-file', 'preview-text-file', 'preview-pdf-file', 'delete-item'],
  data() {
    return {
      loading: false,
      tableData: [],
      searchForm: {
        keyword: ''
      },
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      }
    };
  },
  mounted() {
    if (this.apiKey) {
      api.setApiKey(this.apiKey);
      this.fetchData();
    }
  },
  watch: {
    apiKey(newVal) {
      if (newVal) {
        api.setApiKey(newVal);
        this.resetSearch();
      }
    }
  },
  methods: {
    // 获取数据
    async fetchData() {
      this.loading = true;
      try {
        const params = {
          page: this.pagination.currentPage,
          size: this.pagination.pageSize,
          search: this.searchForm.keyword || undefined // 只有在有搜索词时才传递参数
        };

        const response = await api.getClipboardHistory(params);
        
        this.tableData = response.data || [];
        this.pagination.total = response.total || 0;
        this.pagination.currentPage = response.page || 1;
        this.pagination.pageSize = response.size || 10;
      } catch (error) {
        console.error('获取剪贴板历史失败:', error);
        this.$message.error('获取剪贴板历史失败: ' + (error.message || '未知错误'));
      } finally {
        this.loading = false;
      }
    },

    // 搜索处理
    handleSearch() {
      this.pagination.currentPage = 1;
      this.fetchData();
    },

    // 重置搜索
    resetSearch() {
      this.searchForm.keyword = '';
      this.pagination.currentPage = 1;
      this.fetchData();
    },

    // 分页大小改变
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.currentPage = 1;
      this.fetchData();
    },

    // 当前页改变
    handleCurrentChange(val) {
      this.pagination.currentPage = val;
      this.fetchData();
    },

    // 复制到剪贴板
    copyToClipboard(content) {
      this.$emit('copy-to-clipboard', content);
    },

    // 下载文件
    downloadFile(id, filename, mimeType) {
      this.$emit('download-file', id, filename, mimeType);
    },

    // 预览文本文件
    previewTextFile(item) {
      this.$emit('preview-text-file', item);
    },

    // 预览PDF文件
    previewPdfFile(item) {
      this.$emit('preview-pdf-file', item);
    },

    // 删除项目
    deleteItem(id) {
      this.$emit('delete-item', id);
    },

    // 判断是否为图片
    isImage(mimeType) {
      return mimeType && mimeType.startsWith('image/');
    },

    // 判断是否为文本文件
    isTextFile(mimeType) {
      if (!mimeType) return false;
      return mimeType.startsWith('text/') || 
             mimeType === 'application/json' || 
             mimeType === 'application/xml';
    },

    // 判断是否为PDF文件
    isPdfFile(mimeType) {
      if (!mimeType) return false;
      return mimeType === 'application/pdf';
    },

    // 格式化文件大小
    formatFileSize(size) {
      if (!size && size !== 0) return '0 B';
      if (size < 1024) {
        return size + ' B';
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB';
      } else {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
      }
    },

    // 截断文本
    truncateText(text, maxLength) {
      if (!text) return '';
      if (text.length <= maxLength) {
        return text;
      }
      return text.substr(0, maxLength) + '...';
    },

    /**
     * 格式化时间为上海时区
     */
    formatToShanghaiTime(dateString) {
      if (!dateString) return '';
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

    // 处理图片加载错误
    handleImageError(event) {
      event.target.src = '/images/image-placeholder.png';
    }
  }
};
</script>

<style scoped>
.clipboard-history {
  width: 100%;
}

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

.search-area {
  display: flex;
  margin-bottom: 20px;
  align-items: center;
}

.search-input {
  width: 300px;
  margin-right: 10px;
}

.reset-btn {
  margin-left: 10px;
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

.pagination-area {
  margin-top: 20px;
  text-align: center;
  display: flex;
  justify-content: center;
}
</style>