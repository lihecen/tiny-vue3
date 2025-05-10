//创建任务队列
const queue: any[] = [];
const p = Promise.resolve();
let isFlushPending = false;
export function nextTick(fn) {
  return fn ? p.then(fn) : p;
}
export function queueJobs(job) {
  if (!queue.includes(job)) {
    //在同步任务中添加 job
    queue.push(job);
  }
  //在异步任务中取出 job并执行
  queueFlush();
}

//只执行一次
function queueFlush() {
  //如果 isFlushPending 为 true，直接返回
  if (isFlushPending) {
    return;
  }
  isFlushPending = true;
  nextTick(flushJobs);
}

function flushJobs() {
  isFlushPending = false;
  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}
