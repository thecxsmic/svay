# Features & Tools: Svay Intelligence

This document outlines the core features and tools available in the Svay Intelligence platform, categorized by functionality.

## 1. Analytics & Tracking
- **Historical Analytics:** Tracks subscribers, total views, and video counts over time via daily snapshots.
- **Growth Projections:** Uses historical data and recent video performance to predict future subscriber and view growth.
- **Video Performance:** Analyzes performance metrics for the last 10 uploads, highlighting "Hot" content compared to average benchmarks.
- **Milestone Tracking:** Monitors progress toward key targets (e.g., 100K views) with daily projections.

## 2. Market Intelligence & Trends
- **Trend Radar:** 
  - Real-time scanning of niche content to identify viral momentum.
  - Generates AI-powered insights, including "Quick Wins" and high-potential video ideas.
  - Tracks psychological hooks and winning content patterns.
- **Competitor Matrix:**
  - Identifies direct rivals, market leaders, and rising stars within a niche.
  - Compares reach (subscribers) and efficiency (views/subscribers).
  - Performs deep-dive analysis on competitor "Content DNA" and growth velocity.

## 3. Search & Content Discovery
- **Advanced YouTube Search:** 
  - Multi-parameter search including region, language, upload date, and duration.
  - Sort by relevance, date, view count, or proprietary virality/growth scores.
  - HD and caption filters for precision targeting.
- **Search Pipeline:** Integrates custom ranking and virality algorithms to surface high-performing content.

## 4. Library & Note-Taking
- **Research Notes:** Users can save findings (trends, competitor analysis, content ideas) to a dedicated library.
- **Rich Text Editor:** Built-in editor for saving deep-dive research, strategy notes, and content blueprints.

## 5. Subscription & Billing
- **Pro Features:** Exclusive access to advanced tracking and real-time analysis tools.
- **Plan Management:** Integration with Razorpay for subscription lifecycle management.
- **Status Monitoring:** Real-time feedback on billing status (active, halted, expired).

## 6. Infrastructure & Utilities
- **AI Integration:** Leverages custom ranking and virality models (`@/lib/ranking/virality`) for content scoring.
- **Vector Search:** Utilizes Zilliz/Milvus for semantic search and embedding-based content matching.
- **Automation Pipeline:** Background jobs for index queue processing and daily analytics snapshots.
- **Email Reporting:** Automated email delivery of reports (Trend Radar and Competitor Matrix) via Resend.
- **Auth Integration:** Powered by Clerk for secure user management and per-user data isolation.
