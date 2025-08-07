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
    success: true,
    data: {
      id: req.user.id,
      username: req.user.username,
      admin: req.user.is_admin === 1
    }
  });
});

// 获取用户列表 (仅管理员可访问)
router.get('/', authenticateApiKey, requireAdmin, (req, res) => {
  const db = database.getInstance();
  
  const sql = 'SELECT id, username, is_admin FROM users ORDER BY id';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: '服务器内部错误', error: err.message });
    }
    res.json({ 
      success: true,
      message: '获取用户列表成功',
      data: rows 
    });
  });
});

// 添加API端点：创建新用户 (仅管理员可访问)
router.post('/', authenticateApiKey, requireAdmin, (req, res) => {
  const db = database.getInstance();
  
  // 检查请求体中的字段
  const { username, apiKey, api_key } = req.body;
  const key = apiKey || api_key; // 兼容两种可能的字段名
  
  if (!username || !key) {
    return res.status(400).json({ success: false, message: '用户名和API密钥不能为空' });
  }
  
  const sql = 'INSERT INTO users (username, api_key, is_admin) VALUES (?, ?, ?)';
  db.run(sql, [username, key, false], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ success: false, message: '用户名或API密钥已存在' });
      }
      return res.status(500).json({ success: false, message: '服务器内部错误', error: err.message });
    }
    
    res.json({ 
      success: true,
      message: '用户创建成功',
      data: {
        id: this.lastID,
        username
      }
    });
  });
});

// 删除用户 (仅管理员可访问)
router.delete('/:id', authenticateApiKey, requireAdmin, (req, res) => {
  const db = database.getInstance();
  
  const userId = req.params.id;
  
  // 确保用户不能删除自己
  if (userId == req.user.id) {
    return res.status(400).json({ success: false, error: '不能删除当前用户' });
  }
  
  const sql = 'DELETE FROM users WHERE id = ?';
  db.run(sql, [userId], function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    
    res.json({ success: true, message: '用户删除成功' });
  });
});

// 更新用户API密钥 (仅管理员可访问)
router.put('/:id/apikey', authenticateApiKey, requireAdmin, (req, res) => {
  const db = database.getInstance();
  
  const userId = req.params.id;
  const { apiKey } = req.body;
  
  // 确保提供了新的API密钥
  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'API密钥不能为空' });
  }
  
  // 确保用户不能修改自己的API密钥
  if (userId == req.user.id) {
    return res.status(400).json({ success: false, error: '不能修改当前用户的API密钥' });
  }
  
  const sql = 'UPDATE users SET api_key = ? WHERE id = ?';
  db.run(sql, [apiKey, userId], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ success: false, error: '该API密钥已被其他用户使用' });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    
    res.json({ success: true, message: '用户API密钥更新成功' });
  });
});

module.exports = router;