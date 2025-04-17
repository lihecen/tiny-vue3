import { extend } from "./shared";
class ReactiveEffect {
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
        return this._fn();
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
    if(!activeEffect) {
        return;
    }
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}

//触发依赖
export function trigger(target, key) {
   //取出依赖并循环
   let depsMap = targetMap.get(target);
   let dep = depsMap.get(key);
   //for循环
   for(const effect of dep) {
    if(effect.scheduler) {
        effect.scheduler();
    } else {
        effect.run();
    }
   }
} 


let activeEffect;
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