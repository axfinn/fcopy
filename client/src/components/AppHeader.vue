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

.auth-info {
  display: flex;
  align-items: center;
  margin: 10px 0;
  z-index: 102;
  position: relative;
}

.logout-button {
  width: auto;
  padding: 8px 16px;
  font-size: 12px;
  cursor: pointer;
  position: relative;
  z-index: 103;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
  color: white !important;
  pointer-events: auto !important;
  margin: 0 !important;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: row;
    text-align: left;
    gap: 10px;
    padding: 15px 15px;
  }
  
  .header-content h1 {
    font-size: 1.2rem;
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
    z-index: 102;
  }
  
  .logout-button {
    padding: 8px 16px;
    font-size: 12px;
    cursor: pointer;
    position: relative;
    z-index: 103;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2);
  }
}

@media (min-width: 769px) {
  .logout-button {
    padding: 10px 20px;
    font-size: 13px;
    min-width: 100px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    z-index: 103;
  }
  
  .auth-info {
    z-index: 102;
  }
}
</style>