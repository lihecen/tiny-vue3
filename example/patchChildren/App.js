import { h } from "../../lib/guide-tiny-vue3.esm.js";
//import ArrayToText from "./ArrayToText.js";
//import TextToText from "./TextToText.js";
//import TextToArray from "./TextToArray.js";
import ArrayToArray from "./ArrayToArray.js";
export default {
  name: "App",
  setup() {},
  render() {
    return h("div", { tId: 1 }, [
      h("p", {}, "主页"),
      //旧的是 Array，新的是 Text
      //h(ArrayToText),
      //旧的是 Text，新的是 Text
      //h(TextToText),
      //旧的是 Text, 新的是 Array
      //h(TextToArray),
      //旧的是 Array, 新的是 Array
      h(ArrayToArray),
    ]);
  },
};
