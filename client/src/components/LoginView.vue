<template>
  <div class="auth-container">
    <el-card class="auth-card" shadow="always">
      <div class="auth-card-header">
        <i class="el-icon-lock"></i>
        <h2>安全验证</h2>
      </div>
      <el-input 
        v-model="apiKey" 
        placeholder="请输入访问密钥" 
        show-password
        size="large"
        class="auth-input"
      />
      <el-button 
        type="primary" 
        @click="authenticate"
        class="auth-button"
        size="large"
      >
        <i class="el-icon-key"></i> 鉴权登录
      </el-button>
      
      <div class="auth-hint">
        <p><i class="el-icon-info"></i> 提示：请输入有效的API密钥</p>
        <p><i class="el-icon-info"></i> 管理员密钥可访问用户和日志</p>
      </div>
    </el-card>
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
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.auth-card {
  width: 100%;
  max-width: 500px;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.auth-card-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-card-header i {
  font-size: 3rem;
  color: #409EFF;
  margin-bottom: 15px;
}

.auth-card-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.8rem;
}

.auth-input {
  margin: 20px 0;
}

.auth-button {
  width: 100%;
  margin-bottom: 20px;
}

.auth-hint {
  font-size: 14px;
  color: #666;
  text-align: center;
}

.auth-hint i {
  margin-right: 5px;
}
</style>