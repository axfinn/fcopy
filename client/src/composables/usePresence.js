import { ref } from 'vue';
import { socketService } from '../core/socket/socketService';

export function usePresence(getApiKey){
  const activeUsers = ref([]);

  function start(){
    const key = getApiKey();
    if(!key) return;
    socketService.connect(key);
    socketService.on('presence:update', list => { activeUsers.value = list; });
  }
  function stop(){ socketService.disconnect(); }

  return { activeUsers, start, stop };
}
