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
            v-model="state.keyword"
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
            v-model="state.filterType" 
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
      <div class="mobile-list" v-if="state.isMobile">
        <div 
          v-for="item in items" 
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
                  @click="downloadFile(item.id, item.file_name)"
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
        
        <div v-if="items.length === 0 && !loading" class="no-data">
          暂无数据
        </div>
      </div>

      <!-- 桌面端表格视图 -->
      <el-table 
        :data="items" 
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
                    @click="downloadFile(scope.row.id, scope.row.file_name)"
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
          :current-page="page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="size"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
        >
        </el-pagination>
      </div>
    </div>
    
    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="state.imagePreviewVisible"
      title="图片预览"
      width="80%"
      class="image-preview-dialog"
      :before-close="handleImagePreviewClose"
    >
      <div class="image-preview-container">
        <img 
          :src="state.imagePreviewUrl" 
          :alt="state.previewFile?.file_name"
          class="image-preview-large"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="state.imagePreviewVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { reactive, onMounted, onBeforeUnmount, computed } from 'vue';
import { Document, Search, ArrowDown } from '@element-plus/icons-vue';
export default {
  name: 'ClipboardHistoryImproved',
  components: { Document, Search, ArrowDown },
  props: {
    apiKey: String,
    items: { type: Array, default: () => [] },
    loading: Boolean,
    page: Number,
    size: Number,
    total: Number,
    search: String,
    type: String
  },
  emits: ['update:search','update:type','update:page','update:size','copy','delete','download','preview-text','preview-pdf','preview-image','refresh'],
  setup(props, { emit }) {
    const state = reactive({ keyword: props.search || '', filterType: props.type || '', imagePreviewVisible:false, imagePreviewUrl:'', previewFile:null, isMobile:false });
    // 响应式映射 Pinia 传入的 props，避免直接解构丢失响应
    const itemsRef = computed(()=> props.items);
    const loadingRef = computed(()=> props.loading);
    const pageRef = computed(()=> props.page);
    const sizeRef = computed(()=> props.size);
    const totalRef = computed(()=> props.total);
    function checkIsMobile(){ state.isMobile = window.innerWidth <= 768; }
    function formatFileSize(size){ if(!size&&size!==0) return '0 B'; if(size<1024) return size+' B'; if(size<1024*1024) return (size/1024).toFixed(2)+' KB'; return (size/1024/1024).toFixed(2)+' MB'; }
    function truncateText(text,max){ if(!text) return ''; return text.length>max? text.slice(0,max)+'...':text; }
    function isImage(mt){ return mt && mt.startsWith('image/'); }
    function isTextFile(mt){ return mt && (mt.startsWith('text/') || mt==='application/json' || mt==='application/xml'); }
    function isPdfFile(mt){ return mt === 'application/pdf'; }
    function formatToShanghaiTime(ts){ return ts || ''; }
    function handleSearch(){ emit('update:search', state.keyword); emit('update:type', state.filterType); emit('update:page', 1); emit('refresh'); }
    function resetSearch(){ state.keyword=''; state.filterType=''; emit('update:search',''); emit('update:type',''); emit('update:page',1); emit('refresh'); }
    function handleSizeChange(val){ emit('update:size', val); emit('update:page',1); emit('refresh'); }
    function handleCurrentChange(val){ emit('update:page', val); emit('refresh'); }
    function copyToClipboard(content){ emit('copy', content); }
    function handleDeleteItem(id){ emit('delete', id); }
    function downloadFile(id, name){ emit('download', { id, name }); }
    function handleCommand(command,row){ switch(command){ case 'previewText': emit('preview-text', row); break; case 'previewPdf': emit('preview-pdf', row); break; case 'previewImage': emit('preview-image', row); break; case 'delete': emit('delete', row.id); break; } }
    function previewImage(item){ emit('preview-image', item); }
    function previewTextFile(item){ emit('preview-text', item); }
    function previewPdfFile(item){ emit('preview-pdf', item); }
    function handleImageError(){}
    function handleImagePreviewClose(){ emit('preview-image', null); }
    onMounted(()=>{ checkIsMobile(); window.addEventListener('resize', checkIsMobile); });
    onBeforeUnmount(()=> window.removeEventListener('resize', checkIsMobile));
    return { state, items: itemsRef, loading: loadingRef, page: pageRef, size: sizeRef, total: totalRef, formatFileSize, truncateText, isImage, isTextFile, isPdfFile, formatToShanghaiTime, handleSearch, resetSearch, handleSizeChange, handleCurrentChange, copyToClipboard, handleDeleteItem, downloadFile, handleCommand, previewImage, previewTextFile, previewPdfFile, handleImageError, handleImagePreviewClose };
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
  
  .image-preview_dialog {
    width: 95% !important;
  }
}
</style>