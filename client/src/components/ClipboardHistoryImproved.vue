<template>
  <div class="clipboard-history">
    <div class="card">
      <div class="card-header">
        <h3><el-icon><Document /></el-icon> 剪贴板历史</h3>
      </div>

      <!-- 搜索和筛选区域 -->
      <div class="search-area modern-toolbar">
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
          
          <el-button @click="resetSearch" class="reset-btn" type="default">重置</el-button>
        </div>
      </div>

      <!-- 移动端列表视图 -->
      <ClipboardMobileList
        v-if="isMobile"
        :data="displayData"
        :loading="loading"
        @copy="copyToClipboard"
        @download="downloadFile"
        @preview-text="previewTextFile"
        @preview-pdf="previewPdfFile"
        @preview-image="previewImage"
        @edit="openEdit"
        @delete="handleDeleteItem"
      />

      <!-- 桌面端表格视图 -->
      <ClipboardTable
        v-else
        :data="displayData"
        :loading="loading"
        :api-key="apiKey"
        @copy="copyToClipboard"
        @download="downloadFile"
        @preview-text="previewTextFile"
        @preview-pdf="previewPdfFile"
        @preview-image="previewImage"
        @edit="openEdit"
        @delete="handleDeleteItem"
      />

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
        />
      </div>
    </div>
    
    <!-- 编辑对话框 -->
    <EditDialog
      v-model="editDialogVisible"
      :initial-content="editContent"
      :file-name="editingFileName"
      @copy="handleEditCopy"
      @download="handleEditDownload"
    />

    <!-- 文件预览组件 -->
    <FilePreview
      ref="filePreview"
      :api-key="apiKey"
    />
  </div>
</template>

<script>
import { Document, Search } from '@element-plus/icons-vue';
import api from '../services/api.js';
import { useClipboard } from '../composables/useClipboard.js';
import { useFileOperations } from '../composables/useFileOperations.js';
import ClipboardTable from './clipboard/ClipboardTable.vue';
import ClipboardMobileList from './clipboard/ClipboardMobileList.vue';
import EditDialog from './dialog/EditDialog.vue';
import FilePreview from './preview/FilePreview.vue';

export default {
  name: 'ClipboardHistoryImproved',
  components: {
    Document,
    Search,
    ClipboardTable,
    ClipboardMobileList,
    EditDialog,
    FilePreview
  },
  props: {
    apiKey: String,
    clipboardItems: Array
  },
  emits: ['copy-to-clipboard', 'download-file', 'preview-text-file', 'preview-pdf-file', 'delete-item', 'preview-image'],
  setup() {
    const { copyToClipboard } = useClipboard();
    const { downloadFile, isTextFile } = useFileOperations();
    
    return {
      copyToClipboard,
      downloadFile,
      isTextFile
    };
  },
  data() {
    return {
      loading: false,
      tableData: [],
      searchForm: {
        keyword: '',
        type: ''
      },
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      isMobile: false,
      // 编辑对话框
      editDialogVisible: false,
      editContent: '',
      editingFileName: 'edited.txt'
    };
  },
  computed: {
    displayData() {
      return this.tableData;
    }
  },
  mounted() {
    if (this.apiKey) {
      api.setApiKey(this.apiKey);
      this.fetchData();
    }
    this.checkIsMobile();
    window.addEventListener('resize', this.checkIsMobile);
  },
  beforeUnmount() {
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
          search: this.searchForm.keyword || undefined,
          type: this.searchForm.type || undefined
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
      this.searchForm.type = '';
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

    // 预览文本文件
    previewTextFile(row) {
      this.$refs.filePreview.previewTextFile(row);
    },
    
    // 预览PDF文件
    previewPdfFile(row) {
      this.$refs.filePreview.previewPdfFile(row);
    },
    
    // 预览图片
    previewImage(row) {
      this.$refs.filePreview.previewImage(row);
    },
    
    // 打开编辑对话框
    async openEdit(row) {
      if (row.type === 'file') {
        // 对于文件，只允许文本类型的文件编辑
        if (this.isTextFile(row.mime_type) || /markdown|text/.test(row.mime_type || '')) {
          try {
            const content = await this.fetchRawContent(row);
            this.editContent = content;
            this.editingFileName = row.file_name || 'edited.txt';
            this.editDialogVisible = true;
          } catch (error) {
            console.error('获取文件内容失败:', error);
            this.$message.error('无法加载文本内容');
          }
        } else {
          this.$message.warning('非文本文件不可编辑');
        }
      } else {
        // 文本类型直接编辑
        this.editContent = row.content || '';
        this.editingFileName = 'edited.txt';
        this.editDialogVisible = true;
      }
    },
    
    // 获取原始文件内容
    async fetchRawContent(row) {
      const rawUrl = `/api/clipboard/file/${row.id}/raw`;
      try {
        const response = await fetch(rawUrl, { 
          headers: { 'X-API-Key': this.apiKey }
        });
        if (!response.ok) throw new Error('raw failed');
        const result = await response.json();
        if (!result.success || !result.content) throw new Error('not text');
        return result.content;
      } catch (error) {
        // fallback 二进制 -> text
        const response = await fetch(`/api/clipboard/file/${row.id}`, { 
          headers: { 'X-API-Key': this.apiKey }
        });
        if (!response.ok) throw new Error('fallback failed');
        const blob = await response.blob();
        return await blob.text();
      }
    },
    
    // 处理编辑后复制
    handleEditCopy(content) {
      // 编辑对话框已经处理了复制逻辑
    },
    
    // 处理编辑后下载
    handleEditDownload({ content, fileName }) {
      // 编辑对话框已经处理了下载逻辑
    },
    
    // 删除项目
    handleDeleteItem(id) {
      this.$emit('delete-item', id);
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

.pagination-area {
  margin-top: 20px;
  text-align: center;
  display: flex;
  justify-content: center;
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
  
  .pagination-area {
    overflow-x: auto;
    padding-bottom: 10px;
  }
}
</style>