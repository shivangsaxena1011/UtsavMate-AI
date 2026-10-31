/**
 * @file fallback-provider.ts
 * @module lib/ai/fallback-provider
 * @description Intelligent deterministic plan generator providing offline, zero-latency
 * culturally attuned event plans in English, Hindi, and Hinglish.
 */

import { EventRecord } from "../types";
import { GeneratedPlan } from "./types";
import { formatINR } from "../engines/budget";

/**
 * Generates an intelligent, deterministic celebration plan tailored to event type, city, budget, and language.
 *
 * @param event - The master event record specifications
 * @returns Fully populated, validated GeneratedPlan object
 *
 * @example
 * ```ts
 * const plan = generateDeterministicPlan(eventRecord);
 * console.log(plan.themeConcepts.length); // >= 2
 * ```
 */
export function generateDeterministicPlan(event: EventRecord): GeneratedPlan {
  const isHindi = event.language === "hi";
  const isHinglish = event.language === "hinglish";
  const budgetFormatted = formatINR(event.totalBudget);

  if (event.eventType === "wedding") {
    if (isHindi) {
      return {
        overview: `${event.city} में ${event.guestCount} अतिथियों के लिए भव्य भारतीय विवाह समारोह। कुल बजट ${budgetFormatted} के अंतर्गत सुंदर और यादगार उत्सव।`,
        themeConcepts: [
          {
            name: "शाही रजवाड़ा (Royal Heritage)",
            tagline: "परंपरा और भव्यता का अनुपम संगम",
            description: "गहरे मैरून, सुनहरा और हाथीदांत रंगों के साथ पारंपरिक राजस्थानी मांडना और मारवाड़ शैली की सजावट।",
            colorPalette: ["#800020", "#D4AF37", "#FFFFF0", "#556B2F"],
            vibe: "पारंपरिक, राजसी और सुरुचिपूर्ण",
          },
          {
            name: "गुलाब और कस्तूरी (Pastel Bloom)",
            tagline: "आधुनिक सुरुचिपूर्ण पेस्टल उत्सव",
            description: "हल्के गुलाबी, पिस्ता हरा और आइवरी मोगरा फूलों से सुसज्जित शांत एवं सुखद वातावरण।",
            colorPalette: ["#FFD1DC", "#C1E1C1", "#FFFDD0", "#E6E6FA"],
            vibe: "सौम्य, आधुनिक एवं स्वप्निल",
          },
        ],
        personalizedIdeas: [
          {
            section: "decor",
            title: "गेंदा और पीतल के बर्तन (Marigold & Brass)",
            description: "स्थानीय गेंदा फूलों की लड़ियां और पीतल के उरली में तैरते दीप, जो कम खर्च में भव्य और सुगंधित माहौल बनाते हैं।",
            costTier: "$",
            tags: ["Eco-friendly", "Traditional"],
          },
          {
            section: "food",
            title: "लाइव चाट और क्षेत्रीय व्यंजन",
            description: `${event.city} के प्रसिद्ध स्ट्रीट फूड (पानी पूरी, टिक्की, दही भल्ले) के लाइव स्टॉल और शुद्ध घी की जलेबी-रबड़ी।`,
            costTier: "$$",
            tags: ["Live Counter", "Crowd Favorite"],
          },
          {
            section: "activity",
            title: "पारंपरिक संगीत व ढोल नाइट",
            description: "परिवार के सदस्यों द्वारा संगीत कोरियोग्राफी और स्वागत के लिए नगाड़ा/ढोल वादक दल।",
            costTier: "$$",
            tags: ["Family Fun", "Sangeet"],
          },
          {
            section: "favor",
            title: "हस्तशिल्प पोटली व मिठाई के डिब्बे",
            description: "स्थानीय कारीगरों द्वारा तैयार गोटा-पट्टी पोटली जिसमें सूखे मेवे या पारंपरिक मिठाई हो।",
            costTier: "$",
            tags: ["Artisanal", "Sustainable"],
          },
        ],
        costSavingTips: [
          "मौसमी स्थानीय फूलों (गेंदा, चमेली) का उपयोग करें; विदेशी ऑर्किड की तुलना में 40% तक बचत होती है।",
          "डिजिटल ई-इनविटेशन और व्हाट्सएप वीडियो कार्ड अपनाकर छपाई व कूरियर का खर्च घटाएं।",
          "एक ही स्थल पर मेहंदी और संगीत आयोजित करने से स्थल किराया कम होता है।",
        ],
        riskAndContingencies: [
          "मौसम के अनुसार वाटरप्रूफ टेंट या शेड का पहले से प्रबंध रखें।",
          "अतिथियों की संख्या में 10% उतार-चढ़ाव हेतु कैटरर से बफर प्लेट्स पूर्व-निर्धारित करें।",
        ],
        nextActionRecommendations: [
          "3 मुख्य बैंक्वेट हॉल्स की उपलब्धता और पॉवर बैकअप की जांच करें।",
          "कैटरर के साथ स्वाद परीक्षण (Food Tasting) शेड्यूल करें।",
        ],
        culturalNotes: "सभी शुभ मुहूर्तों और पारिवारिक परंपराओं का विशेष ध्यान रखा गया है।",
      };
    }

    if (isHinglish) {
      return {
        overview: `${event.city} me ${event.guestCount} guests ke liye complete wedding celebration plan within a budget of ${budgetFormatted}. Perfect blend of tradition and modern vibe.`,
        themeConcepts: [
          {
            name: "Royal Heritage Glam",
            tagline: "Desi Shaadi ka Shandar Andaaz",
            description: "Rich maroon, warm gold aur ivory shades ke saath royal palace feel aur traditional brass diya setup.",
            colorPalette: ["#800000", "#FFD700", "#FFF8DC", "#8B4513"],
            vibe: "Grand, Regal and Memorable",
          },
          {
            name: "Pastel Dream Revival",
            tagline: "Fresh, Floral & Instagram-Ready",
            description: "Blush pink, mint green and fresh mogra setup for morning mehendi and evening reception.",
            colorPalette: ["#FFB6C1", "#98FB98", "#FFFFF0", "#E6E6FA"],
            vibe: "Aesthetic, Youthful and Elegant",
          },
        ],
        personalizedIdeas: [
          {
            section: "decor",
            title: "Local Marigold & Fairy Light Canopy",
            description: "Genda phool aur fairy lights ka dense canopy jo evening reception me magical glow deta hai without breaking budget.",
            costTier: "$",
            tags: ["Pocket-friendly", "High-Impact"],
          },
          {
            section: "food",
            title: "Local Delicacies & Live Chaat Counter",
            description: `${event.city} ke special street foods, live tandoor and hot jalebi-rabdi counter for an irresistible feast.`,
            costTier: "$$",
            tags: ["Guest Delight", "Vegetarian"],
          },
          {
            section: "activity",
            title: "Flashmob & Sangeet Dance-off",
            description: "Groom vs Bride side dance competitions with a fun emcee hosting rapid-fire games.",
            costTier: "$",
            tags: ["Interactive", "Fun"],
          },
          {
            section: "favor",
            title: "Handmade Potlis & Mithai Hampers",
            description: "Eco-friendly potli bags filled with homemade sweets or dry fruits as sweet thank-you tokens.",
            costTier: "$",
            tags: ["Sustainable", "Thoughtful"],
          },
        ],
        costSavingTips: [
          "Imported flowers ki jagah local seasonal marigold aur mogra choose karein, 35-40% decor budget save hoga.",
          "Digital video invites WhatsApp par share karein to paper print and courier cost bachegi.",
          "Caterer se per-plate pricing me live counters bundle karne ka negotiation karein.",
        ],
        riskAndContingencies: [
          "Venue par heavy power cuts ke liye silent generator backup ensure karein.",
          "10% extra buffer plates caterer ke saath lock karein to avoid last-minute food shortage.",
        ],
        nextActionRecommendations: [
          "Top 2 venues shortlist karein aur booking dates confirm karein.",
          "Catering menu finalize karke tasting session plan karein.",
        ],
        culturalNotes: "Traditional rituals aur festive warmth ko prioritize kiya gaya hai.",
      };
    }

    // Default English
    return {
      overview: `A refined Indian wedding reception in ${event.city} for ${event.guestCount} guests designed within your ${budgetFormatted} budget. Perfectly balanced between cultural warmth and seamless modern organization.`,
      themeConcepts: [
        {
          name: "Regal Heritage & Brass Radiance",
          tagline: "Timeless Indian Splendor",
          description: "Warm crimson, antique gold, and ivory tones complemented by brass urlis with floating diyas and aromatic marigolds.",
          colorPalette: ["#800020", "#D4AF37", "#FFFFF0", "#2E4057"],
          vibe: "Regal, Warm, and Dignified",
        },
        {
          name: "Pastel Blossom & Botanical Chic",
          tagline: "Contemporary Minimalist Charm",
          description: "Blush rose, sage green, and white jasmine florals paired with delicate fairy light drapes and warm ambient uplighting.",
          colorPalette: ["#FAD2E1", "#C5DCA0", "#FFFDF0", "#DFCCF1"],
          vibe: "Ethereal, Romantic, and Photogenic",
        },
      ],
      personalizedIdeas: [
        {
          section: "decor",
          title: "Fairy Light Tunnel & Marigold Chandeliers",
          description: "A stunning entrance walkway lined with cascading marigold strings and fairy lights creating high visual impact at optimal cost.",
          costTier: "$",
          tags: ["High Impact", "Budget Friendly"],
        },
        {
          section: "food",
          title: "Regional Specialty Live Counters",
          description: `Interactive live chaat stations featuring ${event.city} street favorites, artisanal wood-fired breads, and a live Jalebi-Rabdi station.`,
          costTier: "$$",
          tags: ["Live Station", "Crowd Pleaser"],
        },
        {
          section: "activity",
          title: "Audio Guestbook & Polaroid Wall",
          description: "A retro rotary phone where guests record audio voice messages alongside an instant photo booth where guests peg instant photos.",
          costTier: "$$",
          tags: ["Memorable", "Interactive"],
        },
        {
          section: "favor",
          title: "Handcrafted Jute/Silk Potlis",
          description: "Eco-friendly embroidered potlis with artisanal sweets or seed paper thank-you notes that blossom when planted.",
          costTier: "$",
          tags: ["Eco-friendly", "Artisanal"],
        },
      ],
      costSavingTips: [
        "Opt for locally grown seasonal florals (marigolds, tuberoses, jasmine) over imported orchids to reduce floral expenses by up to 40%.",
        "Streamline menu items: 4 high-quality live counters often impress guests more than 20 generic cold buffet chafing dishes.",
        "Send interactive digital video invitations to reduce high printing, boxing, and distribution costs.",
      ],
      riskAndContingencies: [
        "Ensure the venue provides dedicated 60kVA generator backup with automatic phase changeover for stage lights and sound.",
        "Contract a +/- 10% flexible plate buffer with the caterer to avoid wastage while comfortably accommodating unexpected attendees.",
      ],
      nextActionRecommendations: [
        "Shortlist and schedule venue walkthroughs in Bhopal.",
        "Request sample contracts and schedule a menu tasting session with 2 caterers.",
      ],
      culturalNotes: "Structured around warm hospitality, respectful customs, and festive joy.",
    };
  }

  if (event.eventType === "birthday" || event.eventType === "anniversary") {
    return {
      overview: `A vibrant ${event.eventType} celebration in ${event.city} for ${event.guestCount} guests tailored within a ${budgetFormatted} budget.`,
      themeConcepts: [
        {
          name: "Sunset Bohemian Fiesta",
          tagline: "Warm Vibes, Music, and Celebration",
          description: "Terracotta accents, macrame backdrops, cozy lounge seating, and warm glowing bistro lights.",
          colorPalette: ["#E76F51", "#F4A261", "#E9C46A", "#264653"],
          vibe: "Cozy, Celebratory, and Fun",
        },
        {
          name: "Neon Glow & Retro Beats",
          tagline: "High Energy Party Atmosphere",
          description: "Custom neon sign backdrop, illuminated photo corner, and upbeat pop/Bollywood playlist.",
          colorPalette: ["#FF007F", "#7928CA", "#00DFD8", "#111111"],
          vibe: "Energetic, Modern, and Playful",
        },
      ],
      personalizedIdeas: [
        {
          section: "decor",
          title: "Organic Balloon Arch & Neon Name Sign",
          description: "A dual-toned organic balloon garland with a reusable warm-white neon name sign for hero photos.",
          costTier: "$",
          tags: ["Photo Corner", "Trendy"],
        },
        {
          section: "food",
          title: "Gourmet Sliders, Finger Foods & Custom Cake",
          description: "Interactive finger food buffet with gourmet sliders, loaded nachos, mocktail bar, and a centerpiece tiered cake.",
          costTier: "$$",
          tags: ["Party Food", "Kids & Adults"],
        },
        {
          section: "activity",
          title: "Trivia Game & Instant Polaroid Keepsakes",
          description: "A customized trivia game about the guest of honor, followed by photo keepsakes.",
          costTier: "$",
          tags: ["Engaging", "Keepsake"],
        },
      ],
      costSavingTips: [
        "Host during afternoon high-tea or early evening to optimize catering costs compared to full multi-course dinners.",
        "Create a Spotify collaborative playlist instead of hiring a full sound rig if the venue has an AUX system.",
      ],
      riskAndContingencies: [
        "Confirm refrigeration facilities at the venue for the birthday cake.",
      ],
      nextActionRecommendations: [
        "Book the party venue or cafe lounge space.",
        "Finalize cake design and baker delivery schedule.",
      ],
    };
  }

  // Community or college event
  return {
    overview: `An organized, vibrant ${event.eventType.replace("_", " ")} gathering in ${event.city} for ${event.guestCount} participants within ${budgetFormatted}.`,
    themeConcepts: [
      {
        name: "Unity in Festivity",
        tagline: "Connecting Hearts & Community Spirit",
        description: "Vibrant traditional decor, comfortable shaded seating, clear signage, and cultural stage setup.",
        colorPalette: ["#E63946", "#F1FAEE", "#A8DADC", "#457B9D"],
        vibe: "Inclusive, Festive, and Well-Organized",
      },
    ],
    personalizedIdeas: [
      {
        section: "decor",
        title: "Eco-friendly Fabric Drapes & Banners",
        description: "Washable fabric bunting and reusable welcome flex boards for clean aesthetic with zero plastic waste.",
        costTier: "$",
        tags: ["Eco-friendly", "Cost-effective"],
      },
      {
        section: "food",
        title: "Community Feast / Prasad Kitchen",
        description: "Hygienic batch-cooked meal served in leaf plates (patravali) with safe packaged drinking water dispensers.",
        costTier: "$",
        tags: ["Wholesome", "Eco-friendly"],
      },
      {
        section: "activity",
        title: "Cultural Performances & Volunteer Recognition",
        description: "Structured stage schedule for community talents and certificate distribution for volunteers.",
        costTier: "$",
        tags: ["Community", "Stage"],
      },
    ],
    costSavingTips: [
      "Mobilize community volunteers for setup and distribution to minimize paid labor costs.",
      "Partner with local sponsors or cooperative banks for banner sponsorship.",
    ],
    riskAndContingencies: [
      "Arrange first-aid station and clear pedestrian emergency exit corridors.",
      "Secure municipal and police noise permits in advance.",
    ],
    nextActionRecommendations: [
      "Submit local ground/hall permit applications.",
      "Convene volunteer committee meeting to divide responsibilities.",
    ],
  };
}
