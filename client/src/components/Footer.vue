<template>
  <div class="app-footer">
    <div class="footer-content">
      <div class="footer-section">
        <h4>开源项目</h4>
        <p>本项目是一个开源的跨平台剪贴板同步工具</p>
        <div class="github-links" v-if="githubInfo">
          <a :href="githubInfo.html_url" target="_blank" rel="noopener" class="project-link">
            <i class="el-icon-star-off"></i> GitHub项目: {{ githubInfo.html_url }}
          </a>
          <a :href="githubInfo.html_url + '/issues'" target="_blank" rel="noopener">
            <i class="el-icon-chat-dot-round"></i> 问题反馈
          </a>
          <a :href="githubInfo.html_url + '/blob/main/README.md'" target="_blank" rel="noopener">
            <i class="el-icon-document"></i> 使用文档
          </a>
        </div>
        <div class="project-link-container" v-else>
          <a href="https://github.com/axfinn/fcopy" target="_blank" rel="noopener" class="project-link">
            <i class="el-icon-star-off"></i> GitHub项目: https://github.com/axfinn/fcopy
          </a>
        </div>
      </div>
      
      <div class="footer-section">
        <h4>统计信息</h4>
        <div class="stats" v-if="githubInfo">
          <span class="stat-item">
            <i class="el-icon-collection"></i> Stars: {{ githubInfo.stars }}
          </span>
          <span class="stat-item">
            <i class="el-icon-share"></i> Forks: {{ githubInfo.forks }}
          </span>
          <span class="stat-item">
            <i class="el-icon-info"></i> Version: {{ githubInfo.version }}
          </span>
        </div>
      </div>
      
      <div class="footer-section">
        <h4>使用说明</h4>
        <ul class="usage-guide">
          <li>使用 Ctrl+C / Cmd+C 复制内容到剪贴板</li>
          <li>使用 Ctrl+V / Cmd+V 粘贴截图或文件</li>
          <li>文本内容会自动同步到所有连接的设备</li>
          <li>文件和图片可通过"下载"按钮保存到本地</li>
          <li>支持实时同步，无需手动刷新</li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h4>支持我们</h4>
        <p>如果您觉得这个项目有用，请在GitHub上给我们一个Star!</p>
        <p class="copyright">
          &copy; {{ new Date().getFullYear() }} 跨平台剪贴板同步工具. 保留所有权利.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Footer',
  props: {
    githubInfo: {
      type: Object,
      default: null
    }
  }
}
</script>

<style scoped>
.app-footer {
  background-color: rgba(52, 52, 52, 0.9);
  color: white;
  backdrop-filter: blur(5px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px 0;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.footer-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #409EFF;
  font-size: 1.1rem;
}

.footer-section p {
  margin: 8px 0;
  font-size: 0.9rem;
  color: #ddd;
  line-height: 1.5;
}

.usage-guide {
  margin: 0 0 15px 0;
  padding-left: 20px;
}

.usage-guide li {
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #ddd;
  line-height: 1.4;
}

.github-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.github-links a,
.project-link {
  color: #409EFF;
  text-decoration: none;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: color 0.3s ease;
  word-break: break-all;
}

.github-links a:hover,
.project-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.project-link-container {
  margin-top: 10px;
}

.project-link-container a {
  color: #409EFF;
  text-decoration: none;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: color 0.3s ease;
  word-break: break-all;
}

.project-link-container a:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
}

.copyright {
  margin-top: 15px;
  font-size: 0.8rem;
  color: #aaa;
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .footer-section h4 {
    font-size: 1rem;
  }
  
  .footer-section p,
  .usage-guide li,
  .github-links a,
  .project-link,
  .project-link-container a,
  .stat-item {
    font-size: 0.85rem;
  }
  
  .copyright {
    font-size: 0.75rem;
  }
  
  .app-footer {
    padding: 15px 0;
  }
  
  .footer-content {
    padding: 0 15px;
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .app-footer {
    padding: 15px 0;
  }
  
  .footer-content {
    padding: 0 15px;
    gap: 15px;
  }
  
  .footer-section h4 {
    font-size: 0.95rem;
    margin-bottom: 10px;
  }
  
  .footer-section p,
  .usage-guide li,
  .github-links a,
  .project-link,
  .project-link-container a,
  .stat-item {
    font-size: 0.8rem;
  }
  
  .github-links,
  .project-link-container {
    margin-top: 8px;
  }
  
  .github-links a,
  .project-link-container a {
    gap: 4px;
  }
  
  .stats {
    gap: 6px;
  }
  
  .usage-guide {
    margin-bottom: 12px;
  }
  
  .usage-guide li {
    margin-bottom: 6px;
  }
  
  .copyright {
    font-size: 0.7rem;
    margin-top: 12px;
  }
}

@media (max-width: 360px) {
  .app-footer {
    padding: 12px 0;
  }
  
  .footer-content {
    padding: 0 12px;
    gap: 12px;
  }
  
  .footer-section h4 {
    font-size: 0.9rem;
    margin-bottom: 8px;
  }
  
  .footer-section p,
  .usage-guide li,
  .github-links a,
  .project-link,
  .project-link-container a,
  .stat-item {
    font-size: 0.75rem;
  }
  
  .github-links,
  .project-link-container {
    margin-top: 6px;
  }
  
  .github-links a,
  .project-link-container a {
    gap: 3px;
  }
  
  .stats {
    gap: 5px;
  }
  
  .usage-guide {
    margin-bottom: 10px;
    padding-left: 15px;
  }
  
  .usage-guide li {
    margin-bottom: 5px;
  }
  
  .copyright {
    font-size: 0.65rem;
    margin-top: 10px;
  }
}
</style>