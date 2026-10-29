export const isMarkdownContent = (content: string): boolean => {
	const markdownPatterns = [
		/`.*`/m, // Inline code
		/^#{1,6}\s/m, // Headers
		/\*.*\*/m, // Italic text
		/\[.*\]\(.*\)/m, // Links
		/^\*\s/m, // Unordered list
		/\*\*.*\*\*/m, // Bold text
		/^\d+\.\s/m, // Ordered list
		/```[\s\S]*```/m // Code blocks
	];

	return markdownPatterns.some((pattern) => pattern.test(content));
};
