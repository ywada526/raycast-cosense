import { type Block, type Node, parse } from "@progfay/scrapbox-parser";
import { COSENSE_BASE_URL, PROJECT_NAME } from "./constants";

export function cosenseToMarkdown(text: string): { markdown: string; error?: Error } {
  try {
    const page = parse(text);
    return { markdown: page.map(convertBlockToMarkdown).join("  \n") };
  } catch (error) {
    return { markdown: text, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

function convertBlockToMarkdown(block: Block): string {
  switch (block.type) {
    case "title":
      return `# ${block.text}`;
    case "codeBlock": {
      const extension = block.fileName.includes(".") ? (block.fileName.split(".").pop() ?? "") : "";
      const fence = "```";
      return `${fence}${extension}\n${block.content}\n${fence}`;
    }
    case "table":
      return ""; // todo
    case "line": {
      const listIndent = block.indent > 0 ? `${"  ".repeat(block.indent - 1)}* ` : "";
      return listIndent + block.nodes.map(convertNodeToMarkdown).join("");
    }
    default: {
      const _: never = block;
      throw new Error(_);
    }
  }
}

function convertNodeToMarkdown(node: Node): string {
  switch (node.type) {
    case "plain":
      return node.text;
    case "decoration": {
      if (node.decos.some((deco) => deco.startsWith("*"))) {
        return `**${node.nodes.map(convertNodeToMarkdown).join("")}**`;
      } else {
        return node.raw;
      }
    }
    case "quote":
      return `${node.nodes.map(convertNodeToMarkdown).join("")}`;
    case "code":
      return `\`${node.text}\``;
    case "hashTag":
      return `[#${node.href}](${COSENSE_BASE_URL}/${PROJECT_NAME}/${node.href})`;
    case "link": {
      const { pathType, content, href } = node;
      switch (pathType) {
        case "root":
          return `[${href}](${COSENSE_BASE_URL}${href})`;
        case "relative":
          return `[${href}](${COSENSE_BASE_URL}/${PROJECT_NAME}/${href})`;
        case "absolute":
          return `[${content}](${href})`;
        default: {
          const _: never = pathType;
          throw new Error(_);
        }
      }
    }
    default:
      return node.raw;
  }
}
