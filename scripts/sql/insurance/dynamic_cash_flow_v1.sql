-- ==========================================
-- 1. DATASET CREATION (DATA PRODUCT)
-- ==========================================
-- This creates the data product container in the default region (europe-west1).
CREATE SCHEMA IF NOT EXISTS `dynamic_cash_flow_v1`
OPTIONS (
  location = 'europe-west1',
  description = 'Data product managing dynamic cash flow projections, asset-liability matching (ALM), and stress-test scenarios.'
);

-- ==========================================
-- 2. TABLE CREATION WITH CONSTRAINTS & METADATA
-- ==========================================

-- Table A: Scenarios Master
CREATE TABLE IF NOT EXISTS `dynamic_cash_flow_v1.scenarios` (
  scenario_id STRING OPTIONS(description="Unique identifier for the cash flow projection scenario (e.g., SCEN_01)"),
  scenario_name STRING OPTIONS(description="Descriptive name of the cash flow model scenario"),
  scenario_type STRING OPTIONS(description="Classification of scenario: HISTORICAL, BASELINE, DETERMINISTIC_STRESS, STOCHASTIC"),
  volatility_multiplier FLOAT64 OPTIONS(description="Factor applied to standard volatility curves under this scenario"),
  created_at TIMESTAMP OPTIONS(description="Timestamp when the scenario configuration was registered"),
  PRIMARY KEY (scenario_id) NOT ENFORCED
)
OPTIONS (
  description = "Dimension table defining cash flow modeling scenarios, ranging from baseline projections to extreme macroeconomic stress events."
);

-- Table B: Financial & Insurance Instruments Master
CREATE TABLE IF NOT EXISTS `dynamic_cash_flow_v1.instruments` (
  instrument_id STRING OPTIONS(description="Unique system identifier for the financial asset or liability portfolio"),
  instrument_name STRING OPTIONS(description="Commercial or operational name of the financial contract or insurance book"),
  asset_liability_type STRING OPTIONS(description="Distinguishes cash flows as ASSET (Inflow-generating) or LIABILITY (Outflow-generating)"),
  instrument_class STRING OPTIONS(description="Industry classification: SOVEREIGN_BOND, CORPORATE_LOAN, ANNUITY_PORTFOLIO, LIFE_INSURANCE_BOOK, CASH_EQUIVALENT"),
  currency STRING OPTIONS(description="ISO 4217 currency code of the instrument's cash flows"),
  inception_date DATE OPTIONS(description="The date the instrument contract or book of business became active"),
  maturity_date DATE OPTIONS(description="Maturity or expected run-off end date of the underlying contracts"),
  PRIMARY KEY (instrument_id) NOT ENFORCED
)
OPTIONS (
  description = "Dimension table containing the portfolio of financial assets, insurance liabilities, and contract vehicles generating dynamic cash flows."
);

-- Table C: Dynamic Cash Flow Projections
CREATE TABLE IF NOT EXISTS `dynamic_cash_flow_v1.cash_flow_projections` (
  projection_id STRING OPTIONS(description="Global unique identifier for the specific projected cash flow record"),
  scenario_id STRING OPTIONS(description="Foreign key referencing the evaluation scenario under which this projection runs"),
  instrument_id STRING OPTIONS(description="Foreign key referencing the originating financial instrument or insurance book"),
  projection_date DATE OPTIONS(description="Target date of the anticipated cash inflow or outflow"),
  cash_flow_type STRING OPTIONS(description="Granular transaction classification: PREMIUM, CLAIM, COUPON_PAYMENT, PRINCIPAL_REPAYMENT, INVESTMENT_INCOME, OPERATING_EXPENSE"),
  direction STRING OPTIONS(description="Direction of cash movement: INFLOW (positive liquidity impact) or OUTFLOW (negative liquidity impact)"),
  base_amount NUMERIC OPTIONS(description="The baseline forecasted cash amount in instrument currency before stress or volatility factors"),
  dynamic_adjusted_amount NUMERIC OPTIONS(description="The dynamically adjusted cash amount taking scenario parameters into consideration"),
  confidence_interval_lower NUMERIC OPTIONS(description="The 5th percentile lower boundary for stochastic cash flow projections"),
  confidence_interval_upper NUMERIC OPTIONS(description="The 95th percentile upper boundary for stochastic cash flow projections"),
  last_updated TIMESTAMP OPTIONS(description="Timestamp indicating when this projection record was last computed and updated"),
  PRIMARY KEY (projection_id) NOT ENFORCED,
  CONSTRAINT fk_projections_scenario FOREIGN KEY (scenario_id) REFERENCES `dynamic_cash_flow_v1.scenarios`(scenario_id) NOT ENFORCED,
  CONSTRAINT fk_projections_instrument FOREIGN KEY (instrument_id) REFERENCES `dynamic_cash_flow_v1.instruments`(instrument_id) NOT ENFORCED
)
OPTIONS (
  description = "Transactional facts table storing high-frequency dynamic projections of cash inflows and outflows across various scenario models and temporal horizons."
);

-- ==========================================
-- 3. DATA POPULATION (INSERT DML)
-- ==========================================

-- Populate Scenarios (3 Scenarios)
INSERT INTO `dynamic_cash_flow_v1.scenarios` (scenario_id, scenario_name, scenario_type, volatility_multiplier, created_at)
VALUES 
  ('SCEN-001', 'Baseline Forecast', 'BASELINE', 1.0, CURRENT_TIMESTAMP()),
  ('SCEN-002', 'Interest Rate Shock (+200bps)', 'DETERMINISTIC_STRESS', 1.5, CURRENT_TIMESTAMP()),
  ('SCEN-003', 'Liquidity Crisis & High Inflation', 'STOCHASTIC', 2.2, CURRENT_TIMESTAMP());

-- Populate Instruments (4 Instruments)
INSERT INTO `dynamic_cash_flow_v1.instruments` (instrument_id, instrument_name, asset_liability_type, instrument_class, currency, inception_date, maturity_date)
VALUES 
  ('INST-001', '10Y Euro Sovereign Bond Portfolio', 'ASSET', 'SOVEREIGN_BOND', 'EUR', DATE '2024-01-15', DATE '2034-01-15'),
  ('INST-002', 'Retail Mortgage Backed Loan Book', 'ASSET', 'CORPORATE_LOAN', 'EUR', DATE '2023-06-01', DATE '2043-06-01'),
  ('INST-003', 'Immediate Lifetime Annuity Book', 'LIABILITY', 'ANNUITY_PORTFOLIO', 'EUR', DATE '2020-01-01', DATE '2050-12-31'),
  ('INST-004', 'Group Term Life Protection Portfolio', 'LIABILITY', 'LIFE_INSURANCE_BOOK', 'EUR', DATE '2025-01-01', DATE '2030-01-01');

-- Generate Sample Data (Exactly 120 dynamic projections)
-- This combines cross joins with projection calendars to dynamically model realistic curves
INSERT INTO `dynamic_cash_flow_v1.cash_flow_projections` (
  projection_id, 
  scenario_id, 
  instrument_id, 
  projection_date, 
  cash_flow_type, 
  direction, 
  base_amount, 
  dynamic_adjusted_amount, 
  confidence_interval_lower, 
  confidence_interval_upper, 
  last_updated
)
SELECT 
  -- Generate a clean deterministic unique key
  CONCAT(s.scenario_id, '_', i.instrument_id, '_M', FORMAT_DATE('%Y%m', months.projection_date)) AS projection_id,
  s.scenario_id,
  i.instrument_id,
  months.projection_date,
  -- Dynamic transactional mapping depending on asset class
  CASE 
    WHEN i.instrument_class = 'SOVEREIGN_BOND' THEN 'COUPON_PAYMENT'
    WHEN i.instrument_class = 'CORPORATE_LOAN' THEN 'PRINCIPAL_REPAYMENT'
    WHEN i.instrument_class = 'ANNUITY_PORTFOLIO' THEN 'CLAIM'
    WHEN i.instrument_class = 'LIFE_INSURANCE_BOOK' THEN 'PREMIUM'
    ELSE 'INVESTMENT_INCOME'
  END AS cash_flow_type,
  -- Map standard financial directionality
  CASE 
    WHEN i.asset_liability_type = 'ASSET' THEN 'INFLOW'
    ELSE 'OUTFLOW'
  END AS direction,
  -- Formulate unique base amounts per portfolio
  CAST(ROUND(
    CASE 
      WHEN i.instrument_class = 'SOVEREIGN_BOND' THEN 450000 + (months.month_index * 1200)
      WHEN i.instrument_class = 'CORPORATE_LOAN' THEN 1200000 - (months.month_index * 5000)
      WHEN i.instrument_class = 'ANNUITY_PORTFOLIO' THEN 850000 + (months.month_index * 800)
      WHEN i.instrument_class = 'LIFE_INSURANCE_BOOK' THEN 1500000 + (months.month_index * 15000)
      ELSE 500000
    END, 2) AS NUMERIC) AS base_amount,
  -- Adjust the amounts dynamically based on scenario volatility modifiers
  CAST(ROUND(
    CASE 
      WHEN i.asset_liability_type = 'ASSET' THEN 
        (CASE 
          WHEN i.instrument_class = 'SOVEREIGN_BOND' THEN 450000 + (months.month_index * 1200)
          ELSE 1200000 - (months.month_index * 5000)
        END) * (1.0 + (s.volatility_multiplier - 1.0) * 0.05)
      ELSE 
        (CASE 
          WHEN i.instrument_class = 'ANNUITY_PORTFOLIO' THEN 850000 + (months.month_index * 800)
          ELSE 1500000 + (months.month_index * 15000)
         END) * (1.0 + (s.volatility_multiplier - 1.0) * 0.12) -- liabilities inflate more in stress scenarios
    END, 2) AS NUMERIC) AS dynamic_adjusted_amount,
  -- Calculate stochastic confidence intervals
  CAST(ROUND(
    (CASE 
      WHEN i.asset_liability_type = 'ASSET' THEN 400000
      ELSE 800000
    END) * (1.0 - (0.08 * s.volatility_multiplier)), 2) AS NUMERIC) AS confidence_interval_lower,
  CAST(ROUND(
    (CASE 
      WHEN i.asset_liability_type = 'ASSET' THEN 1300000
      ELSE 1700000
    END) * (1.0 + (0.08 * s.volatility_multiplier)), 2) AS NUMERIC) AS confidence_interval_upper,
  CURRENT_TIMESTAMP() AS last_updated
FROM 
  `dynamic_cash_flow_v1.scenarios` s
CROSS JOIN 
  `dynamic_cash_flow_v1.instruments` i
CROSS JOIN (
  -- Generates a sequence of 10 consecutive monthly projections starting June 2026
  -- 3 scenarios x 4 instruments x 10 months = Exactly 120 structured rows
  SELECT 
    DATE_ADD(DATE '2026-06-01', INTERVAL idx MONTH) AS projection_date,
    idx AS month_index
  FROM UNNEST(GENERATE_ARRAY(0, 9)) AS idx
) months;