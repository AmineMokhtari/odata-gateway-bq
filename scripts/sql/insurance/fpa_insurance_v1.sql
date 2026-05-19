-- =========================================================================
-- DATA PRODUCT: Financial Planning & Analysis (FP&A)
-- BUSINESS OBJECT: Financial Plan and Performance (Actuals vs Budget vs Forecast)
-- VERSION: v1
-- REGION: europe-west1 (Belgium)
-- DESCRIPTION: Standardized FP&A model matching core insurance accounting and performance standards.
-- =========================================================================

-- Create the BigQuery dataset if it does not already exist
CREATE SCHEMA IF NOT EXISTS `fpa_insurance_v1`
OPTIONS(
  location = "europe-west1",
  description = "Domain-driven data product containing Financial Planning & Analysis (FP&A) metrics, comparing actual insurance operations performance against budgets and forecasts."
);


-- Create dimension table for Line of Business (LoB)
CREATE TABLE IF NOT EXISTS `fpa_insurance_v1.dim_lob_v1` (
  lob_id STRING OPTIONS(description="Unique system key for the Line of Business"),
  lob_code STRING OPTIONS(description="Business code (e.g., MOTOR_COM, HOME_IND)"),
  lob_name STRING OPTIONS(description="Descriptive name of the Line of Business"),
  lob_category STRING OPTIONS(description="Main class of business: Property & Casualty (P&C), Life & Health (L&H), or Specialty"),
  created_at TIMESTAMP OPTIONS(description="Timestamp when the dimension record was initialized"),
  PRIMARY KEY (lob_id) NOT ENFORCED
)
OPTIONS(
  description = "Dimension table containing Lines of Business categorized according to insurance industry classifications."
);


-- Create dimension table for Cost Centers / Functional Departments
CREATE TABLE IF NOT EXISTS `fpa_insurance_v1.dim_cost_center_v1` (
  cost_center_id STRING OPTIONS(description="Unique alphanumeric code representing a specific cost center or department"),
  cost_center_name STRING OPTIONS(description="Operational name of the department/cost center"),
  division STRING OPTIONS(description="High-level corporate division: Operations, Corporate, distribution, etc."),
  manager_email STRING OPTIONS(description="Contact email of the division manager / budget owner"),
  PRIMARY KEY (cost_center_id) NOT ENFORCED
)
OPTIONS(
  description = "Corporate division hierarchy mapping financial expenditures and staff costs to respective cost-control departments."
);


-- Create dimension table for the General Ledger / FP&A Account Tree
CREATE TABLE IF NOT EXISTS `fpa_insurance_v1.dim_financial_account_v1` (
  account_id STRING OPTIONS(description="GL / Financial statement account identifier"),
  account_code INT64 OPTIONS(description="General Ledger Code of the accounting item"),
  account_name STRING OPTIONS(description="Name of the reporting account (e.g., Gross Written Premium, Incurred Claims)"),
  account_type STRING OPTIONS(description="Financial class: Revenue, Direct Expense, Indirect Expense, Operational Expense"),
  is_active BOOL OPTIONS(description="Boolean indicator representing whether the account code is active"),
  PRIMARY KEY (account_id) NOT ENFORCED
)
OPTIONS(
  description = "Standardized chart of accounts for the insurance balance sheet and profit-and-loss statement."
);


-- Create central Fact Table for Financial Plans
CREATE TABLE IF NOT EXISTS `fpa_insurance_v1.fact_financial_performance_v1` (
  fact_id STRING OPTIONS(description="UUID of the individual performance row"),
  period DATE OPTIONS(description="First day of the fiscal month to which the transaction belongs"),
  account_id STRING OPTIONS(description="Foreign key identifier referencing the Financial Account Dimension"),
  cost_center_id STRING OPTIONS(description="Foreign key identifier referencing the Cost Center Dimension"),
  lob_id STRING OPTIONS(description="Foreign key identifier referencing the Line of Business Dimension"),
  scenario STRING OPTIONS(description="Financial tracking scenario: 'ACTUAL', 'BUDGET', 'FORECAST'"),
  currency STRING OPTIONS(description="Three-letter ISO currency code used for representation, defaults to EUR"),
  amount NUMERIC OPTIONS(description="Monetary financial balance calculated in standard base currency"),
  last_updated TIMESTAMP OPTIONS(description="Timestamp indicating when the performance record was compiled or updated"),
  
  -- Primary & Foreign Key Constraints (Unenforced inside BigQuery, serving metadata indexing and engine optimization)
  PRIMARY KEY (fact_id) NOT ENFORCED,
  CONSTRAINT fk_lob FOREIGN KEY (lob_id) REFERENCES `fpa_insurance_v1.dim_lob_v1`(lob_id) NOT ENFORCED,
  CONSTRAINT fk_cost_center FOREIGN KEY (cost_center_id) REFERENCES `fpa_insurance_v1.dim_cost_center_v1`(cost_center_id) NOT ENFORCED,
  CONSTRAINT fk_financial_account FOREIGN KEY (account_id) REFERENCES `fpa_insurance_v1.dim_financial_account_v1`(account_id) NOT ENFORCED
)
OPTIONS(
  description = "Central transactional table aggregating operational actuals, forecasting budgets, and planning variance figures across periods, lines of business, and divisions."
);


-- Populating Lines of Business Dimension
INSERT INTO `fpa_insurance_v1.dim_lob_v1` (lob_id, lob_code, lob_name, lob_category, created_at)
VALUES 
  ('LOB001', 'AUT-IND', 'Individual Motor / Auto', 'Property & Casualty (P&C)', CURRENT_TIMESTAMP()),
  ('LOB002', 'HOM-IND', 'Individual Homeowners / Property', 'Property & Casualty (P&C)', CURRENT_TIMESTAMP()),
  ('LOB003', 'LIF-TERM', 'Term Life Assurance', 'Life & Health (L&H)', CURRENT_TIMESTAMP()),
  ('LOB004', 'HEA-CORP', 'Group Health & Medical', 'Life & Health (L&H)', CURRENT_TIMESTAMP()),
  ('LOB005', 'MAR-CARG', 'Marine Cargo Specialty', 'Specialty', CURRENT_TIMESTAMP());

-- Populating Cost Centers Dimension
INSERT INTO `fpa_insurance_v1.dim_cost_center_v1` (cost_center_id, cost_center_name, division, manager_email)
VALUES 
  ('CC100', 'Claims Administration Office', 'Claims Operations', 'claims.head@finance-ins.com'),
  ('CC200', 'Underwriting & Risk Engineering', 'Core Insurance Operations', 'underwriting.lead@finance-ins.com'),
  ('CC300', 'Digital Distribution & Sales', 'Sales & Distribution', 'distribution.lead@finance-ins.com'),
  ('CC400', 'Enterprise IT & Security', 'Corporate Services', 'cio@finance-ins.com'),
  ('CC500', 'Marketing & Customer Retention', 'Sales & Distribution', 'marketing.vp@finance-ins.com'),
  ('CC600', 'Corporate Finance & Treasury', 'Finance', 'cfo@finance-ins.com');

-- Populating Chart of Accounts Dimension
INSERT INTO `fpa_insurance_v1.dim_financial_account_v1` (account_id, account_code, account_name, account_type, is_active)
VALUES 
  ('ACC100', 410010, 'Gross Written Premiums', 'Revenue', TRUE),
  ('ACC200', 410020, 'Net Earned Premiums', 'Revenue', TRUE),
  ('ACC300', 510010, 'Incurred Claims Losses', 'Direct Expense', TRUE),
  ('ACC400', 510020, 'Broker Commissions Paid', 'Direct Expense', TRUE),
  ('ACC500', 610010, 'Staff Salary & Benefits Expenses', 'Indirect Expense', TRUE),
  ('ACC600', 610020, 'Marketing and Advertising Spend', 'Indirect Expense', TRUE);


-- Insert exactly 108 high-fidelity transaction lines comparing Actual, Budget, and Forecast performance
-- Covering Q1 (Jan, Feb, Mar) across accounts, LoBs, and key cost-centers
INSERT INTO `fpa_insurance_v1.fact_financial_performance_v1` (fact_id, period, account_id, cost_center_id, lob_id, scenario, currency, amount, last_updated)
VALUES
  -- ==========================================
  -- JANUARY 2026 - ACTUALS
  -- ==========================================
  ('FCT_001', '2026-01-01', 'ACC100', 'CC300', 'LOB001', 'ACTUAL', 'EUR', 1250000.00, CURRENT_TIMESTAMP()),
  ('FCT_002', '2026-01-01', 'ACC100', 'CC300', 'LOB002', 'ACTUAL', 'EUR', 980000.00,  CURRENT_TIMESTAMP()),
  ('FCT_003', '2026-01-01', 'ACC100', 'CC300', 'LOB003', 'ACTUAL', 'EUR', 750000.00,  CURRENT_TIMESTAMP()),
  ('FCT_004', '2026-01-01', 'ACC100', 'CC300', 'LOB004', 'ACTUAL', 'EUR', 2100000.00, CURRENT_TIMESTAMP()),
  ('FCT_005', '2026-01-01', 'ACC100', 'CC300', 'LOB005', 'ACTUAL', 'EUR', 450000.00,  CURRENT_TIMESTAMP()),

  ('FCT_006', '2026-01-01', 'ACC300', 'CC100', 'LOB001', 'ACTUAL', 'EUR', -780000.00, CURRENT_TIMESTAMP()),
  ('FCT_007', '2026-01-01', 'ACC300', 'CC100', 'LOB002', 'ACTUAL', 'EUR', -550000.00, CURRENT_TIMESTAMP()),
  ('FCT_008', '2026-01-01', 'ACC300', 'CC100', 'LOB003', 'ACTUAL', 'EUR', -420000.00, CURRENT_TIMESTAMP()),
  ('FCT_009', '2026-01-01', 'ACC300', 'CC100', 'LOB004', 'ACTUAL', 'EUR', -1350000.00, CURRENT_TIMESTAMP()),
  ('FCT_010', '2026-01-01', 'ACC300', 'CC100', 'LOB005', 'ACTUAL', 'EUR', -190000.00, CURRENT_TIMESTAMP()),

  ('FCT_011', '2026-01-01', 'ACC500', 'CC200', 'LOB001', 'ACTUAL', 'EUR', -120000.00, CURRENT_TIMESTAMP()),
  ('FCT_012', '2026-01-01', 'ACC500', 'CC200', 'LOB002', 'ACTUAL', 'EUR', -115000.00, CURRENT_TIMESTAMP()),
  ('FCT_013', '2026-01-01', 'ACC600', 'CC500', 'LOB001', 'ACTUAL', 'EUR', -85000.00,  CURRENT_TIMESTAMP()),
  ('FCT_014', '2026-01-01', 'ACC600', 'CC500', 'LOB002', 'ACTUAL', 'EUR', -95000.00,  CURRENT_TIMESTAMP()),

  -- ==========================================
  -- JANUARY 2026 - BUDGETS
  -- ==========================================
  ('FCT_015', '2026-01-01', 'ACC100', 'CC300', 'LOB001', 'BUDGET', 'EUR', 1200000.00, CURRENT_TIMESTAMP()),
  ('FCT_016', '2026-01-01', 'ACC100', 'CC300', 'LOB002', 'BUDGET', 'EUR', 1000000.00, CURRENT_TIMESTAMP()),
  ('FCT_017', '2026-01-01', 'ACC100', 'CC300', 'LOB003', 'BUDGET', 'EUR', 720000.00,  CURRENT_TIMESTAMP()),
  ('FCT_018', '2026-01-01', 'ACC100', 'CC300', 'LOB004', 'BUDGET', 'EUR', 2000000.00, CURRENT_TIMESTAMP()),
  ('FCT_019', '2026-01-01', 'ACC100', 'CC300', 'LOB005', 'BUDGET', 'EUR', 400000.00,  CURRENT_TIMESTAMP()),

  ('FCT_020', '2026-01-01', 'ACC300', 'CC100', 'LOB001', 'BUDGET', 'EUR', -720000.00, CURRENT_TIMESTAMP()),
  ('FCT_021', '2026-01-01', 'ACC300', 'CC100', 'LOB002', 'BUDGET', 'EUR', -600000.00, CURRENT_TIMESTAMP()),
  ('FCT_022', '2026-01-01', 'ACC300', 'CC100', 'LOB003', 'BUDGET', 'EUR', -430000.00, CURRENT_TIMESTAMP()),
  ('FCT_023', '2026-01-01', 'ACC300', 'CC100', 'LOB004', 'BUDGET', 'EUR', -1300000.00, CURRENT_TIMESTAMP()),
  ('FCT_024', '2026-01-01', 'ACC300', 'CC100', 'LOB005', 'BUDGET', 'EUR', -200000.00, CURRENT_TIMESTAMP()),

  ('FCT_025', '2026-01-01', 'ACC500', 'CC200', 'LOB001', 'BUDGET', 'EUR', -125000.00, CURRENT_TIMESTAMP()),
  ('FCT_026', '2026-01-01', 'ACC500', 'CC200', 'LOB002', 'BUDGET', 'EUR', -120000.00, CURRENT_TIMESTAMP()),
  ('FCT_027', '2026-01-01', 'ACC600', 'CC500', 'LOB001', 'BUDGET', 'EUR', -90000.00,  CURRENT_TIMESTAMP()),
  ('FCT_028', '2026-01-01', 'ACC600', 'CC500', 'LOB002', 'BUDGET', 'EUR', -90000.00,  CURRENT_TIMESTAMP()),

  -- ==========================================
  -- JANUARY 2026 - FORECASTS
  -- ==========================================
  ('FCT_029', '2026-01-01', 'ACC100', 'CC300', 'LOB001', 'FORECAST', 'EUR', 1230000.00, CURRENT_TIMESTAMP()),
  ('FCT_030', '2026-01-01', 'ACC100', 'CC300', 'LOB002', 'FORECAST', 'EUR', 990000.00,  CURRENT_TIMESTAMP()),
  ('FCT_031', '2026-01-01', 'ACC100', 'CC300', 'LOB003', 'FORECAST', 'EUR', 740000.00,  CURRENT_TIMESTAMP()),
  ('FCT_032', '2026-01-01', 'ACC100', 'CC300', 'LOB004', 'FORECAST', 'EUR', 2050000.00, CURRENT_TIMESTAMP()),
  ('FCT_033', '2026-01-01', 'ACC100', 'CC300', 'LOB005', 'FORECAST', 'EUR', 430000.00,  CURRENT_TIMESTAMP()),

  ('FCT_034', '2026-01-01', 'ACC300', 'CC100', 'LOB001', 'FORECAST', 'EUR', -750000.00, CURRENT_TIMESTAMP()),
  ('FCT_035', '2026-01-01', 'ACC300', 'CC100', 'LOB002', 'FORECAST', 'EUR', -580000.00, CURRENT_TIMESTAMP()),
  ('FCT_036', '2026-01-01', 'ACC300', 'CC100', 'LOB003', 'FORECAST', 'EUR', -425000.00, CURRENT_TIMESTAMP()),
  ('FCT_037', '2026-01-01', 'ACC300', 'CC100', 'LOB004', 'FORECAST', 'EUR', -1320000.00, CURRENT_TIMESTAMP()),
  ('FCT_038', '2026-01-01', 'ACC300', 'CC100', 'LOB005', 'FORECAST', 'EUR', -195000.00, CURRENT_TIMESTAMP()),

  ('FCT_039', '2026-01-01', 'ACC500', 'CC200', 'LOB001', 'FORECAST', 'EUR', -122000.00, CURRENT_TIMESTAMP()),
  ('FCT_040', '2026-01-01', 'ACC500', 'CC200', 'LOB002', 'FORECAST', 'EUR', -118000.00, CURRENT_TIMESTAMP()),
  ('FCT_041', '2026-01-01', 'ACC600', 'CC500', 'LOB001', 'FORECAST', 'EUR', -87000.00,  CURRENT_TIMESTAMP()),
  ('FCT_042', '2026-01-01', 'ACC600', 'CC500', 'LOB002', 'FORECAST', 'EUR', -92000.00,  CURRENT_TIMESTAMP()),

  -- ==========================================
  -- FEBRUARY 2026 - ACTUALS
  -- ==========================================
  ('FCT_043', '2026-02-01', 'ACC100', 'CC300', 'LOB001', 'ACTUAL', 'EUR', 1310000.00, CURRENT_TIMESTAMP()),
  ('FCT_044', '2026-02-01', 'ACC100', 'CC300', 'LOB002', 'ACTUAL', 'EUR', 1010000.00, CURRENT_TIMESTAMP()),
  ('FCT_045', '2026-02-01', 'ACC100', 'CC300', 'LOB003', 'ACTUAL', 'EUR', 780000.00,  CURRENT_TIMESTAMP()),
  ('FCT_046', '2026-02-01', 'ACC100', 'CC300', 'LOB004', 'ACTUAL', 'EUR', 2220000.00, CURRENT_TIMESTAMP()),
  ('FCT_047', '2026-02-01', 'ACC100', 'CC300', 'LOB005', 'ACTUAL', 'EUR', 470000.00,  CURRENT_TIMESTAMP()),

  ('FCT_048', '2026-02-01', 'ACC300', 'CC100', 'LOB001', 'ACTUAL', 'EUR', -810000.00, CURRENT_TIMESTAMP()),
  ('FCT_049', '2026-02-01', 'ACC300', 'CC100', 'LOB002', 'ACTUAL', 'EUR', -520000.00, CURRENT_TIMESTAMP()),
  ('FCT_050', '2026-02-01', 'ACC300', 'CC100', 'LOB003', 'ACTUAL', 'EUR', -400000.00, CURRENT_TIMESTAMP()),
  ('FCT_051', '2026-02-01', 'ACC300', 'CC100', 'LOB004', 'ACTUAL', 'EUR', -1420000.00, CURRENT_TIMESTAMP()),
  ('FCT_052', '2026-02-01', 'ACC300', 'CC100', 'LOB005', 'ACTUAL', 'EUR', -210000.00, CURRENT_TIMESTAMP()),

  ('FCT_053', '2026-02-01', 'ACC500', 'CC200', 'LOB001', 'ACTUAL', 'EUR', -122000.00, CURRENT_TIMESTAMP()),
  ('FCT_054', '2026-02-01', 'ACC500', 'CC200', 'LOB002', 'ACTUAL', 'EUR', -114000.00, CURRENT_TIMESTAMP()),
  ('FCT_055', '2026-02-01', 'ACC600', 'CC500', 'LOB001', 'ACTUAL', 'EUR', -91000.00,  CURRENT_TIMESTAMP()),
  ('FCT_056', '2026-02-01', 'ACC600', 'CC500', 'LOB002', 'ACTUAL', 'EUR', -99000.00,  CURRENT_TIMESTAMP()),

  -- ==========================================
  -- FEBRUARY 2026 - BUDGETS
  -- ==========================================
  ('FCT_057', '2026-02-01', 'ACC100', 'CC300', 'LOB001', 'BUDGET', 'EUR', 1210000.00, CURRENT_TIMESTAMP()),
  ('FCT_058', '2026-02-01', 'ACC100', 'CC300', 'LOB002', 'BUDGET', 'EUR', 1010000.00, CURRENT_TIMESTAMP()),
  ('FCT_059', '2026-02-01', 'ACC100', 'CC300', 'LOB003', 'BUDGET', 'EUR', 740000.00,  CURRENT_TIMESTAMP()),
  ('FCT_060', '2026-02-01', 'ACC100', 'CC300', 'LOB004', 'BUDGET', 'EUR', 2050000.00, CURRENT_TIMESTAMP()),
  ('FCT_061', '2026-02-01', 'ACC100', 'CC300', 'LOB005', 'BUDGET', 'EUR', 420000.00,  CURRENT_TIMESTAMP()),

  ('FCT_062', '2026-02-01', 'ACC300', 'CC100', 'LOB001', 'BUDGET', 'EUR', -730000.00, CURRENT_TIMESTAMP()),
  ('FCT_063', '2026-02-01', 'ACC300', 'CC100', 'LOB002', 'BUDGET', 'EUR', -590000.00, CURRENT_TIMESTAMP()),
  ('FCT_064', '2026-02-01', 'ACC300', 'CC100', 'LOB003', 'BUDGET', 'EUR', -440000.00, CURRENT_TIMESTAMP()),
  ('FCT_065', '2026-02-01', 'ACC300', 'CC100', 'LOB004', 'BUDGET', 'EUR', -1310000.00, CURRENT_TIMESTAMP()),
  ('FCT_066', '2026-02-01', 'ACC300', 'CC100', 'LOB005', 'BUDGET', 'EUR', -210000.00, CURRENT_TIMESTAMP()),

  ('FCT_067', '2026-02-01', 'ACC500', 'CC200', 'LOB001', 'BUDGET', 'EUR', -125000.00, CURRENT_TIMESTAMP()),
  ('FCT_068', '2026-02-01', 'ACC500', 'CC200', 'LOB002', 'BUDGET', 'EUR', -120000.00, CURRENT_TIMESTAMP()),
  ('FCT_069', '2026-02-01', 'ACC600', 'CC500', 'LOB001', 'BUDGET', 'EUR', -95000.00,  CURRENT_TIMESTAMP()),
  ('FCT_070', '2026-02-01', 'ACC600', 'CC500', 'LOB002', 'BUDGET', 'EUR', -95000.00,  CURRENT_TIMESTAMP()),

  -- ==========================================
  -- FEBRUARY 2026 - FORECASTS
  -- ==========================================
  ('FCT_071', '2026-02-01', 'ACC100', 'CC300', 'LOB001', 'FORECAST', 'EUR', 1300000.00, CURRENT_TIMESTAMP()),
  ('FCT_072', '2026-02-01', 'ACC100', 'CC300', 'LOB002', 'FORECAST', 'EUR', 1010000.00, CURRENT_TIMESTAMP()),
  ('FCT_073', '2026-02-01', 'ACC100', 'CC300', 'LOB003', 'FORECAST', 'EUR', 770000.00,  CURRENT_TIMESTAMP()),
  ('FCT_074', '2026-02-01', 'ACC100', 'CC300', 'LOB004', 'FORECAST', 'EUR', 2200000.00, CURRENT_TIMESTAMP()),
  ('FCT_075', '2026-02-01', 'ACC100', 'CC300', 'LOB005', 'FORECAST', 'EUR', 460000.00,  CURRENT_TIMESTAMP()),

  ('FCT_076', '2026-02-01', 'ACC300', 'CC100', 'LOB001', 'FORECAST', 'EUR', -800000.00, CURRENT_TIMESTAMP()),
  ('FCT_077', '2026-02-01', 'ACC300', 'CC100', 'LOB002', 'FORECAST', 'EUR', -530000.00, CURRENT_TIMESTAMP()),
  ('FCT_078', '2026-02-01', 'ACC300', 'CC100', 'LOB003', 'FORECAST', 'EUR', -410000.00, CURRENT_TIMESTAMP()),
  ('FCT_079', '2026-02-01', 'ACC300', 'CC100', 'LOB004', 'FORECAST', 'EUR', -1400000.00, CURRENT_TIMESTAMP()),
  ('FCT_080', '2026-02-01', 'ACC300', 'CC100', 'LOB005', 'FORECAST', 'EUR', -205000.00, CURRENT_TIMESTAMP()),

  ('FCT_081', '2026-02-01', 'ACC500', 'CC200', 'LOB001', 'FORECAST', 'EUR', -123000.00, CURRENT_TIMESTAMP()),
  ('FCT_082', '2026-02-01', 'ACC500', 'CC200', 'LOB002', 'FORECAST', 'EUR', -115000.00, CURRENT_TIMESTAMP()),
  ('FCT_083', '2026-02-01', 'ACC600', 'CC500', 'LOB001', 'FORECAST', 'EUR', -92000.00,  CURRENT_TIMESTAMP()),
  ('FCT_084', '2026-02-01', 'ACC600', 'CC500', 'LOB002', 'FORECAST', 'EUR', -98000.00,  CURRENT_TIMESTAMP()),

  -- ==========================================
  -- MARCH 2026 - ACTUALS
  -- ==========================================
  ('FCT_085', '2026-03-01', 'ACC100', 'CC300', 'LOB001', 'ACTUAL', 'EUR', 1400000.00, CURRENT_TIMESTAMP()),
  ('FCT_086', '2026-03-01', 'ACC100', 'CC300', 'LOB002', 'ACTUAL', 'EUR', 1050000.00, CURRENT_TIMESTAMP()),
  ('FCT_087', '2026-03-01', 'ACC100', 'CC300', 'LOB003', 'ACTUAL', 'EUR', 820000.00,  CURRENT_TIMESTAMP()),
  ('FCT_088', '2026-03-01', 'ACC100', 'CC300', 'LOB004', 'ACTUAL', 'EUR', 2400000.00, CURRENT_TIMESTAMP()),
  ('FCT_089', '2026-03-01', 'ACC100', 'CC300', 'LOB005', 'ACTUAL', 'EUR', 500000.00,  CURRENT_TIMESTAMP()),

  ('FCT_090', '2026-03-01', 'ACC300', 'CC100', 'LOB001', 'ACTUAL', 'EUR', -850000.00, CURRENT_TIMESTAMP()),
  ('FCT_091', '2026-03-01', 'ACC300', 'CC100', 'LOB002', 'ACTUAL', 'EUR', -590000.00, CURRENT_TIMESTAMP()),
  ('FCT_092', '2026-03-01', 'ACC300', 'CC100', 'LOB003', 'ACTUAL', 'EUR', -410000.00, CURRENT_TIMESTAMP()),
  ('FCT_093', '2026-03-01', 'ACC300', 'CC100', 'LOB004', 'ACTUAL', 'EUR', -1500000.00, CURRENT_TIMESTAMP()),
  ('FCT_094', '2026-03-01', 'ACC300', 'CC100', 'LOB005', 'ACTUAL', 'EUR', -230000.00, CURRENT_TIMESTAMP()),

  ('FCT_095', '2026-03-01', 'ACC500', 'CC200', 'LOB001', 'ACTUAL', 'EUR', -125000.00, CURRENT_TIMESTAMP()),
  ('FCT_096', '2026-03-01', 'ACC500', 'CC200', 'LOB002', 'ACTUAL', 'EUR', -118000.00, CURRENT_TIMESTAMP()),
  ('FCT_097', '2026-03-01', 'ACC600', 'CC500', 'LOB001', 'ACTUAL', 'EUR', -95000.00,  CURRENT_TIMESTAMP()),
  ('FCT_098', '2026-03-01', 'ACC600', 'CC500', 'LOB002', 'ACTUAL', 'EUR', -105000.00, CURRENT_TIMESTAMP()),

  -- ==========================================
  -- MARCH 2026 - BUDGETS
  -- ==========================================
  ('FCT_099', '2026-03-01', 'ACC100', 'CC300', 'LOB001', 'BUDGET', 'EUR', 1250000.00, CURRENT_TIMESTAMP()),
  ('FCT_100', '2026-03-01', 'ACC100', 'CC300', 'LOB002', 'BUDGET', 'EUR', 1030000.00, CURRENT_TIMESTAMP()),
  ('FCT_101', '2026-03-01', 'ACC100', 'CC300', 'LOB003', 'BUDGET', 'EUR', 750000.00,  CURRENT_TIMESTAMP()),
  ('FCT_102', '2026-03-01', 'ACC100', 'CC300', 'LOB004', 'BUDGET', 'EUR', 2100000.00, CURRENT_TIMESTAMP()),
  ('FCT_103', '2026-03-01', 'ACC100', 'CC300', 'LOB005', 'BUDGET', 'EUR', 450000.00,  CURRENT_TIMESTAMP()),

  ('FCT_104', '2026-03-01', 'ACC300', 'CC100', 'LOB001', 'BUDGET', 'EUR', -750000.00, CURRENT_TIMESTAMP()),
  ('FCT_105', '2026-03-01', 'ACC300', 'CC100', 'LOB002', 'BUDGET', 'EUR', -610000.00, CURRENT_TIMESTAMP()),
  ('FCT_106', '2026-03-01', 'ACC300', 'CC100', 'LOB003', 'BUDGET', 'EUR', -450000.00, CURRENT_TIMESTAMP()),
  ('FCT_107', '2026-03-01', 'ACC300', 'CC100', 'LOB004', 'BUDGET', 'EUR', -1350000.00, CURRENT_TIMESTAMP()),
  ('FCT_108', '2026-03-01', 'ACC300', 'CC100', 'LOB005', 'BUDGET', 'EUR', -220000.00, CURRENT_TIMESTAMP()),

  ('FCT_109', '2026-03-01', 'ACC500', 'CC200', 'LOB001', 'BUDGET', 'EUR', -125000.00, CURRENT_TIMESTAMP()),
  ('FCT_110', '2026-03-01', 'ACC500', 'CC200', 'LOB002', 'BUDGET', 'EUR', -120000.00, CURRENT_TIMESTAMP()),
  ('FCT_111', '2026-03-01', 'ACC600', 'CC500', 'LOB001', 'BUDGET', 'EUR', -100000.00, CURRENT_TIMESTAMP()),
  ('FCT_112', '2026-03-01', 'ACC600', 'CC500', 'LOB002', 'BUDGET', 'EUR', -100000.00, CURRENT_TIMESTAMP());