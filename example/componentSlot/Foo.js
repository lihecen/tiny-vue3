import { h, renderSlots } from "../../lib/guide-tiny-vue3.esm.js";
export const Foo = {
  setup() {
    return {};
  },
  render() {
    const foo = h("div", {}, "foo");
    //Foo.vnode.children
    //在渲染的时候必须是虚拟节点 vnode，如果外部传入的是一个数组形式的，则需要引入 h 函数进行优化
    //可以封装成 renderSlots，方便提高可读性
    //具名插槽
    //指定渲染的位置 --> 1: 获取要渲染的元素 2: 获取渲染的位置
    //作用域插槽
    const age = 18;
    return h("div", {}, [
      renderSlots(this.$slots, "header", { age }),
      foo,
      renderSlots(this.$slots, "footer"),
    ]);
  },
};
