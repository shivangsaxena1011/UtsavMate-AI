/**
 * @file timeline.ts
 * @module lib/engines/timeline
 * @description Generates culturally attuned milestone tasks relative to event target dates
 * and exports standard RFC 5545 iCalendar (.ics) files.
 */

import { EventType, TimelineTask } from "../types";

/**
 * Internal template specification defining a single chronological milestone rule.
 */
export interface MilestoneRule {
  /** Day offset relative to the event date (Negative = before event, 0 = event day, Positive = after event) */
  offsetDays: number;
  /** Actionable milestone headline */
  title: string;
  /** Comprehensive checklist guidance and tasks */
  description: string;
  /** Priority level */
  priority: "high" | "medium" | "low";
  /** Functional category */
  category: string;
}

/**
 * Standard milestone progression for Indian wedding ceremonies.
 */
const WEDDING_MILESTONES: MilestoneRule[] = [
  {
    offsetDays: -120,
    title: "Finalize Venue & Date Locking",
    description: "Book main reception/wedding hall or resort and verify backup power, parking, and catering policy.",
    priority: "high",
    category: "Venue",
  },
  {
    offsetDays: -90,
    title: "Select & Book Caterer",
    description: "Finalize catering menu, tasting sessions (Live chaat, mains, Indian desserts), and per-plate pricing.",
    priority: "high",
    category: "Catering",
  },
  {
    offsetDays: -75,
    title: "Hire Photographer & Videographer",
    description: "Confirm package: candid photography, drone shots, traditional video, and album delivery timelines.",
    priority: "high",
    category: "Photography",
  },
  {
    offsetDays: -60,
    title: "Finalize Decor Theme & Mandap Concept",
    description: "Meet decorator for entrance gate, stage/mandap floral setup, lighting, and photo booth concepts.",
    priority: "medium",
    category: "Decor",
  },
  {
    offsetDays: -45,
    title: "Order Invitations & Create Digital E-Invites",
    description: "Design physical cards or digital video cards with RSVP tracking and directions map.",
    priority: "medium",
    category: "Invitations",
  },
  {
    offsetDays: -30,
    title: "Send Out Invitations & Confirm Outstation Stay",
    description: "Distribute cards to family and friends; lock hotel room blocks for out-of-town guests.",
    priority: "high",
    category: "Logistics",
  },
  {
    offsetDays: -21,
    title: "Bridal & Groom Attire Trials",
    description: "Final fitting for outfits, matching accessories, safa/turban, and jewelry.",
    priority: "medium",
    category: "Attire",
  },
  {
    offsetDays: -14,
    title: "Lock DJ, Sound System & Sangeet Playlist",
    description: "Provide preferred tracklist, sound permits, and special entry audio clips to the DJ.",
    priority: "medium",
    category: "Entertainment",
  },
  {
    offsetDays: -7,
    title: "Confirm Final Headcount with Caterer",
    description: "Provide locked guest count (+/- 10% buffer) to avoid food wastage and surprise charges.",
    priority: "high",
    category: "Catering",
  },
  {
    offsetDays: -3,
    title: "Pack Wedding Emergency Kit & Welcome Hampers",
    description: "Prepare safety pins, touch-up makeup, first-aid, cash envelopes for vendor tips, and guest hampers.",
    priority: "medium",
    category: "Coordination",
  },
  {
    offsetDays: 0,
    title: "Event Day: Celebrate & Supervise Flow",
    description: "Assign a point-of-contact for vendor payments, coordinate stage photography, and enjoy the celebration!",
    priority: "high",
    category: "Event Day",
  },
  {
    offsetDays: 1,
    title: "Vendor Settlements & Return Rentals",
    description: "Clear pending vendor balance sheets, return rental items, and collect security deposits.",
    priority: "low",
    category: "Post-Event",
  },
];

/**
 * Milestone progression for birthday and anniversary celebrations.
 */
const BIRTHDAY_MILESTONES: MilestoneRule[] = [
  {
    offsetDays: -30,
    title: "Lock Party Date, Theme & Budget",
    description: "Choose theme (e.g. Superhero, Retro, Tropical, Bollywood) and set spending limit.",
    priority: "high",
    category: "Planning",
  },
  {
    offsetDays: -21,
    title: "Book Venue / Reserve Space",
    description: "Confirm party hall, cafe banquet, or backyard setup.",
    priority: "high",
    category: "Venue",
  },
  {
    offsetDays: -14,
    title: "Order Custom Cake & Desserts",
    description: "Finalize cake design, flavors, dietary options (eggless), and bakery delivery time.",
    priority: "high",
    category: "Food",
  },
  {
    offsetDays: -10,
    title: "Send Digital Invitations (WhatsApp / E-card)",
    description: "Share timing, location pin, dress code, and request RSVPs.",
    priority: "medium",
    category: "Invitations",
  },
  {
    offsetDays: -7,
    title: "Book Anchor, Magic Show, or DJ",
    description: "Arrange games, music, anchor/emcee, or entertainer for kids/guests.",
    priority: "medium",
    category: "Entertainment",
  },
  {
    offsetDays: -3,
    title: "Buy Return Gifts & Party Favors",
    description: "Package thoughtful return gifts or activity kits for guests.",
    priority: "low",
    category: "Favors",
  },
  {
    offsetDays: 0,
    title: "Party Day: Setup Balloons & Host Guests",
    description: "Decor setup 2 hours prior, receive cake, kick off party games, and cake cutting ceremony.",
    priority: "high",
    category: "Event Day",
  },
];

/**
 * Milestone progression for community festivals and college gatherings.
 */
const COMMUNITY_MILESTONES: MilestoneRule[] = [
  {
    offsetDays: -45,
    title: "Form Organizing Committee & Agenda",
    description: "Define festival objectives, sub-committees (finance, stage, food, security).",
    priority: "high",
    category: "Committee",
  },
  {
    offsetDays: -30,
    title: "Secure Ground/Hall Permits & Police Approvals",
    description: "File necessary permissions for sound, public gathering, parking, and fire safety.",
    priority: "high",
    category: "Permits",
  },
  {
    offsetDays: -20,
    title: "Book Tent, Shamiana, Seating & Sound (P.A. System)",
    description: "Ensure quality microphones, speakers, generator backup, and clean seating arrangements.",
    priority: "high",
    category: "Infrastructure",
  },
  {
    offsetDays: -14,
    title: "Plan Community Meals / Prasad / Langar",
    description: "Finalize ingredients, volunteers, hygiene protocols, and eco-friendly leaf plates/donas.",
    priority: "high",
    category: "Food",
  },
  {
    offsetDays: -7,
    title: "Volunteer Briefing & Schedule Assignment",
    description: "Assign shifts for crowd control, stage management, welcome desk, and distribution.",
    priority: "medium",
    category: "Volunteers",
  },
  {
    offsetDays: 0,
    title: "Gathering Day: Coordinate Public Event",
    description: "Oversee program execution, announce schedules, honor guests, and maintain waste bins.",
    priority: "high",
    category: "Event Day",
  },
  {
    offsetDays: 1,
    title: "Cleanup Drive & Accounts Audit",
    description: "Clean venue grounds, settle vendor balances, and publish accounts transparency sheet.",
    priority: "medium",
    category: "Post-Event",
  },
];

/**
 * Generates date-anchored planning tasks relative to the scheduled event date.
 * Automatically compresses timeline offsets proportionally if the event is scheduled in the near future.
 *
 * @param eventType - Category of event (e.g. "wedding", "birthday", "community")
 * @param eventDateStr - Target celebration date in YYYY-MM-DD format
 * @param eventId - Parent event ID
 * @returns Chronologically sequenced TimelineTask records
 *
 * @example
 * ```ts
 * const tasks = generateTimelineTasks("wedding", "2027-10-15", "evt-123");
 * console.log(`Generated ${tasks.length} timeline milestones`);
 * ```
 */
export function generateTimelineTasks(
  eventType: EventType,
  eventDateStr: string,
  eventId: string = "default"
): TimelineTask[] {
  let templateRules: MilestoneRule[];

  switch (eventType) {
    case "wedding":
      templateRules = WEDDING_MILESTONES;
      break;
    case "birthday":
    case "anniversary":
      templateRules = BIRTHDAY_MILESTONES;
      break;
    case "community":
    case "college_fest":
      templateRules = COMMUNITY_MILESTONES;
      break;
    default:
      templateRules = WEDDING_MILESTONES.slice(0, 8);
      break;
  }

  const eventDate = new Date(eventDateStr);
  const now = new Date();
  const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return templateRules.map((rule, idx) => {
    // If the event is happening very soon, compress negative offsets proportionally
    let effectiveOffset = rule.offsetDays;
    if (daysUntilEvent > 0 && Math.abs(rule.offsetDays) > daysUntilEvent) {
      // Scale offset inside available days window
      const scaleFactor = daysUntilEvent / 120;
      effectiveOffset = Math.round(rule.offsetDays * scaleFactor);
    }

    const taskDate = new Date(eventDate);
    taskDate.setDate(taskDate.getDate() + effectiveOffset);

    // Format YYYY-MM-DD
    const yyyy = taskDate.getFullYear();
    const mm = String(taskDate.getMonth() + 1).padStart(2, "0");
    const dd = String(taskDate.getDate()).padStart(2, "0");
    const dueDate = `${yyyy}-${mm}-${dd}`;

    const isPast = taskDate.getTime() < now.getTime() && rule.offsetDays < 0;

    return {
      id: `task-${idx}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      eventId,
      title: rule.title,
      description: rule.description,
      category: rule.category,
      dueDate,
      priority: rule.priority,
      status: "pending",
      isOverdue: isPast,
    };
  });
}

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) string containing all event tasks as calendar entries.
 *
 * @param eventTitle - Celebration title for calendar metadata
 * @param tasks - Array of TimelineTask items to export
 * @returns CRLF-delimited standard .ics file content
 *
 * @example
 * ```ts
 * const ics = generateIcsCalendar("Priya Wedding", tasks);
 * console.log(ics.startsWith("BEGIN:VCALENDAR")); // true
 * ```
 */
export function generateIcsCalendar(
  eventTitle: string,
  tasks: TimelineTask[]
): string {
  const sanitize = (str: string) => str.replace(/[,;]/g, " ").replace(/\n/g, " ");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UtsavMate AI//Event Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${sanitize(eventTitle)} - Timeline`,
  ];

  tasks.forEach((task) => {
    // dueDate format: YYYY-MM-DD
    const dateCompact = task.dueDate.replace(/-/g, "");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${task.id}@utsavmate.ai`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15)}Z`);
    lines.push(`DTSTART;VALUE=DATE:${dateCompact}`);
    lines.push(`DTEND;VALUE=DATE:${dateCompact}`);
    lines.push(`SUMMARY:${sanitize(task.title)} [${task.priority.toUpperCase()}]`);
    lines.push(`DESCRIPTION:${sanitize(task.description)} Category: ${sanitize(task.category)}`);
    lines.push(`STATUS:${task.status === "completed" ? "COMPLETED" : "CONFIRMED"}`);
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
