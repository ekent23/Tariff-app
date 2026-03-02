# TradeShield: AI-Powered Tariff & Supply Chain Risk Intelligence Platform

## Problem Statement

Global supply chains are increasingly vulnerable to sudden tariff changes, trade disputes, and geopolitical instability. Industries such as defense contracting, EV battery manufacturing, and electronics production rely on internationally distributed suppliers, making them highly sensitive to tariff shifts.

Most organizations only recognize tariff-related financial impact after costs increase or production is disrupted. Existing supply chain tools focus on logistics and inventory tracking but do not proactively model tariff exposure or quantify risk before disruption occurs.

Companies need a system that transforms tariff data into actionable risk intelligence.

---

## Target Users

- Defense contractors
- EV battery manufacturers
- Electronics OEMs
- Procurement and sourcing teams
- Supply chain risk analysts
- Operations and finance leadership

---

## Solution Overview

TradeShield is an AI-powered supply chain risk intelligence platform that integrates public tariff data with company supplier and product information.

The system will:

- Ingest tariff data from public sources (e.g., USITC, WTO)
- Map products to Harmonized System (HS) tariff codes
- Calculate projected cost increases due to tariffs
- Compute a quantitative risk score (0–100 scale)
- Enable “what-if” tariff simulation scenarios
- Generate AI-powered mitigation recommendations
- Provide executive-ready summaries and exportable reports

The goal is to enable proactive planning rather than reactive crisis response.

---

## Tech Stack Justification

### AI Layer (Ollama - Local Deployment)

The AI model will run locally to:

- Preserve sensitive supplier and pricing data privacy
- Normalize ambiguous or incomplete product descriptions
- Generate plain-language risk explanations
- Recommend mitigation strategies based on exposure

Local deployment avoids reliance on external AI APIs and ensures greater control over system performance and cost.

### Backend & Data Processing

- Backend API (Node.js or FastAPI) to manage tariff ingestion, supplier uploads, and risk calculations
- PostgreSQL database to store tariff history, supplier data, and risk scores
- Public tariff APIs (USITC, WTO) for real-world data integration

This stack ensures scalability, data integrity, and real-world applicability while remaining feasible within an 8-week development timeline.
- Support scenario-based tariff simulations
- Generate AI-powered executive summaries
- Export structured risk reports for leadership teams

Future expansion may include machine learning–based predictive disruption modeling, ERP integration, and real-time geopolitical monitoring.
