import { tags } from "typia";
import { IJiraService } from "./type";

export function media(input: { url: string & tags.Format<"iri"> }): IJiraService.MediaNode {
  return {
    type: "media",
    attrs: { type: "external", url: input.url },
  };
}
