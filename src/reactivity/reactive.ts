import { mutableHandlers, readonlyHandlers } from "./baseHandlers";
import { track, trigger } from "./effect";
export function reactive(raw) {
    //生成一个Proxy代理对象
    //用于知道何时调用 get() 方法来收集依赖，何时调用 set() 方法来触发依赖
    return createActiveObject(raw, mutableHandlers);
}
export function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function createActiveObject(raw: any, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}