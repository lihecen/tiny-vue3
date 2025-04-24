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
    //ShapeFlags: 可以标识当前的虚拟节点 vnode 有哪几种 Flags
    //element
    //处理组件
    //判断vnode虚拟节点是否为一个element,如果是element就应该处理element，否则处理component
    const { shapeFlag } = vnode;
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        //stateful_component
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
    const { children, shapeFlag } = vnode;
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        //text_children
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        //vnode
        //array_children
        mountChildren(vnode, el);
    }
    //props
    const { props } = vnode;
    for (const key in props) {
        const val = props[key];
        console.log(key);
        //注册事件的时机--> 只有key的规范为 on + Event name 时才是一个注册事件
        //封装 isOn 函数
        const isOn = (key) => /^on[A -Z]/.test(key);
        if (isOn(key)) {
            //onClick -> click
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
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
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
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

export { createApp, h };
