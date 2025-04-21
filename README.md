# @wrtnlabs/markdown-to-adf

Markdown to ADF(Jira, Atlassian) format blacks

## Overview

This repository provides a utility to convert Markdown content into Atlassian Document Format (ADF), commonly used in Jira and other Atlassian products.

## Features

- **Markdown Parsing**: Converts Markdown tokens into ADF-compatible nodes.
- **Rich Text Support**: Handles various Markdown elements such as headings, paragraphs, lists, tables, links, and more.
- **Customizable Transformations**: Supports custom handling for specific Markdown tokens.

## Installation

To use this utility in your project, install it via npm:

```bash
npm install @wrtnlabs/markdown-to-adf
```

## Usage

Here's an example of how to use the `markdownToJiraBlock` function to convert Markdown into ADF:

```typescript
import { markdownToJiraBlock } from "@wrtnlabs/markdown-to-adf";

const markdown = `
# Example Heading

This is a paragraph with **bold text** and *italic text*.

- Item 1
- Item 2
`;

const adfBlocks = markdownToJiraBlock(markdown);
console.log(JSON.stringify(adfBlocks, null, 2));
```

## API Reference

### `markdownToJiraBlock(markdown: string): IJiraService.TopLevelBlockNode[]`

Converts a Markdown string into an array of ADF top-level block nodes.

#### Parameters

- `markdown` (string): The Markdown content to be converted.

#### Returns

- `IJiraService.TopLevelBlockNode[]`: An array of ADF-compatible nodes.

## Supported Markdown Elements

The utility supports the following Markdown elements:

- **Headings**: Converts `#`, `##`, etc., into ADF heading nodes.
- **Paragraphs**: Converts plain text into ADF paragraph nodes.
- **Lists**: Supports both ordered and unordered lists.
- **Tables**: Converts Markdown tables into ADF table nodes.
- **Links**: Converts `[text](url)` into ADF link nodes.
- **Images**: Converts `![alt](url)` into ADF media nodes.
- **Code Blocks**: Converts fenced code blocks into ADF code block nodes.
- **Inline Code**: Converts backtick-enclosed text into ADF inline code nodes.
- **Emphasis**: Supports bold, italic, and strikethrough text.

## Development

### File Structure

- `codeBlock.ts`: Handles conversion of code blocks.
- `heading.ts`: Handles conversion of headings.
- `text.ts`: Handles conversion of plain text and inline elements.
- `rule.ts`: Handles horizontal rules.
- `mediaSingle.ts`: Handles media elements like images.
- `type.ts`: Defines TypeScript types for ADF nodes.

### Transform Function

The core transformation logic is implemented in the `transform` function, which recursively processes Markdown tokens and converts them into ADF nodes.

### Error Handling

The utility includes type-checking using `typia` to ensure that the transformed nodes conform to the expected ADF structure.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

Special thanks to the developers of `marked` and `typia` for their excellent libraries that make this utility possible.
