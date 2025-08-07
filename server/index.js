const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config/app.js');
const database = require('./services/database.js');
const rateLimitAndLog = require('./middleware/rateLimitAndLog.js');
const clipboardRoutes = require('./routes/clipboard.js');
const userRoutes = require('./routes/users.js');
const logsRoutes = require('./routes/logs.js');
const activeUsersRoutes = require('./routes/activeUsers.js');
const { scheduleCleanup } = require('./utils/cleanup.js');

// 初始化 Express 应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 设置io实例，以便在路由中使用
app.set('io', io);

// 中间件
app.use(bodyParser.json());

// 静态文件服务 - 添加缓存策略
app.use(express.static(path.join(__dirname, '../dist'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      // HTML文件不缓存
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (path.endsWith('.js') || path.endsWith('.css')) {
      // JS和CSS文件缓存1年
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (path.match(/\.(jpg|jpeg|png|gif|ico|svg)$/)) {
      // 图片文件缓存1年
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// 保持原有的上传目录静态服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 应用访问记录和限流中间件到所有路由
app.use(rateLimitAndLog);

// 初始化数据库
database.init().then(() => {
  console.log('数据库初始化完成');
}).catch(err => {
  console.error('数据库初始化失败:', err);
});

// API路由
app.use('/api/clipboard', clipboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logsRoutes); // 修复路径以匹配前端调用
app.use('/api/active-users', activeUsersRoutes);

// 添加GitHub信息API端点
app.get('/api/github-info', async (req, res) => {
  try {
    // 从package.json获取版本信息作为备用
    const packageInfo = require('../package.json');
    
    // 实时获取GitHub信息
    const fetch = (await import('node-fetch')).default;
    const githubResponse = await fetch('https://api.github.com/repos/axfinn/fcopy');
    const tagsResponse = await fetch('https://api.github.com/repos/axfinn/fcopy/tags');
    
    if (githubResponse.ok) {
      const githubData = await githubResponse.json();
      let version = packageInfo.version || '1.0.0';
      
      // 如果能获取到标签信息，则使用最新的标签作为版本
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        if (tagsData && tagsData.length > 0) {
          // 获取最新的标签作为版本号
          version = tagsData[0].name;
        }
      }
      
      // 返回实时的GitHub项目信息
      res.json({
        stars: githubData.stargazers_count || 0,
        forks: githubData.forks_count || 0,
        version: version,
        html_url: githubData.html_url || 'https://github.com/axfinn/fcopy',
        issues_url: githubData.html_url + '/issues' || 'https://github.com/axfinn/fcopy/issues',
        readme_url: githubData.html_url + '/blob/main/README.md' || 'https://github.com/axfinn/fcopy/blob/main/README.md'
      });
    } else {
      // 如果无法获取GitHub信息，返回默认信息
      res.json({
        stars: 0,
        forks: 0,
        version: packageInfo.version || '1.0.0',
        html_url: 'https://github.com/axfinn/fcopy',
        issues_url: 'https://github.com/axfinn/fcopy/issues',
        readme_url: 'https://github.com/axfinn/fcopy/blob/main/README.md'
      });
    }
  } catch (error) {
    // 出错时返回默认信息
    const packageInfo = require('../package.json');
    console.error('获取GitHub信息失败:', error);
    res.json({
      stars: 0,
      forks: 0,
      version: packageInfo.version || '1.0.0',
      html_url: 'https://github.com/axfinn/fcopy',
      issues_url: 'https://github.com/axfinn/fcopy/issues',
      readme_url: 'https://github.com/axfinn/fcopy/blob/main/README.md'
    });
  }
});

// Socket.IO 连接处理
io.use((socket, next) => {
  const apiKey = socket.handshake.auth.apiKey;
  
  if (!apiKey) {
    return next(new Error('访问被拒绝，缺少API密钥'));
  }
  
  // 验证API密钥并获取用户信息
  const db = database.getInstance();
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
  console.log(`用户 ${socket.user.username} 已连接，Socket ID: ${socket.id}`);
  
  // 添加连接时间
  socket.connectedAt = new Date();
  
  // 将用户加入其专属房间
  socket.join(`user_${socket.user.id}`);
  
  socket.on('disconnect', () => {
    console.log(`用户 ${socket.user.username} 已断开连接，Socket ID: ${socket.id}`);
  });
});

// 启动定期清理任务
scheduleCleanup(io);

// 启动服务器
server.listen(config.SERVER.PORT, () => {
  console.log(`服务器正在端口 ${config.SERVER.PORT} 上运行`);
  console.log(`API 密钥已设置: ${config.API_KEY !== 'default-api-key' ? '是 (来自环境变量或.env文件)' : '否 (使用默认值)'}`);
  console.log(`请求频率限制已设置: ${config.RATE_LIMIT.REQUESTS} 次/${config.RATE_LIMIT.WINDOW_MS/1000}秒, 封禁时长: ${config.RATE_LIMIT.BLOCK_DURATION_MS/1000}秒`);
});