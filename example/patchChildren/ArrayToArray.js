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
//a (b c)
//d e (b c)
//const prevChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "C" }, "C"),
//];
//const nextChildren = [
//  h("P", { key: "D" }, "D"),
//  h("p", { key: "E" }, "E"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "C" }, "C"),
//];

//3: 新节点比旧节点长 --> 创建新的节点
//左侧
// (a b)
// (a b) c d
//const prevChildren = [h("p", { key: "A" }, "A"), h("p", { key: "B" }, "B")];
//const nextChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "C" }, "C"),
//  h("p", { key: "D" }, "D"),
//];

//右侧
// (a b)
// c (a b)
//const prevChildren = [h("p", { key: "A" }, "A"), h("p", { key: "B" }, "B")];
//const nextChildren = [
//  h("p", { key: "C" }, "C"),
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//];

//4: 旧节点比新节点长 --> 删除旧的节点
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
//a (b c)
// (b c)
//const prevChildren = [
//  h("p", { key: "A" }, "A"),
//  h("p", { key: "B" }, "B"),
//  h("p", { key: "C" }, "C"),
//];
//const nextChildren = [h("p", { key: "B" }, "B"), h("p", { key: "C" }, "C")];
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
