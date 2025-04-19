import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers";
export const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive",
    IS_READONLY = "__v_isReadonly",
}
export function reactive(raw) {
    //生成一个Proxy代理对象
    //用于知道何时调用 get() 方法来收集依赖，何时调用 set() 方法来触发依赖
    return createActiveObject(raw, mutableHandlers);
}
export function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
export function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function createActiveObject(raw: any, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}
export function isReactive(value) {
    return !!value[ReactiveFlags.IS_REACTIVE];
}
export function isReadonly(value) {
    return !!value[ReactiveFlags.IS_READONLY];
}
export function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}