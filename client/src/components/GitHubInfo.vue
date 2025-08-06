<template>
  <div v-if="githubInfo" class="github-info-container">
    <div class="github-info-content">
      <div class="project-info">
        <span class="info-item">
          <i class="el-icon-collection"></i> Stars: {{ githubInfo.stars }}
        </span>
        <span class="info-item">
          <i class="el-icon-share"></i> Forks: {{ githubInfo.forks }}
        </span>
        <span class="info-item">
          <i class="el-icon-info"></i> Version: {{ githubInfo.version }}
        </span>
      </div>
      <div class="support-info">
        <span class="support-item">
          <i class="el-icon-link"></i> 
          <a :href="githubInfo.html_url" target="_blank" rel="noopener">GitHub 项目</a>
        </span>
        <span class="support-item">
          <i class="el-icon-chat-dot-round"></i> 
          <a href="https://github.com/axfinn/fcopy/issues" target="_blank" rel="noopener">问题反馈</a>
        </span>
        <span class="support-item">
          <i class="el-icon-document"></i> 
          <a href="https://github.com/axfinn/fcopy/blob/main/README.md" target="_blank" rel="noopener">使用文档</a>
        </span>
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
      required: true
    }
  }
}
</script>

<style scoped>
.github-info-container {
  margin-top: auto;
  padding: 15px 0;
  font-size: 0.85rem;
  color: #666;
  background-color: rgba(245, 245, 245, 0.8);
  backdrop-filter: blur(5px);
  border-top: 1px solid #eee;
}

.github-info-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
}

.project-info, .support-info {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin: 5px 0;
}

.info-item, .support-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 15px;
  background-color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
}

.info-item i, .support-item i {
  color: #409EFF;
  font-size: 0.9rem;
}

.support-item a {
  color: #666;
  text-decoration: none;
  transition: color 0.3s ease;
}

.support-item a:hover {
  color: #409EFF;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .github-info-content {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
  
  .project-info, .support-info {
    justify-content: center;
  }
}
</style>
