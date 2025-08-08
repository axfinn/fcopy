const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const database = require('../services/database.js');
const { authenticateApiKey } = require('../middleware/auth.js');
const fileService = require('../services/fileService.js');

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 确保上传目录存在
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 限制文件大小为50MB
  }
});

// 获取剪贴板历史记录（支持分页、搜索和类型筛选）
router.get('/', authenticateApiKey, (req, res) => {
  const db = database.getInstance();
  
  // 获取查询参数
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 10;
  const search = req.query.search || '';
  const type = req.query.type || ''; // 获取类型筛选参数
  
  // 计算偏移量
  const offset = (page - 1) * size;
  
  // 构建查询条件 - 添加用户过滤
  let sql = `
    SELECT id, 
           CASE WHEN content IS NOT NULL AND content != '' THEN 'text' ELSE 'file' END as type,
           content, 
           file_name, 
           file_path, 
           mime_type, 
           file_size, 
           created_at
    FROM clipboard 
    WHERE user_id = ? 
  `;
  
  let countSql = 'SELECT COUNT(*) as count FROM clipboard WHERE user_id = ?';
  const params = [req.user.id]; // 添加用户ID参数
  const countParams = [req.user.id]; // 添加用户ID参数用于计数查询
  
  // 添加搜索和类型筛选条件
  if (search || type) {
    sql += ' AND ';
    countSql += ' AND ';
    
    let conditions = [];
    
    // 添加搜索条件
    if (search) {
      conditions.push('(content LIKE ? OR file_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    // 添加类型筛选条件
    if (type) {
      if (type === 'text') {
        conditions.push('(content IS NOT NULL AND content != ?)');
        params.push('');
        countParams.push('');
      } else if (type === 'file') {
        conditions.push('(file_path IS NOT NULL AND file_path != ?)');
        params.push('');
        countParams.push('');
      }
    }
    
    sql += conditions.join(' AND ');
    countSql += conditions.join(' AND ');
  }
  
  // 添加排序和分页
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(size, offset);
  
  // 执行查询
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('查询剪贴板历史失败:', err);
      return res.status(500).json({ success: false, error: '查询失败' });
    }
    
    // 获取总数
    db.get(countSql, countParams, (err, countResult) => {
      if (err) {
        console.error('查询总数失败:', err);
        return res.status(500).json({ success: false, error: '查询失败' });
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

// 添加文本内容
router.post('/text', authenticateApiKey, (req, res) => {
  const { content } = req.body;
  const apiKey = req.headers['x-api-key'];
  
  if (!content) {
    return res.status(400).json({ success: false, error: '内容不能为空' });
  }
  
  const db = database.getInstance();
  const sql = `
    INSERT INTO clipboard (content, user_id, created_at)
    VALUES (?, ?, datetime('now'))
  `;
  
  db.run(sql, [content, req.user.id], function(err) {
    if (err) {
      console.error('保存文本内容失败:', err);
      return res.status(500).json({ success: false, error: '保存失败' });
    }
    
    // 获取插入的记录
    const selectSql = 'SELECT id, \'text\' as type, content, NULL as file_name, NULL as file_path, NULL as mime_type, NULL as file_size, created_at FROM clipboard WHERE id = ?';
    db.get(selectSql, [this.lastID], (err, row) => {
      if (err) {
        console.error('查询插入的记录失败:', err);
        return res.status(500).json({ success: false, error: '查询失败' });
      }
      
      // 通过WebSocket向同一用户的所有连接广播更新
      const io = req.app.get('io');
      // 获取当前用户ID
      const userSql = 'SELECT id FROM users WHERE api_key = ?';
      db.get(userSql, [apiKey], (err, userRow) => {
        if (!err && userRow) {
          // 向特定用户的房间发送消息
          console.log('向用户发送剪贴板更新:', userRow.id, row);
          io.to(`user_${userRow.id}`).emit('clipboard-update', row);
        } else {
          // 修复：即使无法获取用户ID，也不应该向所有用户广播
          // 而是应该记录错误并返回错误响应
          console.error('无法获取用户信息，无法发送剪贴板更新:', err);
        }
      });
      
      res.json({ success: true, id: this.lastID, data: row });
    });
  });
});

// 上传文件
router.post('/file', authenticateApiKey, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: '没有上传文件' });
  }
  
  const { originalname, mimetype, size, path: filePath } = req.file;
  const apiKey = req.headers['x-api-key'];
  const db = database.getInstance();
  
  const sql = `
    INSERT INTO clipboard (file_name, file_path, mime_type, file_size, user_id, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `;
  
  db.run(sql, [originalname, filePath, mimetype, size, req.user.id], function(err) {
    if (err) {
      console.error('保存文件信息失败:', err);
      // 删除已上传的文件
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ success: false, error: '保存失败' });
    }
    
    // 获取插入的记录
    const selectSql = 'SELECT id, \'file\' as type, NULL as content, file_name, file_path, mime_type, file_size, created_at FROM clipboard WHERE id = ?';
    db.get(selectSql, [this.lastID], (err, row) => {
      if (err) {
        console.error('查询插入的记录失败:', err);
        return res.status(500).json({ success: false, error: '查询失败' });
      }
      
      // 通过WebSocket向同一用户的所有连接广播更新
      const io = req.app.get('io');
      // 获取当前用户ID
      const userSql = 'SELECT id FROM users WHERE api_key = ?';
      db.get(userSql, [apiKey], (err, userRow) => {
        if (!err && userRow) {
          // 向特定用户的房间发送消息
          console.log('向用户发送剪贴板更新:', userRow.id, row);
          io.to(`user_${userRow.id}`).emit('clipboard-update', row);
        } else {
          // 修复：即使无法获取用户ID，也不应该向所有用户广播
          // 而是应该记录错误并返回错误响应
          console.error('无法获取用户信息，无法发送剪贴板更新:', err);
        }
      });
      
      res.json({ success: true, id: this.lastID, data: row });
    });
  });
});

// 获取文件
router.get('/file/:id', (req, res) => {
  // 尝试从请求头或查询参数获取API密钥
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({ success: false, error: '访问被拒绝，缺少API密钥' });
  }
  
  const db = database.getInstance();
  
  // 验证API密钥并获取用户信息
  const userSql = 'SELECT id, username, is_admin FROM users WHERE api_key = ?';
  db.get(userSql, [apiKey], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, error: '服务器内部错误' });
    }
    
    if (!user) {
      return res.status(401).json({ success: false, error: '访问被拒绝，API 密钥无效' });
    }
    
    // API密钥验证通过，继续处理文件请求
    const { id } = req.params;
    const fileSql = 'SELECT file_path, mime_type, file_name FROM clipboard WHERE id = ? AND file_path IS NOT NULL AND user_id = ?';
    db.get(fileSql, [id, user.id], (err, row) => {
      if (err) {
        console.error('查询文件信息失败:', err);
        return res.status(500).json({ success: false, error: '查询失败' });
      }
      
      if (!row) {
        return res.status(404).json({ success: false, error: '文件不存在或无权限访问' });
      }
      
      // 检查文件是否存在
      if (!fs.existsSync(row.file_path)) {
        return res.status(404).json({ success: false, error: '文件不存在' });
      }
      
      // 设置响应头
      res.setHeader('Content-Type', row.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(row.file_name)}"`);
      
      // 发送文件
      const fileStream = fs.createReadStream(row.file_path);
      fileStream.pipe(res);
      
      fileStream.on('error', (err) => {
        console.error('读取文件失败:', err);
        res.status(500).json({ success: false, error: '读取文件失败' });
      });
    });
  });
});

// 删除剪贴板项目
router.delete('/:id', authenticateApiKey, (req, res) => {
  const { id } = req.params;
  const db = database.getInstance();
  
  // 先查询项目信息，确保是当前用户的数据
  const selectSql = 'SELECT file_path FROM clipboard WHERE id = ? AND user_id = ?';
  db.get(selectSql, [id, req.user.id], (err, row) => {
    if (err) {
      console.error('查询项目信息失败:', err);
      return res.status(500).json({ success: false, error: '查询失败' });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, error: '项目不存在或无权限访问' });
    }
    
    // 如果是文件，删除文件
    if (row.file_path) {
      try {
        if (fs.existsSync(row.file_path)) {
          fs.unlinkSync(row.file_path);
        }
      } catch (err) {
        console.error('删除文件失败:', err);
      }
    }
    
    // 从数据库删除记录，确保只删除当前用户的数据
    const deleteSql = 'DELETE FROM clipboard WHERE id = ? AND user_id = ?';
    db.run(deleteSql, [id, req.user.id], function(err) {
      if (err) {
        console.error('删除记录失败:', err);
        return res.status(500).json({ success: false, error: '删除失败' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: '项目不存在或无权限访问' });
      }
      
      res.json({ success: true, message: '删除成功' });
    });
  });
});

module.exports = router;