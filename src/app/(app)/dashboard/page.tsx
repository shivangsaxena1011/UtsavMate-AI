import { listEvents } from "@/lib/storage";
import { getDaysUntil } from "@/lib/utils/date";
import { DashboardWelcomeBanner } from "@/components/dashboard/DashboardWelcomeBanner";
import { DashboardKpiGrid } from "@/components/dashboard/DashboardKpiGrid";
import { UpcomingEventsList } from "@/components/dashboard/UpcomingEventsList";
import { QuickActionsPanel } from "@/components/dashboard/QuickActionsPanel";
import { AiFeaturesCard } from "@/components/dashboard/AiFeaturesCard";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const events = listEvents();
  const totalBudget = events.reduce((sum, e) => sum + e.totalBudget, 0);
  const upcomingEvents = events.filter((e) => getDaysUntil(e.eventDate) > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <DashboardWelcomeBanner />
      <DashboardKpiGrid
        totalEvents={events.length}
        upcomingCount={upcomingEvents.length}
        totalBudget={totalBudget}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UpcomingEventsList events={events} />
        </div>
        <div className="space-y-4">
          <QuickActionsPanel firstEventId={events[0]?.id} />
          <AiFeaturesCard />
        </div>
      </div>
    </div>
  );
}
