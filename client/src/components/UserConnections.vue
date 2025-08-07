<template>
  <div class="card">
    <div class="card-header">
      <h3><i class="el-icon-user"></i> 我的连接</h3>
    </div>
    
    <el-table :data="userConnections" style="width: 100%">
      <el-table-column prop="id" label="连接ID" width="100"></el-table-column>
      <el-table-column prop="ip" label="IP地址" width="150">
        <template #default="scope">
          {{ formatIpAddress(scope.row.ip) }}
        </template>
      </el-table-column>
      <el-table-column prop="userAgent" label="客户端"></el-table-column>
      <el-table-column prop="connectedAt" label="连接时间" width="200">
        <template #default="scope">
          {{ formatTime(scope.row.connectedAt) }}
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 当没有连接时显示提示信息 -->
    <div v-if="userConnections.length === 0" style="text-align: center; padding: 20px; color: #999;">
      暂无连接信息
    </div>
  </div>
</template>