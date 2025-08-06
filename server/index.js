const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const multer = require('multer');
// 加载.env文件
require('dotenv').config();

// 初始化 Express 应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// API 密钥 (优先从环境变量获取，否则使用默认值)
const API_KEY = process.env.CLIPBOARD_API_KEY || 'default-api-key';
console.log('API 密钥已设置:', API_KEY !== 'default-api-key' ? '是 (来自环境变量或.env文件)' : '否 (使用默认值)');

// 请求频率限制配置 (优先从环境变量获取，否则使用默认值)
const RATE_LIMIT_REQUESTS = parseInt(process.env.RATE_LIMIT_REQUESTS) || 10;
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1分钟
const RATE_LIMIT_BLOCK_DURATION_MS = parseInt(process.env.RATE_LIMIT_BLOCK_DURATION_MS) || 600000; // 10分钟

console.log(`请求频率限制已设置: ${RATE_LIMIT_REQUESTS} 次/${RATE_LIMIT_WINDOW_MS/1000}秒, 封禁时长: ${RATE_LIMIT_BLOCK_DURATION_MS/1000}秒`);

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
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
    fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
  }
});

// 中间件
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../dist')));

// 添加对根路径的处理
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API 密钥鉴权中间件
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: '访问被拒绝，缺少API密钥' });
  }
  
  // 验证API密钥并获取用户信息
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

// 访问记录和限流中间件
const rateLimitAndLog = (req, res, next) => {
  // 获取客户端真实IP地址
  const ipAddress = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.ip;
  
  const currentTime = new Date();
  
  // 只记录特定的API请求（密钥提交和文件/内容提交）
  const shouldLog = req.path === '/api/clipboard/text' || 
                   req.path === '/api/clipboard/file' || 
                   req.path.startsWith('/api/clipboard/file/');
  
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
    const timeWindowAgo = new Date(currentTime.getTime() - RATE_LIMIT_WINDOW_MS);
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
    if (newCount > RATE_LIMIT_REQUESTS) {
      blockedUntil = new Date(currentTime.getTime() + RATE_LIMIT_BLOCK_DURATION_MS);
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
};

// 应用访问记录和限流中间件到所有路由
app.use(rateLimitAndLog);

// 初始化数据库
console.log('当前工作目录:', process.cwd());
const dbPath = './uploads/clipboard.db';
console.log('尝试连接数据库，路径:', dbPath);

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  console.log('创建数据库目录:', dbDir);
  fs.mkdirSync(dbDir, { recursive: true });
} else {
  console.log('数据库目录已存在:', dbDir);
}

console.log('检查目录权限');
try {
  fs.accessSync(dbDir, fs.constants.W_OK);
  console.log('目录可写');
} catch (err) {
  console.error('目录不可写:', err.message);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    // 尝试使用绝对路径
    const absoluteDbPath = path.resolve(dbPath);
    console.log('尝试使用绝对路径:', absoluteDbPath);
    const db2 = new sqlite3.Database(absoluteDbPath, (err) => {
      if (err) {
        console.error('使用绝对路径连接数据库也失败:', err.message);
      } else {
        console.log('已使用绝对路径连接到 SQLite 数据库');
        initializeDatabase(db2);
      }
    });
  } else {
    console.log('已连接到 SQLite 数据库');
    initializeDatabase(db);
  }
});

function initializeDatabase(database) {
  // 创建剪贴板内容表
  database.run(`CREATE TABLE IF NOT EXISTS clipboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    user_id INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('创建剪贴板表失败:', err.message);
    } else {
      console.log('剪贴板表已创建或已存在');
      
      // 检查并添加user_id列（如果不存在）
      database.run(`ALTER TABLE clipboard ADD COLUMN user_id INTEGER DEFAULT 1`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('添加user_id列失败:', err.message);
        } else if (!err) {
          console.log('成功添加user_id列到clipboard表');
        }
      });
    }
  });
  
  // 创建用户表
  database.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    api_key TEXT UNIQUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('创建用户表失败:', err.message);
    } else {
      console.log('用户表已创建或已存在');
    }
  });
  
  // 创建访问记录表
  database.run(`CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT,
    request_path TEXT,
    request_method TEXT,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('创建访问记录表失败:', err.message);
    } else {
      console.log('访问记录表已创建或已存在');
    }
  });
  
  // 创建限流记录表
  database.run(`CREATE TABLE IF NOT EXISTS rate_limits (
    ip_address TEXT PRIMARY KEY,
    request_count INTEGER DEFAULT 0,
    last_request_time DATETIME,
    blocked_until DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('创建限流记录表失败:', err.message);
    } else {
      console.log('限流记录表已创建或已存在');
    }
  });
  
  // 插入默认管理员用户（如果不存在）
  const adminApiKey = process.env.ADMIN_API_KEY || 'admin_secret_key';
  database.run(`INSERT OR IGNORE INTO users (username, api_key, is_admin) VALUES (?, ?, ?)`, 
    ['admin', adminApiKey, true], 
    (err) => {
      if (err) {
        console.error('创建默认管理员用户失败:', err.message);
      } else {
        console.log('默认管理员用户已创建或已存在');
      }
  });
  
  // 插入默认普通用户（如果不存在）
  const defaultApiKey = process.env.CLIPBOARD_API_KEY || 'default-api-key';
  database.run(`INSERT OR IGNORE INTO users (username, api_key, is_admin) VALUES (?, ?, ?)`, 
    ['default', defaultApiKey, false], 
    (err) => {
      if (err) {
        console.error('创建默认用户失败:', err.message);
      } else {
        console.log('默认用户已创建或已存在');
      }
  });
}

// API 路由 (需要鉴权)
app.get('/api/clipboard', authenticateApiKey, (req, res) => {
  // 只返回当前用户的数据
  const sql = 'SELECT * FROM clipboard WHERE user_id = ? ORDER BY created_at DESC LIMIT 20';
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// 获取7天内的访问记录 (仅管理员可访问)
app.get('/api/access-logs', authenticateApiKey, (req, res) => {
  // 检查是否为管理员
  if (!req.user.is_admin) {
    return res.status(403).json({ error: '访问被拒绝，需要管理员权限' });
  }
  
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sql = `
    SELECT * FROM access_logs 
    WHERE timestamp > ? 
    ORDER BY timestamp DESC 
    LIMIT 100
  `;
  
  db.all(sql, [sevenDaysAgo.toISOString()], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// 获取限流状态 (仅管理员可访问)
app.get('/api/rate-limits', authenticateApiKey, (req, res) => {
  // 检查是否为管理员
  if (!req.user.is_admin) {
    return res.status(403).json({ error: '访问被拒绝，需要管理员权限' });
  }
  
  const sql = `
    SELECT ip_address, request_count, last_request_time, blocked_until, updated_at
    FROM rate_limits 
    WHERE request_count > 0 OR blocked_until IS NOT NULL
    ORDER BY updated_at DESC 
    LIMIT 100
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// 公开文件访问端点（用于显示图片等）
app.get('/api/clipboard/file/:id', (req, res) => {
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
    if (!fs.existsSync(row.file_path)) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    // 设置正确的Content-Type
    const mimeType = getMimeType(row.file_name);
    if (mimeType) {
      res.setHeader('Content-Type', mimeType);
    }
    
    // 发送文件
    res.sendFile(path.resolve(row.file_path));
  });
});

// 文件下载端点（需要鉴权）
app.get('/api/clipboard/download/:id', authenticateApiKey, (req, res) => {
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
    if (!fs.existsSync(row.file_path)) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    // 设置响应头，触发浏览器下载
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(row.file_name)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // 发送文件
    res.sendFile(path.resolve(row.file_path));
  });
});

// 获取文件的MIME类型
function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// 文本内容上传
app.post('/api/clipboard/text', authenticateApiKey, (req, res) => {
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
      created_at: new Date() 
    };
    
    // 只向该用户广播更新
    io.to(`user_${req.user.id}`).emit('clipboard-update', data);
    
    res.json({ id: this.lastID, content });
  });
});

// 文件上传
app.post('/api/clipboard/file', authenticateApiKey, upload.single('file'), (req, res) => {
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
      created_at: new Date()
    };
    
    // 只向该用户广播更新
    io.to(`user_${req.user.id}`).emit('clipboard-update', data);
    
    res.json({ 
      id: this.lastID, 
      file_path: filePath,
      file_name: originalname,
      file_size: size,
      mime_type: mimetype
    });
  });
});

// 删除指定内容 (只能删除自己的内容)
app.delete('/api/clipboard/:id', authenticateApiKey, (req, res) => {
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
        fs.unlink(row.file_path, (err) => {
          if (err) {
            console.error('删除文件失败:', err);
          }
        });
      }
      
      res.json({ message: '删除成功' });
    });
  });
});

// 添加API端点：创建新用户 (仅管理员可访问)
app.post('/api/users', authenticateApiKey, (req, res) => {
  // 检查是否为管理员
  if (!req.user.is_admin) {
    return res.status(403).json({ error: '访问被拒绝，需要管理员权限' });
  }
  
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
app.delete('/api/users/:id', authenticateApiKey, (req, res) => {
  // 检查是否为管理员
  if (!req.user.is_admin) {
    return res.status(403).json({ error: '访问被拒绝，需要管理员权限' });
  }
  
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

// 获取用户列表 (仅管理员可访问)
app.get('/api/users', authenticateApiKey, (req, res) => {
  // 检查是否为管理员
  if (!req.user.is_admin) {
    return res.status(403).json({ error: '访问被拒绝，需要管理员权限' });
  }
  
  const sql = 'SELECT id, username, is_admin FROM users ORDER BY id';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// 获取当前用户信息
app.get('/api/users/me', authenticateApiKey, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    is_admin: req.user.is_admin
  });
});

// Socket.IO 连接处理
io.use((socket, next) => {
  const apiKey = socket.handshake.auth.apiKey;
  
  if (!apiKey) {
    return next(new Error('访问被拒绝，缺少API密钥'));
  }
  
  // 验证API密钥并获取用户信息
  const sql = 'SELECT id, username, is_admin FROM users WHERE api_key = ?';
  db.get(sql, [apiKey], (err, user) => {
    if (err) {
      return next(new Error('服务器内部错误'));
    }
    
    if (!user) {
      return next(new Error('访问被拒绝，API 密钥无效'));
    }
    
    // 将用户信息附加到socket实例
    socket.user = user;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`用户 ${socket.user.username} 已连接`);
  
  // 将用户加入其专属房间
  socket.join(`user_${socket.user.id}`);
  
  socket.on('disconnect', () => {
    console.log(`用户 ${socket.user.username} 已断开连接`);
  });
});

// 定期清理功能 - 每天凌晨2点执行
function scheduleCleanup() {
  const now = new Date();
  const nextRun = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + (now.getHours() < 2 ? 0 : 1),
    2, 0, 0, 0
  );
  
  const timeout = nextRun.getTime() - now.getTime();
  
  setTimeout(() => {
    cleanupOldItems();
    // 之后每24小时执行一次
    setInterval(cleanupOldItems, 24 * 60 * 60 * 1000);
  }, timeout);
}

// 清理旧内容（支持可配置的天数）
function cleanupOldItems() {
  console.log('开始执行定期清理任务');
  
  // 从环境变量获取清理天数，默认为7天
  const cleanupDays = process.env.CLEANUP_DAYS ? parseInt(process.env.CLEANUP_DAYS) : 7;
  const cleanupDate = new Date(Date.now() - cleanupDays * 24 * 60 * 60 * 1000);
  
  // 获取要删除的记录
  db.all('SELECT id, file_path, user_id FROM clipboard WHERE created_at < ?', [cleanupDate.toISOString()], (err, rows) => {
    if (err) {
      console.error('查询旧记录失败:', err.message);
      return;
    }
    
    if (rows.length === 0) {
      console.log('没有需要清理的旧记录');
      return;
    }
    
    // 按用户分组需要通知的用户
    const usersToNotify = new Set();
    
    // 删除文件
    rows.forEach(row => {
      // 添加用户到通知列表
      usersToNotify.add(row.user_id);
      
      if (row.file_path && fs.existsSync(row.file_path)) {
        fs.unlink(row.file_path, (err) => {
          if (err) {
            console.error('删除文件失败:', err);
          }
        });
      }
    });
    
    // 从数据库中删除记录
    db.run('DELETE FROM clipboard WHERE created_at < ?', [cleanupDate.toISOString()], function(err) {
      if (err) {
        console.error('删除旧记录失败:', err.message);
      } else {
        console.log(`已清理 ${this.changes} 条旧记录，清理${cleanupDays}天前的数据`);
        // 通知相关用户更新
        usersToNotify.forEach(userId => {
          io.to(`user_${userId}`).emit('clipboard-cleanup');
        });
      }
    });
  });
}

// 启动定期清理任务
scheduleCleanup();

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器正在端口 ${PORT} 上运行`);
  console.log(`API 密钥已设置: ${API_KEY !== 'default-api-key' ? '是 (来自环境变量或.env文件)' : '否 (使用默认值)'}`);
});