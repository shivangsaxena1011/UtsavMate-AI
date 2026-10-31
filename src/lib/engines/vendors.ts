import { EventType, Vendor } from "../types";

export interface VendorTemplate {
  category: string;
  defaultName: string;
  suggestedPercent: number;
  questionsToAsk: string[];
}

export const VENDOR_TEMPLATES: Record<EventType, VendorTemplate[]> = {
  wedding: [
    {
      category: "Venue",
      defaultName: "Banquet Hall / Lawn Vendor",
      suggestedPercent: 30,
      questionsToAsk: [
        "What is the hall capacity for seating vs floating guests?",
        "Is in-house catering mandatory or are outside caterers allowed?",
        "What are the sound curfew rules and generator backup arrangements?",
        "Are changing/bridal green rooms included in the booking price?",
      ],
    },
    {
      category: "Catering",
      defaultName: "Wedding Catering & Sweets",
      suggestedPercent: 30,
      questionsToAsk: [
        "What is the per-plate charge for vegetarian/non-vegetarian menus?",
        "Do you provide live counters (Chaat, Pasta, Tandoor, Mocktail bar)?",
        "How are food leftover management and hygienic disposal handled?",
        "How many uniformed service staff and table captains will be deployed?",
      ],
    },
    {
      category: "Photography",
      defaultName: "Candid & Cinematic Studio",
      suggestedPercent: 10,
      questionsToAsk: [
        "How many photographers and cinematographers are on the team?",
        "Will we get all raw footage and high-res edited pictures?",
        "What is the delivery turnaround time for the teaser and full album?",
        "Are drone photography permissions and operator costs included?",
      ],
    },
    {
      category: "Decoration",
      defaultName: "Floral & Stage Decorator",
      suggestedPercent: 10,
      questionsToAsk: [
        "Does the quote include entrance gate, walkway, mandap, and stage setup?",
        "Are artificial flowers used or fresh seasonal blossoms (marigold, roses, jasmine)?",
        "Will there be LED mood lighting, fairy lights, and stage spotlights?",
        "Can you share photos of past setups done at our booked venue?",
      ],
    },
    {
      category: "Entertainment",
      defaultName: "DJ & Sound Operator",
      suggestedPercent: 5,
      questionsToAsk: [
        "What sound equipment (JBL/Line array) and console will be brought?",
        "Do you have a dedicated Punjabi/Bollywood/Regional dance playlist?",
        "Are dhol players or backup mics included for sangeet performances?",
      ],
    },
  ],
  birthday: [
    {
      category: "Venue",
      defaultName: "Party Hall / Cafe Lounge",
      suggestedPercent: 25,
      questionsToAsk: [
        "How many hours of hall access are provided?",
        "Is balloon taping on walls allowed?",
        "Is there dedicated kids play space or toddler area?",
      ],
    },
    {
      category: "Catering",
      defaultName: "Birthday Buffet & Bakery",
      suggestedPercent: 35,
      questionsToAsk: [
        "Can you make custom themed fondants or fresh cream cakes?",
        "Are kids-friendly snacks included (mini burgers, pizzas, fries)?",
        "Do you provide paper cups, plates, and cutleries?",
      ],
    },
    {
      category: "Entertainment",
      defaultName: "Game Host / Magician / Anchor",
      suggestedPercent: 15,
      questionsToAsk: [
        "What is the duration of the magic show or game session?",
        "Do you provide music system and wireless microphone?",
        "Are small game prize gifts included in your package?",
      ],
    },
    {
      category: "Decoration",
      defaultName: "Balloon & Backdrop Artist",
      suggestedPercent: 10,
      questionsToAsk: [
        "Is organic balloon garland and thematic cutouts included?",
        "Do you provide neon light signage (e.g., 'Happy Birthday')?",
      ],
    },
  ],
  community: [
    {
      category: "Venue / Pandal",
      defaultName: "Tent & Shamiana Vendor",
      suggestedPercent: 25,
      questionsToAsk: [
        "Is water-proof tarpaulin provided in case of unexpected rain?",
        "How many plastic/cushioned chairs, sofa sets, and tables are included?",
        "Are fire extinguishers and safety exits verified?",
      ],
    },
    {
      category: "Catering",
      defaultName: "Mahaprasad & Community Kitchen",
      suggestedPercent: 35,
      questionsToAsk: [
        "Do you have large capacity cauldrons/bhattis for mass cooking?",
        "Are eco-friendly patravalis (leaf plates) and kulhads sourced?",
        "What is the timeline for food preparation before distribution?",
      ],
    },
    {
      category: "Sound & Stage",
      defaultName: "Public Address System Vendor",
      suggestedPercent: 15,
      questionsToAsk: [
        "How many horn speakers and monitor speakers will cover the ground?",
        "Is heavy-duty generator power backup available?",
        "Do you have cordless mics and podium mic stands?",
      ],
    },
  ],
  anniversary: [],
  college_fest: [],
  custom: [],
};

export function generateInitialVendors(
  eventType: EventType,
  totalBudget: number,
  eventId: string = "default"
): Vendor[] {
  const templates =
    VENDOR_TEMPLATES[eventType] && VENDOR_TEMPLATES[eventType].length > 0
      ? VENDOR_TEMPLATES[eventType]
      : VENDOR_TEMPLATES.wedding;

  return templates.map((tmpl, idx) => {
    const est = Math.round((totalBudget * tmpl.suggestedPercent) / 100);
    return {
      id: `vnd-${idx}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      eventId,
      category: tmpl.category,
      businessName: tmpl.defaultName,
      contactPerson: "Vendor Representative",
      phone: "+91 98765 43210",
      email: "contact@vendor.example.com",
      estimatedQuote: est,
      finalQuote: 0,
      status: "not_contacted",
      notes: "Sample vendor record. Update with real contact and quote details.",
      questionsToAsk: tmpl.questionsToAsk,
    };
  });
}
