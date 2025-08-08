import { createApp } from 'vue';
import ClipboardApp from './ClipboardApp.vue';
import AppHeader from './components/AppHeader.vue';
import LoginView from './components/LoginView.vue';
import MainView from './components/MainView.vue';
import ClipboardHistory from './components/ClipboardHistory.vue';
import AddContent from './components/AddContent.vue';
import MyConnections from './components/MyConnections.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// 引入服务和状态管理
import api from './services/api.js';
import socket from './services/socket.js';
import store from './store/index.js';

const app = createApp(ClipboardApp);
app.use(ElementPlus);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 注册组件
app.component('AppHeader', AppHeader);
app.component('LoginView', LoginView);
app.component('MainView', MainView);
app.component('ClipboardHistory', ClipboardHistory);
app.component('AddContent', AddContent);
app.component('MyConnections', MyConnections);

app.mount('#app');

// 将服务实例挂载到全局，方便调试
window.apiService = api;
window.socketService = socket;
window.store = store;