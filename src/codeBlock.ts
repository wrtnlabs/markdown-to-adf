import { IJiraService } from "./type";

export function codeBlock(input: { text: string; language?: string }): IJiraService.CodeBlockNode {
  return {
    type: "codeBlock",
    content: [{ type: "text", text: input.text }],
    ...(input.language && { attrs: { language: input.language } }),
  };
}
