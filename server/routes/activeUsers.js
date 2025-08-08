const express = require('express');
const router = express.Router();
const { authenticateApiKey } = require('../middleware/auth.js');
const { getWebSocketRealIpAddress } = require('../utils/ipUtils.js');

// 获取活跃用户列表
router.get('/', authenticateApiKey, (req, res) => {
  const io = req.app.get('io'); // 从应用设置中获取io实例
  
  // 如果是管理员，返回所有活跃用户；否则只返回当前用户的信息
  if (req.user.is_admin) {
    // 获取所有连接的用户
    const userConnections = new Map(); // 使用Map提高查找性能
    
    // 遍历所有连接的socket，只遍历一次
    for (let [id, socket] of io.of("/").sockets) {
      if (socket.user) {
        // 统计每个用户的连接数
        if (!userConnections.has(socket.user.id)) {
          userConnections.set(socket.user.id, {
            user: {
              id: socket.user.id,
              username: socket.user.username,
              is_admin: socket.user.is_admin
            },
            connections: []
          });
        }
        
        // 获取真实IP地址
        const realIpAddress = getWebSocketRealIpAddress(socket.handshake);
        
        // 添加连接信息
        userConnections.get(socket.user.id).connections.push({
          socketId: id,
          userAgent: socket.handshake.headers['user-agent'] || 'Unknown',
          ip: realIpAddress,
          connectedAt: socket.connectedAt || new Date()
        });
      }
    }
    
    // 整理用户连接信息
    const userList = Array.from(userConnections.values()).map(userConn => {
      const browsers = Object.create(null); // 使用无原型对象提高性能
      let totalConnections = userConn.connections.length;
      
      // 分析浏览器类型 - 优化循环性能
      for (let i = 0; i < userConn.connections.length; i++) {
        const conn = userConn.connections[i];
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
      }
      
      return {
        id: userConn.user.id,
        username: userConn.user.username,
        is_admin: userConn.user.is_admin,
        totalConnections: totalConnections,
        browsers: browsers,
        connections: userConn.connections // 添加详细的连接信息
      };
    });
    
    res.json({ 
      success: true,
      data: userList 
    });
  } else {
    // 如果是普通用户，只返回自己的信息
    const userConnections = [];
    
    // 只遍历当前用户的连接
    for (let [id, socket] of io.of("/").sockets) {
      if (socket.user && socket.user.id === req.user.id) {
        // 获取真实IP地址
        const realIpAddress = getWebSocketRealIpAddress(socket.handshake);
        
        // 添加连接信息
        userConnections.push({
          socketId: id,
          userAgent: socket.handshake.headers['user-agent'] || 'Unknown',
          ip: realIpAddress,
          connectedAt: socket.connectedAt || new Date()
        });
      }
    }
    
    // 将连接信息扁平化以便前端显示
    const connections = userConnections.map(conn => ({
      id: conn.socketId,
      ip: conn.ip,
      userAgent: conn.userAgent,
      connectedAt: conn.connectedAt
    }));
    
    res.json({ 
      success: true,
      data: connections
    });
  }
});

module.exports = router;