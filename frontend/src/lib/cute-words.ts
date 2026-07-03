// Collection of cute/twinky/femboyish words for custom shortcodes
export const cuteWords = [
  // Kawaii/Cute words
  'uwu', 'owo', 'nya', 'mew', 'purr', 'boop', 'snuggle', 'cuddle', 'smooch', 'kiss',
  'hug', 'pat', 'nuzzle', 'boop', 'squish', 'fluffy', 'soft', 'warm', 'cozy', 'comfy',

  // Femboy/Twinky terms
  'femboy', 'twink', 'boi', 'cutie', 'sweetie', 'honey', 'baby', 'angel', 'precious', 'darling',
  'princess', 'prince', 'bean', 'muffin', 'cupcake', 'cookie', 'candy', 'sugar', 'caramel', 'vanilla',

  // Colors (pastel/cute)
  'pink', 'violet', 'lavender', 'rose', 'coral', 'peach', 'cream', 'mint', 'sky', 'azure',
  'blush', 'cherry', 'berry', 'lilac', 'mauve', 'salmon', 'ivory', 'pearl', 'opal', 'jade',

  // Animals (cute ones)
  'cat', 'kitten', 'puppy', 'bunny', 'fox', 'deer', 'lamb', 'chick', 'duckling', 'hamster',
  'mouse', 'ferret', 'otter', 'seal', 'penguin', 'koala', 'panda', 'bear', 'wolf', 'lynx',

  // Aesthetic words
  'dreamy', 'sparkle', 'shimmer', 'glow', 'shine', 'twinkle', 'glitter', 'magic', 'fairy', 'star',
  'moon', 'cloud', 'flower', 'petal', 'bloom', 'garden', 'meadow', 'spring', 'dawn', 'dusk',

  // Emotions/feelings
  'happy', 'joy', 'bliss', 'peace', 'calm', 'serene', 'gentle', 'tender', 'sweet', 'lovely',
  'grace', 'charm', 'beauty', 'pure', 'innocent', 'shy', 'cute', 'pretty', 'gorgeous', 'stunning',

  // Textures/qualities
  'silk', 'satin', 'velvet', 'cashmere', 'cotton', 'lace', 'chiffon', 'tulle', 'muslin', 'bamboo',
  'smooth', 'sleek', 'glossy', 'matte', 'fuzzy', 'plush', 'downy', 'silky', 'velvety', 'gossamer',

  // Small/cute things
  'tiny', 'mini', 'little', 'small', 'petite', 'dainty', 'delicate', 'fine', 'micro', 'nano',
  'pocket', 'button', 'dot', 'spot', 'drop', 'bubble', 'bead', 'gem', 'crystal', 'jewel',

  // Internet culture
  'smol', 'bean', 'valid', 'vibe', 'mood', 'energy', 'aura', 'aesthetic', 'soft', 'pure',
  'wholesome', 'valid', 'precious', 'protecc', 'attacc', 'snacc', 'thicc', 'smol', 'tol', 'uwu'
];

// Generate a cute word-based shortcode
export function generateCuteShortCode(): string {
  const word1 = cuteWords[Math.floor(Math.random() * cuteWords.length)];
  const word2 = cuteWords[Math.floor(Math.random() * cuteWords.length)];
  const number = Math.floor(Math.random() * 999) + 1;

  // Combine words with number for uniqueness: "cute-bunny-123"
  return `${word1}-${word2}-${number}`;
}

// Alternative format: single word with more numbers
export function generateCuteShortCodeAlt(): string {
  const word = cuteWords[Math.floor(Math.random() * cuteWords.length)];
  const number = Math.floor(Math.random() * 9999) + 1000; // 4 digit number

  return `${word}${number}`;
}
