const database = require('../services/database.js');

// API 密钥鉴权中间件
const authenticateApiKey = (req, res, next) => {
  // 尝试从请求头或查询参数获取API密钥
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({ error: '访问被拒绝，缺少API密钥' });
  }
  
  // 验证API密钥并获取用户信息
  const db = database.getInstance();
  const sql = 'SELECT id, username, is_admin FROM users WHERE api_key = ?';
  db.get(sql, [apiKey], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '服务器内部错误' });
    }
    
    if (!user) {
      return res.status(401).json({ error: '访问被拒绝，API 密钥无效' });
    }
    
    // 将用户信息附加到请求对象
    req.user = user;
    next();
  });
};

// 管理员权限检查中间件
const requireAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: '访问被拒绝，需要管理员权限' });
  }
  next();
};

module.exports = {
  authenticateApiKey,
  requireAdmin
};