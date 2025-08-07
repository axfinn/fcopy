<template>
  <div class="add-content">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="upload-card">
          <template #header>
            <div class="card-header">
              <span>添加内容</span>
            </div>
          </template>
          
          <!-- 文件上传区域 -->
          <div class="upload-area" @paste="handlePaste">
            <el-upload
              drag
              :action="uploadUrl"
              :headers="uploadHeaders"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :multiple="true"
              class="upload-component"
            >
              <i class="el-icon-upload"></i>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <div class="el-upload__tip" slot="tip">
                支持任意类型文件
              </div>
            </el-upload>
          </div>
          
          <!-- 文本输入区域 -->
          <div class="text-input-area">
            <el-input
              type="textarea"
              :rows="6"
              placeholder="请输入文本内容"
              v-model="textContent"
              class="text-input"
            ></el-input>
            <el-button 
              type="primary" 
              @click="addTextContent" 
              :disabled="!textContent.trim()"
              class="add-text-btn"
            >
              添加文本
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 使用说明 -->
    <el-row :gutter="20" class="usage-guide-row">
      <el-col :span="24">
        <el-card class="usage-guide-card">
          <template #header>
            <div class="card-header">
              <span>使用说明</span>
            </div>
          </template>
          <div class="usage-guide-content">
            <ul>
              <li><strong>截图粘贴</strong>: 在任意地方截图后，按下 <kbd>Ctrl</kbd>+<kbd>V</kbd> (Windows) 或 <kbd>Cmd</kbd>+<kbd>V</kbd> (Mac) 粘贴</li>
              <li><strong>文本粘贴</strong>: 复制任意文本后，按下 <kbd>Ctrl</kbd>+<kbd>V</kbd> (Windows) 或 <kbd>Cmd</kbd>+<kbd>V</kbd> (Mac) 粘贴</li>
              <li><strong>文件拖拽</strong>: 直接将文件拖拽到上面的上传区域即可</li>
            </ul>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'AddContent',
  props: {
    apiKey: String
  },
  data() {
    return {
      textContent: ''
    };
  },
  computed: {
    uploadUrl() {
      return '/api/clipboard/file';
    },
    uploadHeaders() {
      return {
        'X-API-Key': this.apiKey
      };
    }
  },
  methods: {
    // 处理粘贴事件
    handlePaste(event) {
      const items = (event.clipboardData || event.originalEvent.clipboardData).items;
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // 检查是否为文件
        if (item.kind === 'file') {
          const file = item.getAsFile();
          this.uploadFile(file);
        }
      }
    },
    
    // 上传文件
    async uploadFile(file) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch(this.uploadUrl, {
          method: 'POST',
          headers: {
            'X-API-Key': this.apiKey
          },
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          this.$emit('file-success', result);
          this.$message.success('文件上传成功');
        } else {
          throw new Error('上传失败');
        }
      } catch (error) {
        console.error('文件上传失败:', error);
        this.$emit('file-error', error);
        this.$message.error('文件上传失败: ' + error.message);
      }
    },
    
    // 处理上传成功
    handleUploadSuccess(response, file, fileList) {
      this.$emit('file-success', response);
      this.$message.success('文件上传成功');
    },
    
    // 处理上传失败
    handleUploadError(error, file, fileList) {
      console.error('文件上传失败:', error);
      this.$emit('file-error', error);
      this.$message.error('文件上传失败');
    },
    
    // 添加文本内容
    addTextContent() {
      if (!this.textContent.trim()) {
        this.$message.warning('请输入文本内容');
        return;
      }
      
      this.$emit('text-added', this.textContent);
      this.textContent = ''; // 清空输入框
    }
  }
};
</script>

<style scoped>
.add-content {
  padding: 20px 0;
}

.upload-card,
.usage-guide-card {
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-area {
  margin-bottom: 30px;
}

.text-input-area {
  margin-top: 20px;
}

.text-input {
  margin-bottom: 15px;
}

.add-text-btn {
  float: right;
}

.usage-guide-row {
  margin-top: 20px;
}

.usage-guide-content ul {
  padding-left: 20px;
  margin: 0;
}

.usage-guide-content li {
  margin-bottom: 10px;
  line-height: 1.5;
}

.usage-guide-content kbd {
  background-color: #f7f7f7;
  border: 1px solid #ccc;
  border-radius: 3px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.2);
  color: #333;
  display: inline-block;
  font-size: 11px;
  line-height: 1;
  padding: 2px 4px;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .add-content {
    padding: 10px 0;
  }
  
  .add-text-btn {
    float: none;
    width: 100%;
  }
}
</style>