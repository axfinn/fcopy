<template>
  <div class="my-connections">
    <el-card class="connections-card">
      <template #header>
        <div class="card-header">
          <span>我的连接</span>
        </div>
      </template>
      
      <el-table :data="activeUsers" style="width: 100%" empty-text="暂无连接信息">
        <el-table-column prop="id" label="用户ID" width="100"></el-table-column>
        <el-table-column prop="username" label="用户名"></el-table-column>
        <el-table-column prop="is_admin" label="管理员" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_admin ? 'danger' : 'info'">
              {{ scope.row.is_admin ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalConnections" label="连接数" width="100">
          <template #default="scope">
            {{ scope.row.totalConnections }}
          </template>
        </el-table-column>
        <el-table-column label="浏览器详情" width="250">
          <template #default="scope">
            <div v-for="(count, browser) in scope.row.browsers" :key="browser" class="browser-info">
              <el-tag size="small" type="info">{{ browser }}: {{ count }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="连接详情" width="300">
          <template #default="scope">
            <div v-for="conn in scope.row.connections" :key="conn.socketId" class="connection-info">
              <div class="connection-detail">
                <div>IP: {{ conn.ip }}</div>
                <div>连接时间: {{ formatToShanghaiTime(conn.connectedAt) }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'MyConnections',
  props: {
    activeUsers: Array
  },
  methods: {
    // 格式化时间为上海时区
    formatToShanghaiTime(dateString) {
      const date = new Date(dateString);
      // 使用Intl.DateTimeFormat格式化为上海时区时间
      return new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(date);
    }
  }
};
</script>

<style scoped>
.my-connections {
  padding: 20px 0;
}

.connections-card {
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 768px) {
  .my-connections {
    padding: 10px 0;
  }
}

.browser-info {
  margin-bottom: 4px;
}

.browser-info:last-child {
  margin-bottom: 0;
}

.connection-info {
  margin-bottom: 8px;
  padding: 5px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.connection-info:last-child {
  margin-bottom: 0;
}

.connection-detail {
  font-size: 12px;
  color: #666;
}
</style>