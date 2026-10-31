/**
 * @file vendors.ts
 * @module lib/engines/vendors
 * @description Vendor template management and quote estimation engine tailored for Indian celebrations.
 * Synthesizes default vendor checklists, percentage-based budget allocations, and cultural vetting inquiries.
 */

import { EventType, Vendor } from "../types";

/**
 * Template structure defining default supplier attributes and vetting questions.
 */
export interface VendorTemplate {
  /** Commercial category (e.g. "Venue", "Catering", "Photography") */
  category: string;
  /** Suggested default business placeholder name */
  defaultName: string;
  /** Recommended percentage of overall budget */
  suggestedPercent: number;
  /** Essential culturally attuned vetting questions to ask contractor */
  questionsToAsk: string[];
}

/**
 * Standard vendor supplier configurations across celebration types.
 */
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
  anniversary: [
    {
      category: "Venue",
      defaultName: "Boutique Banquet or Heritage Hall",
      suggestedPercent: 30,
      questionsToAsk: [
        "Is there an intimate private dining or ballroom space for families?",
        "Are audio/video projectors available for memory montage screenings?",
      ],
    },
    {
      category: "Catering",
      defaultName: "Gourmet Family Feast Caterer",
      suggestedPercent: 35,
      questionsToAsk: [
        "Can you customize a nostalgic menu with traditional delicacies?",
        "Do you provide a customized multi-tiered anniversary cake?",
      ],
    },
    {
      category: "Photography",
      defaultName: "Portrait & Family Documentarian",
      suggestedPercent: 15,
      questionsToAsk: [
        "Can we schedule a pre-event couple portrait session?",
        "Do you provide a printed keepsake album for the couple?",
      ],
    },
    {
      category: "Decoration",
      defaultName: "Warm Fairy-light & Floral Decor",
      suggestedPercent: 15,
      questionsToAsk: [
        "Can you incorporate vintage family photos into the centerpiece decor?",
      ],
    },
  ],
  college_fest: [
    {
      category: "Stage & Sound",
      defaultName: "Pro Stage, Truss & Line-Array Audio",
      suggestedPercent: 35,
      questionsToAsk: [
        "What is the wattage and coverage capacity of the audio setup?",
        "Do you have lighting consoles, smoke machines, and LED walls?",
      ],
    },
    {
      category: "Artist / Band",
      defaultName: "Headline Band / DJ Artist Booking",
      suggestedPercent: 30,
      questionsToAsk: [
        "What are the technical rider and hospitality requirements?",
        "What is the performance duration and curfew timing?",
      ],
    },
    {
      category: "Food Stalls",
      defaultName: "Multi-Cuisine Youth Food Court",
      suggestedPercent: 20,
      questionsToAsk: [
        "How many concurrent food kiosks and quick-serve counters can be deployed?",
        "Are digital payment setups ready at each counter?",
      ],
    },
    {
      category: "Security & Crowd Control",
      defaultName: "Event Marshall & Barricading Team",
      suggestedPercent: 10,
      questionsToAsk: [
        "Do you provide mojo barricades for the stage perimeter?",
        "How many trained marshalls and female security staff are provided?",
      ],
    },
  ],
  custom: [
    {
      category: "Venue",
      defaultName: "Event Venue Coordinator",
      suggestedPercent: 30,
      questionsToAsk: [
        "What are the venue rental hours, load-in, and tear-down windows?",
        "What safety, fire, and municipal permissions are required?",
      ],
    },
    {
      category: "Catering",
      defaultName: "Custom Event Caterer",
      suggestedPercent: 35,
      questionsToAsk: [
        "Can menus be adapted to dietary restrictions (vegan, jain, gluten-free)?",
      ],
    },
    {
      category: "Production",
      defaultName: "Audio, Visual & Decor Team",
      suggestedPercent: 25,
      questionsToAsk: [
        "Do you handle complete AV, backdrop, and ambient illumination?",
      ],
    },
  ],
};

/**
 * Generates baseline vendor supplier records with suggested quote allocations and cultural vetting questions.
 *
 * @param eventType - Category of celebration (e.g. "wedding", "birthday", "community")
 * @param totalBudget - Overall event budget in INR
 * @param eventId - Parent event ID
 * @returns Initialized Vendor records ready for tracking
 *
 * @example
 * ```ts
 * const vendors = generateInitialVendors("wedding", 500000, "evt-123");
 * console.log(`Generated ${vendors.length} vendor supplier records`);
 * ```
 */
export function generateInitialVendors(
  eventType: EventType,
  totalBudget: number,
  eventId: string = "default"
): Vendor[] {
  const safeBudget = Math.max(0, totalBudget);
  const templates =
    VENDOR_TEMPLATES[eventType] && VENDOR_TEMPLATES[eventType].length > 0
      ? VENDOR_TEMPLATES[eventType]
      : VENDOR_TEMPLATES.wedding;

  return templates.map((tmpl, idx) => {
    const est = Math.round((safeBudget * tmpl.suggestedPercent) / 100);
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
