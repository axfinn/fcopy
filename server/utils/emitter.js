// WebSocket 事件发送封装
// 约定：用户房间名 user_{userId}

function userRoom(userId){ return `user_${userId}`; }

function emitToUser(io, userId, event, payload){
  if(!io || !userId) return;
  io.to(userRoom(userId)).emit(event, payload);
}

module.exports = { userRoom, emitToUser };
