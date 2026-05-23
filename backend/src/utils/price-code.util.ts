export interface PriceCodeMapping {
  word: string;
  digits: string;
}

/** Build a letter → digit map from admin-configured code word settings. */
export function buildPriceCodeMap(mapping?: PriceCodeMapping | null): Map<string, string> | null {
  if (!mapping?.word?.trim() || !mapping?.digits?.trim()) return null;

  const word = mapping.word.trim().toUpperCase();
  const digits = mapping.digits.trim();

  if (word.length !== digits.length) {
    throw new Error(
      `Price code word and digits must be the same length (got ${word.length} letters and ${digits.length} digits)`,
    );
  }

  const map = new Map<string, string>();
  for (let i = 0; i < word.length; i++) {
    const letter = word[i];
    if (!/^[A-Z]$/.test(letter)) {
      throw new Error(`Price code word must contain only letters (invalid: "${letter}")`);
    }
    if (!/^\d$/.test(digits[i])) {
      throw new Error(`Price code digits must be single digits 0-9 (invalid: "${digits[i]}")`);
    }
    map.set(letter, digits[i]);
  }
  return map;
}

/** True when value looks like an encoded letter price (not a plain number). */
export function isEncodedPriceValue(raw: string): boolean {
  const cleaned = raw.trim().replace(/[%/=\s,]/g, '');
  if (!cleaned) return false;
  if (/^\d+(\.\d+)?$/.test(cleaned)) return false;
  return /^[A-Za-z]+$/.test(cleaned);
}

/** Strip currency suffixes and formatting from numeric price strings (e.g. 10530/=). */
export function parsePlainPrice(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/\/=/g, '')
    .replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

/**
 * Decode a price cell: plain number OR letter code using company mapping.
 * Examples: "10530/=" → 10530, "BL" with BLACKSTONE→1234567890 → 12
 */
export function decodePriceValue(
  raw: string | undefined | null,
  mapping?: PriceCodeMapping | null,
): number {
  if (raw == null || String(raw).trim() === '') return 0;

  const text = String(raw).trim();
  const plain = parsePlainPrice(text);
  const lettersOnly = text.replace(/[%/=\s,]/g, '').toUpperCase();

  if (plain !== null && !isEncodedPriceValue(text)) {
    return plain;
  }

  const codeMap = buildPriceCodeMap(mapping);
  if (!codeMap) {
    throw new Error(
      'Price uses letter codes but no code word is configured. Set it in Settings → Price code words.',
    );
  }

  let result = '';
  for (const char of lettersOnly) {
    const digit = codeMap.get(char);
    if (digit === undefined) {
      throw new Error(
        `Unknown letter "${char}" in price code "${lettersOnly}". Add it to your code word in Settings.`,
      );
    }
    result += digit;
  }

  const value = parseFloat(result);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid decoded price from code "${lettersOnly}"`);
  }
  return value;
}

/**
 * Parse discount column (e.g. "BK%", "10", or encoded "BK").
 * Returns max discount percentage when parseable.
 */
export function parseDiscountPercent(
  raw: string | undefined | null,
  mapping?: PriceCodeMapping | null,
): number | undefined {
  if (!raw?.trim()) return undefined;

  const text = raw.trim();
  const hasPercent = text.includes('%');
  const core = text.replace(/%/g, '').trim();

  try {
    if (isEncodedPriceValue(core)) {
      const decoded = decodePriceValue(core, mapping);
      return hasPercent ? decoded : decoded <= 100 ? decoded : undefined;
    }
    const num = parseFloat(core.replace(/[^\d.]/g, ''));
    if (Number.isFinite(num) && num >= 0 && num <= 100) return num;
  } catch {
    return undefined;
  }
  return undefined;
}
