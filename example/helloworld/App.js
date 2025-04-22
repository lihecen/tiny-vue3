import { h } from "../../lib/guide-tiny-vue3.esm.js";
export const App = {
  render() {
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"],
      },
      "hi, " + this.msg
      //[
      //Array
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
