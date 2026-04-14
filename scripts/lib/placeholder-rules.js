const path = require('path');

const PLACEHOLDER_FRONTMATTER_PATTERNS = [
  /\[TBD\]/,
  /\bProduct name TBD\b/i
];

const PLACEHOLDER_BODY_PHRASES = [
  '## Product: [TBD]',
  '**Date**: [TBD]',
  '**Repo**: [TBD]',
  '*[To be written after we build it]*',
  '*[Real-time narrative goes here]*',
  '*[What we actually delivered]*',
  '*[What I learned]*'
];

function hasPlaceholderMetadata(frontmatter = {}) {
  const values = [frontmatter.title || '', frontmatter.subtitle || ''];
  return values.some((value) => PLACEHOLDER_FRONTMATTER_PATTERNS.some((pattern) => pattern.test(String(value))));
}

function isDayChapterPath(relPath = '') {
  return /^chapters\/day-(\d+)\.qmd$/.test(relPath);
}

function getDayNumberFromPath(relPath = '') {
  const match = relPath.match(/^chapters\/day-(\d+)\.qmd$/);
  return match ? Number(match[1]) : null;
}

function splitFrontmatterAndBody(text = '') {
  const frontmatterMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    return {
      frontmatterText: '',
      bodyText: text
    };
  }

  return {
    frontmatterText: frontmatterMatch[1] || '',
    bodyText: text.slice(frontmatterMatch[0].length)
  };
}

function isPlaceholderDayChapterContent(text = '', frontmatter = null) {
  const { frontmatterText, bodyText } = splitFrontmatterAndBody(text);
  const metadataHasPlaceholder = frontmatter
    ? hasPlaceholderMetadata(frontmatter)
    : PLACEHOLDER_FRONTMATTER_PATTERNS.some((pattern) => pattern.test(frontmatterText));

  const bodyHasPlaceholder = PLACEHOLDER_BODY_PHRASES.some((phrase) => bodyText.includes(phrase));
  return metadataHasPlaceholder || bodyHasPlaceholder;
}

module.exports = {
  PLACEHOLDER_BODY_PHRASES,
  PLACEHOLDER_FRONTMATTER_PATTERNS,
  getDayNumberFromPath,
  hasPlaceholderMetadata,
  isDayChapterPath,
  isPlaceholderDayChapterContent,
  splitFrontmatterAndBody
};
