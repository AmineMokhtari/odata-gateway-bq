---
module_name: OData v4 GCP
module_code: ov4g
description: A high-performance, extensible OData v4 to SQL translator optimized for Google Cloud (BigQuery).
status: complete
created: 2026-04-27
updated: 2026-04-27
---

# Ideas Captured

- Goal: Create a full-stack OData v4 translation engine, replacing both `odata-v4-sql` (translator) AND `odata-v4-parser` (parser).
- Name: `odata-v4-gcp` (Reflecting a broader GCP focus, though BQ is primary).
- Architecture: "Base Translator" design—extensible via Visitors/Dialects.
    - Hand-written Recursive Descent Parser: Provides maximum performance, flexible error recovery, and absolute fidelity to the OData v4 ABNF grammar.
- Scope: Full OData v4 GET support ($filter, $select, $expand, $apply, $search, $compute, $levels).
- BigQuery Optimizations:
    - Policy-driven: Toggle between `OPTIMIZE_FOR_COST` and `OPTIMIZE_FOR_LATENCY`. (Managed by Admin).
    - `$compute`: (Experimental) Pushed to `SELECT` as computed columns.
    - `$search`: Leverages native BigQuery `SEARCH()` functions.
    - `$levels`: Enforces BigQuery nesting limits with clear user warnings.
- DX & UX:
    - Human-Readable SQL: Generates clean, formatted SQL.
    - Debug Mode: Injects SQL comments explaining the translation rationale.
    - Precise error reporting: Point to the exact character in the query string.
    - Schema-aware: Suggest fixes based on the target BigQuery table schema.
    - Dry Run / Explain Mode: Return generated SQL and cost estimates before execution.
- Security & Quality:
    - Injection Safeguards: Strict parameterization or identifier escaping (backticks) for all translated inputs.
    - Test Coverage: Aim for 90%+ coverage with a heavy focus on edge-case OData filter combinations.
- Integration: Used by the backend to translate OData requests into efficient BigQuery SQL.

# Module Plan

## Vision
To provide a high-performance, full-stack OData v4 translation engine for Google Cloud, replacing legacy third-party libraries with a secure, extensible, and optimized TypeScript implementation.

## Architecture
- **Pattern**: Full-Stack Visitor/Dialect Pattern.
- **Components**:
    - **Lexer/Parser**: Hand-written Recursive Descent Parser for OData v4 query strings.
    - **Semantic AST**: Strong-typed TypeScript AST representation.
    - **Visitor Engine**: Base Visitor that walks the AST.
    - **SQL Dialects**: Concrete implementations (BigQuery, etc.) that render SQL nodes.
- **Design**: Completely **Stateless** for maximum portability and testability.

### Memory Architecture
- **Pattern**: Stateless (No persistent memory).
- **Design Note**: The module relies on external schema definitions provided at runtime for validation.

## Skills

### `ov4g-parser`
**Type:** workflow
**Core Outcome:** A valid, typed AST or a detailed error report with character-level accuracy.
**The Non-Negotiable:** Absolute fidelity to OData v4 ABNF grammar.
**Capabilities:**
| Capability | Outcome | Inputs | Outputs |
| ---------- | ------- | ------ | ------- |
| Lexing | Token stream | Raw OData string | Array of Tokens |
| Parsing | Semantic AST | Token stream | Typed Node Tree |
| Source Mapping | Positional data | AST Node | Char offsets |

---

### `ov4g-translator`
**Type:** workflow
**Core Outcome:** Parameterized SQL string with optional debug comments and cost estimates.
**The Non-Negotiable:** Total protection against SQL Injection via strict escaping.
**Capabilities:**
| Capability | Outcome | Inputs | Outputs |
| ---------- | ------- | ------ | ------- |
| Translation | SQL String | AST + Dialect | Parameterized SQL |
| Debugging | SQL Comments | AST | Annotated SQL |
| Costing | Dry-run stats | AST + BQ Client | Bytes/Slot Estimate |

---

### `ov4g-agent-expert`
**Type:** agent
**Persona:** A deep technical expert in OData internals and Google Cloud SQL dialects.
**Core Outcome:** Assistance in extending the `ov4g` module with new dialects or grammar rules.
**Status:** **Optional / Disabled by Default**.

## Configuration
| Variable | Prompt | Default | Result Template | User Setting |
| -------- | ------ | ------- | --------------- | ------------ |
| `DEFAULT_DIALECT` | Default SQL target | bigquery | `${value}` | true |
| `STRICT_MODE` | Fail on unsupported | true | `${value}` | true |
| `MAX_NESTING_LEVEL` | BQ Recursion limit | 10 | `${value}` | false |

## Build Roadmap
1. **Parser Core**: Implement the Lexer and Recursive Descent Parser for basic `$filter` and `$select`.
2. **Visitor Framework**: Build the base Visitor and the BigQuery Dialect.
3. **Advanced OData**: Add support for `$expand`, `$apply`, and `$search`.
4. **Integration**: Connect `ov4g` to the `odata-gateway-bq` backend to replace the legacy stack.

**Next steps:**
1. Build each skill using **Build an Agent (BA)** or **Build a Workflow (BW)** — share this plan document as context.
2. When all skills are built, return to **Create Module (CM)** to scaffold the module infrastructure.
