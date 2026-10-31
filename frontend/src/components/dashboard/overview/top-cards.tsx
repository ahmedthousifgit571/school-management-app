"use client";

import Link from "next/link";

import { TrendChart, Donut } from "@/components/dashboard/charts";
import { Blob, Burst, Heart, PlusBlob, Star } from "@/components/dashboard/doodles";
import type { Overview } from "@/components/dashboard/overview/use-overview";
import { cardOutline } from "@/components/dashboard/panel";
import { cn } from "@/lib/utils";

const stickerLift = "transition-transform duration-200 motion-safe:hover:-translate-y-0.5";

export function StudentsCard({ data }: { data: Overview["attendance"] }) {
  return (
    <article className={cn("relative flex flex-col gap-4 overflow-hidden bg-pastel-yellow p-5", cardOutline, stickerLift)}>
      <PlusBlob className="absolute -right-5 -top-5 size-28 rotate-12 text-[#F9C53C]" outlined={false} />
      <h2 className="relative font-heading text-xl font-medium">{data.title}:</h2>

      <div className="relative flex flex-1 items-center gap-3">
        <Donut value={data.rate} label={data.rateLabel} color="var(--status-good)" track="rgb(255 255 255 / 65%)" />
        <dl className="min-w-0 space-y-2 text-sm">
          <div>
            <dt className="font-semibold leading-tight">{data.rateLabel}</dt>
            <dd className="text-xs text-ink/75">{data.rateHint}</dd>
          </div>
          <div>
            <dt className="font-semibold leading-tight">{data.countLabel}</dt>
            <dd className="text-xs text-ink/75">{data.countValue}</dd>
          </div>
        </dl>
      </div>

      <div className="relative flex flex-1 items-center gap-3">
        <Donut value={data.absentRate} label={data.absentLabel} color="var(--status-bad)" track="rgb(255 255 255 / 65%)" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold leading-tight">{data.absentLabel}</p>
          <p className="text-xs text-ink/75">{data.absentHint}</p>
        </div>
      </div>
    </article>
  );
}

export function GradeSummaryCard({ data }: { data: Overview["trend"] }) {
  return (
    <article className={cn("relative flex h-full min-h-72 flex-col overflow-hidden bg-pastel-pink p-5", cardOutline, stickerLift)}>
      <Star className="absolute right-20 top-3 size-5 rotate-12 text-pastel-yellow" />
      <Star className="absolute right-10 top-6 size-7 -rotate-6 text-pastel-blue" />
      <Heart className="absolute right-4 top-3 size-6 rotate-12 text-[#F4597F]" />
      <Star className="absolute right-[4.5rem] top-10 size-4 text-pastel-lilac" />
      <h2 className="relative font-heading text-xl font-medium">{data.title}:</h2>
      <p className="relative font-hand text-lg leading-none text-ink/80">average score, this term</p>
      <div className="relative mt-3 flex-1">
        <TrendChart points={data.points} label="Average score by week" min={50} max={100} ticks={[50, 60, 70, 80, 90, 100]} />
      </div>
    </article>
  );
}

export function ByClassCard({ data }: { data: Overview["tags"] }) {
  return (
    <article className={cn("relative flex flex-auto flex-col gap-3 overflow-hidden bg-pastel-green p-5", cardOutline, stickerLift)}>
      <Blob className="absolute -bottom-10 -right-8 size-32 text-[#8FA94F]" outlined={false} />
      <h2 className="relative font-heading text-xl font-medium">{data.title}:</h2>
      <ul className="relative flex flex-wrap gap-1.5">
        {data.items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              aria-label={`${item.label}, grade ${item.grade}`}
              className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink/70 bg-white/50 px-2.5 py-1 text-xs font-semibold transition-colors duration-200 hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {item.label}
              <span className="font-heading font-bold">{item.grade}</span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function AssessmentsCard({ data }: { data: Overview["assessments"] }) {
  return (
    <article className={cn("relative flex flex-auto flex-col gap-2 overflow-hidden bg-pastel-blue p-5", cardOutline, stickerLift)}>
      <Burst className="absolute -bottom-8 -right-8 size-24 text-[#6FA8F5]" />
      <h2 className="relative font-heading text-xl font-medium">Assessments:</h2>
      <dl className="relative flex gap-5">
        <div>
          <dd className="font-heading text-3xl font-medium tabular-nums">{data.today}</dd>
          <dt className="text-xs font-medium text-ink/80">Today</dt>
        </div>
        <div>
          <dd className="font-heading text-3xl font-medium tabular-nums">{data.upcoming}</dd>
          <dt className="text-xs font-medium text-ink/80">Ahead</dt>
        </div>
      </dl>
      <p className="relative max-w-[78%] text-xs font-medium text-ink/80">{data.next}</p>
    </article>
  );
}
