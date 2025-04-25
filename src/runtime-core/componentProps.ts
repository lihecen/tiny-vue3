export function initProps(instance, rawProps) {
  //将没有处理的 rawProps 赋值给 instance
  instance.props = rawProps || {};
}
