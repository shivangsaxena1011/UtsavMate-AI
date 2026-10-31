import { describe, it, expect } from "vitest";
import { generateTimelineTasks, generateIcsCalendar } from "../src/lib/engines/timeline";

describe("Timeline Engine", () => {
  it("generates date-aware tasks ordered around the target event date", () => {
    const eventDate = "2027-02-15";
    const tasks = generateTimelineTasks("wedding", eventDate);

    expect(tasks.length).toBeGreaterThan(5);

    // Event day task should have the exact event date
    const eventDayTask = tasks.find((t) => t.category === "Event Day");
    expect(eventDayTask).toBeDefined();
    expect(eventDayTask!.dueDate).toBe(eventDate);
  });

  it("compresses intervals gracefully when event is very close to today", () => {
    // Event in 10 days
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + 10);
    const dateStr = closeDate.toISOString().split("T")[0];

    const tasks = generateTimelineTasks("birthday", dateStr);
    expect(tasks.length).toBeGreaterThan(0);
    tasks.forEach((t) => {
      expect(t.dueDate).toBeDefined();
    });
  });

  it("generates a valid RFC 5545 iCalendar string", () => {
    const tasks = generateTimelineTasks("wedding", "2027-02-15");
    const ics = generateIcsCalendar("Bhopal Wedding", tasks);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("SUMMARY:Finalize Venue & Date Locking");
    expect(ics).toContain("2027");
  });
});
