import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";
export function render(vnode, container) {
  //调用patch方法
  //便于后续递归处理
  patch(vnode, container, null);
}

function patch(vnode, container, parentComponent) {
  //ShapeFlags: 可以标识当前的虚拟节点 vnode 有哪几种 Flags
  //element
  //处理组件
  //判断vnode虚拟节点是否为一个element,如果是element就应该处理element，否则处理component
  const { type, shapeFlag } = vnode;
  //Fragment -> 只渲染 children
  switch (type) {
    case Fragment:
      processFragment(vnode, container, parentComponent);
      break;
    case Text:
      processText(vnode, container);
      break;
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container, parentComponent);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        //stateful_component
        processComponent(vnode, container, parentComponent);
      }
      break;
  }
}
function processText(vnode: any, container: any) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
}

function processFragment(vnode: any, container: any, parentComponent) {
  mountChildren(vnode, container, parentComponent);
}

function processElement(vnode: any, container: any, parentComponent) {
  mountElement(vnode, container, parentComponent);
}

function mountElement(vnode: any, container: any, parentComponent) {
  //vnode -> element类型（div)
  const el = (vnode.el = document.createElement(vnode.type));
  //string + array
  const { children, shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    //text_children
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    //vnode
    //array_children
    mountChildren(vnode, el, parentComponent);
  }
  //props
  const { props } = vnode;
  for (const key in props) {
    const val = props[key];
    console.log(key);
    //注册事件的时机--> 只有key的规范为 on + Event name 时才是一个注册事件
    //封装 isOn 函数
    const isOn = (key: string) => /^on[A -Z]/.test(key);
    if (isOn(key)) {
      //onClick -> click
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
  }
  container.append(el);
}

function mountChildren(vnode, container, parentComponent) {
  vnode.children.forEach((v) => {
    patch(v, container, parentComponent);
  });
}

function processComponent(vnode: any, container: any, parentComponent) {
  mountComponent(vnode, container, parentComponent);
}

function mountComponent(initialVNode: any, container, parentComponent) {
  const instance = createComponentInstance(initialVNode, parentComponent);
  setupComponent(instance);
  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance: any, initialVNode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  //vnode -> patch
  //vnode -> element -> mountElement
  patch(subTree, container, instance);

  //先用vnode.el把当前创建的虚拟节点存储下来
  //patch方法是一层一层从上至下递归遍历，当处理完成时，将所有根节点树的el属性赋值给当前组件vnode
  initialVNode.el = subTree.el;
}
