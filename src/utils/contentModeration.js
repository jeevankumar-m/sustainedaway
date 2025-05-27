// List of banned words and phrases (case insensitive)
const BANNED_WORDS = [
  // Profanity variations
  'fuck', 'f*ck', 'f**k', 'f***', 'f@ck', 'f@#k', 'f@$k', 'f@ck', 'fck', 'fcking',
  'shit', 'sh*t', 'sh!t', 'sh1t', 's#it', 's@it', 'sh1t', 'shyt', 'shyt',
  'ass', 'a$$', 'a**', 'a*s', 'a55', '@ss', '@$$',
  'bitch', 'b*tch', 'b!tch', 'b1tch', 'b@tch', 'b*tch', 'bytch',
  'damn', 'd@mn', 'd@mn', 'd@m',
  'hell', 'h3ll', 'h@ll',
  'wtf', 'w.t.f', 'w-t-f', 'w_t_f',
  'omg', 'oh my god', 'oh my gosh',
  'crap', 'cr@p', 'cr@p',
  'dumb', 'd@mb', 'dumbass', 'dumb@ss',
  'stupid', 'st*pid', 'st@p1d',
  'idiot', '1d10t', 'id10t', '@sshole',
  
  // Hate speech and discrimination
  'hate', 'hating', 'hater', 'hateful',
  'stupid', 'idiot', 'dumb', 'moron',
  'ugly', 'fat', 'skinny', 'weird',
  'loser', 'lame', 'boring',
  
  // Spam and scams
  'buy now', 'click here', 'free money', 'earn money',
  'make money fast', 'quick cash', 'easy money',
  'work from home', 'earn from home',
  'investment opportunity', 'get rich quick',
  'limited time offer', 'act now',
  'click to win', 'free giveaway',
  'congratulations you won', 'you are selected',
  'claim your prize', 'claim your reward',
  
  // Inappropriate content
  'nude', 'naked', 'sex', 'porn', 'xxx',
  'drugs', 'weed', 'cocaine', 'heroin',
  'alcohol', 'drunk', 'intoxicated',
  
  // Threats and violence
  'kill', 'death', 'die', 'murder',
  'attack', 'fight', 'violence',
  'weapon', 'gun', 'knife',
  
  // Personal attacks
  'ugly', 'fat', 'skinny', 'weird',
  'loser', 'lame', 'boring',
  'nobody', 'worthless', 'useless',
  
  // Spam patterns
  'check out my', 'follow me', 'subscribe to',
  'like and share', 'share this', 'repost',
  'viral', 'trending', 'must see',
  
  // Scam indicators
  'bank account', 'credit card', 'password',
  'social security', 'ssn', 'account number',
  'verify your account', 'confirm your details',
  'suspicious activity', 'account suspended',
  'verify your identity', 'confirm your payment',
  
  // Misinformation
  'fake news', 'conspiracy', 'hoax',
  'scam', 'fraud', 'cheat',
  'lie', 'lying', 'false',
  
  // Harassment
  'stalk', 'stalker', 'creep',
  'harass', 'harassment', 'bully',
  'intimidate', 'threaten', 'threat'
];

// Regular expressions for common patterns
const BANNED_PATTERNS = [
  // Repeated characters
  /(.)\1{4,}/, // Repeated characters (e.g., "heyyyyyyy")
  /[A-Z]{5,}/, // Excessive caps
  /[!]{2,}/,   // Multiple exclamation marks
  
  // Common spam patterns
  /(?:https?:\/\/[^\s]+)/, // URLs
  /(?:www\.[^\s]+)/, // URLs without protocol
  /(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/, // Email addresses
  
  // Phone numbers
  /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
  
  // Common spam phrases
  /(?:buy|purchase|order|get|find).*(?:now|today|fast|quick|easy)/i,
  /(?:free|cheap|discount|sale|offer).*(?:now|today|limited|exclusive)/i,
  
  // Excessive punctuation
  /[!?]{3,}/, // Multiple ! or ?
  /[.]{3,}/,  // Multiple dots
  
  // Common leetspeak patterns
  /[a4@][s5$][s5$]/, // ass
  /[f4][u][c][k]/, // fuck
  /[s5$][h4][i1][t7]/, // shit
  
  // Common word variations
  /(?:f|ph)(?:u|oo|ew)(?:c|k|ck|q)/i, // variations of fuck
  /(?:s|$)(?:h|#)(?:i|1)(?:t|7)/i, // variations of shit
  /(?:a|@)(?:s|$)(?:s|$)/i, // variations of ass
  
  // Common spam indicators
  /(?:click|tap|press).*(?:here|now|link)/i,
  /(?:earn|make|get).*(?:money|cash|income)/i,
  /(?:free|cheap|discount).*(?:offer|deal|price)/i,
  
  // Common scam patterns
  /(?:verify|confirm).*(?:account|identity|payment)/i,
  /(?:suspicious|unusual).*(?:activity|login|access)/i,
  /(?:bank|credit).*(?:account|card|details)/i,
  
  // Common harassment patterns
  /(?:kill|die|death).*(?:you|your|yourself)/i,
  /(?:hate|stupid|idiot).*(?:you|your|yourself)/i,
  
  // Common spam formatting
  /[A-Z][a-z]*[A-Z][a-z]*[A-Z]/, // Mixed case spam
  /[0-9]{4,}/, // Long numbers
  /[^a-zA-Z0-9\s]{3,}/, // Excessive special characters
];

/**
 * Checks if text contains any banned words or patterns
 * @param {string} text - The text to check
 * @returns {Object} - { isClean: boolean, reason: string }
 */
export const moderateContent = (text) => {
  if (!text) {
    return { isClean: true, reason: '' };
  }

  const lowerText = text.toLowerCase();
  const normalizedText = text.replace(/[^a-zA-Z0-9\s]/g, ''); // Remove special characters for better matching

  // Check for banned words
  for (const word of BANNED_WORDS) {
    if (lowerText.includes(word)) {
      return {
        isClean: false,
        reason: 'Your content contains inappropriate language. Please keep it professional and respectful.'
      };
    }
  }

  // Check for banned patterns
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text) || pattern.test(normalizedText)) {
      return {
        isClean: false,
        reason: 'Your content contains inappropriate patterns or formatting. Please keep it clean and readable.'
      };
    }
  }

  // Check for minimum length
  if (text.trim().length < 3) {
    return {
      isClean: false,
      reason: 'Your content is too short. Please provide more details.'
    };
  }

  // Check for maximum length
  if (text.length > 500) {
    return {
      isClean: false,
      reason: 'Your content is too long. Please keep it under 500 characters.'
    };
  }

  return { isClean: true, reason: '' };
};

/**
 * Sanitizes text by removing excessive spaces and trimming
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .trim();
}; 