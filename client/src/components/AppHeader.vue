<template>
  <el-header class="app-header">
    <div class="header-content">
      <div class="header-left">
        <h1><i class="el-icon-copy-document"></i> 跨平台剪贴板同步工具</h1>
      </div>
      <div class="header-right">
        
        <div class="auth-info" v-if="isAuthenticated">
          <el-button 
            type="danger" 
            size="small" 
            @click="logout" 
            round
            class="logout-button"
          >
            <i class="el-icon-switch-button"></i> 登出
          </el-button>
        </div>
      </div>
    </div>
  </el-header>
</template>

<script>
import store from '../store';

export default {
  name: 'AppHeader',
  props: {
    isAuthenticated: {
      type: Boolean,
      required: true
    }
  },
  emits: ['logout'],
  data() {
    return {
    };
  },
  methods: {
    logout() {
      this.$emit('logout');
    },
    
  },
  
}
</script>

<style scoped>
.app-header {
  background-color: transparent !important;
  padding: 0 !important;
  height: auto !important;
  line-height: normal !important;
  position: relative !important;
  z-index: 100 !important;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  flex-wrap: wrap;
  position: relative;
  padding: 10px 20px;
  z-index: 101;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 0;
  margin: 0;
  backdrop-filter: blur(5px);
  box-shadow: none;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-content h1 {
  margin: 10px 0;
  color: #333;
  font-size: 1.5rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: left;
}

.header-content h1 i {
  margin-right: 10px;
  color: #409EFF;
}

.settings-panel {
  display: flex;
  align-items: center;
}

.settings-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.settings-content {
  padding: 10px 0;
}

.setting-item {
  margin-bottom: 15px;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.opacity-value {
  text-align: center;
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.auth-info {
  display: flex;
  align-items: center;
  margin: 10px 0;
  z-index: 102;
  position: relative;
}

.logout-button {
  width: auto;
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
}

.settings-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background-color: #409EFF !important;
  border-color: #409EFF !important;
}

.logout-button:hover {
  background-color: #ff4d4f !important;
  border-color: #ff4d4f !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
}

.logout-button i {
  margin-right: 5px;
}
</style>