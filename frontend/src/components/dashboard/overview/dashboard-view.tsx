"use client";

import { Greeting } from "@/components/dashboard/clock";
import { Squiggle } from "@/components/dashboard/doodles";
import { CalendarPanel } from "@/components/dashboard/overview/calendar-panel";
import { AtAGlance, RecentActivities, UpcomingClasses } from "@/components/dashboard/overview/lists";
import {
  AssessmentsCard,
  ByClassCard,
  GradeSummaryCard,
  StudentsCard,
} from "@/components/dashboard/overview/top-cards";
import { useOverview } from "@/components/dashboard/overview/use-overview";
import { displayName, type SessionUser } from "@/lib/session";

export function DashboardView({ user }: { user: SessionUser }) {
  const overview = useOverview(user);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="@container flex min-w-0 flex-col gap-6">
        <header>
          <h1 className="font-heading text-4xl font-medium tracking-tight md:text-5xl">
            <Greeting name={displayName(user)} />
          </h1>
          <Squiggle className="mt-1 h-2.5 w-40 text-pastel-pink" />
          <p className="mt-2 text-muted-foreground">{overview.summary}</p>
        </header>

        <div className="grid grid-cols-1 gap-4 @[480px]:grid-cols-2 @[720px]:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)_minmax(0,1fr)]">
          <StudentsCard data={overview.attendance} />
          <div className="@[480px]:order-last @[480px]:col-span-2 @[720px]:order-none @[720px]:col-span-1">
            <GradeSummaryCard data={overview.trend} />
          </div>
          <div className="flex flex-col gap-4">
            <ByClassCard data={overview.tags} />
            <AssessmentsCard data={overview.assessments} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 @[640px]:grid-cols-2">
          <UpcomingClasses title={overview.upcomingTitle} items={overview.upcoming} />
          <RecentActivities user={user} />
        </div>

        <AtAGlance tiles={overview.tiles} />
      </div>

      <CalendarPanel user={user} />
    </div>
  );
}
