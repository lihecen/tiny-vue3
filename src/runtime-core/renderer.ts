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
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          //stateful_component
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }
  function processText(n1, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      //初始化
      mountElement(n2, container, parentComponent, anchor);
    } else {
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
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        //diff 算法
        //Array --> Array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    const l2 = c2.length;
    //i 指针表示新数组与旧数组第一个不同的地方
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    function isSomeVNodeType(n1, n2) {
      //根据 type 和 key 来决定当前两个虚拟节点是否一致
      return n1.type === n2.type && n1.key === n2.key;
    }
    //当 i 指针不越界时，即 i 指针 小于等于 e1 和 e2 时
    //左侧
    while (i <= e1 && i <= e2) {
      //取出当前新旧节点
      const n1 = c1[i];
      const n2 = c2[i];
      //判断是否一致
      if (isSomeVNodeType(n1, n2)) {
        //再次调用 patch 进行对比，防止 props 和 children 不一致
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      // i 指针向后移动一位
      i++;
    }
    //右侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    //新的比旧的多
    if (i > e1) {
      if (i <= e2) {
        //需要声明一下锚点
        const nextPos = e2 + 1;
        const anchor = nextPos > l2 ? null : c2[nextPos].el;
        //有可能后面有多个节点
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        remove(c1[i].el);
        i++;
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

  function mountElement(vnode: any, container: any, parentComponent, anchor) {
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

  function processComponent(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountComponent(n2, container, parentComponent, anchor);
  }

  function mountComponent(
    initialVNode: any,
    container,
    parentComponent,
    anchor
  ) {
    const instance = createComponentInstance(initialVNode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  function setupRenderEffect(instance: any, initialVNode, container, anchor) {
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
        patch(null, subTree, container, instance, anchor);

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
        patch(prevTree, subTree, container, instance, anchor);
      }
    });
  }
  return {
    createApp: createAppAPI(render),
  };
}
