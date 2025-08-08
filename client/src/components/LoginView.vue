<template>
  <div class="login-background">
    <div class="background-container">
      <div 
        class="background-slide"
        :style="{ 
          backgroundImage: `url(${currentBackground})`,
          opacity: 1
        }"
      ></div>
    </div>
    
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
    
    <!-- GitHub信息 -->
    <div class="github-info">
      <div class="github-info-content">
        <div class="github-text">
          <i class="el-icon-collection"></i>
          本项目已在 GitHub 开源，欢迎 Star 和 Fork
        </div>
        <div class="github-links">
          <a href="https://github.com/axfinn/fcopy" target="_blank" rel="noopener">GitHub 项目</a>
          <a href="https://github.com/axfinn/fcopy/issues" target="_blank" rel="noopener">问题反馈</a>
          <a href="https://github.com/axfinn/fcopy/blob/main/README.md" target="_blank" rel="noopener">部署文档</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  props: {
    githubInfo: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      apiKey: '',
      backgrounds: [
        'https://picsum.photos/1920/1080?random=1',
        'https://picsum.photos/1920/1080?random=2',
        'https://picsum.photos/1920/1080?random=3',
        'https://picsum.photos/1920/1080?random=4',
        'https://picsum.photos/1920/1080?random=5'
      ],
      currentBackgroundIndex: 0
    };
  },
  computed: {
    currentBackground() {
      // 添加时间戳防止缓存
      const timestamp = new Date().getTime();
      return `${this.backgrounds[this.currentBackgroundIndex]}&t=${timestamp}`;
    }
  },
  emits: ['authenticate'],
  methods: {
    authenticate() {
      this.$emit('authenticate', this.apiKey);
    },
    // 切换背景图片
    changeBackground() {
      this.currentBackgroundIndex = (this.currentBackgroundIndex + 1) % this.backgrounds.length;
    }
  },
  mounted() {
    // 每30秒自动切换背景图片
    setInterval(this.changeBackground, 30000);
    
    // 初始加载时随机选择一个背景
    this.currentBackgroundIndex = Math.floor(Math.random() * this.backgrounds.length);
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: auto;
  z-index: 2000;
  padding: 20px 0;
  box-sizing: border-box;
}

.background-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.background-slide {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex: 1;
  padding: 20px 20px 10px;
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
  position: relative;
  z-index: 10;
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
  line-height: 1.5;
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
  padding: 12px;
  border-radius: 10px;
  background: #f5f7fa;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
}

.feature-item span {
  font-size: 13px;
  color: #666;
}

/* GitHub信息样式 */
.github-info {
  width: 100%;
  background-color: rgba(52, 52, 52, 0.9);
  color: white;
  backdrop-filter: blur(5px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  margin-top: auto;
}

.github-info-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.github-text {
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.github-links {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.github-links a {
  color: #409EFF;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.github-links a:hover {
  color: #66b1ff;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .login-background {
    padding: 15px 0;
  }
  
  .auth-container {
    padding: 15px 15px 5px;
  }
  
  .auth-card {
    margin: 0;
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
  
  .features {
    gap: 12px;
  }
  
  .feature-item {
    min-width: 80px;
    padding: 10px;
  }
  
  .feature-item i {
    font-size: 18px;
  }
  
  .feature-item span {
    font-size: 12px;
  }
  
  .github-info-content {
    flex-direction: column;
    text-align: center;
  }
  
  .github-text {
    justify-content: center;
  }
  
  .github-stats {
    justify-content: center;
  }
  
  .github-stat-item {
    font-size: 0.8rem;
  }
  
  .github-links a {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .login-background {
    padding: 10px 0;
  }
  
  .auth-container {
    padding: 10px 10px 5px;
  }
  
  .auth-card {
    margin: 0;
    padding: 25px 15px;
  }
  
  .auth-card-header h2 {
    font-size: 1.3rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .logo {
    width: 50px;
    height: 50px;
  }
  
  .logo i {
    font-size: 24px;
  }
  
  .auth-input {
    margin: 20px 0;
  }
  
  .auth-button {
    padding: 12px;
    font-size: 14px;
  }
  
  .features {
    flex-direction: column;
    gap: 10px;
  }
  
  .feature-item {
    min-width: auto;
    padding: 12px;
    flex-direction: row;
    text-align: left;
    gap: 10px;
  }
  
  .feature-item i {
    font-size: 18px;
    margin-bottom: 0;
  }
  
  .feature-item span {
    font-size: 13px;
  }
  
  .github-info-content {
    padding: 12px 15px;
  }
  
  .github-text {
    font-size: 0.8rem;
  }
  
  .github-links {
    gap: 10px;
  }
  
  .github-links a {
    font-size: 0.8rem;
  }
}

/* 超小屏幕设备优化 */
@media (max-width: 360px) {
  .auth-card {
    padding: 20px 12px;
  }
  
  .auth-card-header h2 {
    font-size: 1.2rem;
  }
  
  .subtitle {
    font-size: 0.85rem;
  }
  
  .logo {
    width: 45px;
    height: 45px;
  }
  
  .logo i {
    font-size: 20px;
  }
  
  .auth-input {
    margin: 15px 0;
  }
  
  .auth-button {
    padding: 10px;
    font-size: 13px;
  }
  
  .feature-item {
    padding: 10px;
    gap: 8px;
  }
  
  .feature-item i {
    font-size: 16px;
  }
  
  .feature-item span {
    font-size: 12px;
  }
  
  .github-info-content {
    padding: 10px 12px;
  }
  
  .github-text {
    font-size: 0.75rem;
  }
  
  .github-links a {
    font-size: 0.75rem;
  }
}
</style>