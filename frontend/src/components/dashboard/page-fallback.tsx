/** Placeholder while a page reads its URL params. */
export function PageFallback() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <div className="h-16 max-w-md rounded-3xl bg-black/[0.06] motion-safe:animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 rounded-[32px] bg-black/[0.06] motion-safe:animate-pulse" />
        ))}
      </div>
      <div className="h-96 rounded-[32px] bg-black/[0.06] motion-safe:animate-pulse" />
    </div>
  );
}
