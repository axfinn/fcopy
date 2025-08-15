# 已移除与待移除清单

## 已移除/替换

- services/api.js (功能迁移至 apis/*)
- services/socket.js (迁移至 core/socket/socketService.js)
- components/ClipboardHistory.vue (空壳占位, 已清理)
- composables/useClipboard.js (标记弃用, 将彻底删除)

## 待物理删除 (确认无引用后)

- store/index.js (legacy store)
- composables/useClipboard.js (下一步删除)

## 注意

删除前请再次全局搜索引用，确保没有遗漏。
