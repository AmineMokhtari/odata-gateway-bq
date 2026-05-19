-- =====================================================================
-- 1. DATASET CREATION (DATA PRODUCT)
-- =====================================================================
CREATE SCHEMA IF NOT EXISTS `health_insurance_policy_v1`
OPTIONS (
  location = 'europe-west1',
  description = 'Health Insurance Policy Data Product. Contains core contractual data, insured individuals, and benefit configurations.'
);

-- =====================================================================
-- 2. DDL - TABLE CREATION WITH CONSTRAINTS AND DESCRIPTIONS
-- =====================================================================

-- Table 1: Policies (Core Contracts)
CREATE TABLE IF NOT EXISTS `health_insurance_policy_v1.policies` (
  policy_id STRING OPTIONS(description="Globally unique identifier for the health insurance policy contract (UUID)"),
  policy_number STRING OPTIONS(description="Unique business identifier printed on customer cards and documents"),
  contract_start_date DATE OPTIONS(description="The formal inception date when the coverage goes into effect"),
  contract_end_date DATE OPTIONS(description="The scheduled expiration date of the policy contract term"),
  policy_status STRING OPTIONS(description="Current life cycle state of the contract (e.g., ACTIVE, LAPSED, CANCELLED)"),
  premium_amount NUMERIC OPTIONS(description="Total premium charged for the policy term, denominated in EUR"),
  currency STRING OPTIONS(description="Three-letter currency code, default standard is EUR"),
  payment_frequency STRING OPTIONS(description="Frequency of premium payment schedules (MONTHLY, QUARTERLY, ANNUALLY)"),
  created_at TIMESTAMP OPTIONS(description="Audit timestamp indicating when this policy contract record was first generated"),
  updated_at TIMESTAMP OPTIONS(description="Audit timestamp indicating the last system modification of this policy record"),
  PRIMARY KEY (policy_id) NOT ENFORCED
)
OPTIONS (
  description = "Contains master records for all health insurance contracts signed with policyholders."
);

-- Table 2: Policy Members (Insured Entities)
CREATE TABLE IF NOT EXISTS `health_insurance_policy_v1.policy_members` (
  member_id STRING OPTIONS(description="Globally unique identifier for the individual insured person"),
  policy_id STRING OPTIONS(description="Reference key pointing to the governing policy contract"),
  first_name STRING OPTIONS(description="Legal first name of the covered member"),
  last_name STRING OPTIONS(description="Legal last name of the covered member"),
  date_of_birth DATE OPTIONS(description="Date of birth of the covered member, used for age-based benefit processing"),
  gender STRING OPTIONS(description="Identified administrative gender of the member (M, F, O)"),
  relationship_to_primary STRING OPTIONS(description="The relationship link to the primary policyholder (SELF, SPOUSE, CHILD, DEPENDENT)"),
  enrollment_date DATE OPTIONS(description="The date this specific member was added to the active coverage matrix"),
  PRIMARY KEY (member_id) NOT ENFORCED,
  CONSTRAINT fk_member_policy FOREIGN KEY (policy_id) REFERENCES `health_insurance_policy_v1.policies`(policy_id) NOT ENFORCED
)
OPTIONS (
  description = "Details individual members covered under active health insurance contracts. Supports multi-individual policies."
);

-- Table 3: Policy Coverages (Limits & Benefits)
CREATE TABLE IF NOT EXISTS `health_insurance_policy_v1.policy_coverages` (
  coverage_id STRING OPTIONS(description="Globally unique identifier for the specific coverage line item benefit"),
  policy_id STRING OPTIONS(description="Reference key pointing to the parent policy contract"),
  benefit_type STRING OPTIONS(description="The medical benefit domain category (INPATIENT, OUTPATIENT, DENTAL, VISION)"),
  annual_limit_amount NUMERIC OPTIONS(description="Maximum monetary liability covered by the insurer per policy term in EUR"),
  deductible_amount NUMERIC OPTIONS(description="Out-of-pocket amount the insured must satisfy before insurance coverage kicks in"),
  copay_percentage NUMERIC OPTIONS(description="Percentage cost share payable by the insured member (e.g., 0.10 for 10% copay)"),
  PRIMARY KEY (coverage_id) NOT ENFORCED,
  CONSTRAINT fk_coverage_policy FOREIGN KEY (policy_id) REFERENCES `health_insurance_policy_v1.policies`(policy_id) NOT ENFORCED
)
OPTIONS (
  description = "Maintains configured medical coverage structures, liability ceilings, and cost-share mechanisms assigned per policy."
);

-- =====================================================================
-- 3. DML - SAMPLE DATA INSERTS (110 ROWS TOTAL)
-- =====================================================================

-- Table 1: Policies (20 Rows)
INSERT INTO `health_insurance_policy_v1.policies` (policy_id, policy_number, contract_start_date, contract_end_date, policy_status, premium_amount, currency, payment_frequency, created_at, updated_at)
VALUES
('POL-001', 'HP-100201', '2025-01-01', '2025-12-31', 'ACTIVE', 1200.00, 'EUR', 'MONTHLY', '2024-12-15 08:30:00 UTC', '2024-12-15 08:30:00 UTC'),
('POL-002', 'HP-100202', '2025-01-01', '2025-12-31', 'ACTIVE', 2400.00, 'EUR', 'ANNUALLY', '2024-12-16 09:15:00 UTC', '2024-12-16 09:15:00 UTC'),
('POL-003', 'HP-100203', '2025-01-15', '2026-01-14', 'ACTIVE', 1800.00, 'EUR', 'MONTHLY', '2025-01-02 14:00:00 UTC', '2025-01-02 14:00:00 UTC'),
('POL-004', 'HP-100204', '2025-02-01', '2026-01-31', 'ACTIVE', 950.00, 'EUR', 'QUARTERLY', '2025-01-10 11:22:00 UTC', '2025-01-10 11:22:00 UTC'),
('POL-005', 'HP-100205', '2025-02-15', '2026-02-14', 'ACTIVE', 3200.00, 'EUR', 'MONTHLY', '2025-01-20 16:45:00 UTC', '2025-01-20 16:45:00 UTC'),
('POL-006', 'HP-100206', '2025-03-01', '2026-02-28', 'ACTIVE', 1500.00, 'EUR', 'MONTHLY', '2025-02-05 10:00:00 UTC', '2025-02-05 10:00:00 UTC'),
('POL-007', 'HP-100207', '2025-03-01', '2026-02-28', 'ACTIVE', 2100.00, 'EUR', 'ANNUALLY', '2025-02-10 13:10:00 UTC', '2025-02-10 13:10:00 UTC'),
('POL-008', 'HP-100208', '2025-03-15', '2026-03-14', 'ACTIVE', 1100.00, 'EUR', 'QUARTERLY', '2025-02-28 09:30:00 UTC', '2025-02-28 09:30:00 UTC'),
('POL-009', 'HP-100209', '2025-04-01', '2026-03-31', 'ACTIVE', 4500.00, 'EUR', 'MONTHLY', '2025-03-12 15:20:00 UTC', '2025-03-12 15:20:00 UTC'),
('POL-010', 'HP-100210', '2025-04-01', '2026-03-31', 'ACTIVE', 1350.00, 'EUR', 'MONTHLY', '2025-03-15 11:40:00 UTC', '2025-03-15 11:40:00 UTC'),
('POL-011', 'HP-100211', '2024-05-01', '2025-04-30', 'LAPSED', 1200.00, 'EUR', 'MONTHLY', '2024-04-10 08:30:00 UTC', '2025-05-01 00:00:00 UTC'),
('POL-012', 'HP-100212', '2025-05-01', '2026-04-30', 'ACTIVE', 2800.00, 'EUR', 'MONTHLY', '2025-04-12 14:50:00 UTC', '2025-04-12 14:50:00 UTC'),
('POL-013', 'HP-100213', '2025-05-15', '2026-05-14', 'ACTIVE', 850.00, 'EUR', 'ANNUALLY', '2025-04-20 17:15:00 UTC', '2025-04-20 17:15:00 UTC'),
('POL-014', 'HP-100214', '2025-06-01', '2026-05-31', 'ACTIVE', 2250.00, 'EUR', 'QUARTERLY', '2025-05-05 09:00:00 UTC', '2025-05-05 09:00:00 UTC'),
('POL-015', 'HP-100215', '2025-06-01', '2026-05-31', 'ACTIVE', 3100.00, 'EUR', 'MONTHLY', '2025-05-10 10:30:00 UTC', '2025-05-10 10:30:00 UTC'),
('POL-016', 'HP-100216', '2025-06-15', '2026-06-14', 'ACTIVE', 1400.00, 'EUR', 'MONTHLY', '2025-05-25 14:22:00 UTC', '2025-05-25 14:22:00 UTC'),
('POL-017', 'HP-100217', '2025-07-01', '2026-06-30', 'ACTIVE', 1900.00, 'EUR', 'QUARTERLY', '2025-06-12 11:00:00 UTC', '2025-06-12 11:00:00 UTC'),
('POL-018', 'HP-100218', '2025-07-01', '2026-06-30', 'ACTIVE', 4100.00, 'EUR', 'MONTHLY', '2025-06-15 16:40:00 UTC', '2025-06-15 16:40:00 UTC'),
('POL-019', 'HP-100219', '2024-08-01', '2025-07-31', 'CANCELLED', 1600.00, 'EUR', 'MONTHLY', '2024-07-15 08:30:00 UTC', '2025-01-10 09:00:00 UTC'),
('POL-020', 'HP-100220', '2025-08-01', '2026-07-31', 'ACTIVE', 2950.00, 'EUR', 'MONTHLY', '2025-07-12 10:05:00 UTC', '2025-07-12 10:05:00 UTC');

-- Table 2: Policy Members (50 Rows)
INSERT INTO `health_insurance_policy_v1.policy_members` (member_id, policy_id, first_name, last_name, date_of_birth, gender, relationship_to_primary, enrollment_date)
VALUES
('MEM-001', 'POL-001', 'Jean', 'Dupont', '1980-05-14', 'M', 'SELF', '2025-01-01'),
('MEM-002', 'POL-001', 'Marie', 'Dupont', '1982-11-23', 'F', 'SPOUSE', '2025-01-01'),
('MEM-003', 'POL-001', 'Lucas', 'Dupont', '2012-04-05', 'M', 'CHILD', '2025-01-01'),
('MEM-004', 'POL-002', 'Pierre', 'Martin', '1975-02-12', 'M', 'SELF', '2025-01-01'),
('MEM-005', 'POL-002', 'Sophie', 'Martin', '1978-08-30', 'F', 'SPOUSE', '2025-01-01'),
('MEM-006', 'POL-003', 'Thomas', 'Bernard', '1990-09-17', 'M', 'SELF', '2025-01-15'),
('MEM-007', 'POL-003', 'Emma', 'Bernard', '1993-01-25', 'F', 'SPOUSE', '2025-01-15'),
('MEM-008', 'POL-003', 'Léa', 'Bernard', '2020-06-10', 'F', 'CHILD', '2025-01-15'),
('MEM-009', 'POL-003', 'Hugo', 'Bernard', '2022-12-02', 'M', 'CHILD', '2025-01-15'),
('MEM-010', 'POL-004', 'Nicolas', 'Dubois', '1985-03-22', 'M', 'SELF', '2025-02-01'),
('MEM-011', 'POL-005', 'Chloé', 'Thomas', '1968-07-11', 'F', 'SELF', '2025-02-15'),
('MEM-012', 'POL-005', 'Alain', 'Thomas', '1965-10-04', 'M', 'SPOUSE', '2025-02-15'),
('MEM-013', 'POL-006', 'Antoine', 'Robert', '1992-04-18', 'M', 'SELF', '2025-03-01'),
('MEM-014', 'POL-007', 'Camille', 'Richard', '1988-12-05', 'F', 'SELF', '2025-03-01'),
('MEM-015', 'POL-007', 'Arthur', 'Richard', '1987-03-14', 'M', 'SPOUSE', '2025-03-01'),
('MEM-016', 'POL-007', 'Jules', 'Richard', '2018-09-21', 'M', 'CHILD', '2025-03-01'),
('MEM-017', 'POL-008', 'Manon', 'Petit', '1995-05-30', 'F', 'SELF', '2025-03-15'),
('MEM-018', 'POL-009', 'Julien', 'Durand', '1972-11-15', 'M', 'SELF', '2025-04-01'),
('MEM-019', 'POL-009', 'Nathalie', 'Durand', '1974-05-24', 'F', 'SPOUSE', '2025-04-01'),
('MEM-020', 'POL-009', 'Zoe', 'Durand', '2005-08-09', 'F', 'CHILD', '2025-04-01'),
('MEM-021', 'POL-009', 'Leo', 'Durand', '2008-01-14', 'M', 'CHILD', '2025-04-01'),
('MEM-022', 'POL-010', 'Elodie', 'Leroy', '1983-10-27', 'F', 'SELF', '2025-04-01'),
('MEM-023', 'POL-010', 'Mathis', 'Leroy', '2015-03-02', 'M', 'CHILD', '2025-04-01'),
('MEM-024', 'POL-011', 'Guillaume', 'Moreau', '1981-06-18', 'M', 'SELF', '2024-05-01'),
('MEM-025', 'POL-011', 'Celine', 'Moreau', '1984-02-28', 'F', 'SPOUSE', '2024-05-01'),
('MEM-026', 'POL-012', 'Sebastien', 'Simon', '1976-07-09', 'M', 'SELF', '2025-05-01'),
('MEM-027', 'POL-012', 'Isabelle', 'Simon', '1979-09-14', 'F', 'SPOUSE', '2025-05-01'),
('MEM-028', 'POL-012', 'Mathilde', 'Simon', '2010-11-20', 'F', 'CHILD', '2025-05-01'),
('MEM-029', 'POL-013', 'Alexandre', 'Laurent', '1998-01-03', 'M', 'SELF', '2025-05-15'),
('MEM-030', 'POL-014', 'Pauline', 'Lefebvre', '1987-04-22', 'F', 'SELF', '2025-06-01'),
('MEM-031', 'POL-014', 'Olivier', 'Lefebvre', '1985-08-12', 'M', 'SPOUSE', '2025-06-01'),
('MEM-032', 'POL-015', 'Florian', 'Michel', '1970-12-01', 'M', 'SELF', '2025-06-01'),
('MEM-033', 'POL-015', 'Sandrine', 'Michel', '1973-03-19', 'F', 'SPOUSE', '2025-06-01'),
('MEM-034', 'POL-015', 'Bastien', 'Michel', '2002-05-27', 'M', 'CHILD', '2025-06-01'),
('MEM-035', 'POL-015', 'Alice', 'Michel', '2006-07-15', 'F', 'CHILD', '2025-06-01'),
('MEM-036', 'POL-016', 'Romain', 'Garcia', '1991-10-31', 'M', 'SELF', '2025-06-15'),
('MEM-037', 'POL-016', 'Lucie', 'Garcia', '1994-02-08', 'F', 'SPOUSE', '2025-06-15'),
('MEM-038', 'POL-017', 'Maxime', 'David', '1984-06-25', 'M', 'SELF', '2025-07-01'),
('MEM-039', 'POL-017', 'Laure', 'David', '1986-09-03', 'F', 'SPOUSE', '2025-07-01'),
('MEM-040', 'POL-017', 'Clement', 'David', '2016-12-14', 'M', 'CHILD', '2025-07-01'),
('MEM-041', 'POL-018', 'Vincent', 'Bertrand', '1967-03-29', 'M', 'SELF', '2025-07-01'),
('MEM-042', 'POL-018', 'Patricia', 'Bertrand', '1969-12-12', 'F', 'SPOUSE', '2025-07-01'),
('MEM-043', 'POL-018', 'Kevin', 'Bertrand', '1999-05-04', 'M', 'CHILD', '2025-07-01'),
('MEM-044', 'POL-018', 'Audrey', 'Bertrand', '2001-08-18', 'F', 'CHILD', '2025-07-01'),
('MEM-045', 'POL-019', 'Damien', 'Roux', '1982-12-08', 'M', 'SELF', '2024-08-01'),
('MEM-046', 'POL-019', 'Virginie', 'Roux', '1984-04-14', 'F', 'SPOUSE', '2024-08-01'),
('MEM-047', 'POL-020', 'Anthony', 'Vincent', '1979-01-22', 'M', 'SELF', '2025-08-01'),
('MEM-048', 'POL-020', 'Stephanie', 'Vincent', '1981-05-19', 'F', 'SPOUSE', '2025-08-01'),
('MEM-049', 'POL-020', 'Nathan', 'Vincent', '2011-10-07', 'M', 'CHILD', '2025-08-01'),
('MEM-050', 'POL-020', 'Sarah', 'Vincent', '2014-02-25', 'F', 'CHILD', '2025-08-01');

-- Table 3: Policy Coverages (40 Rows - 2 standard benefit profiles per policy)
INSERT INTO `health_insurance_policy_v1.policy_coverages` (coverage_id, policy_id, benefit_type, annual_limit_amount, deductible_amount, copay_percentage)
VALUES
('COV-001', 'POL-001', 'INPATIENT', 150000.00, 500.00, 0.10),
('COV-002', 'POL-001', 'OUTPATIENT', 5000.00, 100.00, 0.15),
('COV-003', 'POL-002', 'INPATIENT', 300000.00, 0.00, 0.00),
('COV-004', 'POL-002', 'OUTPATIENT', 15000.00, 50.00, 0.05),
('COV-005', 'POL-003', 'INPATIENT', 200000.00, 250.00, 0.10),
('COV-006', 'POL-003', 'OUTPATIENT', 8000.00, 150.00, 0.10),
('COV-007', 'POL-004', 'INPATIENT', 100000.00, 1000.00, 0.20),
('COV-008', 'POL-004', 'OUTPATIENT', 3000.00, 200.00, 0.20),
('COV-009', 'POL-005', 'INPATIENT', 500000.00, 0.00, 0.05),
('COV-010', 'POL-005', 'OUTPATIENT', 20000.00, 0.00, 0.10),
('COV-011', 'POL-006', 'INPATIENT', 150000.00, 500.00, 0.10),
('COV-012', 'POL-006', 'OUTPATIENT', 5000.00, 100.00, 0.15),
('COV-013', 'POL-007', 'INPATIENT', 250000.00, 250.00, 0.10),
('COV-014', 'POL-007', 'OUTPATIENT', 10000.00, 100.00, 0.10),
('COV-015', 'POL-008', 'INPATIENT', 120000.00, 500.00, 0.15),
('COV-016', 'POL-008', 'OUTPATIENT', 4000.00, 150.00, 0.15),
('COV-017', 'POL-009', 'INPATIENT', 1000000.00, 0.00, 0.00),
('COV-018', 'POL-009', 'OUTPATIENT', 50000.00, 0.00, 0.05),
('COV-019', 'POL-010', 'INPATIENT', 150000.00, 500.00, 0.10),
('COV-020', 'POL-010', 'OUTPATIENT', 6000.00, 100.00, 0.10),
('COV-021', 'POL-011', 'INPATIENT', 150000.00, 500.00, 0.10),
('COV-022', 'POL-011', 'OUTPATIENT', 5000.00, 100.00, 0.15),
('COV-023', 'POL-012', 'INPATIENT', 300000.00, 250.00, 0.05),
('COV-024', 'POL-012', 'OUTPATIENT', 15000.00, 50.00, 0.10),
('COV-025', 'POL-013', 'INPATIENT', 100000.00, 1000.00, 0.20),
('COV-026', 'POL-013', 'OUTPATIENT', 3000.00, 200.00, 0.20),
('COV-027', 'POL-014', 'INPATIENT', 250000.00, 500.00, 0.10),
('COV-028', 'POL-014', 'OUTPATIENT', 10000.00, 100.00, 0.10),
('COV-029', 'POL-015', 'INPATIENT', 500000.00, 0.00, 0.05),
('COV-030', 'POL-015', 'OUTPATIENT', 25000.00, 0.00, 0.10),
('COV-031', 'POL-016', 'INPATIENT', 150000.00, 500.00, 0.10),
('COV-032', 'POL-016', 'OUTPATIENT', 5000.00, 100.00, 0.15),
('COV-033', 'POL-017', 'INPATIENT', 200000.00, 500.00, 0.10),
('COV-034', 'POL-017', 'OUTPATIENT', 8000.00, 100.00, 0.10),
('COV-035', 'POL-018', 'INPATIENT', 750000.00, 0.00, 0.00),
('COV-036', 'POL-018', 'OUTPATIENT', 35000.00, 0.00, 0.05),
('COV-037', 'POL-019', 'INPATIENT', 200000.00, 500.00, 0.10),
('COV-038', 'POL-019', 'OUTPATIENT', 7000.00, 100.00, 0.15),
('COV-039', 'POL-020', 'INPATIENT', 400000.00, 250.00, 0.05),
('COV-040', 'POL-020', 'OUTPATIENT', 20000.00, 50.00, 0.10);