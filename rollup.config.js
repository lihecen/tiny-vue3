import typescript from "@rollup/plugin-typescript";
export default {
  input: "./src/index.ts",
  output: [
    //cjs -> common.js
    //esm
    {
      format: "cjs",
      file: "lib/guide-tiny-vue3.cjs.js",
    },
    {
      format: "es",
      file: "lib/guide-tiny-vue3.esm.js",
    },
  ],
  plugins: [typescript()],
};
