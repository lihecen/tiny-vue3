import { h, getCurrentInstance } from "../../lib/guide-tiny-vue3.esm.js";
export const Foo = {
  name: "Foo",
  setup() {
    const instance = getCurrentInstance();
    console.log("Foo: ", instance);
    return {};
  },
  render() {
    return h("div", {}, "foo");
  },
};
