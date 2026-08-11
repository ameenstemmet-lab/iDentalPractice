"use client";

import * as React from "react";
import { SendIcon, SparklesIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/features/booking/utils/format";
import { askPublicAssistant, confirmManageAppointment, confirmNewBooking } from "../actions";
import type { ManageAppointmentProposal, NewBookingProposal, PublicAssistantMessage } from "../types";

const SUGGESTIONS = ["Book an appointment", "I need to change my booking", "I need to cancel my booking"];

type ProposalStatus = "idle" | "confirming" | "confirmed" | "cancelled" | "error";

function MessageBubble({ message }: { message: PublicAssistantMessage }) {
  const isUser = message.role === "user";
  if (!message.content) return null;
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border border-border bg-card text-foreground"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function BookingProposalCard({
  proposal,
  status,
  onConfirm,
  onCancel,
}: {
  proposal: NewBookingProposal;
  status: ProposalStatus;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-gold/30 bg-card p-3.5 text-sm text-foreground">
        <p className="text-[10px] font-semibold tracking-wide text-gold-foreground uppercase">Proposed booking</p>
        <div className="mt-1.5 flex flex-col gap-0.5">
          <p className="font-medium">
            {proposal.patient.firstName} {proposal.patient.surname}
          </p>
          <p className="text-muted-foreground">
            {proposal.treatmentName} with {proposal.practitionerName}
          </p>
          <p className="text-muted-foreground">
            {proposal.dateLabel} · {proposal.startTime}–{proposal.endTime}
          </p>
          {proposal.treatmentPrice > 0 && (
            <p className="text-muted-foreground">From {formatCurrency(proposal.treatmentPrice)}</p>
          )}
        </div>
        <ProposalActions status={status} onConfirm={onConfirm} onCancel={onCancel} confirmLabel="Confirm booking" />
      </div>
    </div>
  );
}

function ManageProposalCard({
  proposal,
  status,
  onConfirm,
  onCancel,
}: {
  proposal: ManageAppointmentProposal;
  status: ProposalStatus;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isCancel = proposal.action === "cancel";
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-gold/30 bg-card p-3.5 text-sm text-foreground">
        <p className="text-[10px] font-semibold tracking-wide text-gold-foreground uppercase">
          {isCancel ? "Proposed cancellation" : "Proposed reschedule"}
        </p>
        <div className="mt-1.5 flex flex-col gap-0.5">
          <p className="font-medium">
            {proposal.treatmentName} with {proposal.practitionerName}
          </p>
          <p className="text-muted-foreground">
            {proposal.currentDateLabel} · {proposal.currentStartTime}–{proposal.currentEndTime}
          </p>
          {!isCancel && (
            <p className="font-medium text-foreground">
              → {proposal.newDateLabel} · {proposal.newStartTime}–{proposal.newEndTime}
            </p>
          )}
          <p className="text-muted-foreground">Reference {proposal.reference}</p>
        </div>
        <ProposalActions
          status={status}
          onConfirm={onConfirm}
          onCancel={onCancel}
          confirmLabel={isCancel ? "Confirm cancellation" : "Confirm reschedule"}
          confirmVariant={isCancel ? "destructive" : "default"}
        />
      </div>
    </div>
  );
}

function ProposalActions({
  status,
  onConfirm,
  onCancel,
  confirmLabel,
  confirmVariant = "default",
}: {
  status: ProposalStatus;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
}) {
  if (status === "idle") {
    return (
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant={confirmVariant} className="flex-1" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={onCancel}>
          Never mind
        </Button>
      </div>
    );
  }
  if (status === "confirming") return <p className="mt-3 text-xs text-muted-foreground">Working…</p>;
  if (status === "confirmed") return <p className="mt-3 text-xs font-medium text-success">Done</p>;
  if (status === "cancelled") return <p className="mt-3 text-xs text-muted-foreground">Dismissed.</p>;
  return <p className="mt-3 text-xs text-destructive">Couldn&apos;t complete — see reply below.</p>;
}

export function BookingAssistantPanel({ practiceId }: { practiceId: string }) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<PublicAssistantMessage[]>([]);
  const [proposalStatus, setProposalStatus] = React.useState<Record<number, ProposalStatus>>({});
  const [input, setInput] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const scrollAnchorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const viewport = scrollAnchorRef.current?.closest<HTMLElement>('[data-slot="scroll-area-viewport"]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
      else scrollAnchorRef.current?.scrollIntoView({ block: "end" });
    });
    return () => cancelAnimationFrame(raf);
  }, [messages, pending, open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || pending) return;

    const nextHistory = [...messages, { role: "user" as const, content: question }];
    setMessages(nextHistory);
    setInput("");
    setPending(true);

    try {
      const reply = await askPublicAssistant(practiceId, nextHistory);
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong asking that — try again in a moment." },
      ]);
    } finally {
      setPending(false);
    }
  }

  async function handleConfirmBooking(index: number, proposal: NewBookingProposal) {
    setProposalStatus((prev) => ({ ...prev, [index]: "confirming" }));
    try {
      const result = await confirmNewBooking(practiceId, proposal);
      if (result.ok) {
        setProposalStatus((prev) => ({ ...prev, [index]: "confirmed" }));
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `You're booked — reference ${result.reference}. A confirmation has been sent to ${proposal.patient.email}.`,
          },
        ]);
      } else {
        setProposalStatus((prev) => ({ ...prev, [index]: "error" }));
        setMessages((prev) => [...prev, { role: "assistant", content: result.message }]);
      }
    } catch {
      setProposalStatus((prev) => ({ ...prev, [index]: "error" }));
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong — try again." }]);
    }
  }

  async function handleConfirmManage(index: number, proposal: ManageAppointmentProposal) {
    setProposalStatus((prev) => ({ ...prev, [index]: "confirming" }));
    try {
      const result = await confirmManageAppointment(practiceId, proposal);
      if (result.ok) {
        setProposalStatus((prev) => ({ ...prev, [index]: "confirmed" }));
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              proposal.action === "cancel"
                ? `Booking ${result.reference} has been cancelled.`
                : `Booking ${result.reference} has been moved to ${proposal.newDateLabel} at ${proposal.newStartTime}.`,
          },
        ]);
      } else {
        setProposalStatus((prev) => ({ ...prev, [index]: "error" }));
        setMessages((prev) => [...prev, { role: "assistant", content: result.message }]);
      }
    } catch {
      setProposalStatus((prev) => ({ ...prev, [index]: "error" }));
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong — try again." }]);
    }
  }

  function dismiss(index: number) {
    setProposalStatus((prev) => ({ ...prev, [index]: "cancelled" }));
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed right-5 bottom-5 z-30 size-12 rounded-full shadow-[0_8px_24px_-4px_color-mix(in_oklch,var(--primary)_50%,transparent)]"
        >
          <SparklesIcon className="size-5" />
          <span className="sr-only">Open booking assistant</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            Booking assistant
          </SheetTitle>
          <SheetDescription>Book an appointment, or manage one you already made.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="flex flex-col gap-3 pb-2">
            {messages.length === 0 ? (
              <div className="flex flex-col gap-2 py-4">
                <p className="text-sm text-muted-foreground">Try asking:</p>
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="w-fit rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-accent"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : (
              messages.map((message, i) => (
                <React.Fragment key={i}>
                  <MessageBubble message={message} />
                  {message.bookingProposal && (
                    <BookingProposalCard
                      proposal={message.bookingProposal}
                      status={proposalStatus[i] ?? "idle"}
                      onConfirm={() => handleConfirmBooking(i, message.bookingProposal!)}
                      onCancel={() => dismiss(i)}
                    />
                  )}
                  {message.manageProposal && (
                    <ManageProposalCard
                      proposal={message.manageProposal}
                      status={proposalStatus[i] ?? "idle"}
                      onConfirm={() => handleConfirmManage(i, message.manageProposal!)}
                      onCancel={() => dismiss(i)}
                    />
                  )}
                </React.Fragment>
              ))
            )}
            {pending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={scrollAnchorRef} />
          </div>
        </ScrollArea>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 border-t border-border p-4"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask about booking…"
            rows={1}
            className="min-h-9 resize-none"
          />
          <Button type="submit" size="icon" disabled={pending || !input.trim()}>
            <SendIcon className="size-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
