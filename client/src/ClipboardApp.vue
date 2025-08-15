<template>
  <div id="app">
    <!-- 背景容器 -->
    <div class="background-container">
      <div 
        class="background-slide"
        :style="{ 
          backgroundImage: `url(${backgroundImage})`
        }"
      ></div>
    </div>
    
    <!-- 登录视图 (放在最外层以避免被遮挡) -->
    <LoginView 
      v-if="!auth.isAuthenticated" 
      @authenticate="handleAuthenticate"
      class="login-view"
    />
    
    <!-- 头部组件 -->
    <AppHeader 
      v-if="auth.isAuthenticated"
      :is-authenticated="auth.isAuthenticated"
      :username="auth.username"
      @logout="handleLogout"
    />
    
    <!-- 主要内容区域 -->
    <div class="app-container" v-if="auth.isAuthenticated">
      <el-container class="main-container">
        <el-main class="content-main">
          <MainView 
            :api-key="auth.apiKey"
            :clipboard-items="clipboard.items"
            :active-users="presence.activeUsers"
            :is-admin="auth.isAdmin"
          />
        </el-main>
        
      </el-container>
    </div>
    
    <!-- 底部信息 -->
    <Footer 
      v-if="auth.isAuthenticated"
    />
    
    <!-- 预览对话框占位，后续迁移 -->
    <el-dialog
      v-model="textPreviewDialogVisible"
      title="文本预览"
      width="80%"
    >
      <pre class="text-preview-content">{{ textPreviewContent }}</pre>
    </el-dialog>
    <el-dialog
      v-model="pdfPreviewDialogVisible"
      title="PDF预览"
      width="80%"
    >
      <div v-if="previewFile">
        <iframe 
          :src="`/api/clipboard/file/${previewFile.id}`" 
          width="100%" 
          height="600"
          frameborder="0"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { defineComponent, onMounted, onBeforeUnmount, computed, ref } from 'vue';
import { useAuthStore } from './stores/authStore';
import { useClipboardStore } from './stores/clipboardStore';
import { usePresenceStore } from './stores/presenceStore';
import { socketService } from './core/socket/socketService';
import { useNotify } from './composables/useNotify';
import LoginView from './components/LoginView.vue';
import MainView from './components/MainView.vue';
import Footer from './components/Footer.vue';
import AppHeader from './components/AppHeader.vue';
import { useBackground } from './composables/useBackground';
import { usePreviewDialogs } from './composables/usePreviewDialogs';
import { useUpload } from './composables/useUpload';

export default defineComponent({
  name: 'ClipboardApp',
  components: {
    LoginView,
    MainView,
    Footer,
    AppHeader
  },
  setup(){
    const auth = useAuthStore();
    const clipboard = useClipboardStore();
    const presence = usePresenceStore();
    const { success, error } = useNotify();

    const textPreviewContent = ref('');
    const textPreviewDialogVisible = ref(false);
    const pdfPreviewDialogVisible = ref(false);
    const previewFile = ref(null);

    function bindSocket(){
      if(!auth.apiKey) return;
      socketService.disconnect();
      socketService.connect(auth.apiKey);
      socketService.off('clipboard:new');
      socketService.off('presence:update');
      socketService.on('clipboard:new', data => {
        clipboard.prepend({ ...data, type: data.type || (data.content ? 'text':'file') });
      });
      socketService.on('presence:update', list => { presence.set(list); });
    }

    async function handleAuthenticate(key){
      try { await auth.login(key); bindSocket(); await clipboard.load(auth.apiKey); success('认证成功'); } catch(e){ error(e.message||'认证失败'); }
    }

    function handleLogout(){ socketService.disconnect(); auth.logout(); clipboard.items=[]; presence.activeUsers=[]; success('已登出'); }

    onMounted(()=>{ auth.initFromLocal && auth.initFromLocal(); if(auth.apiKey){ handleAuthenticate(auth.apiKey); } });
    onBeforeUnmount(()=> socketService.disconnect());

    const { backgroundImage } = useBackground();
    const preview = usePreviewDialogs();
    const uploader = useUpload(()=> auth.apiKey);

    return { auth, clipboard, presence, handleAuthenticate, handleLogout, backgroundImage, ...preview, uploader };
  }
});
</script>