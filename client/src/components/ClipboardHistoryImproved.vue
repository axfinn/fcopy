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
        class="table-float-rows"
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
            <div class="action-buttons action-buttons-group" v-if="scope.row">
              <el-tooltip content="复制" v-if="scope.row.type==='text'">
                <el-button 
                  type="primary" 
                  size="small"
                  circle
                  icon="el-icon-document-copy"
                  @click="copyToClipboard(scope.row.content)"
                />
              </el-tooltip>
              <el-tooltip content="下载" v-else>
                <el-button 
                  type="primary" 
                  size="small"
                  circle
                  icon="el-icon-download"
                  @click="downloadFile(scope.row.id, scope.row.file_name, scope.row.mime_type)"
                />
              </el-tooltip>
              <el-tooltip content="编辑后复制" v-if="scope.row.type==='text'">
                <el-button
                  size="small"
                  circle
                  icon="el-icon-edit"
                  @click="openEdit(scope.row)"
                />
              </el-tooltip>
              <el-tooltip content="删除">
                <el-button
                  size="small"
                  circle
                  type="danger"
                  icon="el-icon-delete"
                  @click="handleDeleteItem(scope.row.id)"
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
    <!-- 编辑后复制对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑并复制 / 下载" width="600px" :close-on-click-modal="false">
    <el-input
      type="textarea"
      v-model="editContent"
      :rows="14"
      placeholder="在这里编辑内容..."
      show-word-limit
      maxlength="20000"
      style="font-family: var(--monospace, monospace);"
    />
    <div style="display:flex;justify-content:space-between;margin-top:8px;flex-wrap:wrap;gap:8px;">
      <div style="font-size:12px;color: var(--el-text-color-secondary);">字数: {{ editContent.length }}</div>
      <div style="display:flex;gap:8px;">
        <el-button size="small" @click="editContent=''">清空</el-button>
        <el-button size="small" type="primary" @click="copyEdited">复制</el-button>
        <el-button size="small" type="success" @click="downloadEdited">下载为文件</el-button>
      </div>
    </div>
  </el-dialog>

    <!-- 文本/Markdown 预览对话框 -->
    <el-dialog v-model="textPreviewVisible" :title="textPreviewTitle" width="70%" append-to-body class="text-preview-dialog">
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
    <el-dialog v-model="pdfPreviewVisible" title="PDF 预览" width="80%" append-to-body class="pdf-preview-dialog">
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
<!-- 预览/编辑对话框已在主模板内部插入 -->

<script>
import { formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Document, Search, ArrowDown } from '@element-plus/icons-vue';
import api from '../services/api.js';
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
  breaks:true,
  gfm:true,
  highlight(code,lang){
    if(lang && hljs.getLanguage(lang)){
      return hljs.highlight(code,{language:lang}).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

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
  previewFile: null,
  editDialogVisible:false,
  editRow:null,
  editContent:'',
  textPreviewVisible:false,
  textPreviewLoading:false,
  textPreviewContent:'',
  textPreviewIsMarkdown:false,
  markdownHtml:'',
  textPreviewTitle:'文本预览',
  pdfPreviewVisible:false,
  pdfPreviewLoading:false,
  pdfPreviewUrl:''
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

    // 下载文件 (兼容调用: downloadFile(row) 或 downloadFile(id, name))
    async downloadFile(arg1, arg2) {
      let row = null;
      if (typeof arg1 === 'object') {
        row = arg1;
      } else {
        row = { id: arg1, file_name: arg2 };
      }
      try {
        const apiKey = this.apiKey;
        const fileUrl = `/api/clipboard/file/${row.id}?download=1`;
        const resp = await fetch(fileUrl, { headers: { 'X-API-Key': apiKey }});
        if (!resp.ok) throw new Error('status ' + resp.status);
        const disposition = resp.headers.get('Content-Disposition') || '';
        let suggested = row.file_name || 'download';
        const m = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
        if (m) suggested = decodeURIComponent(m[1] || m[2] || suggested);
        const blob = await resp.blob();
        if (blob.size === 0) throw new Error('empty file');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggested;
        document.body.appendChild(a);
        a.click();
        setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 1200);
      } catch(e) {
        console.warn('[download] fetch 失败 fallback 导航', e);
        const a = document.createElement('a');
        a.href = `/api/clipboard/file/${row.id}?download=1&ts=${Date.now()}`;
        a.setAttribute('download','');
        document.body.appendChild(a);
        a.click();
        setTimeout(()=> a.remove(), 800);
      }
    },
    showMore(row){
      if(!row) return false;
      return this.isTextFile(row.mime_type) || row.type==='text' || this.isPdfFile(row.mime_type) || this.isImage(row.mime_type);
    },
    // 判定类型
    isImage(mime){ return typeof mime === 'string' && mime.startsWith('image/'); },
    isPdfFile(mime){ return typeof mime === 'string' && mime.includes('pdf'); },
    isTextFile(mime){
      if (!mime) return false;
      return /text|json|xml|yaml|markdown|javascript/.test(mime);
    },
    // 工具函数
    formatFileSize(size){
      if(size == null) return '-';
      const units=['B','KB','MB','GB'];
      let i=0, n=size;
      while(n>=1024 && i<units.length-1){ n/=1024; i++; }
      return (n.toFixed(n>=10?0:1))+units[i];
    },
    truncateText(text, len){
      if(!text) return '';
      return text.length>len? text.slice(0,len)+'…' : text;
    },
    formatToShanghaiTime(ts){
      if(!ts) return '';
      const d = new Date(ts);
      if(isNaN(d.getTime())) return ts;
      return d.toLocaleString('zh-CN',{ hour12:false, timeZone:'Asia/Shanghai'});
    },
    copyToClipboard(text){
      if(!text) return;
      navigator.clipboard.writeText(text).then(()=> this.$message.success('已复制'));
    },
    // 预览入口
    async previewTextFile(row){
      this.textPreviewVisible = true;
      this.textPreviewLoading = true;
      this.textPreviewIsMarkdown = false;
      this.textPreviewContent = '';
      this.markdownHtml='';
      this.textPreviewTitle = row.file_name || '文本预览';
      try {
        const rawUrl = `/api/clipboard/file/${row.id}/raw`;
        let j = null;
        try {
          const r = await fetch(rawUrl, { headers: { 'X-API-Key': this.apiKey }});
          if(r.ok) j = await r.json();
        } catch(_) {}
        if(j && j.success && j.isText){
          this.textPreviewContent = j.content;
        } else {
          // fallback 获取 blob
            const r2 = await fetch(`/api/clipboard/file/${row.id}`, { headers: { 'X-API-Key': this.apiKey }});
            if(!r2.ok) throw new Error('获取文件失败');
            const blob = await r2.blob();
            this.textPreviewContent = await blob.text();
        }
        const isMd = /\.md$/i.test(row.file_name||'') || /markdown/.test(row.mime_type||'');
        if(isMd){
          this.textPreviewIsMarkdown = true;
          this.markdownHtml = marked.parse(this.textPreviewContent || '');
        }
      } catch(e){
        this.$message.error('预览失败: '+ e.message);
      } finally {
        this.textPreviewLoading = false;
      }
    },
    previewPdfFile(row){
      this.pdfPreviewVisible = true;
      this.pdfPreviewLoading = true;
      this.pdfPreviewUrl = '';
      const url = `/api/clipboard/file/${row.id}?apiKey=${this.apiKey}`;
      // 直接赋值即可 (浏览器内嵌 PDF 插件)
      setTimeout(()=>{ this.pdfPreviewUrl = url; this.pdfPreviewLoading=false; }, 50);
    },
    previewImage(row){
      this.previewFile = row;
      this.imagePreviewUrl = `/api/clipboard/file/${row.id}?apiKey=${this.apiKey}`;
      this.imagePreviewVisible = true;
    },
    handleImageError(e){ e.target.style.opacity=0.2; },
    handleImagePreviewClose(){ this.imagePreviewVisible=false; },
    handleDeleteItem(id){ this.$emit('delete-item', id); },
    handleCommand(cmd,row){
      switch(cmd){
        case 'previewText': this.previewTextFile(row); break;
        case 'previewPdf': this.previewPdfFile(row); break;
        case 'previewImage': this.previewImage(row); break;
        case 'delete': this.handleDeleteItem(row.id); break;
      }
    },
  openEdit(row){
      if (row.is_file) {
        // 不直接编辑大文件，只允许文本/markdown
    if (this.isTextFile(row.mime_type) || /markdown|text/.test(row.mime_type || '')) {
          this.fetchRawContent(row).then(txt => {
            this.editContent = txt;
            this.editingFileName = row.file_name || 'edited.txt';
            this.editDialogVisible = true;
          }).catch(()=>{
            this.$message.error('无法加载文本内容');
          });
        } else {
          this.$message.warning('非文本文件不可编辑');
        }
      } else {
        this.editContent = row.content || '';
        this.editingFileName = 'edited.txt';
        this.editDialogVisible = true;
      }
    },
    async fetchRawContent(row) {
      const base = `/api/clipboard/file/${row.id}/raw`;
      try {
        const r = await fetch(base, { headers: { 'X-API-Key': this.apiKey }});
        if (!r.ok) throw new Error('raw failed');
        const j = await r.json();
        if (!j.success || !j.isText) throw new Error('not text');
        return j.content;
      } catch(e) {
        // fallback 二进制 -> text
        const r2 = await fetch(`/api/clipboard/file/${row.id}`, { headers: { 'X-API-Key': this.apiKey }});
        if (!r2.ok) throw new Error('fallback failed');
        const blob = await r2.blob();
        return await blob.text();
      }
    },
    copyEdited() {
      navigator.clipboard.writeText(this.editContent).then(()=>{
        this.$message.success('已复制');
      });
    },
    downloadEdited() {
      const name = this.editingFileName.replace(/[/\\]/g,'_') || 'edited.txt';
      const blob = new Blob([this.editContent], { type: 'text/plain;charset=utf-8' });
      // Safari 兼容
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{
        URL.revokeObjectURL(url);
        a.remove();
      }, 1500);
      this.$message.success('下载已触发');
    },
    // 覆盖 / 新增 下载逻辑：Safari 兼容 & 降级
    async downloadFile(row) {
      try {
        const apiKey = this.apiKey;
        const fileUrl = `/api/clipboard/file/${row.id}?download=1`;
        // 先尝试 fetch 方式
        const resp = await fetch(fileUrl, { headers: { 'X-API-Key': apiKey }});
        if (!resp.ok) throw new Error('resp not ok');
        const disposition = resp.headers.get('Content-Disposition') || '';
        let suggested = row.file_name || 'download';
        const m = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
        if (m) {
          suggested = decodeURIComponent(m[1] || m[2] || suggested);
        }
        const blob = await resp.blob();
        if (blob.size === 0) throw new Error('empty file');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggested;
        document.body.appendChild(a);
        a.click();
        setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 1500);
      } catch(e) {
        console.warn('下载 fetch 失败, 尝试窗口导航', e);
        // 直接跳转 (解决某些浏览器 blob 问题)
        const direct = document.createElement('a');
        direct.href = `/api/clipboard/file/${row.id}?download=1&ts=${Date.now()}`;
        direct.setAttribute('download','');
        direct.click();
        // 如果仍失败, 给出提示
        this.$message.error('下载触发(若仍失败请查看网络日志)');
      }
    }
    // ...existing code...
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

/* 文本/Markdown/PDF 预览 & 编辑对话框样式 */
.edit-copy-dialog :deep(.el-dialog__body){padding-top:6px;}
.edit-toolbar .el-button{margin-left:auto;}
.text-preview-dialog .markdown-body{font-size:14px;line-height:1.6;}
.text-preview_dialog pre{background:#1e1e1e;color:#f1f1f1;}
.pdf-frame{width:100%;height:70vh;border:none;}
.preview-loading{padding:40px;text-align:center;color:#888;}

/* 暗色模式 */
:global(.dark) .text-preview_dialog pre{background:#0f1418;color:#e6e6e6;}
:global(.dark) .markdown-body{color:#d0d6dc;}
:global(.dark) .markdown-body a{color:#6aa8ff;}
:global(.dark) .markdown-body code:not(pre code){background:#2d3338;color:#e6e6e6;}
:global(.dark) .pdf-preview-dialog :deep(.el-dialog__body){background:#1f2529;}
:global(.dark) .edit-copy-dialog textarea{background:#1a2024!important;color:#dbe2e8;}

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