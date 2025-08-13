export const ui = {
  state: {
    theme: 'auto',
    darkMode: false,
    background: {
      type: 'image',
      value: '/images/bg-default.jpg',
      opacity: 0.3
    },
    loading: {
      clipboard: false,
      users: false,
      activeUsers: false,
      accessLogs: false
    },
    activeTab: 'clipboard'
  },
  
  mutations: {
    SET_THEME(state, theme) {
      state.theme = theme;
      localStorage.setItem('clipboard_theme_mode', theme);
    },
    
    SET_DARK_MODE(state, isDark) {
      state.darkMode = isDark;
      if (isDark) {
        document.documentElement.classList.add('theme-dark');
      } else {
        document.documentElement.classList.remove('theme-dark');
      }
    },
    
    SET_BACKGROUND(state, background) {
      state.background = { ...state.background, ...background };
      localStorage.setItem('clipboard_background', JSON.stringify(state.background));
    },
    
    SET_LOADING(state, { type, loading }) {
      if (state.loading.hasOwnProperty(type)) {
        state.loading[type] = loading;
      }
    },
    
    SET_ACTIVE_TAB(state, tab) {
      state.activeTab = tab;
    },
    
    INIT_BACKGROUND(state) {
      try {
        const saved = localStorage.getItem('clipboard_background');
        if (saved) {
          const parsed = JSON.parse(saved);
          state.background = { ...state.background, ...parsed };
        }
      } catch (e) {
        console.warn('Failed to parse saved background:', e);
      }
    },
    
    INIT_THEME(state) {
      const savedTheme = localStorage.getItem('clipboard_theme_mode') || 'auto';
      state.theme = savedTheme;
      
      let shouldBeDark = false;
      if (savedTheme === 'dark') {
        shouldBeDark = true;
      } else if (savedTheme === 'light') {
        shouldBeDark = false;
      } else { // auto
        shouldBeDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      state.darkMode = shouldBeDark;
      document.documentElement.classList.toggle('theme-dark', shouldBeDark);
    }
  },
  
  getters: {
    theme: state => state.theme,
    darkMode: state => state.darkMode,
    background: state => state.background,
    loading: state => state.loading,
    activeTab: state => state.activeTab,
    isLoading: state => type => state.loading[type] || false
  }
};