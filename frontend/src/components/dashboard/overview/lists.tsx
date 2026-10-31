"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Megaphone,
  UserPlus,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Pill } from "@/components/dashboard/controls";
import type { GlanceTile, UpcomingItem } from "@/components/dashboard/overview/use-overview";
import { cardOutline } from "@/components/dashboard/panel";
import { toneStyles } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import type { ActivityKind } from "@/lib/mock-data";
import type { SessionUser } from "@/lib/session";
import { useActivities } from "@/lib/stores";
import { cn } from "@/lib/utils";

const rowClass = "flex items-center gap-3 rounded-[24px] bg-black/[0.05] p-2.5 pr-3";

function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-3 flex min-h-9 items-center justify-between gap-3">
      <h2 className="font-heading text-2xl font-medium tracking-tight">{title}</h2>
      {href && (
        <Link
          href={href}
          aria-label={`See all: ${title}`}
          className="inline-flex size-9 items-center justify-center rounded-full transition-colors duration-200 hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-ink"
        >
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function UpcomingClasses({ title, items }: { title: string; items: UpcomingItem[] }) {
  return (
    <section className="min-w-0">
      <SectionHeading title={title} href="/dashboard/timetable" />
      <ol className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className={rowClass}>
            <UserAvatar name={item.name} tone={item.tone} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium leading-tight">{item.name}</p>
              <p className="truncate text-xs text-muted-foreground">{item.role}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Pill tone={item.tone}>{item.tag}</Pill>
              <span className="pr-1 text-[11px] font-medium tabular-nums text-muted-foreground">{item.time}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const ACTIVITY_ICONS: Record<ActivityKind, LucideIcon> = {
  attendance: ClipboardCheck,
  fee: Wallet,
  grade: GraduationCap,
  admission: UserPlus,
  notice: Megaphone,
  library: BookMarked,
  assignment: ClipboardList,
  event: CalendarDays,
  staff: UsersRound,
};

export function RecentActivities({ user }: { user: SessionUser }) {
  const activities = useActivities();
  const audience = user.studentId ? "family" : user.teacherId ? "teacher" : "office";
  // The office sees everything. Others see their own actions and what's shared with them.
  const visible = activities.filter(
    (activity) => audience === "office" || activity.actor === user.name || activity.sharedWith?.includes(audience)
  );

  return (
    <section className="min-w-0">
      <SectionHeading title="Recent activities" />
      <ol className="space-y-2" aria-live="polite">
        {visible.slice(0, 4).map((activity) => {
          const Icon = ACTIVITY_ICONS[activity.kind];
          return (
            <li key={activity.id} className={rowClass}>
              <span className="relative shrink-0">
                <UserAvatar name={activity.actor} tone={activity.tone} size="lg" />
                <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-[1.5px] border-ink bg-white">
                  <Icon className="size-3" aria-hidden />
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium leading-tight">{activity.actor}</p>
                <p className="truncate text-xs text-muted-foreground">{activity.text}</p>
              </div>
              <Pill tone={activity.tone}>{activity.when}</Pill>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function AtAGlance({ tiles }: { tiles: GlanceTile[] }) {
  return (
    <section aria-label="Around the school" className="grid grid-cols-1 gap-3 @[420px]:grid-cols-2 @[720px]:grid-cols-3">
      {tiles.map((tile) => (
        <Link
          key={tile.label}
          href={tile.href}
          className={cn(
            "group flex items-center gap-3 bg-white p-3.5 transition-colors duration-200 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
            cardOutline,
            "rounded-[28px]"
          )}
        >
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink group-hover:motion-safe:animate-wiggle",
              toneStyles[tile.tone].fill
            )}
          >
            <tile.icon className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-muted-foreground">{tile.label}</span>
            <span className="block font-heading text-2xl font-medium leading-tight tabular-nums">{tile.value}</span>
            <span className="block truncate text-xs text-muted-foreground">{tile.hint}</span>
          </span>
        </Link>
      ))}
    </section>
  );
}
