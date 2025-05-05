import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";
export function createRenderer(options) {
  const { createElement, patchProps, insert, remove, setElementText } = options;
  function render(vnode, container) {
    //调用patch方法
    //便于后续递归处理
    patch(null, vnode, container, null);
  }
  //n1 --> 旧节点
  //n2 --> 新节点
  function patch(n1, n2, container, parentComponent) {
    //ShapeFlags: 可以标识当前的虚拟节点 vnode 有哪几种 Flags
    //element
    //处理组件
    //判断vnode虚拟节点是否为一个element,如果是element就应该处理element，否则处理component
    const { type, shapeFlag } = n2;
    //Fragment -> 只渲染 children
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          //stateful_component
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }
  function processText(n1, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2.children, container, parentComponent);
  }

  function processElement(n1, n2: any, container: any, parentComponent) {
    if (!n1) {
      //初始化
      mountElement(n2, container, parentComponent);
    } else {
      //更新
      patchElement(n1, n2, container, parentComponent);
    }
  }

  function patchElement(n1, n2, container, parentComponent) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);
    //取出旧节点的属性
    const oldProps = n1.props || EMPTY_OBJ;
    //取出新节点的属性
    const newProps = n2.props || EMPTY_OBJ;
    //在下一次调用 patchElement 时 n2 变成 n1
    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el, parentComponent);
    compareProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, container, parentComponent) {
    //判断旧的节点是否为数组形式
    const prevShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    //判断新的节点是否为文本节点
    const { shapeFlag } = n2;
    const c2 = n2.children;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        //将旧的节点清空
        unmountChildren(n1.children);
      }
      if (c1 !== c2) {
        //设置 text
        setElementText(container, c2);
      }
    } else {
      //新节点类型为数组 Array
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        //清空旧的 text 节点
        setElementText(container, "");
        //挂载新节点
        mountChildren(c2, container, parentComponent);
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

  function mountElement(vnode: any, container: any, parentComponent) {
    //canvas
    //new Element()
    //vnode -> element类型（div)
    const el = (vnode.el = createElement(vnode.type));
    //string + array
    const { children, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //text_children
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //vnode
      //array_children
      mountChildren(vnode.children, el, parentComponent);
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
    insert(el, container);
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent);
    });
  }

  function processComponent(n1, n2: any, container: any, parentComponent) {
    mountComponent(n2, container, parentComponent);
  }

  function mountComponent(initialVNode: any, container, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance: any, initialVNode, container) {
    //利用 effect 包裹 render 函数，当调用 render 函数时会触发依赖收集，同时会触发响应式对象的 get 操作，把当前的匿名函数收集起来
    //当响应式对象值发生改变时，会触发依赖，即会重新调用当前的匿名函数，又会调用 render 函数，生成全新的 subTree
    effect(() => {
      if (!instance.isMounted) {
        //初始化
        console.log("init");
        const { proxy } = instance;
        //先存储之前的 subTree
        const subTree = (instance.subTree = instance.render.call(proxy));
        //vnode -> patch
        //vnode -> element -> mountElement
        patch(null, subTree, container, instance);

        //先用vnode.el把当前创建的虚拟节点存储下来
        //patch方法是一层一层从上至下递归遍历，当处理完成时，将所有根节点树的el属性赋值给当前组件vnode
        initialVNode.el = subTree.el;
        instance.isMounted = true;
      } else {
        //更新
        console.log("update");
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        //取出之前的 subTree
        const prevTree = instance.subTree;
        instance.subTree = subTree;
        patch(prevTree, subTree, container, instance);
      }
    });
  }
  return {
    createApp: createAppAPI(render),
  };
}
