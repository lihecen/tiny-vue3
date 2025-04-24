//利用位运算的思想
//在标识当前的虚拟节点 vnode 有哪几种 Flags的时候，规定 0 为不是，1为是
//枚举
export const enum ShapeFlags {
  ELEMENT = 1, //0001
  STATEFUL_COMPONENT = 1 << 1, //0010
  TEXT_CHILDREN = 1 << 2, //0100
  ARRAY_CHILDREN = 1 << 3, //1000
}
