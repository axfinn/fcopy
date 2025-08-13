<template>
  <el-dialog 
    v-model="visible" 
    title="编辑并复制 / 下载" 
    width="600px" 
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-input
      type="textarea"
      v-model="content"
      :rows="14"
      placeholder="在这里编辑内容..."
      show-word-limit
      maxlength="20000"
      style="font-family: var(--monospace, monospace);"
    />
    <div class="edit-toolbar">
      <div class="word-count">字数: {{ content.length }}</div>
      <div class="button-group">
        <el-button size="small" @click="content = ''">清空</el-button>
        <el-button size="small" type="primary" @click="copyContent">复制</el-button>
        <el-button size="small" type="success" @click="downloadContent">下载为文件</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'EditDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    initialContent: {
      type: String,
      default: ''
    },
    fileName: {
      type: String,
      default: 'edited.txt'
    }
  },
  emits: ['update:modelValue', 'copy', 'download'],
  data() {
    return {
      content: ''
    };
  },
  computed: {
    visible: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    }
  },
  watch: {
    initialContent: {
      handler(newValue) {
        this.content = newValue || '';
      },
      immediate: true
    }
  },
  methods: {
    copyContent() {
      navigator.clipboard.writeText(this.content).then(() => {
        this.$message.success('已复制');
        this.$emit('copy', this.content);
      }).catch(error => {
        console.error('复制失败:', error);
        this.$message.error('复制失败');
      });
    },
    
    downloadContent() {
      const name = (this.fileName || 'edited.txt').replace(/[/\\]/g, '_');
      const blob = new Blob([this.content], { type: 'text/plain;charset=utf-8' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 1500);
      
      this.$message.success('下载已触发');
      this.$emit('download', { content: this.content, fileName: name });
    },
    
    handleClose() {
      this.content = '';
      this.$emit('update:modelValue', false);
    }
  }
};
</script>

<style scoped>
.edit-toolbar {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.word-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.button-group {
  display: flex;
  gap: 8px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .edit-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .button-group {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>