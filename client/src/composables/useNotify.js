import { ElMessage } from 'element-plus';

export function useNotify(){
  const success = (msg)=> ElMessage.success(msg);
  const error = (msg)=> ElMessage.error(msg);
  const info = (msg)=> ElMessage.info(msg);
  return { success, error, info };
}
