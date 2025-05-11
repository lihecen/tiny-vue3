import { NodeTypes } from "./ast";
const enum TagType {
  Start,
  End,
}
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
  const s = context.source;
  if (s.startsWith("{{")) {
    node = parseInterpolation(context);
  } else if (s[0] === "<") {
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context);
    }
  }
  if (!node) {
    node = parseText(context);
  }
  nodes.push(node);
  return nodes;
}

function parseText(context: any) {
  //获取当前内容
  const content = parseTextData(context, context.source.length);
  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(context: any, length) {
  //获取当前内容
  const content = context.source.slice(0, length);
  //删除
  advanceBy(context, length);
  return content;
}

function parseElement(context: any) {
  const element = parserTag(context, TagType.Start);
  parserTag(context, TagType.End);
  return element;
}

function parserTag(context: any, type: TagType) {
  //解析 tag
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];
  //删除所有处理完成的代码
  advanceBy(context, match[0].length);
  advanceBy(context, 1);
  //判断是否为结束标签
  if (type === TagType.End) {
    return;
  }
  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
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
  const rawContent = parseTextData(context, rawContentLength);
  const content = rawContent.trim();
  //将处理完的信息删除
  advanceBy(context, closeDelimiter.length);
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
