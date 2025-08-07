<template>
  <div class="github-info-container">
    <div class="github-info-content" v-if="githubInfo">
      <div class="github-stats">
        <span class="github-stat-item">
          <i class="el-icon-collection"></i> Stars: {{ githubInfo.stars }}
        </span>
        <span class="github-stat-item">
          <i class="el-icon-share"></i> Forks: {{ githubInfo.forks }}
        </span>
        <span class="github-stat-item">
          <i class="el-icon-info"></i> Version: {{ githubInfo.version }}
        </span>
      </div>
      
      <div class="github-links">
        <a :href="githubInfo.html_url" target="_blank" rel="noopener">GitHub 项目</a>
        <a href="https://github.com/axfinn/fcopy/issues" target="_blank" rel="noopener">问题反馈</a>
        <a href="https://github.com/axfinn/fcopy/blob/main/README.md" target="_blank" rel="noopener">使用文档</a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GitHubInfo',
  props: {
    githubInfo: {
      type: Object,
      default: null
    },
    isAuthenticated: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.github-info-container {
  width: 100%;
  background-color: rgba(52, 52, 52, 0.9);
  color: white;
  backdrop-filter: blur(5px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.github-info-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.github-stats {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.github-stat-item {
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
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
  .github-info-content {
    flex-direction: column;
    text-align: center;
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
  .github-info-content {
    padding: 8px 15px;
  }
  
  .github-stats {
    gap: 10px;
  }
  
  .github-stat-item {
    font-size: 0.75rem;
  }
  
  .github-links {
    gap: 10px;
  }
  
  .github-links a {
    font-size: 0.75rem;
  }
}
</style>