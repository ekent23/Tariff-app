# System Architecture

## Diagram

**UI (Risk Dashboard) → Backend API →  → AI Layer → Database → Result**

---

## Component Descriptions

### Frontend (Risk Dashboard UI)

* Allows users to upload supplier and product data (CSV)
* Displays tariff exposure and cost impact visualizations
* Shows supplier-level risk scores
* Enables tariff “what-if” scenario simulations
* Allows report export (PDF/CSV)

---

### Backend API

* Validates and normalizes uploaded supplier/product data
* Maps products to Harmonized System (HS) tariff codes
* Retrieves tariff data from public APIs (USITC, WTO)
* Orchestrates risk scoring calculations
* Communicates with AI layer for explanations
* Returns structured analysis results to the frontend

---

### Risk Scoring Engine

* Calculates projected cost impact from tariff rates
* Applies weighted scoring model (0–100 risk score)
* Classifies risk levels (Low / Medium / High)
* Supports scenario-based simulations

Future Enhancement:
* Machine learning–based predictive disruption modeling

---

### AI Layer (Ollama)

* Runs locally on the host machine
* Generates plain-language explanations of tariff exposure
* Suggests mitigation strategies (e.g., supplier diversification, contract renegotiation)
* Summarizes scenario simulation outcomes
* Produces executive-level report summaries

---

### Tariff Data Integration Layer

* Connects to public data sources (e.g., USITC, WTO)
* Fetches tariff rate information
* Normalizes data into internal schema
* Stores historical tariff records for trend analysis

---

### Database (PostgreSQL)

Stores:

* Supplier and product data
* Tariff rate history
* Risk scores
* Simulation results
* Alert history
* AI-generated summaries

---

## Data Flow

1. User uploads supplier and product data via the dashboard.
2. Backend validates and processes the upload.
3. Products are mapped to HS tariff codes.
4. Tariff rates are retrieved from public data sources.
5. Risk scoring engine calculates exposure and cost impact.
6. AI layer generates explanations and mitigation strategies.
7. Backend compiles results and sends them to the UI.
8. Dashboard displays risk visualization and recommendations.
9. Optional: User exports executive report.

---

## Architecture Decision Records (ADRs)

### ADR 1: Local AI via Ollama

**Decision:** Use Ollama to run the AI model locally.

**Reasoning:**  
Preserves sensitive supplier data privacy, avoids recurring external API costs, and ensures the system can function without relying on external AI services.

**Trade-offs:**  
Limited model size and performance compared to cloud-hosted large models.

---

### ADR 2: Public Tariff Data Integration

**Decision:** Use publicly available tariff data (USITC, WTO APIs) instead of proprietary trade intelligence platforms.

**Reasoning:**  
Ensures transparency, accessibility, and reproducibility for academic development while demonstrating real-world data integration capability.

**Trade-offs:**  
Public APIs may have limited granularity or slower update cycles compared to enterprise trade intelligence platforms.

---
