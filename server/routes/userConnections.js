const express = require('express');
const { getWebSocketRealIpAddress } = require('../utils/ipUtils.js');

const router = express.Router();

// Get current user's connections
router.get('/', (req, res) => {
  const io = req.app.get('io'); // Get socket.io instance from app
  
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: '未授权访问' 
    });
  }

  // Store connection info for current user only
  const userConnections = [];
  
  // Iterate through all connected sockets to find current user's connections
  for (let [id, socket] of io.of("/").sockets) {
    if (socket.user && socket.user.id === req.user.id) {
      // Get real IP address
      const realIpAddress = getWebSocketRealIpAddress(socket.handshake);
      
      // Add connection info
      userConnections.push({
        id: id,
        ip: realIpAddress,
        userAgent: socket.handshake.headers['user-agent'] || 'Unknown',
        connectedAt: socket.connectedAt || new Date().toISOString()
      });
    }
  }
  
  // Return current user's connections
  return res.json({ 
    success: true,
    data: userConnections 
  });
});

module.exports = router;