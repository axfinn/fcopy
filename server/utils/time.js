// 时间工具：统一将 SQLite UTC 时间转换为上海时区格式
// 存储：clipboard.created_at 由 sqlite datetime('now') -> UTC
// 需求：前端期望 "YYYY/MM/DD HH:mm:ss"

function pad(n){ return String(n).padStart(2,'0'); }

function formatShanghaiDateTime(utcString){
  if(!utcString) return '';
  const utcDate = new Date(utcString);
  if(isNaN(utcDate.getTime())) return '';
  // 加 8 小时得到上海时间（不考虑 DST，国内固定东八区）
  const shanghai = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
  const year = shanghai.getFullYear();
  const month = pad(shanghai.getMonth()+1);
  const day = pad(shanghai.getDate());
  const hours = pad(shanghai.getHours());
  const minutes = pad(shanghai.getMinutes());
  const seconds = pad(shanghai.getSeconds());
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

function attachShanghaiCreatedAt(row){
  if(!row) return row;
  return { ...row, created_at: formatShanghaiDateTime(row.created_at) };
}

module.exports = {
  formatShanghaiDateTime,
  attachShanghaiCreatedAt
};
