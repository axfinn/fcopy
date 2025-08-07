<template>
  <div class="card">
    <div class="card-header">
      <h3><i class="el-icon-user"></i> 我的连接</h3>
    </div>
    
    <el-table :data="activeUsers" style="width: 100%" v-loading="loadingActiveUsers">
      <el-table-column prop="id" label="连接ID" width="100"></el-table-column>
      <el-table-column prop="ip" label="IP地址" width="150"></el-table-column>
      <el-table-column prop="userAgent" label="客户端"></el-table-column>
      <el-table-column prop="connectedAt" label="连接时间" width="200">
        <template #default="scope">
          {{ formatTime(scope.row.connectedAt) }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'MyConnections',
  props: {
    activeUsers: Array
  },
  data() {
    return {
      loadingActiveUsers: false
    };
  },
  mounted() {
    // 组件挂载时获取活跃用户数据
    this.fetchActiveUsers();
  },
  methods: {
    fetchActiveUsers() {
      // 触发父组件获取活跃用户数据
      this.$parent.$emit('fetch-active-users');
    },
    
    formatTime(date) {
      if (!date) return '';
      return new Date(date).toLocaleString('zh-CN');
    }
  }
}
</script>

<style scoped>
.card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 20px;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.card:hover {
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header h3 i {
  color: #409EFF;
}
</style>