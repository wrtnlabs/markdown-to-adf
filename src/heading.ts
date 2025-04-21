import { IJiraService } from "./type";

export function heading(input: {
  content: IJiraService.InlineNode[];
  level: 1 | 2 | 3 | 4 | 5 | 6;
}): IJiraService.HeadingNode {
  return { type: "heading", content: input.content, attrs: { level: input.level } };
}
