import { lexer, MarkedToken, Token } from "marked";
import typia from "typia";
import { codeBlock } from "./codeBlock";
import { heading } from "./heading";
import { isMarkedToken } from "./IsMarkedToken";
import { mideaSingle } from "./mediaSingle";
import { rule } from "./rule";
import { text } from "./text";
import { IJiraService, ListItemNode, ListNode } from "./type";

type JiraContentNode = IJiraService.TopLevelBlockNode | IJiraService.InlineNode | ListItemNode;

function _transform(options: { token: Token; convertParagraph?: boolean }): JiraContentNode | null {
  const target = isMarkedToken(options.token) ? options.token : null;
  if (target === null) {
    return null;
  }

  const targetMarkedToken = target as MarkedToken;
  if (targetMarkedToken.type === "blockquote") {
    const transformed = transform({ tokens: targetMarkedToken.tokens });
    if (typia.is<IJiraService.BlockquoteNode["content"]>(transformed)) {
      return { type: "blockquote", content: transformed } satisfies IJiraService.BlockquoteNode;
    }
    return null;
  } else if (targetMarkedToken.type === "br") {
    return null;
  } else if (targetMarkedToken.type === "code") {
    return codeBlock({ text: targetMarkedToken.text, language: targetMarkedToken.lang });
  } else if (targetMarkedToken.type === "codespan") {
    // Represents a string enclosed in backticks, indicating emphasized text.
    return text({ text: targetMarkedToken.text, marks: [{ type: "code" }] });
  } else if (targetMarkedToken.type === "def") {
    // 링크 정의에 해당하나 각 링크 별로 흩어지는 게 맞는 듯 하다.
    return null;
  } else if (targetMarkedToken.type === "del") {
    // Represents text that has been deleted or crossed out.
    return text({ text: targetMarkedToken.text, marks: [{ type: "strike" }] });
  } else if (targetMarkedToken.type === "em") {
    return text({ text: targetMarkedToken.text, marks: [{ type: "em" }] });
  } else if (targetMarkedToken.type === "escape") {
    return null;
  } else if (targetMarkedToken.type === "heading") {
    const inlines = transform({ tokens: targetMarkedToken.tokens });

    // narrow types to InlineNode[]
    if (typia.is<IJiraService.InlineNode[]>(inlines)) {
      const level = (targetMarkedToken.depth <= 6 ? targetMarkedToken.depth : 6) as 1 | 2 | 3 | 4 | 5 | 6;
      return heading({ content: inlines, level });
    }
    return null;
  } else if (targetMarkedToken.type === "hr") {
    return rule();
  } else if (targetMarkedToken.type === "html") {
    // TODO: how to handle HTML?
    return text({ text: targetMarkedToken.text });
  } else if (targetMarkedToken.type === "image") {
    return mideaSingle({ url: targetMarkedToken.href });
  } else if (targetMarkedToken.type === "link") {
    return text({
      text: targetMarkedToken.title ?? targetMarkedToken.text,
      marks: [{ type: "link", attrs: { href: targetMarkedToken.href } }],
    });
  } else if (targetMarkedToken.type === "list") {
    return {
      type: targetMarkedToken.ordered ? "orderedList" : "bulletList",
      content: targetMarkedToken.items
        .map((item) => {
          const transformed = transform({ tokens: item.tokens, convertParagraph: true });
          if (typia.is<ListItemNode["content"]>(transformed)) {
            return { type: "listItem", content: transformed } satisfies ListItemNode;
          }
          return null;
        })
        .filter((el) => el !== null),
    } satisfies ListNode;
  } else if (targetMarkedToken.type === "paragraph") {
    const transformed = transform({ tokens: targetMarkedToken.tokens });
    if (transformed.length === 1 && transformed.at(0)?.type === "mediaSingle") {
      return transformed[0] ?? null;
    } else if (typia.is<IJiraService.InlineNode[]>(transformed)) {
      return {
        type: "paragraph",
        content: transformed,
      } satisfies IJiraService.ParagraphNode;
    } else {
      return null;
    }
  } else if (targetMarkedToken.type === "space") {
    return {
      type: "paragraph",
      content: [
        {
          // 줄바꿈을 의미한다.
          type: "hardBreak",
          attrs: {
            text: "\n",
          },
        },
      ],
    } satisfies IJiraService.ParagraphNode;
  } else if (targetMarkedToken.type === "strong") {
    return {
      type: "text",
      text: targetMarkedToken.text,
      marks: [
        {
          type: "strong",
        },
      ],
    } satisfies IJiraService.Text;
  } else if (targetMarkedToken.type === "table") {
    return {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: targetMarkedToken.header.map((cell) => {
            const content = transform({
              tokens: cell.tokens,
              convertParagraph: true,
            });
            return {
              type: "tableHeader",
              content,
            } as any;
          }),
        } satisfies IJiraService.TableRowNode,
        ...targetMarkedToken.rows.map((cells): IJiraService.TableRowNode => {
          return {
            type: "tableRow",
            content: cells.map((cell) => {
              const transformed = transform({
                tokens: cell.tokens,
                convertParagraph: true,
              });
              if (typia.is<IJiraService.TableCellNode["content"]>(transformed)) {
                return {
                  type: "tableCell",
                  content: transformed,
                } satisfies IJiraService.TableCellNode;
              } else {
                console.warn(
                  JSON.stringify({
                    message: "tableRow, tableCell build failed.",
                    cell,
                    transformed,
                  })
                );

                return null;
              }
            }) as any[],
          };
        }),
      ],
    } satisfies IJiraService.TableNode;
  } else if (targetMarkedToken.type === "text") {
    if (options.convertParagraph) {
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: targetMarkedToken.text,
          },
        ],
      } satisfies IJiraService.ParagraphNode;
    } else {
      return {
        type: "text",
        text: targetMarkedToken.raw,
      } satisfies IJiraService.Text;
    }
  }

  return null;
}

function transform(options: { tokens: Token; convertParagraph?: boolean }): JiraContentNode[];
function transform(options: { tokens: Token[]; convertParagraph?: boolean }): JiraContentNode[];
function transform(options: {
  tokens: Token | Token[];
  convertParagraph?: boolean;
}): JiraContentNode[] | JiraContentNode | null {
  return (
    (options.tokens instanceof Array ? options.tokens : [options.tokens])
      ?.map((token) => _transform({ token, convertParagraph: options.convertParagraph }))
      .filter((el) => el !== null) ?? []
  );
}

export function markdownToJiraBlock(markdown: string): IJiraService.TopLevelBlockNode[] {
  if (markdown === "") {
    return [];
  }

  const tokensList = lexer(markdown);
  return transform({ tokens: tokensList }) as IJiraService.TopLevelBlockNode[];
}
