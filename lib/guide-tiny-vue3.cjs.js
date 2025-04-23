'use strict';

const isObject = (val) => {
    return val !== null && typeof val === "object";
};

//利用Map来扩展更多的功能
const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        //key 表示 msg(也可以是$el, $data等等)
        //target 表示 ctx
        //从setupState中获取值
        //instance.setupState = setupResult
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
    };
    return component;
}
function setupComponent(instance) {
    //initProps
    //initSlots
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
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    //返回function 或者 Object
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}

function render(vnode, container) {
    //调用patch方法
    //便于后续递归处理
    patch(vnode, container);
}
function patch(vnode, container) {
    //处理组件
    //判断vnode虚拟节点是否为一个element,如果是element就应该处理element，否则处理component
    if (typeof vnode.type === "string") {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    //vnode -> element类型（div)
    const el = (vnode.el = document.createElement(vnode.type));
    //string + array
    const { children } = vnode;
    if (typeof children === "string") {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        //vnode
        mountChildren(vnode, el);
    }
    //props
    const { props } = vnode;
    for (const key in props) {
        const val = props[key];
        el.setAttribute(key, val);
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(initialVNode, container) {
    const instance = createComponentInstance(initialVNode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    //vnode -> patch
    //vnode -> element -> mountElement
    patch(subTree, container);
    //先用vnode.el把当前创建的虚拟节点存储下来
    //patch方法是一层一层从上至下递归遍历，当处理完成时，将所有根节点树的el属性赋值给当前组件vnode
    initialVNode.el = subTree.el;
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
    };
    return vnode;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            //先转换成虚拟节点vnode，后续所有的逻辑操作
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
