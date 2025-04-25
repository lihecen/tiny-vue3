import { h } from "../../lib/guide-tiny-vue3.esm.js";
import { Foo } from "./Foo.js";
window.self = null;
export const App = {
  name: "App",
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"],
        onClick() {
          console.log("click");
        },
        onMousedown() {
          console.log("mousedown");
        },
      },
      [h("div", {}, "hi " + this.msg), h(Foo, { count: 1 })]
      //this.$el: 返回根节点 root element
      //"hi, " + this.msg
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
