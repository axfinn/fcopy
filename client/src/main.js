import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ClipboardApp from './ClipboardApp.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import './stores';

const app = createApp(ClipboardApp);
app.use(createPinia());
app.use(ElementPlus);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount('#app');