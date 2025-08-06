<template>
  <div v-if="githubInfo" class="github-info-container">
    <div class="github-info-content">
      <div class="github-stats">
        <span class="stat-item">
          <i class="el-icon-collection"></i> {{ githubInfo.stars }}
        </span>
        <span class="stat-item">
          <i class="el-icon-share"></i> {{ githubInfo.forks }}
        </span>
        <span class="stat-item">
          <i class="el-icon-info"></i> {{ githubInfo.version }}
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
  padding: 20px 0;
  font-size: 0.85rem;
  color: #666;
}

.github-info-content {
  text-align: center;
  padding: 15px;
  border-top: 1px solid #eee;
}

.github-stats {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 15px;
  margin: 10px 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 15px;
  background-color: #f5f5f5;
}

.stat-item i {
  color: #409EFF;
  font-size: 0.9rem;
}
</style>