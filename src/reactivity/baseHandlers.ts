import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";
import { extend, isObject } from "../shared";
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
      //判断是不是is_reactive
      if(key === ReactiveFlags.IS_REACTIVE){
         return !isReadonly;
      }else if (key === ReactiveFlags.IS_READONLY) {
         return isReadonly;
      }
      const res = Reflect.get(target, key);
      if(shallow) {
         return res;
      }
      //判断res是否为object
      if(isObject(res)) {
         return isReadonly ? readonly(res) : reactive(res);
      }
      if(!isReadonly) {
         track(target, key);
      }
      return res;
   }
}
function createSetter() {
   return function set(target, key, value) {
      const res = Reflect.set(target, key, value);
      trigger(target, key);
      return res;
   }
}
export const mutableHandlers = {
    get,
    set
}
export const readonlyHandlers = {
   get: readonlyGet,
   set(target, key, value) {
      console.warn(`key: ${key} set 失败 因为 target 是 readonly`, target);
      return true;
   },
};
export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
   get: shallowReadonlyGet,
});