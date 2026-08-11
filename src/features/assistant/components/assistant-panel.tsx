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
import { usePracticeContext } from "@/components/reception/practice-context";
import { askAssistant } from "../actions";
import type { AssistantMessage } from "../types";

const SUGGESTIONS = [
  "What's on today?",
  "Any cancellations this week?",
  "Who do we have appointments with tomorrow?",
];

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";
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

export function AssistantPanel() {
  const { practiceId } = usePracticeContext();
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<AssistantMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const scrollAnchorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || !practiceId || pending) return;

    const nextHistory = [...messages, { role: "user" as const, content: question }];
    setMessages(nextHistory);
    setInput("");
    setPending(true);

    try {
      const reply = await askAssistant(practiceId, nextHistory);
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed right-5 bottom-5 z-30 size-12 rounded-full shadow-[0_8px_24px_-4px_color-mix(in_oklch,var(--primary)_50%,transparent)]"
        >
          <SparklesIcon className="size-5" />
          <span className="sr-only">Open assistant</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            Practice assistant
          </SheetTitle>
          <SheetDescription>Ask about today&apos;s appointments, patients, or practitioners.</SheetDescription>
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
              messages.map((message, i) => <MessageBubble key={i} message={message} />)
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
            placeholder="Ask about your practice…"
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
