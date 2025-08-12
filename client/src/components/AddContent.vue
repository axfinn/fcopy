<template>
  <div class="chat-wrapper" @paste="handlePaste">
    <el-card class="chat-card">
      <template #header>
        <div class="card-header">
          <span>实时内容 (聊天模式)</span>
          <div class="header-actions">
            <el-select v-model="limit" size="small" class="limit-select" @change="refillMessages">
              <el-option :value="20" label="20条" />
              <el-option :value="50" label="50条" />
              <el-option :value="100" label="100条" />
            </el-select>
            <el-button size="small" type="primary" plain @click="scrollToBottom">到底部</el-button>
          </div>
        </div>
      </template>
      <div ref="listContainer" class="message-list" @scroll.passive="handleScroll">
        <div v-if="processedMessages.length === 0" class="empty">暂无消息</div>
        <transition-group name="fade-scale" tag="div">
          <div v-for="msg in processedMessages" :key="msg.id" class="bubble-row" :class="msg.side">
            <div class="avatar-wrapper" :class="msg.side">
              <div class="avatar" :style="avatarStyle(msg)">{{ avatarLabel(msg) }}</div>
            </div>
            <div class="bubble-col" :class="msg.side">
              <div class="bubble-meta meta" :class="msg.side">
                <el-tooltip effect="dark" :content="msg.ip_address || '未知IP'" placement="top" v-if="msg.ip_address">
                  <span class="ip meta-text">{{ msg.ip_address }}</span>
                </el-tooltip>
                <el-tooltip effect="dark" :content="msg.user_agent" placement="top" v-if="msg.user_agent">
                  <span class="ua meta-text">{{ formatUA(msg.user_agent) }}</span>
                </el-tooltip>
                <span class="time meta-text">{{ msg.created_at }}</span>
                <span class="tag meta-text" :class="msg.type">{{ msg.type==='text' ? '文本' : '文件' }}</span>
              </div>
              <div class="bubble" :class="[msg.type, msg.side]">
                <template v-if="msg.type==='text'">
                  <pre class="bubble-text" @click="copyMessage(msg)" :title="'点击复制\n'+(copySupported? '':'(可能不被当前浏览器支持)')">{{ msg.content }}</pre>
                  <span class="copy-hint" @click.stop="copyMessage(msg)">复制</span>
                </template>
                <template v-else>
                  <template v-if="isImage(msg)">
                    <div class="image-file">
                      <div class="thumb-wrapper" @click="previewImage(msg)">
                        <img v-if="msg.__thumbUrl" :src="msg.__thumbUrl" class="thumb" :alt="msg.file_name" />
                        <div v-else class="thumb placeholder">预览</div>
                      </div>
                      <div class="file-info" @click.stop="downloadFile(msg)">
                        <el-link type="primary">📷 {{ msg.file_name }} ({{ formatSize(msg.file_size) }})</el-link>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <el-link type="primary" @click.prevent="downloadFile(msg)">
                      📎 {{ msg.file_name }} ({{ formatSize(msg.file_size) }})
                    </el-link>
                  </template>
                </template>
              </div>
            </div>
          </div>
        </transition-group>
        <div v-if="showNewMessageTip" class="new-tip" @click="scrollToBottom">有新消息，点击查看</div>
      </div>
      <div class="input-area" :class="{ shadow: !isAtBottom }">
        <div class="input-flex">
          <el-input v-model="textContent" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }" placeholder="输入文本，Enter发送，Shift+Enter换行，支持粘贴 / 拖拽文件" @keydown.enter.prevent="handleEnter" class="chat-textarea" />
          <div class="send-box">
            <el-upload action="/api/clipboard/file" :headers="uploadHeaders" :show-file-list="false" :on-success="handleUploadSuccess" :on-error="handleUploadError" :multiple="true" class="inline-upload">
              <el-button size="small" class="btn-upload">📎 文件</el-button>
            </el-upload>
            <el-button type="primary" size="small" :disabled="!textContent.trim()" @click="addTextContent">发送</el-button>
          </div>
        </div>
      </div>
      <el-dialog v-model="imagePreviewVisible" title="图片预览" width="70%" :before-close="handleImagePreviewClose" class="chat-image-preview">
        <div class="image-preview-container" v-loading="imagePreviewLoading">
          <img v-if="imagePreviewUrl" :src="imagePreviewUrl" :alt="previewFile?.file_name" class="image-large" />
          <div v-else class="image-loading">加载中...</div>
        </div>
        <template #footer>
          <el-button @click="downloadCurrentImage" :disabled="!previewFile">下载</el-button>
          <el-button type="primary" @click="imagePreviewVisible=false">关闭</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>
<script>
export default {
  name: 'AddContent',
  props: { apiKey: String, clipboardItems: { type: Array, default: () => [] }, defaultLimit: { type: Number, default: 50 } },
  data() { return { textContent:'', limit:this.defaultLimit, displayMessages:[], isAtBottom:true, pendingNew:0, imagePreviewVisible:false, imagePreviewUrl:'', imagePreviewLoading:false, previewFile:null, copySupported: !!(navigator && navigator.clipboard && navigator.clipboard.writeText) }; },
  computed: { uploadHeaders(){return {'X-API-Key':this.apiKey};}, processedMessages(){ const ips={}; this.displayMessages.forEach(m=>{ if(m.ip_address) ips[m.ip_address]=(ips[m.ip_address]||0)+1; }); const selfIp=Object.keys(ips).sort((a,b)=>ips[b]-ips[a])[0]||null; return this.displayMessages.map(m=>({...m, side:selfIp && m.ip_address===selfIp?'right':'left'})); }, showNewMessageTip(){return !this.isAtBottom && this.pendingNew>0;} },
  watch:{ clipboardItems:{ handler(){ this.refillMessages(); }, deep:true, immediate:true } },
  mounted(){ this.scrollToBottom(); },
  methods:{
    refillMessages(){ const beforeBottom=this.isAtBottom; this.displayMessages=this.clipboardItems.slice(0,this.limit).reverse(); this.$nextTick(()=>{ if(beforeBottom){ this.scrollToBottom(); this.pendingNew=0;} else { this.pendingNew+=1; } }); },
    avatarLabel(msg){ if(!msg.ip_address) return '?'; const parts=msg.ip_address.split('.'); return (parts[parts.length-1]||parts[0]||'?').slice(0,3); },
    avatarStyle(msg){ const ip=msg.ip_address||'unknown'; let hash=0; for(let i=0;i<ip.length;i++){ hash=((hash<<5)-hash)+ip.charCodeAt(i); hash|=0; } const hue=Math.abs(hash)%360; return { background:`hsl(${hue} 70% 55%)`, boxShadow:`0 0 0 2px hsl(${hue} 70% 80% / .9), 0 4px 10px -2px hsl(${hue} 60% 35% / .45)` }; },
    handleEnter(e){ if(e.shiftKey){ this.textContent+='\n'; return;} this.addTextContent(); },
    formatSize(size){ if(!size) return '0B'; const u=['B','KB','MB','GB']; let i=0,s=size; while(s>=1024 && i<u.length-1){s/=1024;i++;} return s.toFixed(i===0?0:1)+u[i]; },
    formatUA(ua){ if(!ua) return ''; return ua.length<=40?ua:ua.slice(0,37)+'...'; },
    scrollToBottom(){ const el=this.$refs.listContainer; if(el){ el.scrollTop=el.scrollHeight; this.isAtBottom=true; this.pendingNew=0; } },
    handleScroll(){ const el=this.$refs.listContainer; if(!el) return; const threshold=40; const atBottom=el.scrollHeight-el.scrollTop-el.clientHeight<threshold; this.isAtBottom=atBottom; if(atBottom) this.pendingNew=0; },
    handlePaste(e){ const items=(e.clipboardData||e.originalEvent.clipboardData).items; for(let i=0;i<items.length;i++){ const it=items[i]; if(it.kind==='file'){ this.uploadFile(it.getAsFile()); } } },
    async uploadFile(file){ const fd=new FormData(); fd.append('file',file); try{ const resp=await fetch('/api/clipboard/file',{method:'POST',headers:{'X-API-Key':this.apiKey},body:fd}); if(!resp.ok) throw new Error('上传失败'); const result=await resp.json(); this.$emit('file-success',result); this.$message.success('文件上传成功'); }catch(err){ console.error(err); this.$emit('file-error',err); this.$message.error('文件上传失败: '+err.message);} },
    handleUploadSuccess(r){ this.$emit('file-success',r); this.$message.success('文件上传成功'); },
    handleUploadError(e){ console.error('文件上传失败:',e); this.$emit('file-error',e); this.$message.error('文件上传失败'); },
    addTextContent(){ if(!this.textContent.trim()) return; this.$emit('text-added',this.textContent); this.textContent=''; },
    isImage(item){ return item && item.mime_type && item.mime_type.startsWith('image/'); },
    async previewImage(item){ if(!item) return; this.imagePreviewVisible=true; this.imagePreviewLoading=true; this.previewFile=item; try{ const resp=await fetch(`/api/clipboard/file/${item.id}`,{headers:{'X-API-Key':this.apiKey}}); if(!resp.ok) throw new Error('获取图片失败'); const blob=await resp.blob(); if(this.imagePreviewUrl) URL.revokeObjectURL(this.imagePreviewUrl); this.imagePreviewUrl=URL.createObjectURL(blob); }catch(e){ console.error(e); this.$message.error(e.message||'图片预览失败'); this.imagePreviewVisible=false; } finally { this.imagePreviewLoading=false; } },
    handleImagePreviewClose(){ if(this.imagePreviewUrl) URL.revokeObjectURL(this.imagePreviewUrl); this.imagePreviewUrl=''; this.previewFile=null; this.imagePreviewVisible=false; },
  downloadCurrentImage(){ if(!this.previewFile) return; this.downloadFile(this.previewFile); },
  downloadFile(item){ if(!item) return; this.$emit('download-file', item.id, item.file_name, item.mime_type, true); },
    async copyMessage(item){ if(!item||item.type!=='text'||!item.content) return; const text=item.content; try{ if(this.copySupported){ await navigator.clipboard.writeText(text);} else { const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);} this.$message.success('已复制'); }catch(e){ console.error(e); this.$message.error('复制失败'); } }
  }
};
</script>
<style scoped>
/* (styles omitted for brevity, same as previous good version) */
.chat-wrapper { padding:0; }
.chat-card { height: calc(100vh - 200px); max-height:960px; display:flex; flex-direction:column; --bubble-blue:#409EFF; --bubble-green:#53c41a; --bubble-border:#e2e5e9; background:linear-gradient(135deg,#f8fafc 0%,#eef3f9 100%); }
.chat-card :deep(.el-card__body){ display:flex; flex-direction:column; flex:1; padding:12px 12px 0 12px; min-height:0; }
.card-header { display:flex; justify-content:space-between; align-items:center; font-weight:600; letter-spacing:.5px; }
.header-actions { display:flex; gap:8px; align-items:center; }
.limit-select { width:90px; }
.message-list { position:relative; flex:1; min-height:0; overflow-y:auto; padding:14px 14px 18px; background:rgba(255,255,255,.72); backdrop-filter:blur(6px); border:1px solid #d8dce1; border-radius:14px; }
.message-list::-webkit-scrollbar { width:8px; }
.message-list::-webkit-scrollbar-track { background:transparent; }
.message-list::-webkit-scrollbar-thumb { background:rgba(0,0,0,.15); border-radius:4px; }
.message-list:hover::-webkit-scrollbar-thumb { background:rgba(0,0,0,.28); }
.empty { text-align:center; color:#999; margin-top:40px; }
.bubble-row { display:flex; gap:8px; margin:4px 0 18px; max-width:100%; }
.bubble-row.left { flex-direction:row; }
.bubble-row.right { flex-direction:row-reverse; }
.avatar-wrapper { display:flex; align-items:flex-start; }
.avatar { width:36px; height:36px; border-radius:14px; color:#fff; font-size:12px; font-weight:600; display:flex; align-items:center; justify-content:center; letter-spacing:.5px; user-select:none; transition:transform .25s; }
.avatar:hover { transform:translateY(-2px) scale(1.05); }
.bubble-col { display:flex; flex-direction:column; max-width:calc(100% - 44px); }
.bubble-meta { font-size:11px; color:#667185; display:flex; gap:6px; flex-wrap:wrap; margin:0 6px 4px; line-height:1.2; }
.bubble-meta.right { justify-content:flex-end; }
.bubble { position:relative; padding:10px 14px; border-radius:18px; font-size:13px; line-height:1.55; max-width:72%; word-break:break-word; box-shadow:0 2px 4px -1px rgba(0,0,0,.08),0 4px 14px -6px rgba(14,30,37,.12); border:1px solid var(--bubble-border); background:#fff; transition:transform .15s, box-shadow .15s; }
.bubble.left { background:linear-gradient(135deg,#ffffff 0%,#f4f7fa 100%); }
.bubble.right { background:linear-gradient(135deg,var(--bubble-blue) 0%,#66b6ff 100%); color:#fff; border-color:rgba(255,255,255,.25); }
.bubble.file { background:linear-gradient(135deg,var(--bubble-green) 0%,#7ddc44 100%); color:#fff; border-color:rgba(255,255,255,.25); }
.bubble.file a { color:#fff; text-decoration:underline; }
.bubble:hover { transform:translateY(-2px); box-shadow:0 4px 10px -3px rgba(0,0,0,.16),0 8px 22px -8px rgba(14,30,37,.2); }
.bubble:after { content:''; position:absolute; width:0; height:0; top:12px; }
.bubble.left:after { left:-7px; border:7px solid transparent; border-right-color:#ffffff; filter:drop-shadow(0 0 1px rgba(0,0,0,.08)); }
.bubble.right:after { right:-7px; border:7px solid transparent; border-left-color:var(--bubble-blue); }
.bubble-row.right .bubble.file:after { border-left-color:var(--bubble-green); }
.bubble-row.left .bubble.file:after { border-right-color:var(--bubble-green); }
.bubble-text { margin:0; white-space:pre-wrap; font-family:inherit; cursor:pointer; }
.bubble:hover .copy-hint { opacity:1; transform:translateY(0); }
.copy-hint { user-select:none; position:absolute; top:4px; right:6px; font-size:10px; background:rgba(0,0,0,.5); color:#fff; padding:2px 6px; border-radius:10px; cursor:pointer; opacity:0; transition:all .18s; line-height:1; }
.bubble.right .copy-hint { background:rgba(255,255,255,.25); color:#fff; }
.image-file { display:flex; flex-direction:column; gap:4px; }
.thumb-wrapper { width:160px; height:110px; background:#f0f2f5; border:1px solid #d8dce1; border-radius:10px; overflow:hidden; display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative; }
.thumb-wrapper:after { content:'点击预览'; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; background:rgba(0,0,0,.35); opacity:0; transition:.25s; }
.thumb-wrapper:hover:after { opacity:1; }
.thumb { width:100%; height:100%; object-fit:cover; }
.thumb.placeholder { font-size:12px; color:#666; }
.file-info { font-size:12px; }
.tag { background:#e4eefc; padding:0 6px; border-radius:6px; font-weight:500; letter-spacing:.5px; }
.tag.file { background:#e3f9ec; }
.new-tip { position:absolute; bottom:70px; left:50%; transform:translateX(-50%); background:var(--bubble-blue); color:#fff; padding:7px 18px; border-radius:28px; font-size:12px; cursor:pointer; box-shadow:0 4px 14px -4px rgba(0,0,0,.25); z-index:10; }
.input-area { position:sticky; bottom:0; margin-top:10px; border-top:1px solid #e5e6eb; padding:10px 4px 8px; background:#fff; z-index:5; }
.input-area.shadow { box-shadow:0 -4px 10px -2px rgba(0,0,0,.08); }
.input-flex { display:flex; gap:10px; }
.chat-textarea :deep(textarea){ font-size:13px; line-height:1.5; }
.send-box { display:flex; flex-direction:column; gap:6px; align-items:flex-end; }
.btn-upload { width:100%; }
.inline-upload { display:block; }
.fade-scale-enter-active, .fade-scale-leave-active { transition:all .25s cubic-bezier(.4,.14,.3,1); }
.fade-scale-enter-from, .fade-scale-leave-to { opacity:0; transform:translateY(6px) scale(.96); }
.chat-image-preview :deep(.el-dialog__body){ padding:10px 20px; }
.image-preview-container { width:100%; display:flex; justify-content:center; align-items:center; min-height:50vh; }
.image-large { max-width:100%; max-height:70vh; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,.2); }
.image-loading { color:#666; }
/* 暗色模式适配 */
:global(.dark) .chat-wrapper .chat-card{background:linear-gradient(135deg,#1e2429 0%,#2a3036 100%);}
:global(.dark) .chat-wrapper .message-list{background:rgba(34,38,43,.7);border-color:#2f353a;}
:global(.dark) .chat-wrapper .input-area{background:#1f2529;border-top-color:#2d3338;}
:global(.dark) .chat-wrapper .bubble.left{background:linear-gradient(135deg,#2d3338 0%,#273138 100%);color:#d8dde3;}
:global(.dark) .chat-wrapper .bubble.right{background:linear-gradient(135deg,#1f5fa8 0%,#1673d6 100%);}
:global(.dark) .chat-wrapper .bubble.file{background:linear-gradient(135deg,#2d6a25 0%,#3d8d33 100%);}
:global(.dark) .chat-wrapper .bubble-meta{color:#85919c;}
:global(.dark) .chat-wrapper .thumb-wrapper{background:#253039;border-color:#334048;}
:global(.dark) .chat-wrapper .copy-hint{background:rgba(0,0,0,.45);}
@media (max-width: 768px){ .chat-card { height: calc(100vh - 170px); } .bubble { max-width:82%; } .avatar { width:32px; height:32px; border-radius:12px; font-size:11px; } }
</style>