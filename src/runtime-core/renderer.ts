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
  const el = document.createElement(vnode.type);
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

function mountComponent(vnode: any, container) {
  const instance = createComponentInstance(vnode);
  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance: any, container) {
  const subTree = instance.render();
  //vnode -> patch
  //vnode -> element -> mountElement
  patch(subTree, container);
}
