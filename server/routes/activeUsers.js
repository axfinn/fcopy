const express = require('express');
const router = express.Router();
const { authenticateApiKey } = require('../middleware/auth.js');
const { getWebSocketRealIpAddress } = require('../utils/ipUtils.js');

// 获取活跃用户列表
router.get('/', authenticateApiKey, (req, res) => {
  const io = req.app.get('io'); // 从应用设置中获取io实例
  
  // 获取所有连接的用户
  const activeUsers = [];
  const userConnections = {}; // 用于统计每个用户的连接数
  
  // 遍历所有连接的socket
  for (let [id, socket] of io.of("/").sockets) {
    if (socket.user) {
      // 统计每个用户的连接数
      if (!userConnections[socket.user.id]) {
        userConnections[socket.user.id] = {
          user: {
            id: socket.user.id,
            username: socket.user.username,
            is_admin: socket.user.is_admin
          },
          connections: []
        };
      }
      
      // 获取真实IP地址
      const realIpAddress = getWebSocketRealIpAddress(socket.handshake);
      
      // 添加连接信息
      userConnections[socket.user.id].connections.push({
        socketId: id,
        userAgent: socket.handshake.headers['user-agent'] || 'Unknown',
        ip: realIpAddress,
        connectedAt: socket.connectedAt || new Date()
      });
    }
  }
  
  // 整理用户连接信息
  const userList = Object.values(userConnections).map(userConn => {
    const browsers = {};
    let totalConnections = userConn.connections.length;
    
    // 分析浏览器类型
    userConn.connections.forEach(conn => {
      const userAgent = conn.userAgent;
      let browserType = 'Unknown';
      
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        browserType = 'Chrome';
      } else if (userAgent.includes('Firefox')) {
        browserType = 'Firefox';
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browserType = 'Safari';
      } else if (userAgent.includes('Edg')) {
        browserType = 'Edge';
      } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
        browserType = 'Opera';
      }
      
      if (!browsers[browserType]) {
        browsers[browserType] = 0;
      }
      browsers[browserType]++;
    });
    
    return {
      id: userConn.user.id,
      username: userConn.user.username,
      is_admin: userConn.user.is_admin,
      totalConnections: totalConnections,
      browsers: browsers,
      connections: userConn.connections // 添加详细的连接信息
    };
  });
  
  // 如果是管理员，返回所有活跃用户
  if (req.user.is_admin) {
    res.json({ 
      success: true,
      data: userList 
    });
  } else {
    // 如果是普通用户，只返回自己的信息
    const currentUser = userList.find(user => user.id === req.user.id);
    if (currentUser) {
      // 对于普通用户，将连接信息扁平化以便前端显示
      const connections = currentUser.connections.map(conn => ({
        id: conn.socketId,
        ip: conn.ip,
        userAgent: conn.userAgent,
        connectedAt: conn.connectedAt
      }));
      res.json({ 
        success: true,
        data: connections
      });
    } else {
      // 如果没有找到用户连接，但用户已认证，返回空数组
      res.json({ 
        success: true,
        data: []
      });
    }
  }
});

module.exports = router;