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

  switch (target.type) {
    case "blockquote":{
      const transformed = transform({ tokens: target.tokens });
      if (typia.is<IJiraService.BlockquoteNode["content"]>(transformed)) {
        return { type: "blockquote", content: transformed } satisfies IJiraService.BlockquoteNode;
      }
      return null;
    }
    case "br": {
      return null;
    }
    case "code": {
      return codeBlock({ text: target.text, language: target.lang });
    }
    case "codespan": {
      // Represents a string enclosed in backticks, indicating emphasized text.
      return text({ text: target.text, marks: [{ type: "code" }] });
    }
    case "def": {
    // 링크 정의에 해당하나 각 링크 별로 흩어지는 게 맞는 듯 하다.
      return null;
    }
    case "del": {
      // Represents text that has been deleted or crossed out.
      return text({ text: target.text, marks: [{ type: "strike" }] });
    }
    case "em": {
      return text({ text: target.text, marks: [{ type: "em" }] });
    }
    case "escape": {
      // Represents an escape character, which is used to escape special characters.
      return null;
    }
    case "heading": {
      const inlines = transform({ tokens: target.tokens });
      if (typia.is<IJiraService.InlineNode[]>(inlines)) {
        const level = (target.depth <= 6 ? target.depth : 6) as 1 | 2 | 3 | 4 | 5 | 6;
        return heading({ content: inlines, level });
      }
      return null;
    }
    case "hr": {
      return rule();
    }
    case "html": {
      // TODO: how to handle HTML?
      return text({ text: target.text });
    }
    case "image": {
      return mideaSingle({ url: target.href });
    }
    case "link": {
      return text({
        text: target.title ?? target.text,
        marks: [{ type: "link", attrs: { href: target.href } }],
      });
    }
    case "list": {
      return {
        type: target.ordered ? "orderedList" : "bulletList",
        content: target.items.map((item) => {
          const transformed = transform({ tokens: item.tokens, convertParagraph: true })
          if (typia.is<ListItemNode["content"]>(transformed)) {
            return { type: "listItem", content: transformed } satisfies ListItemNode;
          }
          return null;
        }).filter((el) => el !== null),
      } satisfies ListNode;
    }
    case "list_item": {
      // not implemented
      return null;
    }
    case "paragraph": {
      const transformed = transform({ tokens: target.tokens });
      const firstItem = transformed.at(0);
      if (transformed.length === 1 && firstItem?.type === "mediaSingle") {
        return firstItem;
      }

      if (typia.is<IJiraService.InlineNode[]>(transformed)) {
        return {
          type: "paragraph",
          content: transformed,
        } satisfies IJiraService.ParagraphNode;
      }

      return null;
    }
    case "space": {
      return {
        type: "paragraph",
        content: [
          {
            // this mean line break
            type: "hardBreak",
            attrs: {
              text: "\n",
            },
          },
        ],
      } satisfies IJiraService.ParagraphNode;
    }
    case "strong": {
      return {
        type: "text",
        text: target.text,
        marks: [
          {
            type: "strong",
          },
        ],
      } satisfies IJiraService.Text;
    }
    case "table": {
      return {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: target.header.map((cell) => {
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
          ...target.rows.map((cells): IJiraService.TableRowNode => {
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
        ]
      } satisfies IJiraService.TableNode;
    }
    case "text": {
      if (options.convertParagraph) {
        return {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: target.text,
            },
          ],
        } satisfies IJiraService.ParagraphNode;
      } 
      
      return {
        type: "text",
        text: target.raw,
      } satisfies IJiraService.Text;
    }
    default: {
      // check exhaustive
      target satisfies never;
      // should not happen
      return null;
    }
  }
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
