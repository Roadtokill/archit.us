import { Nil } from "../types";

/**
 * Determines whether a value is defined (non-undefined or null). Returns true if the
 * value is non-nil, false otherwise
 * @param value - The value to check for nil-ness
 */
export function isDefined<T>(value: Nil | T): value is T {
  return !(value == null);
}

/**
 * Determines whether a value is nil (null or undefined). Returns true if the value is
 * nil, false otherwise
 * @param value - The value to check for nil-ness
 */
export function isNil(value: unknown): value is Nil {
  return value == null;
}

/**
 * Escapes special regular expression characters.
 * From https://stackoverflow.com/a/9310752/13192375
 * @param raw - raw *unescaped) regex template
 */
export function escapeRegex(raw: string): string {
  return raw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Trims prefixes from a string repeatedly
 * @param base - Base string to process
 * @param prefix - Prefix substring
 * @param maxTrims - Maximum number of times to remove prefix; -1 means no limit
 */
export function trimPrefix(base: string, prefix: string, maxTrims = 1): string {
  let processed = base;
  for (let i = 0; i < maxTrims || maxTrims === -1; ++i) {
    if (processed.startsWith(prefix)) {
      processed = processed.slice(prefix.length);
    } else {
      break;
    }
  }
  return processed;
}

/**
 * Splits a string into alternating fragments of text that match the regular
 * expression between those that don't
 * @param input - The string to split
 * @param regex - The regular expression to use to perform the splitting
 */
export function splitFragments(input: string, regex: RegExp): string[] {
  const excludedFragments: string[] = input.split(regex);
  const matchedFragments: string[] = allMatches(input, regex);

  // Zip the two arrays together
  const sequence: string[] = [];
  const zippedLength = Math.min(
    matchedFragments.length,
    excludedFragments.length
  );
  for (let i = 0; i < zippedLength; ++i) {
    sequence.push(excludedFragments[i]);
    sequence.push(matchedFragments[i]);
  }
  if (matchedFragments.length > excludedFragments.length) {
    for (let i = excludedFragments.length; i < matchedFragments.length; ++i) {
      sequence.push(matchedFragments[i]);
    }
  } else if (matchedFragments.length < excludedFragments.length) {
    for (let i = matchedFragments.length; i < excludedFragments.length; ++i) {
      sequence.push(excludedFragments[i]);
    }
  }

  return sequence;
}

/**
 * Re-instantiates a new regular expression with the specified one's flags and pattern
 * @param source - The source regular expression to use as a template
 */
export function remakeRegex(source: RegExp): RegExp {
  return new RegExp(source.source, source.flags);
}

/**
 * Finds all matches it can in a string before returning an array of total matches
 * @param string - The string to search for matches in
 * @param regex - The regular expression to use to find matches of
 */
export function allMatches(string: string, regex: RegExp): string[] {
  const remadeRegex = remakeRegex(regex);
  const matches: string[] = [];
  let currentMatch;
  do {
    currentMatch = remadeRegex.exec(string);
    if (currentMatch) matches.push(currentMatch[0]);
  } while (currentMatch);
  return matches;
}

/**
 * Capitalizes the first character in the given string
 * @param str - base string
 */
export function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
