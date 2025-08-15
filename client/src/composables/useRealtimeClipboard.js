import { ref } from 'vue';
import { socketService } from '../core/socket/socketService';
import { useNotify } from './useNotify';

export function useRealtimeClipboard(clipboardStore, getApiKey){
  const { success } = useNotify();
  const connected = ref(false);

  function start(){
    const key = getApiKey();
    if(!key) return;
    socketService.connect(key);
    socketService.on('clipboard:new', data => {
      clipboardStore.items.value.unshift({ ...data, type: data.type || (data.content? 'text':'file') });
      if(clipboardStore.items.value.length > 100) clipboardStore.items.value.pop();
      success('收到新内容');
    });
    connected.value = true;
  }
  function stop(){ socketService.disconnect(); connected.value=false; }

  return { connected, start, stop };
}
