https://youtu.be/VNJxzEL2gnI
# Evenly

## Inspiration

The idea for Evenly came from a very real, everyday frustration: splitting bills is way harder than it should be.

Whether it was group dinners, shared groceries, trips with friends, or roommates splitting expenses, the process was always messy. Someone would take a blurry photo of a receipt, manually type items into an app, miscalculate totals, or forget who owed what. Mistakes were common, arguments weren’t rare, and tracking payments across Venmo, cash, and “I’ll pay you later” was chaotic.

What bothered me most wasn’t the math — it was the friction. The technology existed, but no tool truly handled the full flow: scan → review → split → request → track — cleanly and intuitively.

I wanted to build something that felt effortless: take a photo, confirm the details, split fairly, and send requests instantly — all from a polished mobile experience.

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

## How I built it

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

## Challenges I ran into

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

**Solution:** I redesigned layouts using card-based components, clear primary/secondary actions, and consistent typography, spacing, and color usage. The result is a UI suitable for demos and real users.

## Accomplishments I’m proud of

- **End-to-End Receipt → Payment Flow**
  I built a complete experience from camera capture to payment request without manual data entry.

- **Robust Receipt Parsing Under Noise**
  I successfully handled real-world receipts with messy OCR output while avoiding incorrect totals.

- **Intuitive Bill Request System**
  Requests are clearly visible, trackable, and update correctly in real time.

- **Demo-Ready Mobile UI**
  The app now feels like a real product, not a hack, suitable for showcasing to users or investors.

- **Scalable, Modular Design**
  Core systems (scanner, parser, UI, payments) are decoupled, making future improvements straightforward.

- **Expo Go Debugging Mastery**
  Successfully debugged and resolved countless Expo Go errors, from camera permissions to navigation state issues, ensuring smooth mobile development workflow.

## What I learned

This project reinforced several key lessons:

- **OCR is hard**: I learned that real-world receipts are incredibly messy, and even the best OCR engines struggle with font variations, lighting conditions, and layout inconsistencies. I had to build a robust parsing pipeline with careful validation and error handling to make it work reliably.
- **Explicit state > implicit assumptions in mobile navigation**: I discovered that enforcing explicit user actions and clear navigation transitions helps prevent confusion and lost context. This was crucial for keeping users from getting lost in the app flow.
- **Real-world data requires defensive systems**: I found that scanning real-world receipts means handling endless variations in format, quality, and content. I had to design systems that were broad enough to handle anything while specific enough to extract accurate data, which required extensive validation and fallback mechanisms.
- **Expo simplifies mobile development, but doesn't eliminate complexity**: While Expo provided a powerful framework for building cross-platform apps, I learned it still requires careful attention to navigation state, camera permissions, and other mobile-specific details that can make or break the user experience.

Most importantly, I learned that solving small, everyday frustrations can create products people immediately understand and appreciate.

## What’s next

I believe this can go much further in terms of easability and accessibility, as well. This app has the potential to transform experiences including taxes, receipt audits, and recollections. I would love to develop this further and make it available to the public.

The roadmap ahead focuses on turning Evenly into an everyday tool:

- Smarter item-level split suggestions
- Voice-based receipt review & corrections
- Multi-currency and international receipts
- Spending insights and group expense summaries
- Financial analysis and reporting (taxes, audits, etc.)

The long-term vision is simple:
Make shared expenses effortless with no math, no awkward reminders, and no friction.
