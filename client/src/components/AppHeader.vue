<template>
  <el-header class="app-header">
    <div class="header-content">
      <div class="header-left">
        <h1><i class="el-icon-copy-document"></i> 跨平台剪贴板同步工具</h1>
      </div>
      <div v-if="isAuthenticated" class="auth-info">
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
  </el-header>
</template>

<script>
export default {
  name: 'AppHeader',
  props: {
    isAuthenticated: {
      type: Boolean,
      required: true
    }
  },
  emits: ['logout'],
  methods: {
    logout() {
      this.$emit('logout');
    }
  }
}
</script>

<style scoped>
.app-header {
  background-color: transparent !important;
  padding: 0 !important;
  height: auto !important;
  line-height: normal !important;
  position: relative !important;
  z-index: 1000 !important;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  flex-wrap: wrap;
  position: relative;
  padding: 10px 0;
  z-index: 100;
}

.header-left {
  flex: 1;
}

.header-content h1 {
  margin: 10px 0;
  color: white;
  font-size: 1.5rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: left;
}

.header-content h1 i {
  margin-right: 10px;
}

.auth-info {
  display: flex;
  align-items: center;
  margin: 10px 0;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1001;
}

.header-content .auth-info .el-button {
  width: auto;
  padding: 8px 16px;
  font-size: 12px;
  cursor: pointer;
  position: relative;
  z-index: 1002;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
  color: white !important;
}

.logout-button {
  cursor: pointer !important;
  pointer-events: auto !important;
  z-index: 1002 !important;
  position: relative !important;
  touch-action: manipulation;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
  color: white !important;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: row;
    text-align: left;
    gap: 10px;
    padding: 15px 0;
  }
  
  .header-content h1 {
    font-size: 1.3rem;
    margin: 0;
    text-align: left;
    width: auto;
    flex: 1;
  }
  
  .auth-info {
    display: flex;
    justify-content: flex-end;
    margin: 0;
    position: relative;
    z-index: 1001;
    right: auto;
    top: auto;
    transform: none;
  }
  
  .logout-button {
    padding: 8px 16px;
    font-size: 13px;
    cursor: pointer;
    position: relative;
    z-index: 1002;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2) !important;
  }
}

@media (min-width: 769px) {
  .logout-button {
    padding: 10px 20px !important;
    font-size: 13px !important;
    min-width: 100px !important;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2) !important;
    cursor: pointer !important;
    pointer-events: auto !important;
    z-index: 9999 !important;
    position: relative !important;
  }
  
  .auth-info {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 9998;
  }
  
  .app-header {
    position: relative !important;
    z-index: 9997 !important;
  }
}
</style>