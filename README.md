# Evenly

## Inspiration

The idea for Evenly came from a very real, everyday frustration: splitting bills is way harder than it should be.

Whether it was group dinners, shared groceries, trips with friends, or roommates splitting expenses, the process was always messy. Someone would take a blurry photo of a receipt, manually type items into an app, miscalculate totals, or forget who owed what. Mistakes were common, arguments weren’t rare, and tracking payments across Venmo, cash, and “I’ll pay you later” was chaotic.

What bothered me most wasn’t the math — it was the friction. The technology existed, but no tool truly handled the full flow: scan → review → split → request → track — cleanly and intuitively.

I wanted to build something that felt effortless: take a photo, confirm the details, split fairly, and send requests instantly — all from a polished mobile experience.

I believe this can go much further in terms of easability and accessibility, as well. This app has the potential to transform experiences including taxes, receipt audits, and recollections. I would love to develop this further and make it available to the public.

## What it does

Evenly is a mobile-first bill-splitting and receipt management platform designed to remove friction from shared expenses.

At its core, it allows users to:

- Scan physical receipts using their phone camera
- Automatically extract items, prices, tax, and totals
- Review and edit parsed receipt data
- Split bills among friends (even unevenly)
- Send payment requests and track outstanding balances

### Key Features

- **Receipt scanning & OCR with structured parsing**
- **Item-level bill splitting, not just total splitting**
- **Friends system (add by phone number or user ID)**
- **Payment requests with manual and app-based options (Venmo, Stripe, etc.)**
- **Home dashboard showing current bills, past receipts, and pending requests**
- **Clean, modern mobile UI optimized for demos**

Rather than being just another “split calculator,” Evenly focuses on end-to-end flow and usability, ensuring users never feel lost or rushed through steps.

## How we built it

The app is built as a cross-platform mobile application using a modern React Native / Expo stack, with a lightweight backend handling receipt uploads, OCR processing, and bill state management.

### Architecture Overview

**Mobile Frontend**

- React Native (Expo)
- Camera capture & image upload
- Multi-screen navigation with explicit user confirmation
- Card-based UI for clarity and hierarchy

**Backend**

- REST API for receipt processing and bill management
- OCR + post-processing pipeline for noisy receipt text
- Stateless endpoints designed for mobile reliability

**Core Flows**

Home → New Split → Camera → Review → Split → Payments → Requests

Explicit state transitions to prevent premature navigation

Persistent bill and request tracking

Special care was taken to separate scanning logic from app UI logic, allowing the receipt pipeline to evolve independently from product features.

## Challenges we ran into

### Receipt OCR Noise & Inconsistent Formatting

Receipts vary wildly in font, layout, lighting, and quality. OCR output often contained broken decimals, misread characters (O vs 0, l vs 1), and extra noise like balances, slogans, and IDs.

**Solution:** Implemented structured parsing and validation layers, ensuring totals, subtotals, and line items were inferred conservatively and verified for consistency.

### Navigation Advancing Too Early

Some screens advanced automatically before users had reviewed or confirmed data, leading to confusion and lost context.

**Solution:** Redefined the canonical app flow and enforced explicit user actions (buttons, confirmations) before any navigation transition.

### Incorrect Bill Request Logic

If a user included themselves in a split, the app failed to surface that request correctly on the home screen.

**Solution:** Refactored bill modeling to clearly distinguish sender, recipients, and pending vs paid status, ensuring requests appear immediately in the home dashboard, even for self-included splits.

### UI Consistency & Polish

Early versions felt like a prototype: inconsistent spacing, unclear actions, and screens that didn’t feel “finished.”

**Solution:** Redesigned layouts using card-based components, clear primary/secondary actions, and consistent typography, spacing, and color usage. The result is a UI suitable for demos and real users.

## Accomplishments we’re proud of

- **End-to-End Receipt → Payment Flow**
  Built a complete experience from camera capture to payment request without manual data entry.

- **Robust Receipt Parsing Under Noise**
  Successfully handled real-world receipts with messy OCR output while avoiding incorrect totals.

- **Intuitive Bill Request System**
  Requests are clearly visible, trackable, and update correctly in real time.

- **Demo-Ready Mobile UI**
  The app now feels like a real product — not a hack — suitable for showcasing to users or investors.

- **Scalable, Modular Design**
  Core systems (scanner, parser, UI, payments) are decoupled, making future improvements straightforward.

## What we learned

This project reinforced several key lessons:

- UX matters as much as algorithms — even perfect OCR fails if the flow is confusing
- Explicit state > implicit assumptions in mobile navigation
- Real-world data is messy, and systems must be defensive
- A great demo requires polish, not just functionality

Most importantly, I learned that solving small, everyday frustrations can create products people immediately understand and appreciate.

## What’s next

The roadmap ahead focuses on turning Evenly into a truly delightful everyday tool:

- Smarter item-level split suggestions
- Voice-based receipt review & corrections
- Multi-currency and international receipts
- Real payment integrations (Venmo, Stripe, Apple Pay)
- Spending insights and group expense summaries

The long-term vision is simple:
Make shared expenses effortless — no math, no awkward reminders, no friction.