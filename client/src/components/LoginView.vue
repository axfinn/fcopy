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
    
    <!-- 底部使用说明 -->
    <div class="login-footer">
      <div class="usage-guide-content">
        <h3>使用说明</h3>
        <ul>
          <li>使用 Ctrl+C / Cmd+C 复制内容到剪贴板</li>
          <li>使用 Ctrl+V / Cmd+V 粘贴截图或文件</li>
          <li>文本内容会自动同步到所有连接的设备</li>
          <li>文件和图片可通过"下载"按钮保存到本地</li>
          <li>支持实时同步，无需手动刷新</li>
        </ul>
      </div>
    </div>
    
    <!-- GitHub信息 -->
    <div class="login-github-footer" v-if="githubInfo">
      <GitHubInfo 
        :github-info="githubInfo" 
        :is-authenticated="false"
      />
    </div>
  </div>
</template>

<script>
import GitHubInfo from './GitHubInfo.vue';

export default {
  name: 'LoginView',
  components: {
    GitHubInfo
  },
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
  justify-content: center;
  align-items: center;
  overflow: auto;
  z-index: 2000;
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
  position: relative;
  z-index: 2001;
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

/* 登录页底部使用说明 */
.login-footer {
  position: fixed;
  bottom: 40px;
  left: 0;
  width: 100%;
  background-color: rgba(52, 52, 52, 0.9);
  color: white;
  z-index: 2002;
  backdrop-filter: blur(5px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.usage-guide-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 20px;
  text-align: center;
}

.usage-guide-content h3 {
  margin: 0 0 5px 0;
  font-size: 0.9rem;
  color: #fff;
}

.usage-guide-content ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.usage-guide-content li {
  background-color: rgba(64, 158, 255, 0.3);
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.75rem;
}

/* 登录页GitHub信息 */
.login-github-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 2003;
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
  
  .usage-guide-content ul {
    flex-direction: column;
    gap: 5px;
  }
  
  .usage-guide-content li {
    padding: 3px 8px;
    font-size: 0.7rem;
  }
  
  .login-footer {
    bottom: 70px;
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