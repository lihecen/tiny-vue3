import { camelize, toHandlerKey } from "../shared";
export function emit(instance, event, ...args) {
  console.log("emit", event);
  //从 instance 实例对象的 props 查看是否有 event 回调函数
  //取出 props
  //eg: emit("add"), 只需要传入事件名字，不需要传入 instance 实例对象
  const { props } = instance;
  //TPP
  //先去写一个特定的行为，再去重构成通用的行为
  const handlerName = toHandlerKey(camelize(event));
  const handler = props[handlerName];
  handler && handler(...args);
}
