---
marp: true
theme: default
paginate: true
footer: 'Empowering business users through BigQuery'
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@300;400;500;700&display=swap');

section {
  font-family: 'Roboto', sans-serif;
  color: #202124;
  background-color: #FFFFFF;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Google Sans', sans-serif;
  color: #4285F4;
}

h1 {
  font-size: 2.2em;
  border-bottom: 4px solid #EA4335;
  padding-bottom: 10px;
}

h3 {
  color: #1A73E8;
}

strong {
  color: #1A73E8;
}

blockquote {
  border-left: 5px solid #FBBC04;
  background: #F8F9FA;
  padding: 10px 20px;
  font-style: italic;
  color: #5F6368;
}

/* Google Cloud 4-color accent bar at the top of every slide */
section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 8px;
  background: linear-gradient(90deg, #4285F4 25%, #EA4335 25%, #EA4335 50%, #FBBC04 50%, #FBBC04 75%, #34A853 75%);
}
</style>

# Empowering business users through BigQuery

*Empowering Business Users, Securing Data, Driving Consumption*

---

### Preamble: The Strategic Multi-Cloud Reality

Many of our most strategic customers have adopted a clear, best-of-breed IT strategy: they rely on **Microsoft (Office 365, Copilot, Power BI)** for their collaborative workplace, while choosing **Google Cloud (BigQuery)** to power their enterprise data and analytics.

This solution is designed specifically to bridge that gap elegantly. It ensures Google Cloud remains the undisputed analytics engine of choice, empowering customers to leverage BigQuery seamlessly within their preferred business productivity tools.

---

# 1. Knowing Our Target: The Business User

---

### Who is the "Business User"?

* **The Profile:** A domain expert working in core business departments like Finance, Supply Chain, Marketing, or Operations.
* **The Skillset:** They have limited to zero SQL or coding competencies. However, they are absolute masters of **Microsoft Excel**.
* **The Dilemma:** They hold the keys to critical business decisions but are completely locked out of the enterprise data warehouse (BigQuery) because they cannot write the code to access it.
* **The Goal:** Bridge the gap. Bring BigQuery's massive scale directly into the spreadsheet environments they have mastered.

---

# 2. Executive Overview & The Problem

---

### The "SQL Tax" & The Azure Trap

**The Current Reality:**

* Data democratization fails when business users rely on Data Engineers for custom SQL exports ("SQL Tax").
* **The Azure Trap:** Microsoft pushes customers to constantly copy their "last mile" data into Azure Data Fabric simply to connect it to spreadsheets.
* **Brand Erasure:** By forcing data through Azure, BigQuery becomes entirely invisible to the business user—they never even know Google Cloud is powering their insights.
* **The Result:** Slower business decisions, frustrated teams, and unnecessary operational complexity.

---

### Existing Solutions & Their Limitations (1/2)

**1. Native ODBC / JDBC Drivers**

* *The Reality:* Requires complex local installation, drivers, and configuration on every laptop.
* *The Limitation:* Bypasses modern identity (OIDC), difficult to govern centrally, and struggles with nested BigQuery arrays in Excel.

**2. Custom Nightly CSV/SQL Exports**

* *The Reality:* Data Engineers write custom scripts to dump BigQuery tables into spreadsheets.
* *The Limitation:* Massive "SQL Tax" on engineering time, data is instantly stale, and creates compliance nightmares (local data copies).

---

### Existing Solutions & Their Limitations (2/2)

**3. Moving Data to Azure Data Fabric**

* *The Reality:* This approach requires duplicating the 'last mile' of data into Azure just for native Power BI/Excel integration.
* *The Limitation:* Expensive data egress, high operational complexity, and Google Cloud loses all end-user visibility.

**4. Power BI Data Gateway**

* *The Reality:* Deploying dedicated Windows VMs/servers to bridge Power BI Service to BigQuery.
* *The Limitation:* Performance bottlenecks, no Excel solution, and **cannot be automated via IaC (Terraform/Pulumi)**, forcing manual toil.

---

### What is OData Gateway for BigQuery?

* It is a **production-grade, zero-trust data bridge**.
* It transforms BigQuery datasets into a governed **Data Marketplace** for business users.
* It enables business users to query petabyte-scale data *directly* from the tools they already live in:
  * Microsoft Excel
  * Power BI
  * Microsoft Copilot
* All using the standard OData V4 protocol.

---

### The Big Picture

* **Old Way:** BigQuery is a data warehouse strictly for engineers and analysts who know SQL.
* **New Way:** BigQuery becomes a governed, enterprise-wide **Data Marketplace** for business users.
* We bring the power of Google Cloud directly to the business user's desktop, seamlessly.

---

# 3. Customer Outcomes & Value Proposition

---

### Frictionless Onboarding & Time-to-Value

* **Auto-Discovery (EDM):** The gateway automatically crawls BigQuery schemas.
* **Instant Native Integration:** No custom plugins or complex driver installations required. Users simply paste a secure URL, and the entire BigQuery lakehouse is instantly queryable using the familiar Excel and Power BI interfaces they already know.
* **Live Discovery Fallback:** If a table isn't in the cache, the gateway performs a targeted live check. Newly created tables are accessible instantly without waiting for a full refresh.

---

### Zero Cost Leakage & Governance

* **Dry-Run Circuit Breaker:** Every query is audited *before* execution.
* **Cost Control:** If a request exceeds a defined scan budget (e.g., 10GB), it is blocked automatically.
* **Outcome:** The CDO and FinOps teams have peace of mind. Business users can explore data without the fear of running a million-dollar query by mistake.

---

### Trusted Subsystem Security

* **Decoupled Identity:** App-access is decoupled from cloud IAM (since business user identities are rarely provisioned in Google Cloud IAM, which is usually reserved for IT users).
* **Instant Verification:** Users are verified via O365/OIDC instantly, without waiting 48h for cloud permission syncs.
* **Multi-Tenant Isolation:** BigQuery jobs are strictly bound to the user's OIDC identity at the data execution level.
* **Outcome:** Strict security meets frictionless access.

---

# 4. Google Cloud GTM Strategy & Positioning

---

### Winning the Microsoft Ecosystem

* **The Competitor Play:** Don't force customers to migrate tools or move data to compete with Azure/Synapse.
* **Our Positioning:** Natively embrace the Microsoft stack. Let them keep Excel and Power BI, but power it with the unmatched scale and performance of BigQuery.
* **Zero Data Movement:** Query directly in place. No ETL pipelines required just to find a business answer.

---

### Pitching to the Right Personas

* **Chief Data Officer (CDO):** Focus on maximizing ROI of their BigQuery investment and democratizing data without losing governance.
* **CISO / Head of Security:** Pitch the zero-trust architecture. No data is duplicated into vulnerable local CSVs, and all access is strictly bound to the user's OIDC identity via Identity-Job Isolation.
* **CTO / CFO:** Emphasize mastering cloud spend. The "Dry-Run Circuit Breaker" prevents runaway queries, and it eliminates the redundant infrastructure costs of paying for Azure Data Fabric just for connectivity.
* **Data Engineer:** Focus on eliminating ad-hoc SQL requests. Reclaim their time for high-value engineering.
* **Business Analyst:** Focus on real-time data access in their familiar environment without needing to learn SQL or wait for approvals.

---

### Objection Handling

* **"Is it secure?"** Yes. Identity-Job Isolation ensures every query runs under the authenticated user's context.
* **"Can it scale?"** Yes. Zero-Footprint Streaming uses server-driven paging to enforce strict memory boundaries (< 256MB), even for massive requests.
* **"What about complex data?"** BigQuery `RECORD` and `ARRAY` types are automatically handled, ensuring nested data is readable in spreadsheets.

---

# 5. Driving Google Cloud Spend (Consumption)

---

### Opening New Consumption Channels

* **Exponential User Growth:** Moving from dozens of SQL-writing analysts to thousands of business users.
* **Increased Data Scanned:** Every refresh of a Power BI dashboard or Excel spreadsheet triggers a live query against BigQuery.
* **The Result:** A massive, sustained increase in daily active queries and overall data consumption.

---

### The "AI Ready" Upsell (Phase 3)

* **Microsoft Copilot & Gemini Enterprise:** The roadmap includes AI-Agent shims that connect directly to Copilot and pave the way for seamless integration with **Gemini Enterprise**.
* **Conversational Analytics:** Enable business users to "chat with their data" in natural language directly within their spreadsheets, driving massive Vertex AI consumption.
* **Cross-Sell Opportunities:** As users demand more advanced analytics, this bridges the gap to Vertex AI and BigQuery's built-in ML compute features.

---

### Infrastructure Pull-Through

The gateway acts as a force multiplier for Google Cloud. Running it at enterprise scale drives consumption across:

* **BigQuery Compute:** Increases slot consumption as thousands of new users trigger live queries from their daily spreadsheets.
* **Gemini Agent Platform:** Unlocks the use of BigQuery's built-in `AI.*` functions, enriching data with generative AI on the fly before it reaches the business user.
* **Google Cloud Run / GKE:** For hosting the highly scalable gateway APIs.
* **Identity-Aware Proxy (IAP) & Load Balancing:** For secure, globally distributed access.

---

# 6. Q&A and Next Steps

---

### Next Steps & Call to Action

1. **Spin up a PoC:** You can launch this locally in 30 seconds using `ANONYMOUS_MODE`.
2. **Identify Accounts:** Look for customers struggling with "SQL Tax" or trying to integrate BigQuery with Power BI/Excel.
3. **Demo It:** Show the value live. Query a massive dataset from a blank Excel sheet.

### Questions?

---

> **A Note on Availability:**
> *Please note that the OData Gateway for BigQuery is currently undergoing internal reviews and is in the active process of being officially open-sourced. We look forward to sharing the public repository with our customers and the broader community very soon, empowering them to deploy, audit, and confidently build upon this transformative solution.*
