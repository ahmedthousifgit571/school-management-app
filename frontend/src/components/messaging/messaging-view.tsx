"use client";

import { useState } from "react";
import { ArrowLeft, Megaphone, PenSquare, Send } from "lucide-react";

import {
  EmptyState,
  Field,
  FormDrawer,
  Pill,
  SearchField,
  Segmented,
  SelectInput,
  TextArea,
  TextInput,
  buttonClass,
  iconButtonClass,
  inputClass,
} from "@/components/dashboard/controls";
import { PageHeader, cardOutline } from "@/components/dashboard/panel";
import { toneStyles, toneFor } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { formatDate } from "@/lib/format";
import { NOTICE_AUDIENCES, TODAY_ISO, subjectById, type Thread } from "@/lib/mock-data";
import { canManage } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";
import { logActivity, newId, noticesStore, teachersStore, threadsForRole, threadsStore, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

type Tab = "messages" | "notices";

function audienceFor(user: SessionUser): Thread["audience"] {
  if (user.teacherId) return "teacher";
  return user.studentId ? "family" : "office";
}

export function MessagingView({ user }: { user: SessionUser }) {
  const allThreads = threadsStore.useStore();
  const notices = noticesStore.useStore();
  const teachers = teachersStore.useStore();
  const threads = threadsForRole(allThreads, user.role);

  const [tab, setTab] = useState<Tab>("messages");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [composing, setComposing] = useState(false);
  const [posting, setPosting] = useState(false);

  const active = threads.find((thread) => thread.id === activeId) ?? null;
  const search = query.trim().toLowerCase();
  const visibleThreads = threads.filter((thread) => !search || thread.name.toLowerCase().includes(search));
  const unread = threads.reduce((sum, thread) => sum + thread.unread, 0);

  const visibleNotices = user.studentId
    ? notices.filter((notice) => notice.audience === "Everyone" || notice.audience === (user.role === "PARENT" ? "Parents" : "Students"))
    : notices;

  function openThread(id: string) {
    setActiveId(id);
    threadsStore.set((list) => list.map((thread) => (thread.id === id ? { ...thread, unread: 0 } : thread)));
  }

  function send(threadId: string, text: string) {
    threadsStore.set((list) =>
      list.map((thread) =>
        thread.id === threadId
          ? { ...thread, messages: [...thread.messages, { id: newId("m"), fromMe: true, text, time: "Just now" }] }
          : thread
      )
    );
  }

  function submitDraft(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!active || !text) return;
    send(active.id, text);
    setDraft("");
  }

  function compose(data: FormData) {
    const teacher = teachers.find((item) => item.id === String(data.get("to")))!;
    const text = String(data.get("message")).trim();
    const existing = threads.find((thread) => thread.name === teacher.name);
    if (existing) {
      send(existing.id, text);
      openThread(existing.id);
    } else {
      const id = newId("th");
      threadsStore.set((list) => [
        {
          id,
          name: teacher.name,
          subtitle: subjectById(teacher.subjectId).name,
          audience: audienceFor(user),
          unread: 0,
          messages: [{ id: "m1", fromMe: true, text, time: "Just now" }],
        },
        ...list,
      ]);
      setActiveId(id);
    }
    toast(`Message sent to ${teacher.name}`);
    setComposing(false);
  }

  function postNotice(data: FormData) {
    const title = String(data.get("title")).trim();
    const audience = String(data.get("audience"));
    noticesStore.set((list) => [
      { id: newId("n"), title, body: String(data.get("body")).trim(), date: TODAY_ISO, audience, tone: toneFor(title) },
      ...list,
    ]);
    logActivity({ actor: user.name, text: `posted a notice to ${audience.toLowerCase()}: ${title}`, kind: "notice", tone: "pink" });
    toast("Notice posted");
    setPosting(false);
  }

  return (
    <>
      <PageHeader
        eyebrow="Stay in the loop"
        title="Messaging"
        description="Conversations with staff and families, plus school-wide notices."
        actions={
          tab === "messages" ? (
            <button type="button" onClick={() => setComposing(true)} className={buttonClass("dark")}>
              <PenSquare aria-hidden /> New message
            </button>
          ) : (
            canManage(user.role) && (
              <button type="button" onClick={() => setPosting(true)} className={buttonClass("dark")}>
                <Megaphone aria-hidden /> Post notice
              </button>
            )
          )
        }
      />

      <Segmented
        label="Messaging views"
        value={tab}
        onChange={setTab}
        options={[
          { value: "messages", label: "Messages", count: unread || undefined },
          { value: "notices", label: "Notices", count: visibleNotices.length },
        ]}
      />

      {tab === "messages" ? (
        <section className={cn("relative grid min-h-[34rem] grid-cols-1 overflow-hidden bg-white md:grid-cols-[320px_minmax(0,1fr)]", cardOutline)}>
          <div className={cn("flex min-h-0 min-w-0 flex-col gap-2 border-black/10 p-3 md:border-r-[1.5px]", active && "hidden md:flex")}>
            <SearchField value={query} onChange={setQuery} placeholder="Find a conversation" />
            <ul className="space-y-1 overflow-y-auto">
              {visibleThreads.map((thread) => {
                const last = thread.messages[thread.messages.length - 1]!;
                return (
                  <li key={thread.id}>
                    <button
                      type="button"
                      aria-current={thread.id === activeId ? "true" : undefined}
                      onClick={() => openThread(thread.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-[22px] p-2.5 text-left transition-colors duration-200 hover:bg-black/[0.05] focus-visible:outline-2 focus-visible:outline-ink",
                        thread.id === activeId && "bg-black/[0.06]"
                      )}
                    >
                      <UserAvatar name={thread.name} size="lg" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-semibold">{thread.name}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">{last.time}</span>
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {last.fromMe && "You: "}
                          {last.text}
                        </span>
                      </span>
                      {thread.unread > 0 && (
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink bg-pastel-pink text-xs font-bold">
                          <span className="sr-only">Unread: </span>
                          {thread.unread}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={cn("flex min-h-[34rem] min-w-0 flex-col", !active && "hidden md:flex")}>
            {active ? (
              <>
                <header className="flex items-center gap-3 border-b-[1.5px] border-black/10 p-3">
                  <button type="button" aria-label="Back to conversations" onClick={() => setActiveId(null)} className={cn(iconButtonClass(), "md:hidden")}>
                    <ArrowLeft aria-hidden />
                  </button>
                  <UserAvatar name={active.name} size="lg" />
                  <div className="min-w-0">
                    <h2 className="truncate font-heading text-lg font-medium leading-tight">{active.name}</h2>
                    <p className="truncate text-xs text-muted-foreground">{active.subtitle}</p>
                  </div>
                </header>

                <ol className="flex flex-1 flex-col gap-2 overflow-y-auto p-4" aria-live="polite">
                  {active.messages.map((message) => (
                    <li key={message.id} className={cn("flex max-w-[80%] flex-col gap-0.5", message.fromMe ? "items-end self-end" : "items-start")}>
                      <p className={cn("rounded-[22px] px-4 py-2.5 text-sm", message.fromMe ? "rounded-br-md bg-ink text-white" : "rounded-bl-md bg-pastel-blue/40")}>
                        {message.text}
                      </p>
                      <span className="px-1 text-[11px] text-muted-foreground">{message.time}</span>
                    </li>
                  ))}
                </ol>

                <form onSubmit={submitDraft} className="flex items-center gap-2 border-t-[1.5px] border-black/10 p-3">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={`Message ${active.name}`}
                    aria-label={`Message ${active.name}`}
                    className={cn(inputClass, "min-w-0 flex-1")}
                  />
                  <button type="submit" aria-label="Send message" disabled={!draft.trim()} className={cn(iconButtonClass("dark"), "disabled:pointer-events-none disabled:opacity-40")}>
                    <Send aria-hidden />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <EmptyState title="Pick a conversation" hint="Or start a new one with the button above." />
              </div>
            )}
          </div>
        </section>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {visibleNotices.map((notice) => (
            <li key={notice.id} className={cn("flex flex-col gap-2 p-5", cardOutline, toneStyles[notice.tone].soft)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Pill tone={notice.tone}>{notice.audience}</Pill>
                <span className="text-xs font-medium text-ink/75">{formatDate(notice.date)}</span>
              </div>
              <h2 className="font-heading text-xl font-medium leading-tight">{notice.title}</h2>
              <p className="text-sm text-ink/80">{notice.body}</p>
            </li>
          ))}
        </ul>
      )}

      <FormDrawer open={composing} onOpenChange={setComposing} title="New message" submitLabel="Send message" onSubmit={compose}>
        <Field label="To" required>
          <SelectInput name="to" className="w-full" defaultValue={teachers[0]?.id}>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} · {subjectById(teacher.subjectId).name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Message" required>
          <TextArea name="message" required rows={4} />
        </Field>
      </FormDrawer>

      <FormDrawer open={posting} onOpenChange={setPosting} title="Post notice" submitLabel="Post notice" onSubmit={postNotice}>
        <Field label="Title" required>
          <TextInput name="title" required />
        </Field>
        <Field label="Who is it for?" required>
          <SelectInput name="audience" className="w-full" defaultValue={NOTICE_AUDIENCES[0]}>
            {NOTICE_AUDIENCES.map((audience) => (
              <option key={audience}>{audience}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Details" required>
          <TextArea name="body" required rows={4} />
        </Field>
      </FormDrawer>
    </>
  );
}
