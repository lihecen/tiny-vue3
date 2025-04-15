class ReactiveEffect {
    private _fn: any;
    constructor(fn) {
        this._fn = fn;
    }
    run() {
        activeEffect = this;
        this._fn();
    }
}
//依赖收集
//用 Map 数据结构，形成target -> key -> dep 查询方案
const targetMap = new Map();
export function track(target, key) {
    //target -> key -> dep
    let depsMap = targetMap.get(target);
    //解决初始化问题--key不存在
    if(!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if(!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    dep.add(activeEffect);
}

//触发依赖
export function trigger(target, key) {
   //取出依赖并循环
   let depsMap = targetMap.get(target);
   let dep = depsMap.get(key);
   //for循环
   for(const effect of dep) {
    effect.run();
   }
} 


let activeEffect;
export function effect(fn) {
    //调用fn
    const _effect = new ReactiveEffect(fn);
    _effect.run();
}