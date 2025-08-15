# 清理任务追踪 (自动生成)

## 已执行

- AdminDashboard 迁移到 Pinia stores (admin / presence / auth) (可能仍需实现 addUser/updateApiKey/deleteUser 方法于 adminStore)
- ClipboardHistoryImproved 瘦身为纯展示/交互容器，数据由 clipboardStore 提供
- ClipboardList 绑定 Pinia store 双向分页与搜索
- MainView 调整首加载逻辑
- AppHeader 使用 script setup + authStore
- 标记 useClipboard 过时
- 移除 Deprecated ClipboardHistory 内容

## 待办

1. 彻底删除 legacy store/index.js 与 services/api.js, services/socket.js (确认无引用后物理删除)
2. 将 AdminDashboard 中用户/日志/活跃用户操作迁移到 adminStore/presenceStore (addUser, updateApiKey, deleteUser) 并删除组件内残存逻辑
3. 在 adminStore 中实现: updateApiKey(id,newKey, apiKey) 若后端支持
4. presenceStore: 若需要轮询或 socket 增量更新, 添加对应动作
5. clipboardStore: 整合搜索/分页参数到 load 返回结构统一
6. 移除 useClipboard.js 文件 (当前已安全空实现)
7. 验证所有组件不再引用 services/api.js / socket.js / legacy store
8. 引入错误统一处理 (request 拦截) / 消息提示封装
9. 添加类型 (JSDoc 或迁移 TS)
10. 优化预览事件链 (ClipboardList -> 全局预览 dialog composable)
