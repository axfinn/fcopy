// 应用配置
require('dotenv').config();

module.exports = {
  // API 密钥 (优先从环境变量获取，否则使用默认值)
  API_KEY: process.env.CLIPBOARD_API_KEY || 'default-api-key',
  
  // 请求频率限制配置 (优先从环境变量获取，否则使用默认值)
  RATE_LIMIT: {
    REQUESTS: parseInt(process.env.RATE_LIMIT_REQUESTS) || 10,
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1分钟
    BLOCK_DURATION_MS: parseInt(process.env.RATE_LIMIT_BLOCK_DURATION_MS) || 600000 // 10分钟
  },
  
  // 清理配置
  CLEANUP: {
    DAYS: process.env.CLEANUP_DAYS ? parseInt(process.env.CLEANUP_DAYS) : 7
  },
  
  // 服务器配置
  SERVER: {
    PORT: process.env.PORT || 3000
  },
  
  // 数据库配置
  DATABASE: {
    PATH: './uploads/clipboard.db'
  },
  
  // 文件上传配置
  UPLOAD: {
    DIR: './uploads',
    LIMITS: {
      FILE_SIZE: 10 * 1024 * 1024 // 限制文件大小为10MB
    }
  }
};