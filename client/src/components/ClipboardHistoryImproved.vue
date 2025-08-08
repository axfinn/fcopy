<template>
  <div class="clipboard-history">
    <div class="card">
      <div class="card-header">
        <h3><el-icon><Document /></el-icon> 剪贴板历史</h3>
      </div>

      <!-- 搜索和筛选区域 -->
      <div class="search-area">
        <div class="search-controls">
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
          
          <el-select 
            v-model="searchForm.type" 
            placeholder="类型筛选" 
            clearable
            @change="handleSearch"
            class="type-filter"
          >
            <el-option label="文本" value="text"></el-option>
            <el-option label="文件" value="file"></el-option>
          </el-select>
          
          <el-button @click="resetSearch" class="reset-btn">重置</el-button>
        </div>
      </div>

      <!-- 移动端列表视图 -->
      <div class="mobile-list" v-if="isMobile">
        <div 
          v-for="item in displayData" 
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
              {{ formatToShanghaiTime(item.created_at) }}
            </div>
          </div>
          
          <div class="item-content">
            <div v-if="item.type === 'text'" class="text-content">
              <div class="text-preview">{{ truncateText(item.content, 100) }}</div>
              <el-button 
                type="primary" 
                size="small"
                @click="copyToClipboard(item.content)"
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
                  @click="downloadFile(item.id, item.file_name, item.mime_type)"
                >
                  下载
                </el-button>
                
                <el-button 
                  v-if="isTextFile(item.mime_type)" 
                  size="small"
                  @click="previewTextFile(item)"
                >
                  预览
                </el-button>
                
                <el-button 
                  v-else-if="isPdfFile(item.mime_type)" 
                  size="small"
                  @click="previewPdfFile(item)"
                >
                  预览
                </el-button>
                
                <el-button 
                  v-else-if="isImage(item.mime_type)" 
                  size="small"
                  @click="previewImage(item)"
                >
                  预览
                </el-button>
              </div>
            </div>
          </div>
          
          <div class="item-footer">
            <el-button 
              type="danger" 
              size="small"
              @click="handleDeleteItem(item.id)"
            >
              删除
            </el-button>
          </div>
        </div>
        
        <div v-if="displayData.length === 0 && !loading" class="no-data">
          暂无数据
        </div>
      </div>

      <!-- 桌面端表格视图 -->
      <el-table 
        :data="displayData" 
        style="width: 100%"
        v-loading="loading"
        element-loading-text="加载中..."
        :default-sort="{prop: 'created_at', order: 'descending'}"
        stripe
        v-else
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
                class="copy-btn"
              >
                复制
              </el-button>
            </div>
            <div v-else-if="scope.row && scope.row.type === 'file'" class="file-preview">
              <div v-if="isImage(scope.row.mime_type)" class="image-preview" @click="previewImage(scope.row)">
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
                    @click="downloadFile(scope.row.id, scope.row.file_name, scope.row.mime_type)"
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
        <el-table-column label="操作" width="200" fixed="right">
          <template v-slot="scope">
            <div class="action-buttons" v-if="scope.row">
              <el-button 
                v-if="scope.row.type === 'text'" 
                type="primary" 
                size="small"
                @click="copyToClipboard(scope.row.content)"
              >
                复制
              </el-button>
              <el-button 
                v-else
                type="primary" 
                size="small"
                @click="downloadFile(scope.row.id, scope.row.file_name, scope.row.mime_type)"
              >
                下载
              </el-button>
              
              <el-dropdown trigger="click" @command="(command) => handleCommand(command, scope.row)">
                <el-button size="small">
                  更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item 
                      v-if="isTextFile(scope.row.mime_type) || scope.row.type === 'text'"
                      command="previewText"
                    >
                      预览文本
                    </el-dropdown-item>
                    <el-dropdown-item 
                      v-if="isPdfFile(scope.row.mime_type)"
                      command="previewPdf"
                    >
                      预览PDF
                    </el-dropdown-item>
                    <el-dropdown-item 
                      v-if="isImage(scope.row.mime_type)"
                      command="previewImage"
                    >
                      预览图片
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
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
import { formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Document, Search, ArrowDown } from '@element-plus/icons-vue';
import api from '../services/api.js';

export default {
  name: 'ClipboardHistoryImproved',
  components: {
    Document,
    Search,
    ArrowDown
  },
  props: {
    apiKey: String,
    clipboardItems: Array
  },
  emits: ['copy-to-clipboard', 'download-file', 'preview-text-file', 'preview-pdf-file', 'delete-item', 'preview-image'],
  data() {
    return {
      loading: false,
      tableData: [],
      searchForm: {
        keyword: '',
        type: '' // 添加类型筛选
      },
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      isMobile: false, // 添加移动端检测
      // 图片预览相关数据
      imagePreviewVisible: false,
      imagePreviewUrl: '',
      previewFile: null
    };
  },
  computed: {
    displayData() {
      // 始终显示tableData，它包含了合并后的数据
      return this.tableData;
    }
  },
  mounted() {
    if (this.apiKey) {
      api.setApiKey(this.apiKey);
      this.fetchData();
    }
    // 检测是否为移动端
    this.checkIsMobile();
    // 监听窗口大小变化
    window.addEventListener('resize', this.checkIsMobile);
  },
  beforeUnmount() {
    // 移除事件监听器
    window.removeEventListener('resize', this.checkIsMobile);
  },
  watch: {
    apiKey(newVal) {
      if (newVal) {
        api.setApiKey(newVal);
        this.resetSearch();
      }
    },
    clipboardItems: {
      handler(newVal) {
        console.log('clipboardItems 更新:', newVal);
        if (Array.isArray(newVal) && newVal.length > 0) {
          if (newVal.length > 10) {
            this.tableData = [...newVal];
            return;
          }

          const currentIds = new Set(this.tableData.map(item => item.id));
          const newItems = newVal.filter(item => !currentIds.has(item.id));

          if (newItems.length > 0) {
            this.tableData = [...newItems, ...this.tableData];

            if (this.tableData.length > 100) {
              this.tableData = this.tableData.slice(0, 100);
            }

            if (this.pagination.total < this.tableData.length) {
              this.pagination.total = this.tableData.length;
            }
          } else {
            newVal.forEach(updatedItem => {
              const index = this.tableData.findIndex(item => item.id === updatedItem.id);
              if (index !== -1) {
                this.tableData.splice(index, 1, updatedItem);
                const [movedItem] = this.tableData.splice(index, 1);
                this.tableData.unshift(movedItem);
              }
            });
          }
        } else if (Array.isArray(newVal) && newVal.length === 0) {
          this.tableData = [];
        }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    // 检测是否为移动端
    checkIsMobile() {
      this.isMobile = window.innerWidth <= 768;
    },
    
    // 获取数据
    async fetchData() {
      this.loading = true;
      try {
        const params = {
          page: this.pagination.currentPage,
          size: this.pagination.pageSize,
          search: this.searchForm.keyword || undefined, // 只有在有搜索词时才传递参数
          type: this.searchForm.type || undefined // 添加类型筛选参数
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
      this.searchForm.type = ''; // 重置类型筛选
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

    // 处理移动端删除项目
    handleDeleteItem(id) {
      this.$confirm('确认删除此项目?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteItem(id);
      }).catch(() => {
        // 用户取消删除
      });
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
      // 时间已经在API层格式化，直接返回
      return dateString || '';
    },

    // 下拉菜单命令处理
    handleCommand(command, row) {
      switch (command) {
        case 'previewText':
          this.previewTextFile(row);
          break;
        case 'previewPdf':
          this.previewPdfFile(row);
          break;
        case 'previewImage':
          this.previewImage(row);
          break;
        case 'delete':
          this.$confirm('确认删除此项目?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            this.deleteItem(row.id);
          }).catch(() => {
            // 用户取消删除
          });
          break;
      }
    },

    // 预览图片
    previewImage(item) {
      this.previewFile = item;
      this.imagePreviewUrl = `/api/clipboard/file/${item.id}?apiKey=${this.apiKey}`;
      this.imagePreviewVisible = true;
    },
    
    // 关闭图片预览
    handleImagePreviewClose() {
      this.imagePreviewVisible = false;
      this.imagePreviewUrl = '';
      this.previewFile = null;
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
  margin-bottom: 20px;
}

.search-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.type-filter {
  width: 120px;
}

.reset-btn {
  margin-left: 10px;
}

/* 移动端列表样式 */
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
  gap: 10px;
  flex-wrap: wrap;
}

.copy-btn-mobile {
  align-self: flex-start;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #999;
}

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

.file-name {
  font-weight: 500;
}

.file-size {
  color: #999;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-area {
  margin-top: 20px;
  text-align: center;
  display: flex;
  justify-content: center;
}

/* 图片预览样式 */
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

/* 移动端适配 */
@media (max-width: 768px) {
  .card {
    padding: 15px;
  }
  
  .search-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    min-width: auto;
  }
  
  .type-filter {
    width: 100%;
  }
  
  .reset-btn {
    margin-left: 0;
  }
  
  .el-table {
    font-size: 12px;
  }
  
  .el-table th,
  .el-table td {
    padding: 8px 0;
  }
  
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
  
  .file-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .el-button {
    margin-bottom: 5px;
    padding: 8px 12px;
  }
  
  .el-dropdown {
    width: 100%;
  }
  
  .el-dropdown .el-button {
    width: 100%;
    text-align: left;
  }
  
  .pagination-area {
    overflow-x: auto;
    padding-bottom: 10px;
  }
  
  .el-pagination {
    font-size: 12px;
    white-space: nowrap;
  }
  
  .el-pagination button,
  .el-pagination span:not([class*='suffix']),
  .el-pagination .el-input__inner {
    padding: 0 5px;
    min-width: 24px;
    height: 24px;
    line-height: 24px;
  }
  
  .el-pagination .el-select .el-input__inner {
    height: 24px;
    line-height: 24px;
  }
  
  .el-pagination .el-select .el-input__icon {
    line-height: 24px;
  }
  
  .image-preview-dialog {
    width: 95% !important;
  }
}
</style>