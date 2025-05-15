import { NodeTypes } from "./ast";
const enum TagType {
  Start,
  End,
}
export function baseParse(content: string) {
  //创建全局上下文对象
  const context = createParserContext(content);
  return createRoot(parseChildren(context, []));
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
    type: NodeTypes.ROOT,
  };
}
function parseChildren(context, ancestors) {
  //需要返回数组形式
  const nodes: any = [];
  //需要判断当前什么时候需要解析插值
  //{{
  while (!isEnd(context, ancestors)) {
    let node;
    const s = context.source;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors);
      }
    }
    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}

//需要判断何时循环结束
//<div>hi, {{message}}</div>
function isEnd(context, ancestors) {
  //当遇到结束标签</div> 时
  const s = context.source;
  //</div>
  if (s.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(s, tag)) {
        return true;
      }
    }
  }
  //source 存在值
  return !s;
}

function parseText(context: any) {
  let endIndex = context.source.length;
  let endTokens = ["<", "{{"];
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }
  //获取当前内容
  const content = parseTextData(context, endIndex);
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

function parseElement(context: any, ancestors) {
  const element: any = parserTag(context, TagType.Start);
  //收集 element
  ancestors.push(element);
  element.children = parseChildren(context, ancestors);
  //收集完成之后弹出
  ancestors.pop();
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parserTag(context, TagType.End);
  } else {
    throw new Error(`缺少结束标签:${element.tag}`);
  }
  return element;
}

function startsWithEndTagOpen(source, tag) {
  return (
    source.startsWith("</") &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
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
