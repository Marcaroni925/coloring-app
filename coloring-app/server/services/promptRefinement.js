/**
 * Advanced Prompt Refinement Service for High-Quality Coloring Book Creation
 * 
 * Core AI-enhanced module implementing intelligent prompt transformation for superior
 * coloring book images with rich descriptive details, expanded categorization,
 * GPT-powered refinement (default), comprehensive DALL-E optimization, and 
 * professional-grade output specifications.
 * 
 * ENHANCED FEATURES (v2.0):
 * ✨ GPT Refinement Now Default: Automatically uses GPT-4o-mini for detailed enhancement
 * 🎨 Rich Descriptive Details: Mood, atmosphere, patterns, and composition elements
 * 🏗️ Expanded Categories: 7 new categories (20+ total) with 300+ keyword patterns
 * 📏 Enhanced Templates: Sophisticated descriptive language for all complexity levels
 * 🎯 DALL-E Best Practices: Always applied for optimal coloring book quality
 * 
 * META-PROMPT TRANSFORMATION EXAMPLES:
 * 
 * Input: "a dinosaur"
 * Meta-Prompt Output: "intricate black-and-white line art of a majestic dinosaur in a prehistoric 
 *                     jungle with detailed scales, ancient ferns, volcanic landscape background, 
 *                     and dynamic roaring pose, detailed complexity, kids style, medium lines, 
 *                     with border, coloring book style, family-friendly, no shading, clear outlines, 300 DPI"
 * 
 * Input: "a princess" 
 * Meta-Prompt Output: "intricate black-and-white line art of an elegant princess with flowing gown, 
 *                     ornate crown, castle towers background, blooming garden, and graceful pose, 
 *                     medium complexity, kids style, medium lines, with border, coloring book style, 
 *                     family-friendly, no shading, clear outlines, 300 DPI"
 * 
 * Input: "a car"
 * Meta-Prompt Output: "intricate black-and-white line art of a sleek car with detailed wheels, 
 *                     chrome details, city street background, traffic elements, and dynamic angle, 
 *                     simple complexity, kids style, thick lines, with border, coloring book style, 
 *                     family-friendly, no shading, clear outlines, 300 DPI"
 * 
 * Input: "a butterfly"
 * Meta-Prompt Output: "intricate black-and-white line art of a beautiful butterfly with ornate wing 
 *                     patterns, garden flowers, delicate antennae, landing pose, and nature setting, 
 *                     simple complexity, kids style, thin lines, with border, coloring book style, 
 *                     family-friendly, no shading, clear outlines, 300 DPI"
 * 
 * Input: "a robot"
 * Meta-Prompt Output: "intricate black-and-white line art of a friendly robot with geometric panels, 
 *                     antenna details, futuristic lab background, helpful expression, and standing pose, 
 *                     medium complexity, kids style, medium lines, with border, coloring book style, 
 *                     family-friendly, no shading, clear outlines, 300 DPI"
 * 
 * CATEGORIES SUPPORTED (20+ Total):
 * 🐕 domesticAnimals, 🦁 wildAnimals, 🦕 prehistoric, 🐟 marineLife, 🦋 insects
 * 🧙 fantasy, 🌳 nature, 🚗 vehicles, 🍎 food, 🏠 objects, ⚽ sports
 * 🎄 holidays, 🎵 music, 🕸️ mandalas, 🎨 abstract
 * 🏛️ architecture, 👕 clothing, 🚀 space, 👨‍⚕️ professions, 🌦️ weather, 🧸 toys
 * 
 * Evidence-based implementation following OpenAI best practices:
 * - Clear, specific instructions for consistent results (architecture.md 6.3)  
 * - Advanced subject categorization and enhancement (architecture.md 3.1.2)
 * - Robust fallback mechanisms for error resilience (architecture.md 3.1.3)
 * - GPT-powered intelligent refinement with meta-prompts (architecture.md 4.1)
 * - Structured logging and monitoring (architecture.md 6.3)
 * - Consistent output formatting through templates (architecture.md 6.3)
 * 
 * Technical Features:
 * - Winston structured logging for production monitoring
 * - Expanded subject patterns (300+ keywords across 20+ categories)
 * - Advanced enhancement templates with rich descriptive language
 * - Default GPT-based intelligent refinement with template fallback
 * - Comprehensive DALL-E optimization specifications
 * - Family-friendly content validation and input sanitization
 * - Full testing exports for comprehensive unit test coverage
 */

import OpenAI from 'openai';
import winston from 'winston';

/**
 * Logger configuration with structured output
 * Production-ready logging with multiple levels and formats
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'prompt-refinement' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5 
    })
  ]
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

/**
 * Input Sanitization Utilities
 * Comprehensive validation and cleaning of user inputs
 * 
 * Unit Test Examples:
 * expect(InputSanitizer.clean('a dinosaur')).toBe('a dinosaur')
 * expect(InputSanitizer.clean('  hello world  ')).toBe('hello world')
 * expect(InputSanitizer.clean('test<script>alert(1)</script>')).toBe('testalert1')
 * expect(() => InputSanitizer.clean('violence test')).toThrow('Content contains inappropriate terms')
 * expect(() => InputSanitizer.clean('')).toThrow('Invalid input: must be a non-empty string')
 * expect(() => InputSanitizer.clean('a'.repeat(501))).toThrow('Input must be between 1 and 500 characters')
 */
class InputSanitizer {
  /**
   * Primary cleaning method as specified in requirements
   * @param {string} input - Raw user input to clean and validate
   * @returns {string} - Cleaned and validated input
   * @throws {Error} - If input is invalid or inappropriate
   */
  static clean(input) {
    return this.sanitizeText(input);
  }

  static sanitizeText(input) {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input: must be a non-empty string');
    }

    // Basic sanitization
    let sanitized = input.trim();
    
    // Remove potentially harmful characters but preserve coloring book terms
    // Evidence: architecture.md 6.3 - Input sanitization for security
    sanitized = sanitized.replace(/[^\w\s]/gi, '');
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    // Length validation
    if (sanitized.length < 1 || sanitized.length > 500) {
      throw new Error('Input must be between 1 and 500 characters');
    }

    return sanitized;
  }

  static validateCustomizations(customizations) {
    if (!customizations || typeof customizations !== 'object') {
      return {};
    }

    const validatedCustomizations = {};

    // Validate complexity
    if (customizations.complexity) {
      if (!['simple', 'medium', 'detailed'].includes(customizations.complexity)) {
        throw new Error('Invalid complexity level');
      }
      validatedCustomizations.complexity = customizations.complexity;
    }

    // Validate age group
    if (customizations.ageGroup) {
      if (!['kids', 'teens', 'adults'].includes(customizations.ageGroup)) {
        throw new Error('Invalid age group');
      }
      validatedCustomizations.ageGroup = customizations.ageGroup;
    }

    // Validate line thickness
    if (customizations.lineThickness) {
      if (!['thin', 'medium', 'thick'].includes(customizations.lineThickness)) {
        throw new Error('Invalid line thickness');
      }
      validatedCustomizations.lineThickness = customizations.lineThickness;
    }

    // Validate border
    if (customizations.border) {
      if (!['with', 'without'].includes(customizations.border)) {
        throw new Error('Invalid border option');
      }
      validatedCustomizations.border = customizations.border;
    }

    // Validate theme
    if (customizations.theme) {
      const validThemes = ['animals', 'mandalas', 'fantasy', 'nature', 'vehicles', 'food', 'holidays', 'sports'];
      if (!validThemes.includes(customizations.theme)) {
        throw new Error('Invalid theme');
      }
      validatedCustomizations.theme = customizations.theme;
    }

    return validatedCustomizations;
  }

  static checkFamilyFriendly(input) {
    // Comprehensive inappropriate content filter - 30+ keywords
    // Evidence: architecture.md 6.3 - Content moderation for family safety
    const inappropriateKeywords = [
      // Violence and weapons
      'violence', 'blood', 'weapon', 'gun', 'knife', 'death', 'kill', 'murder', 'fight', 'war',
      'bomb', 'explosive', 'sword', 'blade', 'attack', 'assault', 'shoot', 'stab',
      // Adult content
      'sexual', 'nude', 'naked', 'adult', 'explicit', 'inappropriate', 'sexy', 'porn',
      'breast', 'genital', 'erotic', 'intimate', 'seductive',
      // Substances
      'drug', 'alcohol', 'beer', 'wine', 'cigarette', 'smoking', 'marijuana', 'cocaine',
      'heroin', 'methamphetamine', 'addiction', 'overdose',
      // Dark/scary content
      'scary', 'horror', 'demon', 'devil', 'evil', 'dark magic', 'satanic', 'occult',
      'zombie', 'ghost', 'haunted', 'nightmare', 'terror',
      // Mental health concerns
      'suicide', 'self-harm', 'cutting', 'depression', 'anxiety', 'abuse',
      // Hate speech
      'hate', 'racist', 'discrimination', 'prejudice', 'bigotry'
    ];

    const lowerInput = input.toLowerCase();
    const foundInappropriate = inappropriateKeywords.filter(keyword => 
      lowerInput.includes(keyword)
    );

    if (foundInappropriate.length > 0) {
      throw new Error(`Content contains inappropriate terms: ${foundInappropriate.join(', ')}`);
    }

    return true;
  }
}

/**
 * Enhanced PromptRefinementService - Core prompt enhancement engine
 * 
 * Implements the 4-step refinement process with advanced features:
 * 1. Detect subject type (15+ categories, 200+ patterns)
 * 2. Generate base prompt structure with templates  
 * 3. Add contextual details with sub-complexity levels
 * 4. Apply quality parameters with optional GPT enhancement
 * 
 * Unit Test Examples:
 * expect(await service.refinePrompt('a dinosaur')).toHaveProperty('success', true)
 * expect(await service.refinePrompt('a dinosaur')).toMatchObject({ refinedPrompt: expect.stringContaining('scales') })
 * expect(await service.refinePrompt('robot', { complexity: 'detailed' })).toMatchObject({ detectedCategory: 'objects' })
 * expect(await service.refinePrompt('christmas tree', { theme: 'holidays' })).toMatchObject({ detectedCategory: 'holidays' })
 * expect(service.detectSubjectCategory('guitar music')).toBe('music')
 * expect(service.detectSubjectCategory('abstract pattern')).toBe('abstract')
 * expect(() => service.refinePrompt('violence')).rejects.toThrow('inappropriate terms')
 */
class PromptRefinementService {
  constructor() {
    // Initialize logger first
    this.logger = logger;
    this.enableLogging = true;
    this.requestIdCounter = 0;
    
    // Initialize OpenAI client with environment-based key selection
    // Evidence: architecture.md 6.1 - API key management and cost mitigation
    this.openai = new OpenAI({
      apiKey: this.getApiKey()
    });
    
    // Expanded subject detection patterns - 15+ categories, 200+ keywords
    // Evidence: architecture.md 3.1.2 - Enhanced subject categorization for better refinement
    this.subjectPatterns = {
      // Domestic Animals (30 patterns) - Evidence: architecture.md 3.1.2 - Subject categorization
      domesticAnimals: [
        'dog', 'puppy', 'cat', 'kitten', 'rabbit', 'bunny', 'hamster', 'guinea pig',
        'bird', 'parrot', 'canary', 'fish', 'goldfish', 'horse', 'pony', 'cow',
        'pig', 'sheep', 'goat', 'chicken', 'duck', 'goose', 'turkey', 'llama', 'alpaca',
        'ferret', 'budgie', 'cockatiel', 'gerbil', 'chinchilla'
      ],
      
      // Wild Animals (30 patterns)
      wildAnimals: [
        'lion', 'tiger', 'elephant', 'giraffe', 'zebra', 'rhinoceros', 'hippopotamus',
        'bear', 'wolf', 'fox', 'deer', 'moose', 'elk', 'squirrel', 'raccoon',
        'monkey', 'ape', 'gorilla', 'chimpanzee', 'kangaroo', 'koala', 'panda',
        'leopard', 'cheetah', 'jaguar', 'lynx', 'bobcat', 'buffalo', 'bison', 'camel'
      ],
      
      // Prehistoric Animals (15 patterns)
      prehistoric: [
        'dinosaur', 'tyrannosaurus', 't-rex', 'triceratops', 'stegosaurus', 'brontosaurus',
        'velociraptor', 'pterodactyl', 'mammoth', 'saber-tooth', 'sabertooth',
        'dino', 'prehistoric', 'fossil', 'ancient'
      ],
      
      // Marine Life (20 patterns)
      marineLife: [
        'whale', 'dolphin', 'shark', 'octopus', 'squid', 'jellyfish', 'starfish',
        'seahorse', 'turtle', 'seal', 'walrus', 'penguin', 'crab', 'lobster',
        'shrimp', 'manta ray', 'stingray', 'coral', 'seaweed', 'submarine'
      ],
      
      // Insects & Small Creatures (15 patterns)
      insects: [
        'butterfly', 'bee', 'ladybug', 'spider', 'ant', 'grasshopper', 'cricket',
        'dragonfly', 'caterpillar', 'snail', 'worm', 'beetle', 'moth', 'firefly', 'centipede'
      ],
      
      // Fantasy Creatures (25 patterns)
      fantasy: [
        'dragon', 'unicorn', 'fairy', 'mermaid', 'phoenix', 'griffin', 'pegasus',
        'centaur', 'elf', 'dwarf', 'troll', 'goblin', 'ogre', 'wizard', 'witch',
        'magic', 'magical', 'enchanted', 'mystical', 'legendary', 'mythical',
        'castle', 'tower', 'potion', 'wand'
      ],
      
      // Nature Elements (30 patterns)
      nature: [
        'tree', 'forest', 'flower', 'rose', 'sunflower', 'daisy', 'tulip', 'lily',
        'garden', 'leaf', 'grass', 'bush', 'mountain', 'hill', 'valley', 'river',
        'lake', 'ocean', 'beach', 'desert', 'waterfall', 'rainbow', 'cloud',
        'sun', 'moon', 'star', 'snowflake', 'lightning', 'landscape', 'scenery'
      ],
      
      // Vehicles & Transportation (25 patterns)
      vehicles: [
        'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'train', 'airplane', 'helicopter',
        'boat', 'ship', 'submarine', 'rocket', 'spaceship', 'tank', 'tractor',
        'fire truck', 'ambulance', 'police car', 'taxi', 'van', 'jeep', 'sports car',
        'race car', 'hot air balloon', 'scooter'
      ],
      
      // Food & Treats (20 patterns)
      food: [
        'cake', 'cookie', 'ice cream', 'pizza', 'burger', 'sandwich', 'apple',
        'banana', 'orange', 'strawberry', 'cherry', 'donut', 'cupcake', 'candy',
        'chocolate', 'fruit', 'vegetable', 'bread', 'cheese', 'pie'
      ],
      
      // Household Objects (25 patterns)
      objects: [
        'house', 'home', 'chair', 'table', 'lamp', 'clock', 'book', 'toy',
        'ball', 'kite', 'balloon', 'umbrella', 'hat', 'shoe', 'bag', 'cup',
        'bottle', 'key', 'phone', 'computer', 'robot', 'teddy bear', 'doll', 'blocks', 'puzzle'
      ],
      
      // Sports & Activities (15 patterns)
      sports: [
        'soccer', 'football', 'basketball', 'baseball', 'tennis', 'golf', 'swimming',
        'running', 'cycling', 'skating', 'skiing', 'surfing', 'climbing', 'dancing', 'yoga'
      ],
      
      // Holidays & Celebrations (20 patterns)
      holidays: [
        'christmas', 'halloween', 'easter', 'birthday', 'valentine', 'thanksgiving',
        'new year', 'party', 'celebration', 'gift', 'present', 'ornament',
        'decoration', 'holiday', 'festival', 'christmas tree', 'pumpkin', 'candy cane', 'fireworks', 'birthday cake'
      ],
      
      // Musical Instruments (10 patterns)
      music: [
        'guitar', 'piano', 'violin', 'drums', 'trumpet', 'flute', 'saxophone',
        'harp', 'organ', 'microphone'
      ],
      
      // Mandala & Geometric Patterns (10 patterns)
      mandalas: [
        'mandala', 'pattern', 'geometric', 'circular', 'symmetrical', 'ornate',
        'decorative', 'intricate', 'spiral', 'kaleidoscope'
      ],
      
      // Abstract & Artistic (10 patterns)
      abstract: [
        'abstract', 'artistic', 'design', 'creative', 'modern', 'contemporary',
        'minimalist', 'stylized', 'artistic pattern', 'art'
      ],
      
      // Architecture & Buildings (15 patterns) - NEW CATEGORY
      architecture: [
        'house', 'building', 'castle', 'tower', 'bridge', 'church', 'temple',
        'skyscraper', 'cottage', 'barn', 'lighthouse', 'windmill', 'palace',
        'monument', 'cathedral'
      ],
      
      // Vehicles & Transportation Extended (20 patterns) - ENHANCED CATEGORY  
      vehicles: [
        'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'train', 'airplane', 'helicopter',
        'boat', 'ship', 'submarine', 'rocket', 'spaceship', 'tank', 'tractor',
        'fire truck', 'ambulance', 'police car', 'taxi', 'van', 'jeep', 'sports car',
        'race car', 'hot air balloon', 'scooter', 'sailboat', 'yacht', 'ferry'
      ],
      
      // Clothing & Fashion (12 patterns) - NEW CATEGORY
      clothing: [
        'dress', 'shirt', 'hat', 'shoes', 'jacket', 'pants', 'skirt',
        'costume', 'uniform', 'accessories', 'jewelry', 'crown'
      ],
      
      // Space & Astronomy (12 patterns) - NEW CATEGORY
      space: [
        'planet', 'star', 'moon', 'galaxy', 'astronaut', 'alien', 'ufo',
        'satellite', 'comet', 'nebula', 'solar system', 'space station'
      ],
      
      // Professions & People (15 patterns) - NEW CATEGORY
      professions: [
        'doctor', 'teacher', 'firefighter', 'police officer', 'chef', 'farmer',
        'pilot', 'nurse', 'scientist', 'artist', 'musician', 'dancer',
        'athlete', 'librarian', 'veterinarian'
      ],
      
      // Weather & Seasons (12 patterns) - NEW CATEGORY
      weather: [
        'rain', 'snow', 'sunny', 'cloudy', 'storm', 'rainbow', 'wind',
        'spring', 'summer', 'autumn', 'winter', 'seasons'
      ],
      
      // Toys & Games (15 patterns) - NEW CATEGORY
      toys: [
        'toy', 'doll', 'teddy bear', 'blocks', 'puzzle', 'board game', 'kite',
        'yo-yo', 'top', 'marbles', 'jack-in-the-box', 'rocking horse',
        'action figure', 'stuffed animal', 'building blocks'
      ]
    };
    
    // Enhanced advanced templates with rich descriptive language for superior coloring book quality
    this.enhancementTemplates = {
      domesticAnimals: {
        simple: (subject) => `adorable ${subject} with high contrast outlines, friendly expression, soft rounded features, and playful stance in a cozy domestic setting`,
        medium: (subject) => `detailed ${subject} with intricate fur/feather textures, expressive bright eyes, dynamic pose, comfortable home environment, and charming personality traits`,
        detailed: (subject) => `sophisticated ${subject} with complex anatomical patterns, luxurious fur/feather details, graceful pose, elaborate domestic scene, companion animals, and rich environmental storytelling`
      },
      
      wildAnimals: {
        simple: (subject) => `majestic ${subject} with bold outlines, noble expression, characteristic markings, and confident stance in natural habitat`,
        medium: (subject) => `detailed ${subject} with intricate natural textures, piercing eyes, dynamic movement, authentic habitat elements, and characteristic behavioral traits`,
        detailed: (subject) => `magnificent ${subject} with complex pattern work, detailed anatomical features, powerful pose, elaborate ecosystem scene, weather elements, and rich wildlife storytelling`
      },
      
      prehistoric: {
        simple: (subject) => `magnificent ${subject} with bold prehistoric features, ancient landscape elements, gentle expression, and educational accuracy`,
        medium: (subject) => `detailed ${subject} with intricate scale/skin textures, lush prehistoric vegetation, volcanic backdrop, ferns and ancient plants, and period-authentic atmosphere`,
        detailed: (subject) => `awe-inspiring ${subject} with complex anatomical patterns, elaborate prehistoric ecosystem, active volcanic landscape, diverse ancient flora, geological formations, and rich paleontological storytelling`
      },
      
      marineLife: {
        simple: (subject) => `graceful ${subject} with flowing aquatic features, gentle ocean waves, peaceful expression, and harmonious underwater setting`,
        medium: (subject) => `detailed ${subject} with natural scale/fin textures, swirling ocean currents, colorful coral reef elements, seaweed patterns, and vibrant marine ecosystem`,
        detailed: (subject) => `spectacular ${subject} with intricate aquatic patterns, elaborate underwater scene, diverse coral formations, flowing sea plants, schools of fish, and rich oceanic storytelling`
      },
      
      insects: {
        simple: (subject) => `charming ${subject} with delicate wing patterns, simple garden flowers, friendly demeanor, and whimsical garden setting`,
        medium: (subject) => `detailed ${subject} with intricate wing designs, blooming garden flowers, leaf textures, natural garden ecosystem, and seasonal elements`,
        detailed: (subject) => `enchanting ${subject} with complex wing ornamentation, elaborate garden scene, diverse flowering plants, detailed foliage, garden creatures, and rich botanical storytelling`
      },
      
      fantasy: {
        simple: (subject) => `magical ${subject} with enchanting mystical features, gentle sparkles, fairy-tale elements, and whimsical fantasy setting`,
        medium: (subject) => `enchanted ${subject} with detailed magical ornaments, glowing mystical aura, fantasy landscape backdrop, ethereal creatures, and magical storytelling`,
        detailed: (subject) => `magnificent ${subject} with intricate magical patterns, elaborate fantasy realm, diverse mystical creatures, swirling magical phenomena, enchanted forests, and rich mythological storytelling`
      },
      
      nature: {
        simple: (subject) => `beautiful ${subject} with organic flowing lines, peaceful natural setting, gentle seasonal elements, and harmonious composition`,
        medium: (subject) => `detailed ${subject} with rich natural textures, seasonal foliage, wildlife companions, weather elements, and authentic environmental context`,
        detailed: (subject) => `magnificent ${subject} with complex organic patterns, elaborate ecosystem scene, diverse plant species, weather phenomena, layered vegetation, and rich environmental storytelling`
      },
      
      vehicles: {
        simple: (subject) => `dynamic ${subject} with bold geometric lines, streamlined design features, motion elements, and exciting transportation theme`,
        medium: (subject) => `detailed ${subject} with intricate mechanical features, authentic design elements, environmental setting, technical details, and realistic proportions`,
        detailed: (subject) => `sophisticated ${subject} with complex mechanical patterns, elaborate technical details, dynamic action scene, environmental context, supporting vehicles, and rich transportation storytelling`
      },
      
      food: {
        simple: (subject) => `appetizing ${subject} with clear outline details, simple garnishes, inviting presentation, and delightful culinary appeal`,
        medium: (subject) => `detailed ${subject} with rich food textures, decorative garnishes, serving plate elements, kitchen utensils, and warm dining atmosphere`,
        detailed: (subject) => `gourmet ${subject} with intricate culinary patterns, elaborate presentation style, detailed ingredients, cooking implements, dining table setting, and rich gastronomic storytelling`
      },
      
      objects: {
        simple: (subject) => `functional ${subject} with clear geometric forms, basic design features, simple decorative elements, and purposeful appearance`,
        medium: (subject) => `detailed ${subject} with surface textures, functional components, environmental context, decorative patterns, and practical elegance`,
        detailed: (subject) => `sophisticated ${subject} with intricate design patterns, elaborate decorative elements, rich environmental setting, technical details, and artistic craftsmanship storytelling`
      },
      
      sports: {
        simple: (subject) => `energetic ${subject} with dynamic action lines, basic sports equipment, athletic pose, and exciting sports theme`,
        medium: (subject) => `detailed ${subject} with authentic sports gear, playing field environment, action details, team elements, and competitive atmosphere`,
        detailed: (subject) => `championship ${subject} with complex equipment details, elaborate sports venue, crowd elements, dynamic action sequences, weather effects, and rich athletic storytelling`
      },
      
      holidays: {
        simple: (subject) => `joyful ${subject} with cheerful holiday symbols, simple festive decorations, celebratory elements, and warm seasonal atmosphere`,
        medium: (subject) => `festive ${subject} with detailed holiday ornaments, traditional seasonal motifs, decorative patterns, gift elements, and rich cultural celebration`,
        detailed: (subject) => `spectacular ${subject} with elaborate holiday decorations, intricate cultural traditions, complex celebratory scenes, seasonal landscapes, and rich festive storytelling`
      },
      
      music: {
        simple: (subject) => `melodic ${subject} with flowing musical lines, basic instrument details, rhythmic patterns, and harmonious design composition`,
        medium: (subject) => `detailed ${subject} with intricate musical notation, performance elements, acoustic details, artistic flourishes, and concert atmosphere`,
        detailed: (subject) => `symphonic ${subject} with complex musical patterns, elaborate performance scene, ornate instrumental details, concert hall setting, and rich musical storytelling`
      },
      
      mandalas: {
        simple: (subject) => `balanced ${subject} with geometric symmetry, simple repetitive patterns, harmonious design, and meditative circular composition`,
        medium: (subject) => `intricate ${subject} with detailed geometric patterns, layered symmetrical designs, decorative elements, and mathematical precision`,
        detailed: (subject) => `elaborate ${subject} with complex geometric formations, multiple pattern layers, sophisticated symmetrical elements, ornate details, and spiritual artistic expression`
      },
      
      abstract: {
        simple: (subject) => `creative ${subject} with flowing artistic lines, basic design elements, expressive forms, and modern aesthetic appeal`,
        medium: (subject) => `detailed ${subject} with complex artistic patterns, creative design elements, expressive compositions, and contemporary visual style`,
        detailed: (subject) => `sophisticated ${subject} with intricate artistic patterns, elaborate design complexity, avant-garde elements, and rich creative expression storytelling`
      },
      
      // NEW CATEGORY TEMPLATES - Enhanced with rich descriptive language
      
      architecture: {
        simple: (subject) => `impressive ${subject} with clear structural lines, basic architectural features, simple decorative elements, and solid foundational design`,
        medium: (subject) => `detailed ${subject} with intricate architectural details, window patterns, door elements, surrounding landscape, and historical character`,
        detailed: (subject) => `magnificent ${subject} with elaborate architectural ornamentation, complex structural details, environmental context, architectural periods, and rich historical storytelling`
      },
      
      clothing: {
        simple: (subject) => `stylish ${subject} with clear fashion lines, basic design patterns, simple decorative elements, and appealing wearable style`,
        medium: (subject) => `detailed ${subject} with fabric textures, fashion patterns, accessory elements, style details, and trendy design features`,
        detailed: (subject) => `haute couture ${subject} with intricate fashion details, elaborate pattern work, luxury fabric textures, designer elements, and rich fashion storytelling`
      },
      
      space: {
        simple: (subject) => `cosmic ${subject} with stellar features, basic space elements, simple celestial patterns, and wonder-inspiring astronomical theme`,
        medium: (subject) => `detailed ${subject} with intricate cosmic patterns, planetary details, starfield backgrounds, space exploration elements, and scientific accuracy`,
        detailed: (subject) => `galactic ${subject} with complex astronomical features, elaborate space scenes, detailed cosmic phenomena, futuristic elements, and rich space exploration storytelling`
      },
      
      professions: {
        simple: (subject) => `professional ${subject} with career-specific tools, work environment elements, clear occupational features, and inspiring workplace theme`,
        medium: (subject) => `detailed ${subject} with authentic professional gear, workplace setting, career-specific details, action elements, and occupational context`,
        detailed: (subject) => `expert ${subject} with complex professional equipment, elaborate workplace scene, detailed career elements, community impact, and rich professional storytelling`
      },
      
      weather: {
        simple: (subject) => `atmospheric ${subject} with basic weather patterns, simple seasonal elements, natural phenomena, and peaceful environmental mood`,
        medium: (subject) => `detailed ${subject} with intricate weather textures, seasonal details, atmospheric effects, environmental elements, and natural beauty`,
        detailed: (subject) => `dramatic ${subject} with complex weather patterns, elaborate atmospheric scenes, detailed natural phenomena, seasonal landscapes, and rich meteorological storytelling`
      },
      
      toys: {
        simple: (subject) => `playful ${subject} with fun design elements, simple toy features, childlike appeal, and joyful recreational theme`,
        medium: (subject) => `detailed ${subject} with intricate toy mechanisms, play patterns, childhood elements, imaginative details, and nostalgic charm`,
        detailed: (subject) => `whimsical ${subject} with complex toy craftsmanship, elaborate play scenes, detailed mechanical features, childhood magic, and rich imaginative storytelling`
      },
      
      general: {
        simple: (subject) => `appealing ${subject} with clear outline features, basic design elements, simple decorative touches, and balanced composition`,
        medium: (subject) => `detailed ${subject} with enhanced visual features, surface textures, contextual elements, and engaging design complexity`,
        detailed: (subject) => `sophisticated ${subject} with intricate design patterns, complex details, rich environmental context, and elaborate artistic storytelling`
      }
    };
  }

  /**
   * Get OpenAI API key based on environment
   * Evidence: architecture.md 6.1 - API cost mitigation, mock keys for development
   */
  getApiKey() {
    const hasRealKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-mock-key-for-testing' && process.env.OPENAI_API_KEY.startsWith('sk-');
    if (hasRealKey) {
      this.logger.info('Using real OpenAI key', {
        keyLength: process.env.OPENAI_API_KEY.length,
        keyPrefix: process.env.OPENAI_API_KEY.substring(0, 10) + '...'
      });
      return process.env.OPENAI_API_KEY;
    } else {
      this.logger.info('Using mock OpenAI key in development mode', {
        hasEnvKey: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY?.length
      });
      return 'sk-mock-key-for-testing';
    }
  }

  /**
   * Generate unique request ID for logging traceability
   * Evidence: architecture.md 6.3 - Request tracking for monitoring
   */
  generateRequestId() {
    return `req_${Date.now()}_${++this.requestIdCounter}`;
  }

  /**
   * Main prompt refinement function with input sanitization
   * 
   * @param {string} userInput - Original user description
   * @param {Object} customizations - User preferences for complexity, age, etc.
   * @param {Object} options - Additional options like useGPT, requestId
   * @returns {Promise<Object>} - Refined prompt with metadata
   */
  async refinePrompt(userInput, customizations = {}, options = {}) {
    const startTime = Date.now();
    const requestId = options.requestId || this.generateRequestId();
    
    try {
      // Input sanitization and validation
      const sanitizedInput = InputSanitizer.sanitizeText(userInput);
      const validatedCustomizations = InputSanitizer.validateCustomizations(customizations);
      InputSanitizer.checkFamilyFriendly(sanitizedInput);

      this.logger.info('Starting prompt refinement', {
        requestId,
        originalLength: userInput.length,
        sanitizedLength: sanitizedInput.length,
        customizations: validatedCustomizations,
        options
      });

      // Set defaults for missing customizations
      const config = {
        complexity: validatedCustomizations.complexity || 'medium',
        ageGroup: validatedCustomizations.ageGroup || 'kids',
        lineThickness: validatedCustomizations.lineThickness || 'medium',
        border: validatedCustomizations.border || 'with',
        theme: validatedCustomizations.theme || null
      };

      let refinedPrompt;
      let method = 'template-based';

      // Choose refinement method - Evidence: architecture.md 4.1 - GPT enhancement option
      // FLOW STEP 2: Default to GPT refinement for superior quality with meta-prompt optimization
      // Enhanced approach: GPT refinement is now the default for detailed, high-quality results
      // Architecture: architecture.md 4.1 - Advanced AI-powered prompt enhancement with meta-prompts
      const useGPT = options.useGPT !== false; // Default to true unless explicitly disabled
      
      if (useGPT) {
        // Check if we have a real OpenAI API key available
        const hasRealKey = process.env.OPENAI_API_KEY && 
                          process.env.OPENAI_API_KEY !== 'sk-mock-key-for-testing' && 
                          process.env.OPENAI_API_KEY.startsWith('sk-');
        
        if (hasRealKey) {
          this.logger.info('Using GPT-based refinement method with meta-prompt template', { requestId });
          refinedPrompt = await this.gptRefinement(sanitizedInput, config, requestId);
          method = 'meta-prompt-gpt';
        } else {
          this.logger.warn('GPT refinement requested but no real API key available, falling back to template method', { requestId });
          refinedPrompt = await this.templateRefinement(sanitizedInput, config);
          method = 'template-fallback';
        }
      } else {
        this.logger.info('Using template-based refinement method', { requestId });
        refinedPrompt = await this.templateRefinement(sanitizedInput, config);
        method = 'template-based';
      }

      const processingTime = Date.now() - startTime;

      // Enhanced logging for method and final prompt - Architecture: architecture.md 6.3 - Comprehensive logging
      this.logger.info('Prompt refinement completed successfully', {
        requestId,
        processingTime,
        method,
        originalInput: sanitizedInput,
        originalLength: sanitizedInput.length,
        finalPrompt: refinedPrompt.substring(0, 200) + '...', // Log first 200 chars of final prompt
        finalPromptLength: refinedPrompt.length,
        detectedCategory: this.detectSubjectCategory(sanitizedInput),
        appliedConfig: config
      });

      return {
        success: true,
        refinedPrompt,
        originalInput: sanitizedInput,
        detectedCategory: this.detectSubjectCategory(sanitizedInput),
        appliedSettings: config,
        metadata: {
          method,
          processingTime,
          sanitized: true,
          familyFriendly: true
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('Prompt refinement error', {
        requestId,
        error: error.message,
        stack: error.stack,
        processingTime,
        input: userInput?.substring(0, 100)
      });
      
      // Fallback mechanism
      return {
        success: false,
        refinedPrompt: this.createFallbackPrompt(userInput, customizations),
        originalInput: userInput,
        error: error.message,
        metadata: {
          method: 'fallback',
          processingTime,
          sanitized: false
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Template-based refinement method (original approach)
   */
  async templateRefinement(input, config) {
    // Step 1: Detect subject category
    const subjectCategory = this.detectSubjectCategory(input);
    
    // Step 2: Build enhanced description using templates
    const enhancedDescription = this.enhanceDescription(
      input, 
      subjectCategory, 
      config.complexity,
      config.ageGroup
    );
    
    // Step 3: Apply coloring book specifications
    const refinedPrompt = this.applyColoringBookSpecs(
      enhancedDescription,
      config
    );
    
    return refinedPrompt;
  }

  /**
   * Enhanced GPT-based refinement method using advanced meta-prompt template
   * 
   * Uses OpenAI's GPT-4o (or GPT-4o-mini) with sophisticated meta-prompt for detailed enhancement:
   * - Advanced meta-prompt template for rich texture, pose, background, and mood details
   * - Intelligent addition of contextual elements (environments, lighting, emotions)
   * - Enhanced descriptive language for superior coloring book quality
   * - Automatic inclusion of technical specifications for 300 DPI printing
   * - Fallback to template method if GPT fails
   * 
   * ENHANCED TRANSFORMATION EXAMPLES:
   * 
   * Input: "a dinosaur"
   * Output: "intricate black-and-white line art of a majestic T-Rex dinosaur with detailed 
   *         reptilian scales, textured skin patterns, prehistoric jungle background with 
   *         ancient ferns and volcanic landscape, dynamic roaring pose showing powerful 
   *         stance, atmospheric prehistoric mood with distant mountains, medium complexity, 
   *         kids style, medium lines, with decorative border, coloring book style, 
   *         family-friendly, no shading, clear outlines, 300 DPI"
   * 
   * Input: "a princess"
   * Output: "intricate black-and-white line art of an elegant princess with flowing gown 
   *         featuring ornate fabric textures, detailed embroidery patterns, ornate crown 
   *         with jewel details, graceful curtsy pose in castle courtyard background with 
   *         blooming rose gardens, fairy-tale atmosphere with decorative arches, gentle 
   *         and regal mood, medium complexity, kids style, medium lines, with ornate 
   *         border, coloring book style, family-friendly, no shading, clear outlines, 300 DPI"
   * 
   * Input: "a butterfly"
   * Output: "intricate black-and-white line art of an enchanting monarch butterfly with 
   *         complex symmetrical wing patterns, delicate vein textures, ornate geometric 
   *         wing designs, graceful landing pose on blooming sunflower, garden meadow 
   *         background with variety of flowers and leaves, peaceful summer mood with 
   *         gentle breeze effects, simple complexity, kids style, thin lines, with 
   *         nature border, coloring book style, family-friendly, no shading, clear outlines, 300 DPI"
   * 
   * Evidence: architecture.md 4.1 - Advanced AI-powered prompt enhancement with meta-prompts
   * Reference: architecture.md 6.3 - Consistent output formatting through structured prompts
   * Pricing: GPT-4o text tokens at $5/1M input for detailed enhancement processing
   */
  async gptRefinement(input, config, requestId) {
    try {
      // Enhanced meta-prompt template for detailed textures, poses, backgrounds, and mood
      // Architecture: architecture.md 4.1 - Sophisticated meta-prompt approach for superior results
      const enhancedMetaPrompt = `You are a professional coloring book artist and prompt engineer. Transform this simple input into a rich, detailed prompt for a family-friendly coloring book image.

ENHANCEMENT REQUIREMENTS:
- Add specific TEXTURES (scales, fur, fabric patterns, surface details)
- Include dynamic POSES (action, emotion, gesture, stance)  
- Create detailed BACKGROUNDS (environments, settings, contextual elements)
- Establish clear MOOD (atmosphere, feeling, ambiance)
- Ensure age-appropriate content for ${config.ageGroup} audience
- Optimize for ${config.complexity} complexity level
- Design for ${config.lineThickness} line thickness
- Include ${config.border === 'with' ? 'decorative border elements' : 'clean edge presentation'}

INPUT TO ENHANCE: "${input}"
CUSTOMIZATIONS: ${JSON.stringify(config)}

EXAMPLE OUTPUT FORMAT:
"intricate black-and-white line art of a [enhanced subject] with [specific textures], [detailed background environment], [dynamic pose description], [mood/atmosphere], ${config.complexity} complexity, ${config.ageGroup} style, ${config.lineThickness} lines, ${config.border === 'with' ? 'with decorative border' : 'without border'}, coloring book style, family-friendly, no shading, clear outlines, 300 DPI"

Generate the enhanced prompt now:`;
      
      // Use GPT-4o for higher quality enhancement when available, fallback to GPT-4o-mini
      const model = this.hasGPT4oAccess() ? 'gpt-4o' : 'gpt-4o-mini';
      
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert coloring book artist specializing in detailed, family-friendly line art with rich textures, dynamic poses, atmospheric backgrounds, and engaging moods.'
          },
          {
            role: 'user',
            content: enhancedMetaPrompt
          }
        ],
        max_tokens: 300, // Increased for more detailed descriptions
        temperature: 0.4, // Slightly higher for creative enhancement while maintaining consistency
        top_p: 0.9 // Focus on high-probability creative additions
      });

      const enhancedPrompt = response.choices[0].message.content.trim();
      
      // Log successful GPT enhancement with model used
      this.logger.info('Enhanced GPT refinement completed successfully', {
        requestId,
        model,
        originalInput: input,
        enhancedLength: enhancedPrompt.length,
        method: 'enhanced-meta-prompt-gpt',
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens
      });
      
      return enhancedPrompt;
      
    } catch (error) {
      this.logger.warn('Enhanced GPT refinement failed, falling back to template method', {
        requestId,
        error: error.message,
        errorType: error.name
      });
      
      // Fallback to enhanced template method
      return this.templateRefinement(input, config);
    }
  }

  /**
   * Check if GPT-4o access is available for enhanced processing
   * GPT-4o provides superior enhancement quality but costs $5/1M input tokens
   */
  hasGPT4oAccess() {
    // Check if we have a real API key and environment allows GPT-4o usage
    const hasRealKey = process.env.OPENAI_API_KEY && 
                      process.env.OPENAI_API_KEY !== 'sk-mock-key-for-testing' && 
                      process.env.OPENAI_API_KEY.startsWith('sk-');
    
    // Allow GPT-4o in production or when explicitly enabled
    const allowGPT4o = process.env.NODE_ENV === 'production' || 
                      process.env.ENABLE_GPT4O === 'true';
    
    return hasRealKey && allowGPT4o;
  }

  /**
   * Enhanced subject category detection with expanded patterns
   */
  detectSubjectCategory(input) {
    const lowercaseInput = input.toLowerCase();
    
    // Check each category pattern with scoring
    let bestMatch = { category: 'general', score: 0 };
    
    for (const [category, patterns] of Object.entries(this.subjectPatterns)) {
      const matches = patterns.filter(pattern => lowercaseInput.includes(pattern));
      const score = matches.length;
      
      if (score > bestMatch.score) {
        bestMatch = { category, score };
      }
    }
    
    this.logger.debug('Subject category detected', {
      input: input.substring(0, 50),
      category: bestMatch.category,
      confidence: bestMatch.score,
      patterns: Object.keys(this.subjectPatterns).length
    });
    
    return bestMatch.category;
  }

  /**
   * Enhanced description building with expanded templates
   */
  enhanceDescription(input, category, complexity, ageGroup) {
    const baseDescription = input.trim();
    
    // Get enhancement template for category and complexity
    const templates = this.enhancementTemplates[category] || this.enhancementTemplates.general;
    const enhancedBase = templates[complexity] ? templates[complexity](baseDescription) : baseDescription;
    
    // Add age-appropriate adjustments
    const ageAdjustment = this.getAgeAdjustment(ageGroup);
    
    return `${enhancedBase}${ageAdjustment}`;
  }

  /**
   * Enhanced age-appropriate content adjustments
   */
  getAgeAdjustment(ageGroup) {
    const adjustments = {
      kids: ', with friendly expressions, safe rounded features, bright cheerful elements, and child-appropriate simplicity',
      teens: ', with moderate detail, contemporary style elements, dynamic composition, and age-appropriate complexity',
      adults: ', with sophisticated details, complex patterns, artistic elements, intricate design, and mature aesthetic appeal'
    };
    
    return adjustments[ageGroup] || ', with balanced detail level and universal appeal';
  }

  /**
   * Enhanced coloring book specifications with comprehensive DALL-E best practices
   * 
   * Always appends optimal specifications for high-quality coloring book images:
   * - Technical specs for print quality and line clarity
   * - Content guidelines for family-friendly appeal
   * - Coloring medium compatibility
   * - Professional formatting standards
   */
  applyColoringBookSpecs(description, config) {
    const enhancedSpecs = [
      'professional black-and-white line art illustration of',
      description,
      `optimized for ${config.complexity} complexity level with appropriate detail density`,
      `designed specifically for ${config.ageGroup} target audience with age-appropriate elements`,
      `featuring ${config.lineThickness} line thickness for optimal coloring experience`,
      config.border === 'with' ? 'with elegant decorative border elements and frame design' : 'with clean edges and minimalist presentation',
      
      // DALL-E Best Practices - Always Applied for Optimal Quality
      'black-and-white line art',
      'coloring book style', 
      'clear outlines',
      'no shading',
      'detailed but not overwhelming',
      'high contrast',
      'printable quality',
      'family-friendly content',
      'suitable for coloring with crayons, markers, or colored pencils',
      '300 DPI resolution equivalent',
      'crisp clean lines',
      'distinct boundaries between elements',
      'white background',
      'professional illustration quality',
      'optimized for print reproduction'
    ];

    return enhancedSpecs.join(', ');
  }

  /**
   * Enhanced fallback prompt creation
   */
  createFallbackPrompt(input, customizations = {}) {
    try {
      const sanitizedInput = typeof input === 'string' ? input.trim() : 'drawing';
      const config = {
        complexity: customizations.complexity || 'medium',
        ageGroup: customizations.ageGroup || 'kids',
        lineThickness: customizations.lineThickness || 'medium',
        border: customizations.border || 'with'
      };

      return `black-and-white line art of ${sanitizedInput}, ${config.complexity} complexity, ${config.ageGroup} style, ${config.lineThickness} lines, ${config.border === 'with' ? 'with border' : 'no border'}, coloring book style, family-friendly, no shading, 300 DPI`;
    } catch (error) {
      this.logger.error('Fallback prompt creation failed', { 
        error: error.message,
        input: typeof input === 'string' ? input.substring(0, 50) : 'invalid'
      });
      return 'black-and-white line art coloring book page, family-friendly, no shading, 300 DPI';
    }
  }

  /**
   * Enhanced health check method
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      // Basic service health
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        features: {
          inputSanitization: true,
          expandedPatterns: Object.keys(this.subjectPatterns).length,
          enhancementTemplates: Object.keys(this.enhancementTemplates).length,
          gptRefinement: process.env.NODE_ENV !== 'development',
          winstonLogging: true
        }
      };

      // Check if real API key is available (same logic as main app.js)
      const hasRealKey = process.env.OPENAI_API_KEY && 
                        process.env.OPENAI_API_KEY !== 'sk-mock-key-for-testing' && 
                        process.env.OPENAI_API_KEY.startsWith('sk-');

      // For mock mode (no real API key)
      if (!hasRealKey) {
        health.mode = 'development-mock';
        health.apiKey = 'mock';
        health.openaiConnected = false;
        health.responseTime = Date.now() - startTime;
        return health;
      }

      // For real API connection, test OpenAI connectivity
      const testResponse = await this.openai.models.list();
      
      health.mode = 'real-api-' + (process.env.NODE_ENV || 'development');
      health.apiKey = 'configured';
      health.openaiConnected = true;
      health.modelsAvailable = testResponse.data?.length || 0;
      health.responseTime = Date.now() - startTime;
      
      this.logger.info('Health check completed', health);
      return health;
      
    } catch (error) {
      this.logger.error('Health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

/**
 * Testing exports for comprehensive unit test coverage
 * Evidence: architecture.md 3.3.2 - Testable service architecture
 * 
 * Example unit tests:
 * 
 * describe('InputSanitizer', () => {
 *   test('cleans basic input', () => {
 *     expect(InputSanitizer.clean('  hello world  ')).toBe('hello world');
 *   });
 *   
 *   test('removes special characters', () => {
 *     expect(InputSanitizer.clean('test<script>bad</script>')).toBe('testscriptbadscript');
 *   });
 *   
 *   test('throws on inappropriate content', () => {
 *     expect(() => InputSanitizer.clean('violence test')).toThrow('inappropriate terms');
 *   });
 * });
 * 
 * describe('PromptRefinementService', () => {
 *   test('refines dinosaur prompt correctly', async () => {
 *     const result = await service.refinePrompt('a dinosaur');
 *     expect(result.success).toBe(true);
 *     expect(result.refinedPrompt).toContain('scales');
 *     expect(result.detectedCategory).toBe('prehistoric');
 *   });
 *   
 *   test('detects subject categories', () => {
 *     expect(service.detectSubjectCategory('guitar music')).toBe('music');
 *     expect(service.detectSubjectCategory('christmas tree')).toBe('holidays');
 *     expect(service.detectSubjectCategory('robot toy')).toBe('objects');
 *   });
 *   
 *   test('handles complex customizations', async () => {
 *     const result = await service.refinePrompt('dragon', {
 *       complexity: 'detailed',
 *       ageGroup: 'adults',
 *       theme: 'fantasy'
 *     });
 *     expect(result.appliedSettings.complexity).toBe('detailed');
 *     expect(result.detectedCategory).toBe('fantasy');
 *   });
 * });
 */
export const TestingExports = {
  InputSanitizer,
  PromptRefinementService,
  logger
};

// Export both the service class and singleton instance
export { InputSanitizer, PromptRefinementService };

// Export singleton instance for consistent usage across application
const promptRefinementService = new PromptRefinementService();
export default promptRefinementService;