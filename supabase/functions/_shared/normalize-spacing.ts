// Common text normalization logic for TOEFL Text Completion
// Handles spacing issues between text parts and blanks

export interface ContentPart {
  type: string;
  value?: string;
  full_word?: string;
  [key: string]: any;
}

export interface PassageData {
  content_parts: ContentPart[];
  [key: string]: any;
}

/**
 * Normalize spacing in passage content parts
 * Ensures proper spacing around blanks and text
 */
export function normalizeSpacing(passage: PassageData): PassageData {
  if (!passage.content_parts || !Array.isArray(passage.content_parts)) {
    return passage;
  }

  const parts = [...passage.content_parts]; // Create copy
  const normalizedParts: ContentPart[] = [];

  for (let i = 0; i < parts.length; i++) {
    const current = parts[i];
    const next = parts[i + 1];

    if (current.type === 'text' && typeof current.value === 'string') {
      let value = current.value;

      // RULE 1: Text followed by Blank
      // If text doesn't end with space/hyphen, add space
      if (next && next.type === 'blank') {
        if (value.length > 0 && !/\s$/.test(value) && !value.endsWith('-')) {
          value = value + ' ';
        }
      }

      normalizedParts.push({ ...current, value });
    } else if (current.type === 'blank') {
      normalizedParts.push({ ...current });

      // RULE 2: Blank followed by Text
      // If text doesn't start with space/punctuation, add space
      if (next && next.type === 'text' && typeof next.value === 'string') {
        const nextValue = next.value;
        
        // Punctuation check: . , ! ? ; : ' (for 's, 't)
        const isPunctuation = /^[\.,!?;:]/.test(nextValue);
        const isContraction = /^['’][a-z]/.test(nextValue); // 's, 't, 're, 've
        const startsWithSpace = /^\s/.test(nextValue);

        if (nextValue.length > 0 && !startsWithSpace && !isPunctuation && !isContraction) {
          // Modifying the next part in the original array to handle it in next iteration
          parts[i + 1] = { ...next, value: ' ' + nextValue };
        }
      }
    } else {
      normalizedParts.push({ ...current });
    }
  }

  return { ...passage, content_parts: normalizedParts };
}

/**
 * Check if passage needs normalization
 * Returns true if spacing issues are detected
 */
export function needsNormalization(passage: PassageData): boolean {
  if (!passage.content_parts || !Array.isArray(passage.content_parts)) {
    return false;
  }

  const parts = passage.content_parts;

  for (let i = 0; i < parts.length - 1; i++) {
    const current = parts[i];
    const next = parts[i + 1];

    // Check Text -> Blank
    if (current.type === 'text' && next.type === 'blank') {
      const val = current.value || '';
      if (val.length > 0 && !/\s$/.test(val) && !val.endsWith('-')) {
        return true;
      }
    }

    // Check Blank -> Text
    if (current.type === 'blank' && next.type === 'text') {
      const val = next.value || '';
      const isPunctuation = /^[\.,!?;:]/.test(val);
      const isContraction = /^['’][a-z]/.test(val);
      
      if (val.length > 0 && !/^\s/.test(val) && !isPunctuation && !isContraction) {
        return true;
      }
    }
  }

  return false;
}

