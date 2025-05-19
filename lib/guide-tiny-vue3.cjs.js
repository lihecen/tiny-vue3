'use strict';

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    //处理 children
    //赋值
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    //是否为 slots 类型 -> 1: 必须是组件 2: 必须是 children
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    //vnode
    //获取需要渲染的 slot
    const slot = slots[name];
    if (slot) {
        //判断 slot 是否为 function 类型
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const isString = (value) => typeof value === "string";
const hasChanged = (val, newValue) => {
    return !Object.is(val, newValue);
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
//add -> Add
//实现首字母大写
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
//add-foo -> addFoo
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
//加上 on
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        //当前状态
        this.active = true;
        this._fn = fn;
    }
    run() {
        activeEffect = this;
        //收集依赖
        if (!this.active) {
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
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
//依赖收集
//用 Map 数据结构，形成target -> key -> dep 查询方案
const targetMap = new Map();
function track(target, key) {
    if (!isTracking()) {
        return;
    }
    //target -> key -> dep
    let depsMap = targetMap.get(target);
    //解决初始化问题--key不存在
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    //依赖已经在dep中--需要判断
    if (dep.has(activeEffect)) {
        return;
    }
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
//触发依赖
function trigger(target, key) {
    //取出依赖并循环
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    //for循环
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    //调用fn
    const _effect = new ReactiveEffect(fn, options.scheduler);
    //options
    Object.assign(_effect, options);
    //extend
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        //判断是不是is_reactive
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        //判断res是否为object
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key: ${key} set 失败 因为 target 是 readonly`, target);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function reactive(raw) {
    //生成一个Proxy代理对象
    //用于知道何时调用 get() 方法来收集依赖，何时调用 set() 方法来触发依赖
    return createActiveObject(raw, mutableHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function createActiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`raw ${raw} 必须是一个对象`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        //如果value值为一个对象，则应该转化为reactive进行处理
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        //先修改value值再去触发依赖
        //hasChanged
        //对比的时候会不同，一个是新传入的对象，一个是转换成Proxy的对象
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    //判断是否为ref，如果是则返回ref.value, 否则直接返回ref
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    //get | set
    return new Proxy(objectWithRefs, {
        get(target, key) {
            //调用get()，如果age属性为ref，则返回age.value, 否则返回本身的value
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            //调用set(), 如果原来的值是ref属性并且新传入的值不是ref属性，则把新的值赋给原来的值，否则直接返回
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

function emit(instance, event, ...args) {
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

function initProps(instance, rawProps) {
    //将没有处理的 rawProps 赋值给 instance
    instance.props = rawProps || {};
}

//利用Map来扩展更多的功能
const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        //key 表示 msg(也可以是$el, $data等等)
        //target 表示 ctx
        //从setupState中获取值
        //instance.setupState = setupResult
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, children) {
    //检查是否需要 slots 处理
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        //slot
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        next: null,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    //initProps
    initProps(instance, instance.vnode.props);
    //initSlots
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    //初始化
    const Component = instance.type;
    //使用Proxy代理对象
    //ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        //在调用 setup 的时候获取 instance 的值
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            //将 emit 函数挂载到 instance 组件实例上
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    //返回function 或者 Object
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render;
}
//借助全局变量来获取 instance 的值
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

function provide(key, value) {
    var _a;
    //存
    //key value
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        //原型
        //将当前实例对象的原型指向父级
        //初始化只执行一次
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    var _a;
    //取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

//render
function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                //先转换成虚拟节点vnode，后续所有的逻辑操作
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

//创建任务队列
const queue = [];
const p = Promise.resolve();
let isFlushPending = false;
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
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

function createRenderer(options) {
    const { createElement, patchProps, insert, remove, setElementText } = options;
    function render(vnode, container) {
        //调用patch方法
        //便于后续递归处理
        patch(null, vnode, container, null, null);
    }
    //n1 --> 旧节点
    //n2 --> 新节点
    function patch(n1, n2, container, parentComponent, anchor) {
        //ShapeFlags: 可以标识当前的虚拟节点 vnode 有哪几种 Flags
        //element
        //处理组件
        //判断vnode虚拟节点是否为一个element,如果是element就应该处理element，否则处理component
        const { type, shapeFlag } = n2;
        //Fragment -> 只渲染 children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    //stateful_component
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            //初始化
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            //更新
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log("patchElement");
        console.log("n1", n1);
        console.log("n2", n2);
        //取出旧节点的属性
        const oldProps = n1.props || EMPTY_OBJ;
        //取出新节点的属性
        const newProps = n2.props || EMPTY_OBJ;
        //在下一次调用 patchElement 时 n2 变成 n1
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        compareProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        //判断旧的节点是否为数组形式
        const prevShapeFlag = n1.shapeFlag;
        const c1 = n1.children;
        //判断新的节点是否为文本节点
        const { shapeFlag } = n2;
        const c2 = n2.children;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                //将旧的节点清空
                unmountChildren(n1.children);
            }
            if (c1 !== c2) {
                //设置 text
                setElementText(container, c2);
            }
        }
        else {
            //新节点类型为数组 Array
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                //清空旧的 text 节点
                setElementText(container, "");
                //挂载新节点
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                //diff 算法
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        //i 指针表示新数组和旧数组第一个不同的地方
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        function isSomeVNodeType(n1, n2) {
            //如何比较当前的两个节点是否一致: 只需看 type 和 key
            return n1.type === n2.type && n1.key === n2.key;
        }
        //左侧
        while (i <= e1 && i <= e2) {
            //取出当前的新旧节点
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSomeVNodeType(n1, n2)) {
                //如果两个节点相同，则递归使用 patch 方法来比较 props 属性和 children
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        //右侧
        while (i <= e1 && i <= e2) {
            //取出当前的新旧节点
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        //新的比旧的多 -- 创建
        if (i > e1) {
            if (i <= e2) {
                //需要声明一下锚点
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            while (i <= e1) {
                remove(c1[i].el);
                i++;
            }
        }
        else {
            //中间对比
            let s1 = i;
            let s2 = i;
            //记录新节点的总数
            const toBePatched = e2 - s2 + 1;
            //记录当前处理的总数
            let patched = 0;
            //建立新节点的映射关系表 -- key: 新节点 value: 索引
            const keyToNewIndexMap = new Map();
            //建立新旧节点索引之间的映射关系表
            const newIndexToOldIndexMap = new Array(toBePatched);
            //记录是否需要移动
            let moved = false;
            //记录旧节点向新节点索引映射的最大值
            let maxNewIndexSoFar = 0;
            //初始化
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexMap[i] = 0;
            }
            for (let i = s2; i <= e2; i++) {
                //取出新的节点
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                //取出旧的节点
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    remove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        //判断当前的节点和旧节点是否一致
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    remove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        // 1 2 3
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        // 1 2 0
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            //生成最长递增序列
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            //j 表示最长递增序列的指针
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                //锚点是当前节点的下一个
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    //创建
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        insert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            //删除
            remove(el);
        }
    }
    function compareProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            //对新节点的属性进行遍历
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const newProp = newProps[key];
                //当当前的新旧属性不一致时，进行触发更新
                if (prevProp !== newProp) {
                    patchProps(el, key, prevProp, newProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                //对旧节点的属性进行遍历
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        patchProps(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        //canvas
        //new Element()
        //vnode -> element类型（div)
        const el = (vnode.el = createElement(vnode.type));
        //string + array
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            //text_children
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            //vnode
            //array_children
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        //props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            patchProps(el, key, null, val);
        }
        //canvas
        //el.x = 10
        //container.append(el);
        //addChild()
        insert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            //挂载
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            //更新
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        //取出组件实例对象
        const instance = (n2.component = n1.component);
        //判断组件是否需要更新
        if (shouldUpdateComponent(n1, n2)) {
            //将新的节点存储到下一个需要更新的节点
            instance.next = n2;
            //更新
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        //利用 effect 包裹 render 函数，当调用 render 函数时会触发依赖收集，同时会触发响应式对象的 get 操作，把当前的匿名函数收集起来
        //当响应式对象值发生改变时，会触发依赖，即会重新调用当前的匿名函数，又会调用 render 函数，生成全新的 subTree
        instance.update = effect(() => {
            if (!instance.isMounted) {
                //初始化
                console.log("init");
                const { proxy } = instance;
                //先存储之前的 subTree
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                //vnode -> patch
                //vnode -> element -> mountElement
                patch(null, subTree, container, instance, anchor);
                //先用vnode.el把当前创建的虚拟节点存储下来
                //patch方法是一层一层从上至下递归遍历，当处理完成时，将所有根节点树的el属性赋值给当前组件vnode
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                //更新
                console.log("update");
                //vnode 指向更新之前的虚拟节点，而 next 指向下一次更新的虚拟节点
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    //更新组件的属性
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                const subTree = instance.render.call(proxy, proxy);
                //取出之前的 subTree
                const prevTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                console.log("update -- scheduler");
                queueJobs(instance.update);
            },
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let j, u, v, c;
    const len = arr.length;
    for (let i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}
const r = getSequence([4, 2, 3, 1, 5]);
console.log(r);

function createElement(type) {
    return document.createElement(type);
}
function patchProps(el, key, prevVal, nextVal) {
    //注册事件的时机--> 只有key的规范为 on + Event name 时才是一个注册事件
    //封装 isOn 函数
    const isOn = (key) => /^on[A -Z]/.test(key);
    if (isOn(key)) {
        // onClick -> click
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
//anchor: 锚点，代表需要添加的位置
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    if (child) {
        const parent = child.parentNode;
        //如果当前节点存在父节点，则把当前节点删除掉
        if (parent) {
            parent.removeChild(child);
        }
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProps,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    createElementVNode: createVNode,
    createRenderer: createRenderer,
    createTextVNode: createTextVNode,
    getCurrentInstance: getCurrentInstance,
    h: h,
    inject: inject,
    nextTick: nextTick,
    provide: provide,
    registerRuntimeCompiler: registerRuntimeCompiler,
    renderSlots: renderSlots,
    toDisplayString: toDisplayString
});

//常量存储
const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
//将 Symbol 转化为 String
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(ast, context);
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(", ");
    push(`function ${functionName}(${signature}){`);
    push("return ");
    genNode(ast.codegenNode, context);
    push("}");
    return {
        code: context.code,
    };
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = "Vue";
    const aliasHelper = (s) => `${helperMapName[s]}: _${helperMapName[s]}`;
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinging}`);
    }
    push("\n");
    push("return ");
}
function createCodegenContext() {
    const context = {
        code: "",
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            //生成 text 类型
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullable([tag, props, children]), context);
    push(")");
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}
function genNullable(args) {
    return args.map((arg) => arg || "null");
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(")");
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}

function baseParse(content) {
    //创建全局上下文对象
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
function createParserContext(content) {
    return {
        source: content,
    };
}
//创建根节点
function createRoot(children) {
    return {
        children,
        type: 4 /* NodeTypes.ROOT */,
    };
}
function parseChildren(context, ancestors) {
    //需要返回数组形式
    const nodes = [];
    //需要判断当前什么时候需要解析插值
    //{{
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (s.startsWith("{{")) {
            node = parseInterpolation(context);
        }
        else if (s[0] === "<") {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
//需要判断何时循环结束
//<div>hi, {{message}}</div>
function isEnd(context, ancestors) {
    //当遇到结束标签</div> 时
    const s = context.source;
    //</div>
    if (s.startsWith("</")) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    //source 存在值
    return !s;
}
function parseText(context) {
    let endIndex = context.source.length;
    let endTokens = ["<", "{{"];
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    //获取当前内容
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content,
    };
}
function parseTextData(context, length) {
    //获取当前内容
    const content = context.source.slice(0, length);
    //删除
    advanceBy(context, length);
    return content;
}
function parseElement(context, ancestors) {
    const element = parserTag(context, 0 /* TagType.Start */);
    //收集 element
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    //收集完成之后弹出
    ancestors.pop();
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parserTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺少结束标签:${element.tag}`);
    }
    return element;
}
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith("</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parserTag(context, type) {
    //解析 tag
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    //删除所有处理完成的代码
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    //判断是否为结束标签
    if (type === 1 /* TagType.End */) {
        return;
    }
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
    };
}
function parseInterpolation(context) {
    //创建左右分隔符
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    //获取右边的索引值
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    advanceBy(context, openDelimiter.length);
    //利用右边的索引值 closeIndex 计算出 message 的长度
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawContent = parseTextData(context, rawContentLength);
    const content = rawContent.trim();
    //将处理完的信息删除
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content: content,
        },
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}

function transform(root, options = {}) {
    //创建上下文对象
    const context = createTransformContext(root, options);
    //遍历 ast 抽象语法树
    //DFS深度优先遍历
    traverseNode(root, context);
    //root.codegenNode
    //希望在 root 节点中实现属性
    createRootCodegen(root);
    //将 helpers 赋值到根节点 root
    root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
function traverseNode(node, context) {
    //修改 text content
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit) {
            exitFns.push(onExit);
        }
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            //中间处理层
            //tag
            const vnodeTag = `'${node.tag}'`;
            //props
            let vnodeProps;
            //children
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    if (node) {
        return (node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */);
    }
}

function transformText(node) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            //创建容器
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    //搜索下一个节点
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                //初始化
                                currentContainer = children[i] = {
                                    //复合类型
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

//tiny-vue3出口
function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

exports.createApp = createApp;
exports.createElementVNode = createVNode;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.nextTick = nextTick;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.registerRuntimeCompiler = registerRuntimeCompiler;
exports.renderSlots = renderSlots;
exports.toDisplayString = toDisplayString;
