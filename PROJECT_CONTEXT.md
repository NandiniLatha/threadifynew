# Threadify Project Context

## Project Name
Threadify

## Project Vision
Threadify is an AI-powered custom clothing marketplace that connects customers with tailors, boutiques, fashion designers, and clothing studios.

Users can browse designers, upload clothing inspiration images, request custom outfits, chat with designers, and place custom orders.

## Design Philosophy
The application should feel:

- Premium
- Modern
- Elegant
- Professional
- Image-focused
- Easy to use

Every screen should look like a real startup product, not a demo or template.
---

# User Roles

## Customer

A customer can:

- Browse designers
- Search by category, city, and budget
- Upload inspiration images
- Request custom clothing
- Chat with designers
- Book consultations
- Track order progress
- Leave reviews after order completion

---

## Designer

A designer can:

- Create a professional profile
- Upload portfolio images
- List specialties
- Set pricing
- Accept or reject requests
- Chat with customers
- Manage incoming orders
- Update order progress
- Receive ratings and reviews

---

## Admin

An admin can:

- Verify designers
- Manage users
- Remove inappropriate content
- Review reported profiles
- Monitor platform activity
---

# Marketplace Rules

Threadify is a real marketplace, not a sample gallery.

All generated content must feel authentic and realistic.

## Designer Rules

- Every designer must have a unique business name.
- Never use placeholder names like "John Doe", "ABC Tailor", or "Test Designer".
- Prefer Indian boutique and studio names.
- Every designer must belong to one primary specialty.

Examples:
- Bridal Couture
- Luxury Sarees
- Menswear
- Sherwanis
- Designer Blouses
- Western Dresses
- Kids Wear
- Party Wear

## Portfolio Rules

Every designer should have a portfolio.

Portfolio images must always match the designer's specialty.

Examples:

✅ Bridal designer → Bridal dresses only

✅ Menswear designer → Suits, shirts, sherwanis, blazers

✅ Saree designer → Sarees only

❌ Never mix unrelated categories.

## Demo Data Rules

Until enough real users join, the application should display high-quality demo designers.

Demo designers should:
- Look realistic
- Have different ratings
- Have different experience levels
- Have different cities
- Have different price ranges
- Never feel repetitive
---

# UI & UX Guidelines

## Overall Design Style

Threadify should feel like a premium fashion marketplace.

Design inspiration:

- Pinterest (image discovery)
- Airbnb (clean cards)
- Etsy (independent creators)
- Zara (minimal fashion aesthetic)

The interface should be elegant, modern, and luxurious.

---

## Design Principles

Every page should:

- Be clean and uncluttered.
- Use plenty of white space.
- Prioritize images over text.
- Feel fast and responsive.
- Work beautifully on desktop, tablet, and mobile.

---

## Cards

Designer cards should always include:

- Cover image
- Circular profile picture
- Business name
- Specialty
- Rating
- Location
- Starting price
- Verified badge (if applicable)

Cards should have:

- Rounded corners
- Soft shadows
- Smooth hover animations
- Consistent spacing

---

## Buttons

Buttons should:

- Have rounded corners
- Be easy to click
- Show hover effects
- Display loading states during actions

Avoid tiny buttons.

---

## Images

Images are the most important part of Threadify.

Always prefer:

- High-quality
- Bright
- Professional
- Fashion-focused

Never stretch images.

Always preserve aspect ratio.

Show skeleton loaders while images load.

Use lazy loading whenever possible.

---

## Animations

Animations should be subtle.

Examples:

- Fade in
- Smooth hover
- Gentle scale on cards
- Smooth page transitions

Avoid flashy or distracting animations.

---

## Empty States

Never show a blank page.

Instead display helpful messages like:

"No designers found."

"Try another category."

"Explore trending designers."

Always provide a next action.

---

## Loading States

Never show blank white screens.

Display:

- Skeleton cards
- Loading placeholders
- Progress indicators

The application should always feel responsive.
---

# Demo Data Generation Rules

Threadify should always appear active and populated, even when there are few real users.

Demo content should look realistic and professional.

## Demo Designers

When generating demo designers:

- Generate between 20 and 50 unique designers.
- Every business name must be unique.
- Never use placeholder names.
- Prefer Indian boutique and fashion studio names.

Examples:

- House of Meera
- Velvet Vogue
- Royal Needle Studio
- Noor Couture
- Urban Loom
- Silk Stories

---

## Designer Information

Each designer should include:

- Business name
- Owner name
- Profile photo
- Cover image
- City
- State
- Specialty
- Short description
- Experience
- Rating
- Review count
- Starting price
- Response time
- Verification status

Every designer should feel different.

---

## Portfolio

Each designer should have between 6 and 12 portfolio images.

Portfolio images must match the designer's specialty.

Examples:

Bridal Couture
→ Bridal dresses only

Menswear
→ Suits, Sherwanis, Blazers, Shirts

Luxury Sarees
→ Sarees only

Designer Blouses
→ Blouse designs only

Never mix unrelated fashion categories.

---

## Ratings

Ratings should feel realistic.

Examples:

4.4
4.5
4.6
4.7
4.8
4.9

Avoid giving everyone 5.0.

---

## Experience

Use different experience levels.

Examples:

2 Years
4 Years
7 Years
10 Years
15 Years

---

## Pricing

Generate different starting prices.

Examples:

₹799

₹999

₹1499

₹2499

₹3999

₹6999

Avoid identical pricing for every designer.

---

## Locations

Prefer Indian cities.

Examples:

Hyderabad

Visakhapatnam

Vijayawada

Bangalore

Chennai

Mumbai

Delhi

Pune

Kochi

Never assign every designer to the same city.

---

## Reviews

Generate realistic review counts.

Examples:

18

54

136

422

985

Never use identical values repeatedly.

---

## Goal

A new user visiting Threadify should believe they are browsing a real and active fashion marketplace.
---

# Development Rules

## General Principles

Always improve the existing codebase instead of replacing it.

Understand the current implementation before making changes.

Never rewrite working features unless explicitly requested.

Always preserve existing functionality.

---

## Code Quality

Write production-ready code.

The code should be:

- Clean
- Modular
- Reusable
- Well structured
- Easy to maintain

Avoid duplicated code.

Extract reusable components whenever appropriate.

---

## Before Making Changes

Before modifying any file:

1. Analyze the existing implementation.
2. Identify dependencies.
3. Explain what will change.
4. Make the smallest safe modification possible.

Never make unnecessary changes.

---

## UI Changes

Do not redesign unrelated pages.

If asked to modify one page:

- Only modify that page.
- Keep the overall design language consistent.
- Preserve responsiveness.

---

## Bug Fixes

When fixing a bug:

- Find the root cause.
- Do not apply temporary fixes.
- Explain why the bug occurred.
- Ensure no existing functionality breaks.

---

## Performance

Prefer efficient solutions.

Avoid unnecessary:

- Database queries
- API calls
- Component re-renders

Use lazy loading where appropriate.

Optimize images whenever possible.

---

## Existing Features

Never remove existing functionality unless explicitly instructed.

If a feature might be affected:

- Warn before changing it.
- Suggest a safer approach.

---

## Project Consistency

Always follow the architecture already used in the project.

Reuse:

- Existing components
- Existing utilities
- Existing hooks
- Existing styles

Do not create duplicate implementations.

---

## Error Handling

Always handle:

- Loading states
- Empty states
- Network failures
- Unexpected errors

The application should fail gracefully.
---

# AI Development Workflow

## Always Start With Analysis

Before writing code:

- Analyze the existing project structure.
- Understand how the current feature works.
- Identify affected files.
- Explain the implementation plan.

Never immediately start changing code.

---

## Make Small Changes

Prefer multiple small, safe changes instead of one massive refactor.

Keep pull requests and code modifications focused.

---

## Preserve Existing Functionality

Every change must preserve existing features unless explicitly instructed otherwise.

Never remove functionality to simplify implementation.

---

## Reuse Before Creating

Before creating:

- Components
- Hooks
- Utility functions
- Services

Always check whether an existing implementation can be reused.

Avoid duplicate code.

---

## Ask When Uncertain

If requirements are unclear:

- Ask for clarification.
- Do not make assumptions that could break the project.

---

## Respect Existing Architecture

Follow the project's:

- Folder structure
- Naming conventions
- Component architecture
- State management
- Styling approach

Avoid introducing a different architecture.

---

## Complete Every Task

When implementing a feature:

- Update frontend if needed.
- Update backend if needed.
- Update database if needed.
- Handle loading states.
- Handle error states.
- Handle empty states.

Do not leave features half-finished.
