/**
 * IP地址工具类
 * 用于统一获取客户端真实IP地址
 */

/**
 * 获取客户端真实IP地址
 * @param {Object} req - Express请求对象
 * @returns {string} 客户端真实IP地址
 */
const getRealIpAddress = (req) => {
  // 按优先级获取IP地址
  let ipAddress = req.headers['x-forwarded-for'] || 
                 req.headers['x-real-ip'] || 
                 req.connection?.remoteAddress || 
                 req.ip;
  
  // x-forwarded-for可能包含多个IP地址，用逗号分隔，第一个是最原始的客户端IP
  if (typeof ipAddress === 'string' && ipAddress.includes(',')) {
    return ipAddress.split(',')[0].trim();
  }
  
  return ipAddress || 'Unknown';
};

/**
 * 获取WebSocket连接的真实IP地址
 * @param {Object} handshake - WebSocket握手对象
 * @returns {string} 客户端真实IP地址
 */
const getWebSocketRealIpAddress = (handshake) => {
  // 从握手对象中获取各种可能的IP地址字段
  const headers = handshake.headers || {};
  
  // 按优先级获取IP地址
  let ipAddress = headers['x-forwarded-for'] || 
                 headers['x-real-ip'] || 
                 handshake.address || 
                 'Unknown';
  
  // x-forwarded-for可能包含多个IP地址，用逗号分隔，第一个是最原始的客户端IP
  if (typeof ipAddress === 'string' && ipAddress.includes(',')) {
    return ipAddress.split(',')[0].trim();
  }
  
  return ipAddress;
};

module.exports = {
  getRealIpAddress,
  getWebSocketRealIpAddress
};