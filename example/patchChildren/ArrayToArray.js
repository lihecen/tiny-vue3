//旧的是 Array, 新的是 Array
import { ref, h } from "../../lib/guide-tiny-vue3.esm.js";
//1: 左侧的对比
// (a b) c
// (a b) d e
//const prevChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "C" }, "C"),
//];
//const nextChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "D" }, "D"),
//  h("p", { key: "E" }, "E"),
//];

//2: 右侧的对比
// a (b c)
// d e (b c)
//const prevChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "C" }, "C"),
//];
//const nextChildren = [
//  h("p", { key: "D" }, "D"),
//  h("p", { key: "E" }, "E"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "C" }, "C"),
//];

//3: 新的比旧的长 --创建
//左侧
// (a b)
// (a b) c
//const prevChildren = [h("p", { key: "A" }, "A"), h("p", { key: "B" }, "B")];
//const nextChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "C" }, "C"),
//  h("p", { key: "D" }, "D"),
//];

//右侧
// (a b)
// d c (a b)
//const prevChildren = [h("p", { key: "A" }, "A"), h("p", { key: "B" }, "B")];
//const nextChildren = [
//  h("p", { key: "D" }, "D"),
//  h("p", { key: "C" }, "C"),
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//];

//4: 旧的比新的长--删除旧节点
//左侧
// (a b) c
// (a b)
//const prevChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "C" }, "C"),
//];
//const nextChildren = [h("p", { key: "A" }, "A"), h("p", { key: "B" }, "B")];

//右侧
// a (b c)
// (b c)
//const prevChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "C" }, "C"),
//];
//const nextChildren = [h("p", { key: "B" }, "B"), h("p", { key: "C" }, "C")];

//5: 对比中间的部分
//在旧的节点中存在，在新的节点中不存在 -- 删除旧节点
//a b (c d) f g
//a b (e c) f g
//const prevChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "C", id: "c-prev" }, "C"),
//  h("p", { key: "D" }, "D"),
//  h("p", { key: "F" }, "F"),
//  h("p", { key: "G" }, "G"),
//];
//const nextChildren = [
//  h("P", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "E" }, "E"),
//  h("p", { key: "C", id: "c-next" }, "C"),
//  h("p", { key: "F" }, "F"),
//  h("p", { key: "G" }, "G"),
//];

//旧节点比新节点多 --多出来的部分直接删除
// a b (c e d) f g
// a b (e c) f g
//const prevChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "C", id: "c-prev" }, "C"),
//  h("p", { key: "E" }, "E"),
//  h("p", { key: "D" }, "D"),
//  h("p", { key: "F" }, "F"),
//  h("p", { key: "G" }, "G"),
//];
//const nextChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "E" }, "E"),
//  h("p", { key: "C", id: "c-next" }, "C"),
//  h("p", { key: "F" }, "F"),
//  h("p", { key: "G" }, "G"),
//];

//移动
//节点存在于新节点和旧节点中，只是位置发生改变
// a b (c d e) f g
// a b (e c d) f g
//const prevChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "C" }, "C"),
//  h("p", { key: "D" }, "D"),
//  h("p", { key: "E" }, "E"),
//  h("p", { key: "F" }, "F"),
//  h("p", { key: "G" }, "G"),
//];
//const nextChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "E" }, "E"),
//  h("p", { key: "C" }, "C"),
//  h("p", { key: "D" }, "D"),
//  h("p", { key: "F" }, "F"),
//  h("p", { key: "G" }, "G"),
//];

//创建新节点
//a b (c e) f g
//a b (e c d) f g
//const prevChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "C" }, "C"),
//  h("p", { key: "E" }, "E"),
//  h("p", { key: "F" }, "F"),
//  h("p", { key: "G" }, "G"),
//];
//const nextChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "E" }, "E"),
//  h("p", { key: "C" }, "C"),
//  h("p", { key: "D" }, "D"),
//  h("p", { key: "F" }, "F"),
//  h("p", { key: "G" }, "G"),
//];

//综合例子
//a b (c d e z) f g
//a b (d c y e) f g
const prevChildren = [
  h("p", { key: "A" }, "A"),
  h("p", { key: "B" }, "B"),
  h("p", { key: "C" }, "C"),
  h("p", { key: "D" }, "D"),
  h("p", { key: "E" }, "E"),
  h("p", { key: "Z" }, "Z"),
  h("p", { key: "F" }, "F"),
  h("p", { key: "G" }, "G"),
];
const nextChildren = [
  h("p", { key: "A" }, "A"),
  h("p", { key: "B" }, "B"),
  h("p", { key: "D" }, "D"),
  h("p", { key: "C" }, "C"),
  h("p", { key: "Y" }, "Y"),
  h("p", { key: "E" }, "E"),
  h("p", { key: "F" }, "F"),
  h("p", { key: "G" }, "G"),
];
export default {
  name: "ArrayToArray",
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;
    return {
      isChange,
    };
  },
  render() {
    const self = this;
    return self.isChange === true
      ? h("div", {}, nextChildren)
      : h("div", {}, prevChildren);
  },
};
