# Sam — AI Voice Agent for Solar Lead Recovery

Solar and home-services companies lose a huge share of leads simply because
nobody calls them back fast enough. Conversion odds collapse if a lead isn't
contacted within the first few minutes — most companies take hours, some take
days, and by then the lead has already booked with whoever called first.

**Sam calls a new lead within seconds of form submission, qualifies them,
handles the objections that normally kill the deal, and books a real
appointment — on the call, with no human involved.**

🔗 **Live demo:** https://vapi-solar-webhook.vercel.app/
📊 **Live call metrics:** https://vapi-solar-webhook.vercel.app/dashboard.html

---

## Try it yourself

- **Call the number** shown on the demo page, or
- **Click "Talk to Sam"** on the same page to talk through your browser — no
  phone number required, works from anywhere in the world.

Say "stop calling" at any point and the call ends immediately, no questions
asked. Every real conversation that happens gets logged and shows up on the
live dashboard within seconds.

---

## What actually happens on a call

1. **Qualification** — Sam asks about home ownership, roof condition, rough
   monthly electric bill, and timeline, adapting the questions naturally
   rather than reading them as a script.
2. **Objection handling** — price pushback, "I'm already comparing quotes,"
   "I'm not the decision maker," and "call me back later" each have a distinct
   handling path, not one generic fallback.
3. **Booking** — if the lead qualifies and is willing, Sam checks calendar
   availability and books the appointment before the call ends.

A real excerpt from the objection-handling logic:

> **Lead:** "Honestly, it's probably too expensive for us."
> **Sam:** "Totally fair to ask. Financing usually brings the monthly cost
> below what you're paying the utility now — worth 20 minutes to see real
> numbers for your house?"

---

## Architecture

```
Lead calls in (phone or browser)
        │
        ▼
   Vapi Assistant  ──── qualification + objection-tree system prompt
        │                  + function-calling for booking/logging
        ▼
Vercel serverless webhook (api/vapi-webhook.js)
        │
        ▼
   Supabase (calls table) ──── structured outcome, duration, objection type
        │
        ▼
Vercel serverless aggregator (api/dashboard-metrics.js)
        │
        ▼
   Live dashboard (dashboard.html) ── aggregate stats only, refreshes every 20s
```

**Stack:** Vapi (voice + free US telephony), Vercel (hosting + serverless
functions), Supabase (call logging), plain HTML/CSS/JS on the frontend — no
framework, no build step.

---

## Real metrics

| Metric | Value |
|---|---|
| Total calls | 59 |
| Qualified calls | 6 |
| Booked calls | 2 |
| Avg call duration | 2 minutes 44 seconds |

Live, current numbers are always visible on the [dashboard](https://your-project.vercel.app/dashboard.html)
itself rather than frozen here.

---

## Decisions & tradeoffs

- **Inbound calls, not outbound.** The demo doesn't collect a visitor's phone
  number and call them — that's a consent and spam problem for a public demo.
  Instead, visitors call in or use the browser widget, which is opt-in by
  definition.
- **Aggregate-only public API.** `api/dashboard-metrics.js` deliberately never
  returns phone numbers or transcript text — only counts and rates. Once a
  URL is public, anyone can hit it, and demo callers didn't sign up to have
  their number exposed in an open API response.
- **No orchestration layer (like n8n) in the public demo.** Running a
  persistent workflow engine 24/7 for a portfolio demo isn't necessary — Vapi,
  Vercel, and Supabase are all hosted services that need nothing kept running.
  The orchestration/CRM-integration story is documented separately rather than
  wired into the live demo.
- **Browser call widget added for global reach.** Vapi's free numbers are
  US-only. Rather than limit the demo to people who can dial the US
  affordably, a Vapi Web SDK widget lets anyone talk to Sam through their
  browser mic instead.

---

## What breaks, and how it's handled

- **Explicit opt-out** ("stop calling," "remove me") ends the call immediately
  and logs it — this is the one behavior tested most rigorously, since it's
  the one that actually matters if this were live.
- **Low-confidence understanding** or an explicit request for a human triggers
  an escalation path rather than the agent guessing.
- **Zero call data** — the dashboard shows an honest "no calls yet" empty
  state rather than a broken-looking page of zeros.

---

## What I'd change at production scale

- Wire booking to a real calendar (Cal.com/Google Calendar) instead of the
  current stubbed time slots.
- Add a real CRM sync-back step (this is where an orchestration layer like
  n8n would actually earn its place — reacting to CRM events rather than
  running as a bare public-facing loop).
- Track cost-per-booked-appointment against actual Vapi/telephony spend.
- Add outbound calling with proper TCPA-compliant consent capture upstream of
  the call itself, rather than only handling opt-out reactively.

---

## Project structure

```
├── api/
│   ├── vapi-webhook.js         → receives Vapi tool-calls + end-of-call events
│   └── dashboard-metrics.js    → aggregates Supabase data for the dashboard
├── index.html                  → demo landing page + browser call widget
├── dashboard.html               → live metrics dashboard
├── package.json
└── .env.example
```

---

Built by Rehan Rizwan.
