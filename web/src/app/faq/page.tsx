"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { LogoLockup } from "@/components/animated-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is the Network Intelligence TPRM platform?",
    a: "An AI-native third-party risk platform for banks and regulated entities. Vendors answer a questionnaire once, the platform judges their evidence against what they claimed, and every verdict propagates through a control crosswalk to MAS, RBI and SEBI CSCRF clauses in real time.",
  },
  {
    q: "Do we need an API key or internet access to run it?",
    a: "No. The platform ships with a free Static rules engine that runs fully offline — no API key, no external calls. If you want live AI adjudication, sign in as Root, open Admin → Processing engine, and paste in a token for Claude, OpenAI, Grok or Gemini.",
  },
  {
    q: "Can we trust the AI's compliance verdicts?",
    a: "The engine is conservative by default: every verdict carries a confidence score and a citation back to the evidence it read, and it's benchmarked against real assessor judgments. It's designed as a first-pass analyst, not a replacement for the assessor — every result stays human-in-the-loop and can be overridden.",
  },
  {
    q: "Does our vendor data ever leave our environment?",
    a: "Only if you choose to. You control which AI provider is used (or none at all via the Static engine), and you supply your own API key — vendor data is only ever sent to the provider you've explicitly configured.",
  },
  {
    q: "How is a vendor's risk tier decided?",
    a: "At onboarding, an assessor (or an AI-assisted read of the vendor's contract/scope document) captures data sensitivity, system access, business criticality and data volume. The platform computes a Critical/High/Medium/Low tier live from those inputs — no separate spreadsheet.",
  },
  {
    q: "What happens with password-protected evidence?",
    a: "If a vendor uploads an encrypted PDF, the platform detects it immediately and prompts for the password inline — no rejected uploads, no manual back-and-forth over email.",
  },
  {
    q: "Can multiple people from the same vendor collaborate?",
    a: "Yes. Root or an assessor can add multiple login accounts for one vendor, and all of them share the same submission workspace — so a vendor's security lead and account manager can both contribute without stepping on each other.",
  },
  {
    q: "Is there an audit trail for examiners?",
    a: "Every action — adjudications, overrides, sign-offs, scope changes — is timestamped and attributable, visible from both the assessor console and the admin audit log. Built for reconstructing exactly who decided what, when.",
  },
  {
    q: "Can we export assessment results?",
    a: "Yes — one-click PDF and Excel exports are available per vendor from the assessor console, and a portfolio-level roll-up export is available from the customer/portfolio view for executive reporting.",
  },
  {
    q: "How is the assessment scope for a vendor kept current?",
    a: "Scope is assessor-owned: defined at onboarding (optionally AI-drafted from an uploaded contract or scope sheet) and refined afterward in the console. Vendors can also file a scope-change request, which the assessor reviews and approves or rejects.",
  },
];

function FaqItem({ item, open, onToggle }: { item: { q: string; a: string }; open: boolean; onToggle: () => void }) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-semibold text-fg">{item.q}</span>
        <ChevronDown size={18} className={cn("shrink-0 text-muted transition", open && "rotate-180 text-brand")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-24">
      <header className="flex items-center justify-between py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="flex items-center gap-3">
          <LogoLockup markWidth={38} />
          <ThemeToggle />
        </div>
      </header>

      <div className="mt-6 text-center">
        <h1 className="text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
          Frequently asked <span className="text-brand">questions</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted">
          What prospective customers ask most before they sign in and try it themselves.
        </p>
      </div>

      <div className="mt-12 space-y-3">
        {FAQS.map((item, i) => (
          <FaqItem key={item.q} item={item} open={openIndex === i} onToggle={() => setOpenIndex((cur) => (cur === i ? null : i))} />
        ))}
      </div>

      <div className="mt-12 text-center text-sm text-muted">
        Still have questions?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Sign in and see it live
        </Link>
        .
      </div>
    </main>
  );
}
