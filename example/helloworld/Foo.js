import { h } from "../../lib/guide-tiny-vue3.esm.js";
export const Foo = {
  setup(props) {
    //props.count
    console.log(props);
    //props是只读的（shallowReadonly）
    props.count++;
    console.log(props);
  },
  render() {
    return h("div", {}, "foo: " + this.count);
  },
};
