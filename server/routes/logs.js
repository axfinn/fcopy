const express = require('express');
const router = express.Router();
const database = require('../services/database.js');
const { authenticateApiKey, requireAdmin } = require('../middleware/auth.js');

// 获取访问日志 (仅管理员可访问)
router.get('/access', authenticateApiKey, requireAdmin, (req, res) => {
  const db = database.getInstance();
  
  // 添加分页支持
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 50;
  const offset = (page - 1) * size;
  
  const sql = `
    SELECT al.*
    FROM access_logs al
    ORDER BY al.timestamp DESC 
    LIMIT ? OFFSET ?
  `;
  
  db.all(sql, [size, offset], (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
      return;
    }
    
    // 获取总记录数
    const countSql = 'SELECT COUNT(*) as count FROM access_logs';
    db.get(countSql, [], (err, countResult) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
        return;
      }
      
      res.json({ 
        success: true,
        data: rows,
        total: countResult.count,
        page: page,
        size: size
      });
    });
  });
});

// 获取限流状态 (仅管理员可访问)
router.get('/rate-limits', authenticateApiKey, requireAdmin, (req, res) => {
  const db = database.getInstance();
  
  const sql = `
    SELECT ip_address, request_count, last_request_time, blocked_until, updated_at
    FROM rate_limits 
    WHERE request_count > 0 OR blocked_until IS NOT NULL
    ORDER BY updated_at DESC 
    LIMIT 100
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
      return;
    }
    res.json({ 
      success: true,
      data: rows 
    });
  });
});

module.exports = router;