import { computed } from 'vue';
import { useUiStore } from '../stores/uiStore';

export function useBackground(){
  const ui = useUiStore();
  ui.init();
  const backgroundImage = computed(()=> ui.currentBackground);
  return { backgroundImage, ui };
}
