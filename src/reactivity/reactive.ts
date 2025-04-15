import { track, trigger } from "./effect";
export function reactive(raw) {
    //生成一个Proxy代理对象
    //用于知道何时调用 get() 方法来收集依赖，何时调用 set() 方法来触发依赖
    return new Proxy(raw, {
       get(target, key) {
          //target: {foo: 1} 
          //key: foo
          const res = Reflect.get(target, key);
          //依赖收集
          track(target, key);
          return res;
       },
       set(target, key, value) {
          const res = Reflect.set(target, key, value);
          //触发依赖
          trigger(target, key);
          return res;
       }
    });
}