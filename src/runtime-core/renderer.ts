import { isObject } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component";
export function render(vnode, container) {
  //调用patch方法
  //便于后续递归处理
  patch(vnode, container);
}

function patch(vnode, container) {
  //处理组件
  //判断vnode虚拟节点是否为一个element,如果是element就应该处理element，否则处理component
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container);
  }
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

function mountElement(vnode: any, container: any) {
  //vnode -> element类型（div)
  const el = (vnode.el = document.createElement(vnode.type));
  //string + array
  const { children } = vnode;
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
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

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}

function mountComponent(initialVNode: any, container) {
  const instance = createComponentInstance(initialVNode);
  setupComponent(instance);
  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance: any, initialVNode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  //vnode -> patch
  //vnode -> element -> mountElement
  patch(subTree, container);

  //先用vnode.el把当前创建的虚拟节点存储下来
  //patch方法是一层一层从上至下递归遍历，当处理完成时，将所有根节点树的el属性赋值给当前组件vnode
  initialVNode.el = subTree.el;
}
