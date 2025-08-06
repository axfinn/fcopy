import { createApp } from 'vue';
import ClipboardApp from './ClipboardApp.vue';
import AppHeader from './components/AppHeader.vue';
import LoginView from './components/LoginView.vue';
import MainView from './components/MainView.vue';
import GitHubInfo from './components/GitHubInfo.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

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
app.component('GitHubInfo', GitHubInfo);

app.mount('#app');