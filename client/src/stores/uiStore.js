import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
  state: () => ({
    backgroundImages: ['https://picsum.photos/1920/1080?random=1'],
    currentBackground: '',
  }),
  actions: {
    init(){
      const saved = localStorage.getItem('clipboard_background');
      this.currentBackground = saved || this.backgroundImages[0];
    },
    setBackground(url){
      this.currentBackground = url;
      localStorage.setItem('clipboard_background', url);
    }
  }
});
