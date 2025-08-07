const config = require('../config/app.js');
const database = require('../services/database.js');

// 定期清理功能 - 每天凌晨2点执行
function scheduleCleanup(io) {
  const now = new Date();
  const nextRun = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + (now.getHours() < 2 ? 0 : 1),
    2, 0, 0, 0
  );
  
  const timeout = nextRun.getTime() - now.getTime();
  
  setTimeout(() => {
    cleanupOldItems(io);
    // 之后每24小时执行一次
    setInterval(() => cleanupOldItems(io), 24 * 60 * 60 * 1000);
  }, timeout);
}

// 清理旧内容（支持可配置的天数）
function cleanupOldItems(io) {
  const db = database.getInstance();
  
  console.log('开始执行定期清理任务');
  
  // 从环境变量获取清理天数，默认为7天
  const cleanupDays = config.CLEANUP.DAYS;
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
      
      if (row.file_path && require('fs').existsSync(row.file_path)) {
        require('fs').unlink(row.file_path, (err) => {
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

module.exports = {
  scheduleCleanup,
  cleanupOldItems
};