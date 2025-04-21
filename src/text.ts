import { IJiraService } from "./type";

export function text(input: { text: string; marks?: IJiraService.Mark[] }): IJiraService.Text {
  return {
    type: "text",
    text: input.text,
    ...(input.marks?.length && { marks: input.marks }),
  };
}
