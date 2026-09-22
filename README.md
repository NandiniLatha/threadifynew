# Threadify

> **From Inspiration to Stitch — AI-Powered Custom Tailoring.**

Threadify is a full-stack bespoke fashion marketplace that bridges the gap between visual clothing inspiration and master tailoring craftsmanship. By leveraging multimodal computer vision, retrieval-augmented generation (RAG), and a structured order lifecycle state machine, Threadify enables customers to transform photos and sketches into precise, custom-tailored garments through verified artisans.

---

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI_GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

[ Live Demo (Coming Soon) ] &nbsp;|&nbsp; [ GitHub Repository ]

</div>

---

## 📌 Project Overview

Custom tailoring has historically suffered from communication friction. Consumers discover fashion inspiration across platforms like Pinterest, Instagram, and social media, but conveying design specifications to a tailor requires complex, unstructured coordination:

- **Garment Structure & Silhouette**: Categorizing necklines, sleeve cuts, drape styles, and silhouettes.
- **Fabric & Embellishment Feasibility**: Matching fabric weights, linings, and hand-embroidery requirements (Zari, Zardozi, Sequins).
- **Body Measurements & Fit**: Capturing and attaching precise multi-point measurements securely.
- **Budgeting & Turnaround Expectations**: Negotiating quotes and deadlines without standardized transparency.

**Threadify** solves this by establishing a structured digital pipeline. An intelligent multimodal AI layer parses user-submitted imagery and descriptions, converting raw inspiration into structured technical briefs that verified tailors can evaluate, quote, and execute with milestone-driven photo verification.

---

## 💡 Core Value Proposition

```text
Inspiration Image / Voice Brief
       │
       ▼
AI Vision & Brief Parsing (Gemini + OpenAI)
       │
       ▼
Structured Design Request Created
       │
       ▼
Tailor Marketplace Discovery & Custom Quotations
       │
       ▼
Customer Review & Bid Acceptance
       │
       ▼
Demo Escrow Payment Hold
       │
       ▼
Measurement Profile Attachment
       │
       ▼
Staged Production (Cutting ➔ Stitching ➔ Quality Check)
       │
       ▼
Progress Photo Upload & Approval
       │
       ▼
Dispatch & Delivery Confirmation
       │
       ▼
Escrow Release & Artisan Review
```

---

## 🤖 AI Architecture & Intelligent Features

Threadify integrates multimodal AI directly into core user workflows rather than as superficial wrappers.

```
                  ┌──────────────────────────────────────────────┐
                  │          Customer Input Modalities           │
                  │   [Fashion Photo]   [Text Brief]   [Voice]   │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │             Threadify AI Gateway             │
                  ├──────────────────────────────────────────────┤
                  │ 1. Gemini Vision Engine (gemini-2.5-flash)   │
                  │    - Garment Category & Silhouette Parsing   │
                  │    - Color, Pattern, Neckline & Complexity   │
                  │                                              │
                  │ 2. Retrieval-Augmented Generation (RAG)      │
                  │    - Local ONNX Embeddings (all-MiniLM-L6)   │
                  │    - Supabase pgvector Cosine Search         │
                  │    - Grounded Stitching & Fabric Specs       │
                  │                                              │
                  │ 3. OpenAI GPT-4o-mini & Whisper Engine       │
                  │    - Natural Language Brief Extraction       │
                  │    - AI Stylist & App Copilot Tool-Calling   │
                  │    - Speech-to-Text Voice Transcription      │
                  │                                              │
                  │ 4. Google Cloud Vision (Label Fallback)      │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │    Structured Design Brief & AI Insights     │
                  │     Ready for Tailor Bidding & Production    │
                  └──────────────────────────────────────────────┘
```

### 1. Multimodal Vision Analysis (`/api/vision/analyze`)
- **Primary Engine**: Google Gemini API (`gemini-2.5-flash-lite`) via `@google/genai`.
- **Functionality**: Analyzes user-uploaded inspiration photos and extracts a strict schema:
  - `garmentType` (e.g., *Lehenga Choli, Saree, Designer Blouse, Sherwani, Anarkali, Western Suit*)
  - `category` (*Ethnic/Traditional vs. Western/Contemporary*)
  - `gender` (*Contextual human model detection*)
  - `colour`, `pattern`, `sleeveType`, `neckline`, `style`
  - `complexity` (*Simple, Moderate, Elaborate*)
  - `confidenceScore` & `reason`
- **Fallback Layer**: Google Cloud Vision API for label detection if primary generation limits or network constraints are encountered.

### 2. Natural-Language Design Brief Parser (`/api/ai/brief`)
- **Engine**: OpenAI `gpt-4o-mini` with a deterministic rule-based keyword fallback.
- **Functionality**: Extracts structured parameters (*garment type, occasion, style aesthetic, color palette, embellishment work, fabric recommendations, fit preferences, and budget ranges*) from unstructured voice or text prompts.

### 3. Voice Transcription Interface (`/api/whisper`)
- **Engine**: OpenAI Whisper (`whisper-1`).
- **Functionality**: Accepts user audio recordings (up to 25MB), transcribing spoken design ideas into editable text within the Design Studio before submission.

### 4. Interactive AI Stylist & Copilot (`/api/chat`)
- **Engine**: Vercel AI SDK (`ai` v7 / `@ai-sdk/openai`) streaming `gpt-4o-mini` (text) and `gpt-4o` (image queries).
- **Tool Calling**: Invokes application navigation actions directly from the chat conversation (`navigate_to_page`, `track_order`, `get_payment_status`, `open_upload_flow`, `compare_quotations`).
- **Platform Grounding**: Answers queries using curated domain rules and role-specific permissions.

---

## 🧠 Retrieval-Augmented Generation (RAG)

Threadify implements a specialized fashion knowledge retrieval pipeline to assist customers with fabric selection, price estimates, and turnaround expectations.

### Architecture & Implementation Details

1. **Domain Knowledge Store**:
   - Curated domain repository covering Indian ethnic wear and Western garments, fabric compatibilities, complexity factors, stitching costs, and measurement rules.
   - Stored in the Supabase PostgreSQL database using the `pgvector` extension in the `fashion_knowledge_vectors` table.

2. **Vector Embeddings via Local ONNX Pipeline**:
   - Uses `@xenova/transformers` running the `Xenova/all-MiniLM-L6-v2` model.
   - Generates **384-dimensional normalized vector embeddings** directly within the Node.js runtime, eliminating external embedding API costs and reducing round-trip latency.

3. **Semantic Similarity Retrieval**:
   - Implemented via a custom PostgreSQL RPC function (`match_fashion_knowledge`).
   - Executes cosine similarity searches (`1 - (embedding <=> query_embedding)`) filtered by canonical garment taxonomy (*Saree, Half Saree, Kurti, Blouse, Lehenga Choli, Salwar Kameez, Sherwani, Suit, etc.*).

4. **Grounded Generation Provider**:
   - Retrieved knowledge chunks are passed to `lib/rag/generator.ts` using `DeterministicProvider`.
   - Generates structured recommendations containing:
     - `recommendedFabric`: Compatible fabrics suited for the garment complexity.
     - `estimatedStitchingRange`: Base stitching cost estimates (INR).
     - `estimatedTurnaroundDays`: Realistic tailoring timelines.
     - `measurementGuidance`: Critical body measurements required for the specific cut.
     - `reasoning`: Grounded explanation linking visual attributes to tailoring feasibility.

5. **Activation & Safety Controls**:
   - Feature-flagged via `NEXT_PUBLIC_RAG_ENABLED="true"`.
   - **Confidence Guard**: RAG execution is gated on vision analysis confidence scores to prevent irrelevant retrievals on ambiguous images.

---

## ✨ Features by Role

### 👗 Customer Portal (`/dashboard`)
| Feature | Description |
| :--- | :--- |
| **AI Design Studio** | Upload inspiration images, trigger Gemini vision analysis, generate AI briefs, and configure garment specs. |
| **Design Request Manager** | Create, view, and track custom requests. Cancel/delete open requests with multi-table database consistency. |
| **Quotation Comparison** | Review competitive quotes submitted by verified tailors, compare pricing/timelines, and accept bids. |
| **Demo Escrow Payment** | Secure sandbox checkout with simulated payment status transitions. |
| **Measurement Profile** | Store standard and custom body measurements (*Chest, Waist, Hips, Inseam, Shoulder, Sleeve*). |
| **Visual Order Stepper** | Track production stages in real time with photo proof approval. |
| **Direct Messaging** | Chat with assigned tailors and share reference attachments. |
| **Inspiration Wishlist** | Bookmark tailor profiles and curated designs. |
| **Ratings & Reviews** | Submit verified reviews upon successful delivery. |

### ✂️ Master Tailor Workspace (`/tailor`)
| Feature | Description |
| :--- | :--- |
| **Marketplace Feed** | Browse open design requests filtered by garment category, budget, and turnaround deadline. |
| **Quotation Engine** | Submit itemized bids with price (₹), delivery estimates, and custom craft notes. |
| **Production Pipeline** | Advance order states (*Cutting ➔ Stitching ➔ Quality Check ➔ Ready ➔ Shipped*) with mandatory progress photo uploads. |
| **Client Measurement Access** | Access verified client body measurements for accepted and assigned orders. |
| **Artisan Profile & Portfolio** | Manage showcase galleries, craft specializations, and verification credentials. |
| **Tailor Verification** | Submit identification and business documentation for platform verification. |

### 🛡️ Admin Command Center (`/admin`)
| Feature | Description |
| :--- | :--- |
| **Tailor Verification Review** | Audit submitted tailor credentials and approve or reject partner accounts. |
| **Order Monitoring** | Supervise platform-wide orders, delivery milestones, and escrow status. |
| **Dispute Management** | Review disputes raised by customers or tailors with resolution notes. |

---

## 🔄 Order Lifecycle & Production State Machine

Threadify enforces strict server-side state machine transitions to ensure process integrity:

```text
[ pending_bids ] ──(Tailor submits quote)──> [ quoted ]
       │
 (Customer accepts quote)
       │
       ▼
[ assigned / payment_pending ]
       │
 (Customer completes demo payment)
       │
       ▼
[ paid ]
       │
 (Tailor initiates work — requires client measurements)
       │
       ▼
[ cutting ] ──(Tailor uploads cutting proof + customer approval)──┐
                                                                  │
                                                                  ▼
[ ready ] <──(Tailor uploads final proof)── [ quality_check ] <── [ stitching ]
    │
 (Tailor dispatches package)
    │
    ▼
[ shipped ]
    │
 (Customer confirms physical receipt)
    │
    ▼
[ delivered ] ──(Payment released to tailor)──> [ completed / reviewed ]
```

### Responsibility Breakdown
- **Customer**: Creates request ➔ Accepts quote ➔ Submits payment ➔ Approves progress photos ➔ Confirms delivery ➔ Submits review.
- **Tailor**: Reviews requests ➔ Submits quote ➔ Advances production milestones ➔ Uploads progress evidence ➔ Dispatches order.
- **Admin / System**: Audits tailor verifications ➔ Resolves disputes ➔ Bypasses state locks in authorized escalations.

---

## 💳 Payment Architecture

> **Demonstration Notice**: Threadify currently operates on a **Demo / Mock Escrow Payment Engine** designed for academic presentation and sandbox evaluation.

- **Sandbox Flow**: When a customer accepts a quotation, the system generates a secure payment intent record and redirects to a simulated checkout modal (`/api/orders/[id]/mock-pay`).
- **Simulated Escrow**: Funds are marked as `completed` in the `payments` ledger and held in platform escrow until the customer inspects the delivered garment and triggers `/api/orders/[id]/confirm-delivery`.
- **Production Gateway Readiness**: The codebase includes initial architectural structures for Razorpay order generation and webhook processing (`/api/webhooks/razorpay`), preserved for live payment gateway activation.

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                              │
│         Next.js 14 App Router (React 18, TypeScript, Tailwind)         │
│     Customer Portal   •   Master Tailor Workspace   •   Admin Center   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / SSR
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           EDGE & API LAYER                             │
│       Next.js Edge Middleware (Role-Based Route Protection & Auth)      │
│       Server Actions & Route Handlers (/api/vision, /api/orders, etc.) │
└──────────────┬────────────────────┬────────────────────┬───────────────┘
               │                    │                    │
               ▼                    ▼                    ▼
┌─────────────────────────┐ ┌───────────────┐ ┌──────────────────────────┐
│     DATABASE LAYER      │ │ MEDIA STORAGE │ │        AI ENGINES        │
│   Supabase PostgreSQL   │ │ Cloudinary CDN│ │ • Google Gemini Vision   │
│ • Row-Level Security    │ │ • Inspirations│ │ • OpenAI GPT-4o-mini     │
│ • pgvector Search       │ │ • Proof Photos│ │ • OpenAI Whisper         │
│ • Real-time Subscriptions│ │ • Attachments │ │ • Local ONNX Embeddings  │
└─────────────────────────┘ └───────────────┘ └──────────────────────────┘
```

---

## 🛠️ Technology Stack

| Domain | Technology / Library | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14** (`app` router) | Server-rendered React framework with hybrid routing |
| **Core Language** | **TypeScript 5** | Strict static type checking across the entire codebase |
| **UI Components & Styling** | **Tailwind CSS 3**, **Radix UI** primitives | Utility-first responsive styling with accessible UI components |
| **Motion & Micro-interactions** | **Framer Motion 12** | Declarative page transitions and layout animations |
| **Icons & Media** | **Lucide React**, **Canvas Confetti** | Consistent iconography and milestone celebration UI |
| **Backend & APIs** | **Next.js Route Handlers** | Edge and server runtime API endpoints |
| **Database** | **Supabase (PostgreSQL 15)** | Relational database with `pgvector` extension |
| **Data Access & Security** | **PostgreSQL Row-Level Security (RLS)** | Granular SQL policies protecting tenant data |
| **Authentication** | **Supabase SSR Auth** (`@supabase/ssr`) | Cookie-based session validation across Edge and Server |
| **Computer Vision** | **Google Gemini API** (`@google/genai`) | Multimodal vision understanding (`gemini-2.5-flash-lite`) |
| **NLP & AI Copilot** | **OpenAI API**, **Vercel AI SDK** (`ai` v7) | Streaming chatbot copilot and design brief extraction |
| **Voice Processing** | **OpenAI Whisper** (`whisper-1`) | Speech-to-text voice input transcription |
| **Local RAG Embeddings** | **Transformers.js** (`@xenova/transformers`)| In-process `all-MiniLM-L6-v2` ONNX vector generation |
| **Media Hosting** | **Cloudinary CDN** (`cloudinary` v2) | High-speed cloud image delivery and optimization |
| **Payment System** | **Mock Escrow Payment Engine** | In-app simulated payment and escrow release ledger |
| **Validation** | **Zod 4** | Schema assertion and request body validation |

---

## 🔒 Security & Privacy Architecture

1. **Edge Middleware Protection (`middleware.ts`)**:
   - Inspects Supabase session cookies at the edge before serving routes.
   - Restricts `/dashboard/*` to authenticated customers.
   - Restricts `/tailor/*` to authenticated users with the `tailor` role.
   - Restricts `/admin/*` to platform administrators.
   - Unauthenticated users are redirected to `/login` with preserved redirect parameters.

2. **Database-Level Row-Level Security (RLS)**:
   - Tables (`design_requests`, `quotations`, `messages`, `measurements`, `payments`, `tailor_profiles`, `disputes`, `wishlist_items`) enforce granular SQL policies.
   - Customers can only read and mutate their own requests, measurements, and payment records.
   - Tailors can only access customer measurements for orders where their quotation was accepted.

3. **Privileged Operations via Service-Role Client (`lib/supabase/admin.ts`)**:
   - High-privilege tasks (admin tailor verification, cascading request deletion across unassigned quotes, dispute resolutions) execute through isolated server-side handlers utilizing the Supabase service role key, protected by server session authentication.

4. **Input Sanitization & Safe Fallbacks**:
   - Audio file uploads are capped at 25MB before being passed to Whisper.
   - AI endpoints enforce rate limiting and structured schema assertions to prevent prompt injection or malformed data writes.

---

## 🗄️ Database Architecture

```text
users (Supabase Auth & Profiles)
  │
  ├── tailor_profiles (1:1)
  │     ├── portfolio_images
  │     ├── verification_status
  │     └── avg_rating
  │
  ├── measurements (1:1 per customer)
  │     └── chest, waist, hips, inseam, shoulder, etc.
  │
  ├── design_requests (1:N per customer)
  │     │
  │     ├── quotations (1:N per request)
  │     │     └── tailor_id, price, estimated_days, status
  │     │
  │     ├── design_request_images (1:N per request)
  │     │     └── image_url, production_stage, is_primary
  │     │
  │     ├── payments (1:1 per accepted request)
  │     │     └── amount, escrow_status, payment_status
  │     │
  │     ├── messages (1:N per request conversation)
  │     │     └── sender_id, content, attachment_url
  │     │
  │     └── disputes (1:N per request)
  │           └── raised_by, reason, status, admin_notes
  │
  ├── wishlist_items (1:N per customer)
  └── reviews (1:N per tailor)
```

---

## 📁 Project Structure

```text
ThreadifyNew/
├── app/
│   ├── (auth)/                  # Login, Signup, Reset Password, Auth Callback
│   ├── (marketing)/             # Public Landing, About, Pricing, FAQ, Contact
│   ├── admin/                   # Admin Verification, Order & Dispute Hub
│   ├── api/                     # Backend API Route Handlers
│   │   ├── ai/brief/            # Natural-language brief parser
│   │   ├── chat/                # Vercel AI SDK streaming copilot
│   │   ├── design-requests/     # Request creation, feed & deletion
│   │   ├── orders/              # Milestone progression & mock payment
│   │   ├── vision/analyze/      # Gemini multimodal image analyzer
│   │   └── whisper/             # Speech-to-text audio route
│   ├── dashboard/               # Customer Portal (Studio, Orders, Settings)
│   ├── design-studio/           # Interactive AI Garment Customizer
│   ├── explore/                 # Verified Tailor Discovery Directory
│   ├── inspiration/             # Curated Fashion Gallery
│   └── tailor/                  # Master Tailor Workspace (Feed, Bids, Orders)
├── components/
│   ├── ai/                      # AI Chatbot drawer & voice widgets
│   ├── luxury/                  # Editorial landing cards & process showcases
│   ├── shared/                  # Navbar, Footer, StatusStepper, ThemeToggle
│   └── ui/                      # Base UI library (Buttons, Dialogs, Badges)
├── hooks/
│   └── useFashionRag.ts         # React hook for client-side RAG pipeline
├── lib/
│   ├── ai/                      # System prompts, whitelists & knowledge base
│   ├── garment-vision/          # Vision analyzer & tag extraction helpers
│   ├── rag/                     # RAG embeddings, query builder & vector store
│   └── supabase/                # Browser, server & service-role client factories
├── supabase/
│   ├── migrations/              # Version-controlled SQL schemas & RLS policies
│   └── config.toml              # Supabase CLI local configuration
├── middleware.ts                # Edge Auth & Role Protection Middleware
├── next.config.mjs              # Next.js configuration, CDN domains & headers
└── package.json                 # Project dependencies & scripts
```

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the project root based on the following template.

> **Security Notice**: Never commit `.env.local` to version control. The repository `.gitignore` ensures all `.env*` files remain strictly local.

```env
# ==============================================================================
# Supabase Configuration
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# ==============================================================================
# AI & Multimodal Services
# ==============================================================================
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key

# ==============================================================================
# Media & CDN Storage (Cloudinary)
# ==============================================================================
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# ==============================================================================
# Optional & Feature Flags
# ==============================================================================
NEXT_PUBLIC_RAG_ENABLED=true
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GOOGLE_VISION_API_KEY=your-google-vision-key-optional-fallback
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: `v18.17.0` or higher (LTS recommended)
- **npm** (v9+) or **pnpm** / **yarn**
- A **Supabase** project with PostgreSQL and Auth enabled

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/threadify.git
   cd threadify
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   # Populate .env.local with your Supabase, Gemini, OpenAI, and Cloudinary keys
   ```

4. **Apply database schema & migrations**:
   Run the SQL migrations located in `supabase/migrations/` in your Supabase SQL Editor.

5. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Validate TypeScript and Production Build**:
   ```bash
   # Run TypeScript static check
   npx tsc --noEmit

   # Execute production bundle build
   npm run build
   ```

---

## 🌐 Deployment Guide (Vercel)

Threadify is optimized for deployment on the **Vercel Platform**:

1. **Push your repository** to GitHub, GitLab, or Bitbucket.
2. **Import the project** in your Vercel Dashboard.
3. **Configure Environment Variables** in Vercel Project Settings matching your `.env.local` configuration (exclude local URLs like `localhost`).
4. **Supabase Auth Redirect URL**:
   - In your Supabase Dashboard under **Authentication ➔ URL Configuration**, add your production domain:
     - Site URL: `https://your-domain.vercel.app`
     - Redirect URLs: `https://your-domain.vercel.app/api/auth/callback`
5. **Deploy**: Trigger the initial build. Vercel will automatically compile the Next.js App Router endpoints, static assets, and Edge middleware.

---

## 🧪 Testing & Engineering Verification

The following engineering checks have been performed to validate application stability:

- **TypeScript Compilation**: Executed `npx tsc --noEmit` across all 70+ app routes, components, and libraries with 0 type errors.
- **Production Build Validation**: Completed full production bundling (`npm run build`) validating SSR, static page generation, and dynamic route rendering across all routes.
- **Security & RLS Audits**: Verified tenant data isolation across customer, tailor, and admin roles.
- **Cascading Deletion Consistency**: Verified that customer-initiated request deletions safely clean up orphaned quotation records and design images via authenticated service-role transactions.
- **Auth Flow Integrity**: Verified signup role persistence (customer vs. tailor metadata synchronization) and role-specific dashboard redirects.

---

## 🏆 Key Engineering Highlights

- **Hybrid AI Pipeline**: Combines large multimodal models (Gemini) for visual parsing with lightweight local embeddings (Transformers.js ONNX) for zero-latency, privacy-preserving RAG retrieval.
- **Multi-Tenant Row-Level Security**: Zero reliance on application-layer filtering alone; PostgreSQL policies enforce data isolation at the database layer.
- **Resilient Fallback Design**: AI endpoints gracefully degrade (e.g., Gemini ➔ Google Vision fallback; OpenAI ➔ Rule-based keyword parser) to prevent user-facing failures during quota exhaustion.
- **Edge Route Protection**: Authentication and role resolution execute at the Edge before rendering downstream application routes.
- **Staged Visual Proof Protocol**: Tailors cannot advance orders to completion without uploading stage-specific photographic evidence, protecting buyers in bespoke transactions.

---

## 🛠️ Technical Challenges & Solutions

| Challenge Encountered | Technical Root Cause | Resolution Implemented |
| :--- | :--- | :--- |
| **Cross-Tenant Deletion Consistency** | Deleting a customer design request failed to remove corresponding tailor quotations due to restrictive RLS deletion policies on child tables. | Implemented an authenticated, server-side transaction handler (`/api/design-requests/[id]`) using the Supabase admin client to atomically clean up associated records upon customer deletion. |
| **Dynamic SSR Route Bailout During Build** | Tailor request feeds querying live URL search parameters caused static generation errors during `next build`. | Configured explicit `export const dynamic = "force-dynamic"` route segment declarations on dynamic dashboard pages. |
| **In-Process RAG Latency & API Costs** | Calling external embedding APIs for every design query added latency and potential failure points. | Integrated `@xenova/transformers` to run the `all-MiniLM-L6-v2` embedding model in-process via ONNX, generating 384-dimensional vectors with zero external API calls. |
| **Auth Metadata Role Desynchronization** | User roles stored in Supabase `raw_user_meta_data` could occasionally desync from the public `users` table on custom signup flows. | Created a PostgreSQL database trigger (`handle_new_user`) that automatically reads signup metadata and provisions the public `users` record in a single atomic transaction. |

---

## 🗺️ Future Roadmap

- [ ] **Live Payment Gateway Activation**: Transition from simulated escrow to live Razorpay payment processing and auto-payout splits.
- [ ] **3D Virtual Garment Preview**: Integration of Three.js / WebGL for 3D garment simulation based on body measurement inputs.
- [ ] **Geospatial Artisan Discovery**: Location-based radius filtering to connect clients with nearby bespoke boutiques.
- [ ] **Mobile Application**: Native mobile experience using React Native / Flutter sharing existing Supabase and AI backends.

---

## 🎓 Academic Capstone Context

This software was engineered and designed as a **Final Year B.Tech in Computer Science and Engineering (CSE) Capstone Project**. It serves as an academic demonstration of full-stack system architecture, multimodal artificial intelligence integration, relational database security modeling, and modern web application development.

---

## 👥 Project Author

- **Nandini Latha Nallamothu**  
  *B.Tech in Computer Science and Engineering*  
  Raghu Engineering College (Autonomous), Visakhapatnam, India

---

## 📄 License

License: Not specified.
