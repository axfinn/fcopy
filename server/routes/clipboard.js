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
      
      // 确保时间格式正确传递给前端
      const formattedRows = rows.map(row => {
        // 数据库中存储的时间是UTC时间，我们需要将其转换为上海时区的ISO字符串格式
        const utcDate = new Date(row.created_at);
        // 转换为上海时区时间
        const shanghaiTime = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
        
        // 格式化为 "YYYY/MM/DD HH:mm:ss" 格式
        const year = shanghaiTime.getFullYear();
        const month = String(shanghaiTime.getMonth() + 1).padStart(2, '0');
        const day = String(shanghaiTime.getDate()).padStart(2, '0');
        const hours = String(shanghaiTime.getHours()).padStart(2, '0');
        const minutes = String(shanghaiTime.getMinutes()).padStart(2, '0');
        const seconds = String(shanghaiTime.getSeconds()).padStart(2, '0');
        
        const formattedTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
        
        return {
          ...row,
          created_at: formattedTime
        };
      });
      
      res.json({
        success: true,
        data: formattedRows,
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
      console.error('插入文本内容失败:', err);
      return res.status(500).json({ success: false, error: '保存失败' });
    }
    
    // 通过 Socket.IO 通知所有客户端（需要广播给特定用户）
    const io = req.app.get('io');
    if (io) {
      // 获取新插入的记录
      db.get('SELECT * FROM clipboard WHERE id = ?', [this.lastID], (err, row) => {
        if (!err && row) {
          // 格式化时间
          const utcDate = new Date(row.created_at);
          // 转换为上海时区时间
          const shanghaiTime = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
          
          // 格式化为 "YYYY/MM/DD HH:mm:ss" 格式
          const year = shanghaiTime.getFullYear();
          const month = String(shanghaiTime.getMonth() + 1).padStart(2, '0');
          const day = String(shanghaiTime.getDate()).padStart(2, '0');
          const hours = String(shanghaiTime.getHours()).padStart(2, '0');
          const minutes = String(shanghaiTime.getMinutes()).padStart(2, '0');
          const seconds = String(shanghaiTime.getSeconds()).padStart(2, '0');
          
          const formattedTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
          
          const formattedRow = {
            ...row,
            created_at: formattedTime,
            type: 'text'
          };
          
          // 只向对应的用户发送更新
          io.to(`user_${req.user.id}`).emit('clipboard-update', formattedRow);
        }
      });
    }
    
    res.json({ 
      success: true, 
      id: this.lastID, 
      content,
      message: '内容保存成功'
    });
  });
});

// 文件上传
router.post('/file', authenticateApiKey, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: '没有上传文件' });
  }
  
  const { originalname, mimetype, size, path: filePath } = req.file;
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
    
    // 通过 Socket.IO 通知所有客户端（需要广播给特定用户）
    const io = req.app.get('io');
    if (io) {
      // 获取新插入的记录
      db.get('SELECT * FROM clipboard WHERE id = ?', [this.lastID], (err, row) => {
        if (!err && row) {
          // 格式化时间
          const utcDate = new Date(row.created_at);
          // 转换为上海时区时间
          const shanghaiTime = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
          
          // 格式化为 "YYYY/MM/DD HH:mm:ss" 格式
          const year = shanghaiTime.getFullYear();
          const month = String(shanghaiTime.getMonth() + 1).padStart(2, '0');
          const day = String(shanghaiTime.getDate()).padStart(2, '0');
          const hours = String(shanghaiTime.getHours()).padStart(2, '0');
          const minutes = String(shanghaiTime.getMinutes()).padStart(2, '0');
          const seconds = String(shanghaiTime.getSeconds()).padStart(2, '0');
          
          const formattedTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
          
          const formattedRow = {
            ...row,
            created_at: formattedTime,
            type: 'file'
          };
          
          // 只向对应的用户发送更新
          io.to(`user_${req.user.id}`).emit('clipboard-update', formattedRow);
        }
      });
    }
    
    res.json({ 
      success: true, 
      id: this.lastID,
      file_name: originalname,
      file_path: filePath,
      mime_type: mimetype,
      file_size: size,
      message: '文件上传成功'
    });
  });
});

// 删除剪贴板项目
router.delete('/:id', authenticateApiKey, (req, res) => {
  const { id } = req.params;
  const db = database.getInstance();
  
  // 先查询文件路径以删除文件
  db.get('SELECT file_path FROM clipboard WHERE id = ? AND user_id = ?', [id, req.user.id], (err, row) => {
    if (err) {
      console.error('查询项目失败:', err);
      return res.status(500).json({ success: false, error: '删除失败' });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, error: '项目不存在' });
    }
    
    // 如果是文件，删除文件
    if (row.file_path) {
      fs.unlink(row.file_path, (err) => {
        if (err) {
          console.error('删除文件失败:', err);
        }
      });
    }
    
    // 从数据库中删除记录
    const sql = 'DELETE FROM clipboard WHERE id = ? AND user_id = ?';
    db.run(sql, [id, req.user.id], function(err) {
      if (err) {
        console.error('删除记录失败:', err);
        return res.status(500).json({ success: false, error: '删除失败' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: '项目不存在' });
      }
      
      // 通过 Socket.IO 通知客户端删除
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${req.user.id}`).emit('clipboard-delete', { id: parseInt(id) });
      }
      
      res.json({ success: true, message: '删除成功' });
    });
  });
});

// 根据ID获取文件
router.get('/file/:id', authenticateApiKey, (req, res) => {
  const { id } = req.params;
  const db = database.getInstance();
  
  const sql = 'SELECT file_path, mime_type FROM clipboard WHERE id = ? AND user_id = ?';
  db.get(sql, [id, req.user.id], (err, row) => {
    if (err) {
      console.error('查询文件失败:', err);
      return res.status(500).json({ success: false, error: '获取文件失败' });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, error: '文件不存在' });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(row.file_path)) {
      return res.status(404).json({ success: false, error: '文件不存在' });
    }
    
    // 设置响应头
    res.setHeader('Content-Type', row.mime_type);
    // 发送文件
    res.sendFile(path.resolve(row.file_path));
  });
});

module.exports = router;