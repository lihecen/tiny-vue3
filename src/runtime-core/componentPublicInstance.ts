import { hasOwn } from "../shared";
//利用Map来扩展更多的功能
const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
};
export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    //key 表示 msg(也可以是$el, $data等等)
    //target 表示 ctx
    //从setupState中获取值
    //instance.setupState = setupResult
    const { setupState, props } = instance;
    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
