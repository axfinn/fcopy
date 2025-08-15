import { io } from 'socket.io-client';
import mitt from 'mitt';

class SocketService {
  constructor(){
    this.socket = null;
    this.bus = mitt();
    this.apiKey = null;
  }
  connect(apiKey){
    if(this.socket) this.disconnect();
    this.apiKey = apiKey;
    this.socket = io('/', { auth:{ apiKey } });
    this.socket.on('clipboard-update', data=> this.bus.emit('clipboard:new', data));
    this.socket.on('user-update', data=> this.bus.emit('presence:update', data));
    return this.bus;
  }
  on(event, handler){ this.bus.on(event, handler); }
  off(event){ this.bus.all.delete(event); }
  disconnect(){ if(this.socket){ this.socket.disconnect(); this.socket=null; } }
  clear(){ this.bus.all.clear(); }
}

export const socketService = new SocketService();
