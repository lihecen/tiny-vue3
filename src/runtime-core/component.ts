export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
  };
  return component;
}

export function setupComponent(instance) {
  //initProps
  //initSlots
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  //初始化
  const Component = instance.type;
  //使用Proxy代理对象
  //ctx
  instance.proxy = new Proxy(
    {},
    {
      get(target, key) {
        //key 表示 msg
        //target 表示 ctx
        //从setupState中获取值
        //instance.setupState = setupResult
        const { setupState } = instance;
        if (key in setupState) {
          return setupState[key];
        }
      },
    }
  );
  const { setup } = Component;
  if (setup) {
    const setupResult = setup();
    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult: any) {
  //返回function 或者 Object
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }
  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;
  instance.render = Component.render;
}
