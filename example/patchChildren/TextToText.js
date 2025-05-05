//旧的是 Text, 新的是Text
import { h, ref } from "../../lib/guide-tiny-vue3.esm.js";
const prevChildren = "oldChild";
const nextChildren = "newChild";
export default {
  name: "TextToText",
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
