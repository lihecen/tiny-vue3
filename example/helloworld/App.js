import { h } from "../../lib/guide-tiny-vue3.esm.js";
window.self = null;
export const App = {
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"],
      },
      //this.$el: 返回根节点 root element
      "hi, " + this.msg
      //[
      //  Array
      //  h("p", { class: "red" }, "hi"),
      //  h("p", { class: "blue" }, "tiny-vue3"),
      //]
    );
  },
  setup() {
    return {
      msg: "tiny-vue3",
    };
  },
};
