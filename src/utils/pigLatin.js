/**
 * Pig Latin Translator
 *
 * Rules:
 * 1. Words starting with vowels (a, e, i, o, u) or "xr"/"yt" → add "ay" at the end
 * 2. Words starting with consonants → move consonants to end and add "ay"
 * 3. Words with "qu" after consonants → move consonants + "qu" to end and add "ay"
 * 4. Words with "y" after consonants → move consonants before "y" to end and add "ay"
 * 5. Handle phrases (multiple words)
 */

/**
 * Translates a single word to Pig Latin
 * @param {string} word - The word to translate
 * @returns {string} - The Pig Latin translation
 */
export function translateWord(word) {
  if (!word) return '';

  const lowerWord = word.toLowerCase();
  const vowels = ['a', 'e', 'i', 'o', 'u'];

  // Rule 1: Words starting with vowels or "xr"/"yt" → add "ay"
  if (vowels.includes(lowerWord[0]) ||
      lowerWord.startsWith('xr') ||
      lowerWord.startsWith('yt')) {
    return word + 'ay';
  }

  // Find the first vowel (considering special cases)
  let firstVowelIndex = -1;
  for (let i = 0; i < lowerWord.length; i++) {
    // Special case: "qu" after consonants
    if (lowerWord[i] === 'q' && i + 1 < lowerWord.length && lowerWord[i + 1] === 'u') {
      i++; // Skip both 'q' and 'u'
      continue;
    }

    // Check for vowels
    if (vowels.includes(lowerWord[i])) {
      // Special case: "y" after consonants (not at the beginning)
      if (lowerWord[i] === 'y' && i > 0) {
        // If this is the first vowel found, use it
        if (firstVowelIndex === -1) {
          firstVowelIndex = i;
        }
        break;
      } else if (lowerWord[i] !== 'y') {
        firstVowelIndex = i;
        break;
      }
    }
  }

  // If no vowel found, treat as consonant word
  if (firstVowelIndex === -1) {
    return word + 'ay';
  }

  // Move consonants to the end and add "ay"
  const consonants = word.substring(0, firstVowelIndex);
  const restOfWord = word.substring(firstVowelIndex);

  return restOfWord + consonants + 'ay';
}

/**
 * Translates a phrase or multiple words to Pig Latin
 * @param {string} phrase - The phrase to translate
 * @returns {string} - The Pig Latin translation
 */
export function translatePhrase(phrase) {
  if (!phrase) return '';

  // Split into words, translate each, and rejoin
  return phrase
    .split(/\s+/)
    .map(word => {
      // Preserve punctuation
      const punctuation = word.match(/[.,!?;:'"]*$/);
      const cleanWord = word.replace(/[.,!?;:'"]*$/, '');

      if (punctuation) {
        return translateWord(cleanWord) + punctuation[0];
      }

      return translateWord(cleanWord);
    })
    .join(' ');
}

/**
 * Main translation function
 * @param {string} input - The text to translate
 * @returns {string} - The Pig Latin translation
 */
export function translateToPigLatin(input) {
  return translatePhrase(input);
}

// Example usage:
// console.log(translateToPigLatin('hello')); // 'ellohay'
// console.log(translateToPigLatin('apple')); // 'appleay'
// console.log(translateToPigLatin('quick brown fox')); // 'ickquay ownbray oxfay'