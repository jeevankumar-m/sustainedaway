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

// Content moderation utility functions

// List of inappropriate words and phrases
const inappropriateContent = [
  // Profanity
  'profanity1', 'profanity2', 'profanity3',
  // Hate speech
  'hate1', 'hate2', 'hate3',
  // Spam indicators
  'spam1', 'spam2', 'spam3',
  // Add more categories as needed
];

// List of sustainability-related keywords for context checking
const sustainabilityKeywords = [
  'eco-friendly', 'sustainable', 'green', 'environmental',
  'recycling', 'waste', 'plastic', 'organic', 'renewable',
  'energy', 'carbon', 'emissions', 'pollution', 'conservation'
];

// Advanced pattern detection for content moderation
const PATTERN_DETECTION = {
  // Leetspeak patterns (e.g., 4ss, f*ck, etc.)
  leetspeak: {
    patterns: [
      /[a4@][s5$][s5$]/i,  // ass
      /[f4][u][c][k]/i,    // fuck
      /[s5$][h4][i1][t7]/i, // shit
      /[b8][i1][t7][c][h]/i, // bitch
      /[d0][i1][c][k]/i,   // dick
      /[p9][u][s5$][s5$][y]/i, // pussy
      /[w][h][o][r][e]/i,  // whore
      /[c][u][n][t]/i,     // cunt
      /[n][i1][g][g][e][r]/i, // n-word
      /[f][a][g][g][o][t]/i, // f-word
    ],
    weight: 2
  },

  // Common obfuscation patterns
  obfuscation: {
    patterns: [
      /[a-z]+[*!@#$%^&]+[a-z]+/i,  // Words with special chars
      /[a-z]+[0-9]+[a-z]+/i,       // Words with numbers
      /[a-z]+[.]+[a-z]+/i,         // Words with dots
      /[a-z]+[_]+[a-z]+/i,         // Words with underscores
      /[a-z]+[-]+[a-z]+/i,         // Words with hyphens
    ],
    weight: 1.5
  },

  // Spam patterns
  spam: {
    patterns: [
      /(?:https?:\/\/[^\s]+)/,  // URLs
      /(?:www\.[^\s]+)/,        // URLs without protocol
      /(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/, // Email addresses
      /(?:buy|purchase|order|get|find).*(?:now|today|fast|quick|easy)/i,
      /(?:free|cheap|discount|sale|offer).*(?:now|today|limited|exclusive)/i,
      /(?:earn|make|get).*(?:money|cash|income)/i,
      /(?:click|tap|press).*(?:here|now|link)/i,
    ],
    weight: 1.2
  },

  // Harassment patterns
  harassment: {
    patterns: [
      /(?:kill|die|death).*(?:you|your|yourself)/i,
      /(?:hate|stupid|idiot).*(?:you|your|yourself)/i,
      /(?:ugly|fat|skinny).*(?:you|your|yourself)/i,
      /(?:worthless|useless).*(?:you|your|yourself)/i,
    ],
    weight: 2.5
  },

  // Common word variations using algorithmic patterns
  wordVariations: {
    patterns: [
      /(?:f|ph)(?:u|oo|ew)(?:c|k|ck|q)/i,  // variations of fuck
      /(?:s|$)(?:h|#)(?:i|1)(?:t|7)/i,     // variations of shit
      /(?:a|@)(?:s|$)(?:s|$)/i,            // variations of ass
      /(?:b|8)(?:i|1)(?:t|7)(?:c|k)(?:h|#)/i, // variations of bitch
      /(?:d|0)(?:i|1)(?:c|k)/i,            // variations of dick
      /(?:p|9)(?:u|v)(?:s|$)(?:s|$)(?:y|i)/i, // variations of pussy
    ],
    weight: 2
  },

  // Context-based patterns
  context: {
    patterns: [
      /(?:want|need|looking).*(?:sex|hookup|date)/i,
      /(?:nude|naked).*(?:pic|photo|image)/i,
      /(?:drug|weed).*(?:buy|sell|deal)/i,
      /(?:gambling|bet|casino).*(?:win|money|cash)/i,
    ],
    weight: 1.8
  }
};

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
 * Sanitizes text by removing potentially harmful characters
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (text) => {
  if (!text) return '';
  
  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // Remove special characters that could be used for injection
  sanitized = sanitized.replace(/[<>{}[\]\\]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Checks if content is spam
 * @param {string} content - The content to check
 * @returns {boolean} - Whether the content is spam
 */
const isSpam = (content) => {
  // Check for repeated characters
  if (/(.)\1{4,}/.test(content)) {
    return true;
  }

  // Check for excessive punctuation
  if (/[!?]{3,}/.test(content)) {
    return true;
  }

  // Check for excessive capitalization
  if (content.length > 10 && content === content.toUpperCase()) {
    return true;
  }

  return false;
};

/**
 * Checks if content is relevant to sustainability
 * @param {string} content - The content to check
 * @returns {Object} - Result of sustainability relevance check
 */
export const checkSustainabilityRelevance = (content) => {
  if (!content) {
    return {
      isRelevant: false,
      reason: 'Content cannot be empty'
    };
  }

  const lowerContent = content.toLowerCase();
  let relevanceScore = 0;
  const foundKeywords = [];

  // Check for sustainability keywords
  for (const keyword of sustainabilityKeywords) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      relevanceScore++;
      foundKeywords.push(keyword);
    }
  }

  // Calculate relevance percentage
  const relevancePercentage = (relevanceScore / sustainabilityKeywords.length) * 100;

  return {
    isRelevant: relevancePercentage >= 20, // At least 20% relevance
    relevanceScore: relevancePercentage,
    foundKeywords,
    reason: relevancePercentage >= 20 
      ? 'Content is relevant to sustainability'
      : 'Content is not sufficiently related to sustainability topics'
  };
};

// Advanced content analysis functions
const analyzeContent = (text) => {
  if (!text) return { score: 0, flags: [] };

  let totalScore = 0;
  const flags = [];

  // Check each pattern category
  Object.entries(PATTERN_DETECTION).forEach(([category, { patterns, weight }]) => {
    patterns.forEach(pattern => {
      if (pattern.test(text)) {
        totalScore += weight;
        flags.push({
          category,
          pattern: pattern.toString(),
          weight
        });
      }
    });
  });

  // Check for excessive repetition
  const repetitionScore = checkRepetition(text);
  totalScore += repetitionScore.score;
  if (repetitionScore.flags.length > 0) {
    flags.push(...repetitionScore.flags);
  }

  // Check for excessive capitalization
  const capsScore = checkCapitalization(text);
  totalScore += capsScore.score;
  if (capsScore.flags.length > 0) {
    flags.push(...capsScore.flags);
  }

  return { score: totalScore, flags };
};

// Check for excessive repetition
const checkRepetition = (text) => {
  const flags = [];
  let score = 0;

  // Check for repeated characters
  if (/(.)\1{4,}/.test(text)) {
    score += 1;
    flags.push({ category: 'repetition', type: 'repeated_characters' });
  }

  // Check for repeated words
  const words = text.toLowerCase().split(/\s+/);
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  Object.entries(wordCount).forEach(([word, count]) => {
    if (count > 3) {
      score += 0.5;
      flags.push({ category: 'repetition', type: 'repeated_words', word });
    }
  });

  return { score, flags };
};

// Check for excessive capitalization
const checkCapitalization = (text) => {
  const flags = [];
  let score = 0;

  // Check for all caps
  if (text === text.toUpperCase() && text.length > 10) {
    score += 1.5;
    flags.push({ category: 'capitalization', type: 'all_caps' });
  }

  // Check for excessive caps in words
  const words = text.split(/\s+/);
  const capsWords = words.filter(word => 
    word.length > 2 && word === word.toUpperCase()
  );

  if (capsWords.length > 2) {
    score += 1;
    flags.push({ category: 'capitalization', type: 'excessive_caps', count: capsWords.length });
  }

  return { score, flags };
};

/**
 * Comprehensive content moderation for both store ratings and SustainaVoice
 * @param {string} content - The content to moderate
 * @param {string} type - The type of content ('rating' or 'voice')
 * @returns {Object} - Result of moderation
 */
export const moderateUserContent = (content, type) => {
  // First sanitize the content
  const sanitizedContent = sanitizeText(content);

  // Analyze content using advanced patterns
  const analysis = analyzeContent(sanitizedContent);
  
  // Determine if content is inappropriate based on score
  const isInappropriate = analysis.score >= 2.5;

  if (isInappropriate) {
    return {
      isClean: false,
      reason: 'Your content contains inappropriate language or patterns. Please keep it professional and respectful.',
      flags: analysis.flags
    };
  }

  // Additional checks for SustainaVoice
  if (type === 'voice') {
    const relevanceCheck = checkSustainabilityRelevance(sanitizedContent);
    if (!relevanceCheck.isRelevant) {
      return {
        isClean: false,
        reason: relevanceCheck.reason
      };
    }
  }

  return {
    isClean: true,
    reason: 'Content passed all moderation checks',
    sanitizedContent
  };
}; 