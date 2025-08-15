// 统一的延迟 / 空闲调度工具
// 用法:
// import { useDeferredFetch } from '../composables/useDeferredFetch';
// const { schedule } = useDeferredFetch();
// schedule(() => apiCall(), { delay: 600, idle: true });

export function useDeferredFetch(globalOptions = {}) {
  const defaultOptions = { delay: 500, idle: true, timeout: 2000, ...globalOptions };

  function schedule(fn, options = {}) {
    const { delay, idle, timeout } = { ...defaultOptions, ...options };
    if (typeof window === 'undefined') {
      // SSR 直接执行
      return Promise.resolve().then(fn);
    }
    return new Promise(resolve => {
      const run = () => Promise.resolve(fn()).then(resolve);
      if (idle && 'requestIdleCallback' in window) {
        requestIdleCallback(() => run(), { timeout });
      } else {
        setTimeout(run, delay);
      }
    });
  }

  return { schedule };
}
