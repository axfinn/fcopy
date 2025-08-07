const fs = require('fs');
const path = require('path');
const config = require('../config/app.js');

class FileService {
  // 配置文件上传
  configureMulter() {
    const multer = require('multer');
    
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../', config.UPLOAD.DIR);
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

    return multer({ 
      storage: storage,
      limits: config.UPLOAD.LIMITS
    });
  }

  // 获取文件的MIME类型
  getMimeType(fileName) {
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

  // 检查文件是否存在
  fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  // 删除文件
  deleteFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // 获取文件绝对路径
  getAbsolutePath(filePath) {
    return path.resolve(filePath);
  }
}

module.exports = new FileService();