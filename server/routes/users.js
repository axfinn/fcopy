const express = require('express');
const router = express.Router();
const database = require('../services/database.js');
const { authenticateApiKey, requireAdmin } = require('../middleware/auth.js');

// 用户认证端点
router.post('/auth', (req, res) => {
  const { apiKey } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ success: false, message: 'API密钥不能为空' });
  }
  
  // 验证API密钥并获取用户信息
  const db = database.getInstance();
  const sql = 'SELECT id, username, is_admin FROM users WHERE api_key = ?';
  db.get(sql, [apiKey], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'API密钥无效' });
    }
    
    // 认证成功
    res.json({ 
      success: true, 
      admin: user.is_admin === 1,
      username: user.username,
      userId: user.id
    });
  });
});

// 获取当前用户信息
router.get('/me', authenticateApiKey, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    is_admin: req.user.is_admin
  });
});

// 获取用户列表 (仅管理员可访问)
router.get('/', authenticateApiKey, requireAdmin, (req, res) => {
  const db = database.getInstance();
  
  const sql = 'SELECT id, username, is_admin FROM users ORDER BY id';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// 添加API端点：创建新用户 (仅管理员可访问)
router.post('/', authenticateApiKey, requireAdmin, (req, res) => {
  const db = database.getInstance();
  
  const { username, apiKey } = req.body;
  
  if (!username || !apiKey) {
    return res.status(400).json({ error: '用户名和API密钥不能为空' });
  }
  
  const sql = 'INSERT INTO users (username, api_key, is_admin) VALUES (?, ?, ?)';
  db.run(sql, [username, apiKey, false], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: '用户名或API密钥已存在' });
      }
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ id: this.lastID, username, message: '用户创建成功' });
  });
});

// 删除用户 (仅管理员可访问)
router.delete('/:id', authenticateApiKey, requireAdmin, (req, res) => {
  const db = database.getInstance();
  
  const userId = req.params.id;
  
  // 确保用户不能删除自己
  if (userId == req.user.id) {
    return res.status(400).json({ error: '不能删除当前用户' });
  }
  
  const sql = 'DELETE FROM users WHERE id = ?';
  db.run(sql, [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ message: '用户删除成功' });
  });
});

module.exports = router;