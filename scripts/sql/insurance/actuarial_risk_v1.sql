-- Dataset Creation
CREATE SCHEMA IF NOT EXISTS `actuarial_risk_v1`
OPTIONS(
  location="europe-west1",
  description="Data product containing actuarial risk, capital allocation, and solvency models aligned with standard insurance and financial industry models (e.g., Solvency II)."
);

-- Table: risk_factors
-- Description: Defines standard risk modules and sub-modules for capital modeling.
CREATE TABLE IF NOT EXISTS `actuarial_risk_v1.risk_factors` (
    risk_factor_id STRING NOT NULL OPTIONS(description="Unique identifier for the risk factor."),
    risk_module STRING NOT NULL OPTIONS(description="Broad category of risk (e.g., Market, Life, Non-Life, Default)."),
    risk_sub_module STRING NOT NULL OPTIONS(description="Specific risk type within the module (e.g., Equity Risk, Mortality Risk, Premium Risk)."),
    description STRING OPTIONS(description="Detailed description of the risk factor."),
    PRIMARY KEY (risk_factor_id) NOT ENFORCED
) OPTIONS(description="Master table for risk factors used in solvency and capital models.");

-- Table: capital_requirements
-- Description: Stores calculated Solvency Capital Requirement (SCR) components.
CREATE TABLE IF NOT EXISTS `actuarial_risk_v1.capital_requirements` (
    calculation_id STRING NOT NULL OPTIONS(description="Unique identifier for a specific calculation run."),
    reporting_date DATE NOT NULL OPTIONS(description="Date for which the capital calculation is performed."),
    entity_id STRING NOT NULL OPTIONS(description="Identifier for the legal entity or business unit."),
    risk_factor_id STRING NOT NULL OPTIONS(description="Identifier of the risk factor (FK to risk_factors)."),
    gross_scr_amount NUMERIC OPTIONS(description="Calculated Solvency Capital Requirement before diversification or mitigation."),
    net_scr_amount NUMERIC OPTIONS(description="Calculated Solvency Capital Requirement after diversification or mitigation."),
    currency STRING OPTIONS(description="Currency code (e.g., EUR)."),
    PRIMARY KEY (calculation_id, reporting_date, entity_id, risk_factor_id) NOT ENFORCED,
    FOREIGN KEY (risk_factor_id) REFERENCES `actuarial_risk_v1.risk_factors`(risk_factor_id) NOT ENFORCED
) OPTIONS(description="Fact table storing detailed capital requirement calculations per risk factor and entity.");

-- Table: own_funds
-- Description: Details available capital (Own Funds) to cover the requirements.
CREATE TABLE IF NOT EXISTS `actuarial_risk_v1.own_funds` (
    reporting_date DATE NOT NULL OPTIONS(description="Reporting date of the own funds."),
    entity_id STRING NOT NULL OPTIONS(description="Identifier for the legal entity."),
    tier_level STRING NOT NULL OPTIONS(description="Classification of own funds (Tier 1, Tier 2, Tier 3)."),
    fund_component STRING NOT NULL OPTIONS(description="Specific component (e.g., Ordinary Share Capital, Subordinated Liabilities)."),
    amount NUMERIC OPTIONS(description="Value of the own funds component."),
    currency STRING OPTIONS(description="Currency code (e.g., EUR)."),
    PRIMARY KEY (reporting_date, entity_id, tier_level, fund_component) NOT ENFORCED
) OPTIONS(description="Fact table detailing the components and tiers of available Own Funds.");

-- Sample Data Insertion: risk_factors
INSERT INTO `actuarial_risk_v1.risk_factors` (risk_factor_id, risk_module, risk_sub_module, description)
VALUES
    ('MKT_EQ', 'Market Risk', 'Equity Risk', 'Risk of loss from changes in equity prices.'),
    ('MKT_INT', 'Market Risk', 'Interest Rate Risk', 'Risk of loss from changes in interest rates.'),
    ('MKT_PROP', 'Market Risk', 'Property Risk', 'Risk of loss from changes in property values.'),
    ('MKT_SPREAD', 'Market Risk', 'Spread Risk', 'Risk of loss from changes in credit spreads.'),
    ('LIFE_MORT', 'Life Underwriting Risk', 'Mortality Risk', 'Risk of loss from increased mortality rates.'),
    ('LIFE_LON', 'Life Underwriting Risk', 'Longevity Risk', 'Risk of loss from decreased mortality rates.'),
    ('NL_PREM', 'Non-Life Underwriting Risk', 'Premium & Reserve Risk', 'Risk of loss related to non-life premiums and claims reserves.'),
    ('NL_CAT', 'Non-Life Underwriting Risk', 'Catastrophe Risk', 'Risk of loss from extreme or exceptional events.'),
    ('DEF_TYP1', 'Counterparty Default Risk', 'Type 1 Exposures', 'Risk of default on reinsurance arrangements, derivatives, etc.'),
    ('OP_RISK', 'Operational Risk', 'Operational Risk', 'Risk of loss from inadequate internal processes, people, systems, or external events.');

-- Sample Data Insertion: capital_requirements (Generating 100+ rows)
INSERT INTO `actuarial_risk_v1.capital_requirements` (calculation_id, reporting_date, entity_id, risk_factor_id, gross_scr_amount, net_scr_amount, currency)
SELECT
    CONCAT('CALC_', CAST(202512 + MOD(seq, 4) AS STRING)),
    DATE_ADD(DATE '2025-03-31', INTERVAL MOD(seq, 4) * 3 MONTH),
    CONCAT('ENT_', CAST(MOD(seq, 5) + 1 AS STRING)),
    rf.risk_factor_id,
    ROUND(CAST(1000000 + (RAND() * 5000000) AS NUMERIC), 2),
    ROUND(CAST(800000 + (RAND() * 4000000) AS NUMERIC), 2),
    'EUR'
FROM
    UNNEST(GENERATE_ARRAY(1, 150)) AS seq
    JOIN `actuarial_risk_v1.risk_factors` AS rf ON MOD(seq, 10) = CASE
        WHEN rf.risk_factor_id = 'MKT_EQ' THEN 0
        WHEN rf.risk_factor_id = 'MKT_INT' THEN 1
        WHEN rf.risk_factor_id = 'MKT_PROP' THEN 2
        WHEN rf.risk_factor_id = 'MKT_SPREAD' THEN 3
        WHEN rf.risk_factor_id = 'LIFE_MORT' THEN 4
        WHEN rf.risk_factor_id = 'LIFE_LON' THEN 5
        WHEN rf.risk_factor_id = 'NL_PREM' THEN 6
        WHEN rf.risk_factor_id = 'NL_CAT' THEN 7
        WHEN rf.risk_factor_id = 'DEF_TYP1' THEN 8
        ELSE 9
    END;

-- Sample Data Insertion: own_funds (Generating ~60 rows to complement the requirements)
INSERT INTO `actuarial_risk_v1.own_funds` (reporting_date, entity_id, tier_level, fund_component, amount, currency)
SELECT
    DATE_ADD(DATE '2025-03-31', INTERVAL MOD(seq, 4) * 3 MONTH),
    CONCAT('ENT_', CAST(MOD(seq, 5) + 1 AS STRING)),
    CASE WHEN MOD(seq, 3) = 0 THEN 'Tier 1' WHEN MOD(seq, 3) = 1 THEN 'Tier 2' ELSE 'Tier 3' END,
    CASE
        WHEN MOD(seq, 3) = 0 THEN 'Ordinary Share Capital'
        WHEN MOD(seq, 3) = 1 THEN 'Subordinated Liabilities'
        ELSE 'Deferred Tax Assets'
    END,
    ROUND(CAST(5000000 + (RAND() * 20000000) AS NUMERIC), 2),
    'EUR'
FROM
    UNNEST(GENERATE_ARRAY(1, 60)) AS seq;