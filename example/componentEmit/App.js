import { h } from "../../lib/guide-tiny-vue3.esm.js";
import { Foo } from "./Foo.js";
export const App = {
  name: "App",
  render() {
    //emit
    return h("div", {}, [
      h("div", {}, "App"),
      h(Foo, {
        //on + event
        onAdd(a, b) {
          console.log("onAdd", a, b);
        },
        onAddFoo() {
          console.log("onAddFoo");
        },
      }),
    ]);
  },
  setup() {
    return {};
  },
};
