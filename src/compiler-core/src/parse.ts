import { NodeTypes } from "./ast";
export function baseParse(content: string) {
  //创建全局上下文对象
  const context = createParserContext(content);
  return createRoot(parseChildren(context));
}
function createParserContext(content: string): any {
  return {
    source: content,
  };
}
//创建根节点
function createRoot(children) {
  return {
    children,
  };
}
function parseChildren(context) {
  //需要返回数组形式
  const nodes: any = [];
  //需要判断当前什么时候需要解析插值
  //{{
  let node;
  if (context.source.startsWith("{{")) {
    node = parseInterpolation(context);
  }
  nodes.push(node);
  return nodes;
}
function parseInterpolation(context) {
  //创建左右分隔符
  const openDelimiter = "{{";
  const closeDelimiter = "}}";
  //获取右边的索引值
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );
  advanceBy(context, openDelimiter.length);
  //利用右边的索引值 closeIndex 计算出 message 的长度
  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = context.source.slice(0, rawContentLength);
  const content = rawContent.trim();
  //将处理完的信息删除
  advanceBy(context, rawContentLength + closeDelimiter.length);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}
