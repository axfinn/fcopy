const config = require('../config/app.js');
const database = require('../services/database.js');
const { getRealIpAddress } = require('../utils/ipUtils.js');

// 访问记录和限流中间件
const rateLimitAndLog = (req, res, next) => {
  const db = database.getInstance();
  
  // 获取客户端真实IP地址
  const ipAddress = getRealIpAddress(req);
  
  const currentTime = new Date();
  
  // 只对特定的API请求进行限流和记录（用户登录和剪贴板添加数据）
  const shouldLogAndLimit = req.path === '/api/clipboard/text' || 
                           req.path === '/api/clipboard/file' ||
                           req.path === '/api/users';
  
  // 但仍然记录所有文件访问
  const shouldLog = shouldLogAndLimit || req.path.startsWith('/api/clipboard/file/');
  
  if (shouldLog) {
    // 记录访问日志
    const logSql = `INSERT INTO access_logs 
      (ip_address, request_path, request_method, user_agent) 
      VALUES (?, ?, ?, ?)`;
    db.run(logSql, [
      ipAddress, 
      req.path, 
      req.method, 
      req.get('User-Agent') || ''
    ], (err) => {
      if (err) {
        console.error('记录访问日志失败:', err.message);
      }
    });
  }
  
  // 只对特定请求进行限流
  if (shouldLogAndLimit) {
    // 检查是否被限流
    const checkLimitSql = `SELECT * FROM rate_limits WHERE ip_address = ?`;
    db.get(checkLimitSql, [ipAddress], (err, row) => {
      if (err) {
        console.error('检查限流状态失败:', err.message);
        return next(); // 出错时仍允许访问
      }
      
      // 如果已被限流且仍在限制时间内
      if (row && row.blocked_until) {
        const blockedUntil = new Date(row.blocked_until);
        if (blockedUntil > currentTime) {
          return res.status(429).json({ 
            error: '请求过于频繁，请稍后再试',
            retry_after: Math.ceil((blockedUntil - currentTime) / 1000) + '秒'
          });
        }
      }
      
      // 更新请求计数
      const timeWindowAgo = new Date(currentTime.getTime() - config.RATE_LIMIT.WINDOW_MS);
      let newCount = 1;
      
      if (row && row.last_request_time) {
        const lastRequestTime = new Date(row.last_request_time);
        // 如果上次请求在时间窗口内，则增加计数，否则重置为1
        if (lastRequestTime > timeWindowAgo) {
          newCount = (row.request_count || 0) + 1;
        }
      }
      
      // 如果请求次数超过限制，则限制访问
      let blockedUntil = null;
      if (newCount > config.RATE_LIMIT.REQUESTS) {
        blockedUntil = new Date(currentTime.getTime() + config.RATE_LIMIT.BLOCK_DURATION_MS);
      }
      
      // 更新或插入限流记录
      const updateCountSql = `
        INSERT OR REPLACE INTO rate_limits 
        (ip_address, request_count, last_request_time, blocked_until, updated_at)
        VALUES (?, ?, ?, ?, ?)`;
        
      db.run(updateCountSql, [
        ipAddress,
        newCount,
        currentTime.toISOString(),
        blockedUntil ? blockedUntil.toISOString() : null,
        currentTime.toISOString()
      ], (err) => {
        if (err) {
          console.error('更新请求计数失败:', err.message);
        }
      });
      
      next();
    });
  } else {
    next();
  }
};

module.exports = rateLimitAndLog;