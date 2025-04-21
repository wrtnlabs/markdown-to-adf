import { tags } from "typia";
import { media } from "./media";
import { IJiraService } from "./type";

export function mediaSingle(input: { url: string & tags.Format<"iri"> }): IJiraService.MediaSingleNode {
  return { type: "mediaSingle", content: [media(input)], attrs: { layout: "center" } };
}
