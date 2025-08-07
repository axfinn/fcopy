const express = require('express');
const router = express.Router();
const database = require('../services/database.js');
const fileService = require('../services/fileService.js');
const { authenticateApiKey } = require('../middleware/auth.js');

// 获取剪贴板历史记录
router.get('/', authenticateApiKey, (req, res) => {
  const db = database.getInstance();
  
  // 获取分页参数
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 10;
  const search = req.query.search || '';
  const offset = (page - 1) * size;
  
  let sql = '';
  let countSql = '';
  let params = [];
  
  if (search) {
    // 如果有搜索关键词，添加搜索条件
    sql = `
      SELECT id, content, file_path as filename, file_size as size, mime_type, user_id, created_at, 
             CASE WHEN file_path IS NOT NULL THEN 'file' ELSE 'text' END as type
      FROM clipboard 
      WHERE (content LIKE ? OR file_name LIKE ?)
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    countSql = `
      SELECT COUNT(*) as count
      FROM clipboard 
      WHERE (content LIKE ? OR file_name LIKE ?)
    `;
    
    const searchPattern = `%${search}%`;
    params = [searchPattern, searchPattern, size, offset];
    const countParams = [searchPattern, searchPattern];
    
    // 执行计数查询
    db.get(countSql, countParams, (err, countResult) => {
      if (err) {
        console.error('数据库计数查询错误:', err.message);
        res.status(500).json({ success: false, error: err.message });
        return;
      }
      
      // 执行数据查询
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('数据库数据查询错误:', err.message);
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
  } else {
    // 没有搜索条件的查询
    sql = `
      SELECT id, content, file_path as filename, file_size as size, mime_type, user_id, created_at, 
             CASE WHEN file_path IS NOT NULL THEN 'file' ELSE 'text' END as type
      FROM clipboard 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    countSql = 'SELECT COUNT(*) as count FROM clipboard';
    params = [size, offset];
    
    // 执行计数查询
    db.get(countSql, [], (err, countResult) => {
      if (err) {
        console.error('数据库计数查询错误:', err.message);
        res.status(500).json({ success: false, error: err.message });
        return;
      }
      
      // 执行数据查询
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('数据库数据查询错误:', err.message);
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
  }
});

// 公开文件访问端点（用于显示图片等）
router.get('/file/:id', (req, res) => {
  const db = database.getInstance();
  const fileId = req.params.id;
  
  // 查询文件信息
  const sql = 'SELECT file_path, file_name FROM clipboard WHERE id = ? AND file_path IS NOT NULL';
  db.get(sql, [fileId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: '文件未找到' });
    }
    
    // 检查文件是否存在
    if (!fileService.fileExists(row.file_path)) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    // 设置正确的Content-Type
    const mimeType = fileService.getMimeType(row.file_name);
    if (mimeType) {
      res.setHeader('Content-Type', mimeType);
    }
    
    // 发送文件
    res.sendFile(fileService.getAbsolutePath(row.file_path));
  });
});

// 文件下载端点（需要鉴权）
router.get('/download/:id', authenticateApiKey, (req, res) => {
  const db = database.getInstance();
  const fileId = req.params.id;
  
  // 查询文件信息
  const sql = 'SELECT file_path, file_name FROM clipboard WHERE id = ? AND file_path IS NOT NULL';
  db.get(sql, [fileId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: '文件未找到' });
    }
    
    // 检查文件是否存在
    if (!fileService.fileExists(row.file_path)) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    // 设置响应头，触发浏览器下载
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(row.file_name)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // 发送文件
    res.sendFile(fileService.getAbsolutePath(row.file_path));
  });
});

// 文本内容上传
router.post('/text', authenticateApiKey, (req, res) => {
  const db = database.getInstance();
  const io = req.app.get('io'); // 从应用设置中获取io实例
  
  const { content } = req.body;
  const sql = 'INSERT INTO clipboard (content, user_id) VALUES (?, ?)';
  db.run(sql, [content, req.user.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 通过 Socket.IO 通知特定用户
    const data = { 
      id: this.lastID, 
      content, 
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      type: 'text'
    };
    
    // 只向该用户广播更新
    io.to(`user_${req.user.id}`).emit('clipboard-update', data);
    
    res.json({ 
      id: this.lastID, 
      content,
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      type: 'text'
    });
  });
});

// 文件上传
const upload = fileService.configureMulter();
router.post('/file', authenticateApiKey, upload.single('file'), (req, res) => {
  const db = database.getInstance();
  const io = req.app.get('io'); // 从应用设置中获取io实例
  
  if (!req.file) {
    return res.status(400).json({ error: '没有文件被上传' });
  }
  
  const { originalname, mimetype, size, path: filePath } = req.file;
  
  const sql = 'INSERT INTO clipboard (file_path, file_name, file_size, mime_type, user_id) VALUES (?, ?, ?, ?, ?)';
  db.run(sql, [filePath, originalname, size, mimetype, req.user.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 通过 Socket.IO 通知特定用户
    const data = { 
      id: this.lastID, 
      file_path: filePath,
      file_name: originalname,
      file_size: size,
      mime_type: mimetype,
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      type: 'file'
    };
    
    // 只向该用户广播更新
    io.to(`user_${req.user.id}`).emit('clipboard-update', data);
    
    res.json({ 
      id: this.lastID, 
      file_path: filePath,
      file_name: originalname,
      file_size: size,
      mime_type: mimetype,
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      type: 'file'
    });
  });
});

// 删除指定内容 (只能删除自己的内容)
router.delete('/:id', authenticateApiKey, (req, res) => {
  const db = database.getInstance();
  const { id } = req.params;
  
  // 先获取文件路径以删除文件，并验证所有权
  db.get('SELECT file_path FROM clipboard WHERE id = ? AND user_id = ?', [id, req.user.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      return res.status(404).json({ error: '内容未找到或无权限访问' });
    }
    
    // 从数据库中删除记录
    db.run('DELETE FROM clipboard WHERE id = ? AND user_id = ?', [id, req.user.id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '内容未找到或无权限访问' });
      }
      
      // 如果有文件，也删除文件
      if (row.file_path) {
        fileService.deleteFile(row.file_path).catch(err => {
          console.error('删除文件失败:', err);
        });
      }
      
      res.json({ message: '删除成功' });
    });
  });
});

module.exports = router;