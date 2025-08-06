<template>
  <div class="login-background">
    <div class="auth-container">
      <el-card class="auth-card" shadow="always">
        <div class="auth-card-header">
          <div class="logo">
            <i class="el-icon-copy-document"></i>
          </div>
          <h2>跨平台剪贴板同步</h2>
          <p class="subtitle">安全、便捷、跨平台的剪贴板同步工具</p>
        </div>
        <el-input 
          v-model="apiKey" 
          placeholder="请输入访问密钥" 
          show-password
          size="large"
          class="auth-input"
          @keyup.enter="authenticate"
        />
        <el-button 
          type="primary" 
          @click="authenticate"
          class="auth-button"
          size="large"
        >
          <i class="el-icon-key"></i> 安全登录
        </el-button>
        
        <div class="auth-hint">
          <p><i class="el-icon-info"></i> 输入您的API密钥以访问剪贴板同步服务</p>
          <p><i class="el-icon-info"></i> 管理员密钥可访问用户管理和系统日志</p>
        </div>
        
        <div class="features">
          <div class="feature-item">
            <i class="el-icon-upload"></i>
            <span>文本与文件同步</span>
          </div>
          <div class="feature-item">
            <i class="el-icon-refresh"></i>
            <span>实时同步</span>
          </div>
          <div class="feature-item">
            <i class="el-icon-mobile"></i>
            <span>跨平台支持</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  data() {
    return {
      apiKey: ''
    }
  },
  emits: ['authenticate'],
  methods: {
    authenticate() {
      this.$emit('authenticate', this.apiKey);
    }
  }
}
</script>

<style scoped>
.login-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
}

.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.auth-card {
  width: 100%;
  max-width: 450px;
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 40px 30px;
  margin: auto;
}

.auth-card-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #409EFF 0%, #1a56db 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
}

.logo i {
  font-size: 40px;
  color: white;
}

.auth-card-header h2 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.8rem;
  font-weight: 600;
}

.subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.auth-input {
  margin: 25px 0;
}

.auth-button {
  width: 100%;
  margin-bottom: 25px;
  background: linear-gradient(135deg, #409EFF 0%, #1a56db 100%);
  border: none;
  padding: 15px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.auth-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.4);
}

.auth-hint {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 30px;
}

.auth-hint p {
  margin: 10px 0;
}

.auth-hint i {
  margin-right: 5px;
  color: #409EFF;
}

.features {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
}

.feature-item {
  flex: 1;
  min-width: 100px;
  text-align: center;
  padding: 10px;
  border-radius: 10px;
  background: #f5f7fa;
  transition: all 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  background: #e9f4ff;
}

.feature-item i {
  font-size: 20px;
  color: #409EFF;
  margin-bottom: 8px;
  display: block;
}

.feature-item span {
  font-size: 13px;
  color: #666;
}

@media (max-width: 768px) {
  .auth-card {
    margin: 20px;
    padding: 30px 20px;
  }
  
  .auth-card-header h2 {
    font-size: 1.5rem;
  }
  
  .logo {
    width: 60px;
    height: 60px;
  }
  
  .logo i {
    font-size: 30px;
  }
}

@media (max-width: 480px) {
  .auth-card {
    margin: 15px;
    padding: 25px 15px;
  }
  
  .auth-card-header h2 {
    font-size: 1.3rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .features {
    gap: 10px;
  }
  
  .feature-item {
    min-width: 80px;
    padding: 8px 5px;
  }
  
  .feature-item i {
    font-size: 18px;
  }
  
  .feature-item span {
    font-size: 12px;
  }
}
</style>