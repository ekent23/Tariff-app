# Functional Requirements

## User Stories

### User Story 1: Analyze Tariff Exposure
##### As a supply chain analyst, I want to upload supplier and product data so that I can understand how tariffs impact my costs.

### Acceptance Criteria:

- *User can upload supplier and product data in CSV format*
- *System maps products to Harmonized System (HS) tariff codes*
- *System calculates projected cost increases*
- *Risk analysis results are returned within 5 seconds*
- *Results include a short AI-generated explanation of risk impact*

---

### User Story 2: Compare Supplier Risk
##### As a procurement manager, I want to compare suppliers based on tariff exposure so that I can choose lower-risk sourcing options.

### Acceptance Criteria:

- *System displays at least two suppliers when available*
- *Suppliers are assigned a quantitative risk score (0–100)*
- *Suppliers are sortable by risk score*
- *Highest-risk supplier is clearly highlighted*
- *AI provides mitigation suggestions for high-risk suppliers*

---

### User Story 3: Run Tariff Simulation
##### As an operations leader, I want to simulate tariff increases so that I can see projected cost and risk changes before making decisions.

### Acceptance Criteria:

- *User can input a hypothetical tariff increase percentage*
- *System recalculates projected costs in real time*
- *Updated risk scores are displayed*
- *AI generates a summary explaining the impact of the simulation*
- *Simulation results are visually distinguishable from baseline results*

---

## Non-Functional Requirements

### Performance

- Risk analysis must be generated within 5 seconds for 95% of requests
- The system must log and track all risk analysis requests for auditability.
- Tariff data ingestion must update at least once per day

---

### Security & Privacy

- Supplier and product data must not be shared with external AI services
- All AI processing occurs locally using Ollama
- All data transmission must use HTTPS encryption

---

### Usability

- Interface must be usable by non-technical business users
- Risk scores must be visually represented (charts or color indicators)
- Dashboard must function on modern desktop browsers

---

## AI-Specific Requirements

- AI must normalize ambiguous product descriptions
- AI must generate human-readable explanations of tariff exposure
- AI must provide actionable mitigation recommendations
- AI must summarize simulation results in executive-friendly language

---

## Prioritization

### Must Have

- Supplier/product upload functionality
- Tariff data integration
- Risk scoring model (0–100 scale)
- Local AI processing via Ollama
- Basic supplier comparison

---
