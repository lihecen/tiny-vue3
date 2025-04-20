import { extend } from "../shared";
let activeEffect;
let shouldTrack;
export class ReactiveEffect {
    private _fn: any;
    deps = [];
    onStop?: () => void;
    //当前状态
    active = true;
    constructor(fn, public scheduler?) {
        this._fn = fn;
    }
    run() {
        activeEffect = this;
        //收集依赖
        if(!this.active) {
            return this._fn();
        }
        //应该收集
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();
        //重置
        shouldTrack = false;
        return result;
    }
    stop() {
       //外部用户多次调用effect的时候deps也只会清空一次
       if(this.active) {
          cleanupEffect(this);
          if(this.onStop) {
            this.onStop();
          }
          this.active = false;
       }
    }
}

function cleanupEffect(effect) {
   effect.deps.forEach((dep: any) => {
     dep.delete(effect);
   });
   effect.deps.length = 0;
}
//依赖收集
//用 Map 数据结构，形成target -> key -> dep 查询方案
const targetMap = new Map();
export function track(target, key) {
    if(!isTracking()) {
        return;
    }
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
    trackEffects(dep);
}

export function trackEffects(dep) {
    //依赖已经在dep中--需要判断
    if(dep.has(activeEffect)) {
        return;
    }
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}

export function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}

//触发依赖
export function trigger(target, key) {
   //取出依赖并循环
   let depsMap = targetMap.get(target);
   let dep = depsMap.get(key);
   triggerEffects(dep);
} 

export function triggerEffects(dep) {
    //for循环
   for(const effect of dep) {
    if(effect.scheduler) {
        effect.scheduler();
    } else {
        effect.run();
    }
   }
}

export function effect(fn, options: any = {}) {
    //调用fn
    const _effect = new ReactiveEffect(fn, options.scheduler);
    //options
    Object.assign(_effect, options);
    //extend
    extend(_effect, options);
    _effect.run();
    const runner: any = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

export function stop(runner) {
    runner.effect.stop();
}