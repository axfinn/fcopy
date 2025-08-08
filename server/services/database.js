const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../config/app.js');

// 设置SQLite使用上海时区
process.env.TZ = 'Asia/Shanghai';

class DatabaseService {
  constructor() {
    this.db = null;
  }

  // 初始化数据库
  init() {
    console.log('当前工作目录:', process.cwd());
    const dbPath = config.DATABASE.PATH;
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

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('数据库连接失败:', err.message);
          // 尝试使用绝对路径
          const absoluteDbPath = path.resolve(dbPath);
          console.log('尝试使用绝对路径:', absoluteDbPath);
          this.db = new sqlite3.Database(absoluteDbPath, (err) => {
            if (err) {
              console.error('使用绝对路径连接数据库也失败:', err.message);
              reject(err);
            } else {
              console.log('已使用绝对路径连接到 SQLite 数据库');
              this.initializeDatabase();
              resolve(this.db);
            }
          });
        } else {
          console.log('已连接到 SQLite 数据库');
          this.initializeDatabase();
          resolve(this.db);
        }
      });
    });
  }

  // 初始化数据库表
  initializeDatabase() {
    // 创建剪贴板内容表
    this.db.run(`CREATE TABLE IF NOT EXISTS clipboard (
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
        this.db.run(`ALTER TABLE clipboard ADD COLUMN user_id INTEGER DEFAULT 1`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('添加user_id列失败:', err.message);
          } else if (!err) {
            console.log('成功添加user_id列到clipboard表');
          }
        });
      }
    });
    
    // 创建用户表
    this.db.run(`CREATE TABLE IF NOT EXISTS users (
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
        this.createDefaultUsers();
      }
    });
    
    // 创建访问记录表
    this.db.run(`CREATE TABLE IF NOT EXISTS access_logs (
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

    // 添加测试方法
    this.testInsertAndRetrieve = () => {
      // 插入测试数据
      const testFilePath = '/test/path';
      const testFileName = 'test.txt';
      const testFileSize = 1024;
      const testMimeType = 'text/plain';
      
      this.db.run(`INSERT INTO clipboard (content, file_path, file_name, file_size, mime_type) 
                 VALUES (?, ?, ?, ?, ?)`,
        ['测试内容', testFilePath, testFileName, testFileSize, testMimeType],
        function (err) {
          if (err) {
            console.error('插入测试数据失败:', err.message);
            return;
          }
          
          console.log(`插入测试数据，ID: ${this.lastID}`);
          
          // 查询测试数据
          this.db.get(`SELECT * FROM clipboard WHERE id = ?`, [this.lastID], (err, row) => {
            if (err) {
              console.error('查询测试数据失败:', err.message);
              return;
            }
            
            console.log('查询到测试数据:');
            console.log(`ID: ${row.id}, 内容: ${row.content}, 文件路径: ${row.file_path}, 文件名: ${row.file_name}, 大小: ${row.file_size}, MIME类型: ${row.mime_type}`);
          });
        });
    };
    
    // 创建限流记录表
    this.db.run(`CREATE TABLE IF NOT EXISTS rate_limits (
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
  }

  // 创建默认用户
  createDefaultUsers() {
    // 插入或更新默认管理员用户
    const adminApiKey = process.env.ADMIN_API_KEY || 'admin_secret_key';
    console.log('管理员API密钥已设置:', adminApiKey !== 'admin_secret_key' ? '是 (来自环境变量或.env文件)' : '否 (使用默认值)');
    
    // 强制更新管理员用户API密钥（如果环境变量存在）
    if (process.env.ADMIN_API_KEY) {
      this.db.run(`INSERT OR REPLACE INTO users (id, username, api_key, is_admin) VALUES ((SELECT id FROM users WHERE username = 'admin'), ?, ?, ?)`, 
        ['admin', adminApiKey, true], 
        (err) => {
          if (err) {
            console.error('更新管理员用户失败:', err.message);
          } else {
            console.log('管理员用户API密钥已更新');
          }
      });
    } else {
      this.db.run(`INSERT OR IGNORE INTO users (username, api_key, is_admin) VALUES (?, ?, ?)`, 
        ['admin', adminApiKey, true], 
        (err) => {
          if (err) {
            console.error('创建默认管理员用户失败:', err.message);
          } else {
            console.log('默认管理员用户已创建或已存在');
          }
      });
    }
    
    // 插入或更新默认普通用户
    const defaultApiKey = process.env.CLIPBOARD_API_KEY || 'default-api-key';
    
    // 强制更新默认用户API密钥（如果环境变量存在）
    if (process.env.CLIPBOARD_API_KEY) {
      this.db.run(`INSERT OR REPLACE INTO users (id, username, api_key, is_admin) VALUES ((SELECT id FROM users WHERE username = 'default'), ?, ?, ?)`, 
        ['default', defaultApiKey, false], 
        (err) => {
          if (err) {
            console.error('更新默认用户失败:', err.message);
          } else {
            console.log('默认用户API密钥已更新');
            console.log('当前配置的API密钥:', defaultApiKey);
          }
      });
    } else {
      this.db.run(`INSERT OR IGNORE INTO users (username, api_key, is_admin) VALUES (?, ?, ?)`, 
        ['default', defaultApiKey, false], 
        (err) => {
          if (err) {
            console.error('创建默认用户失败:', err.message);
          } else {
            console.log('默认用户已创建或已存在');
            console.log('当前配置的API密钥:', defaultApiKey);
          }
      });
    }
  }

  // 获取数据库实例
  getInstance() {
    return this.db;
  }
  
  // 添加用于查询文件名的方法
  getClipboardByFileName(fileName) {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM clipboard WHERE file_name = ?`, [fileName], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = new DatabaseService();