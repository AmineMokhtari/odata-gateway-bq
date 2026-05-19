-- Create the Actuarial Loss Development dataset in europe-west1
CREATE SCHEMA IF NOT EXISTS `actuarial_loss_development_v1`
OPTIONS (
  location = 'europe-west1',
  description = 'Actuarial Loss Development Triangles data product containing premium cohorts, historical paid claims, case reserves, and development status. Designed for reserve adequacy analysis.'
);

-- Create Premium Cohorts table (Dimension/Anchor)
CREATE TABLE IF NOT EXISTS `actuarial_loss_development_v1.premium_cohorts` (
  accident_year INT64 OPTIONS(description = 'The calendar year in which the loss events occurred or premium was earned.'),
  line_of_business STRING OPTIONS(description = 'The insurance line of business (e.g., Commercial_Auto, Workers_Comp, General_Liability).'),
  written_premium NUMERIC OPTIONS(description = 'Total gross written premium for the designated Accident Year and LOB in USD.'),
  earned_premium NUMERIC OPTIONS(description = 'Total earned premium representing the portion of written premium exposure consumed during the Accident Year in USD.'),
  underwriting_year_status STRING OPTIONS(description = 'Status of the underwriting year cohort: OPEN or CLOSED.'),
  currency STRING OPTIONS(description = 'Three-letter ISO currency code of the financial values.'),
  created_at TIMESTAMP OPTIONS(description = 'Audit timestamp of row creation.'),
  PRIMARY KEY (accident_year, line_of_business) NOT ENFORCED
)
OPTIONS (
  description = 'Holds premium exposure baseline details grouped by Accident Year and Line of Business, serving as denominators for loss ratio and development calculations.'
);

-- Create Loss Development Triangles table (Fact Table)
CREATE TABLE IF NOT EXISTS `actuarial_loss_development_v1.loss_development_triangles` (
  accident_year INT64 OPTIONS(description = 'The calendar year in which the loss events occurred.'),
  line_of_business STRING OPTIONS(description = 'The insurance line of business (must match the premium cohort LOB).'),
  development_lag_months INT64 OPTIONS(description = 'Number of months elapsed from the beginning of the accident year to the evaluation date (e.g., 12, 24, 36, etc.).'),
  evaluation_date DATE OPTIONS(description = 'The specific evaluation cutoff date for this development point (Accident Year + Lag).'),
  cumulative_paid_claims NUMERIC OPTIONS(description = 'Cumulative financial payments made to claimants from inception of accident year to evaluation date.'),
  outstanding_case_reserves NUMERIC OPTIONS(description = 'Estimated financial liability of known, open claims set by claims adjusters at the evaluation date.'),
  reported_claims_count INT64 OPTIONS(description = 'Cumulative count of claims reported to the insurer from inception of accident year to evaluation date.'),
  closed_claims_count INT64 OPTIONS(description = 'Cumulative count of claims that have been fully closed with or without payment.'),
  open_claims_count INT64 OPTIONS(description = 'Active claim count outstanding at the evaluation date (reported_claims_count - closed_claims_count).'),
  ultimate_loss_estimate_current NUMERIC OPTIONS(description = 'The actuary’s current best estimate of total final liability (Paid + Outstanding + IBNR projection) at this evaluation step.'),
  updated_at TIMESTAMP OPTIONS(description = 'Audit timestamp of last data refresh.'),
  PRIMARY KEY (accident_year, line_of_business, development_lag_months) NOT ENFORCED
)
OPTIONS (
  description = 'Transactional and longitudinal snapshot table storing historical paid losses, outstanding case reserves, and settlement metrics over progressive development lags.'
);

-- Adding Referential Integrity Constraint
ALTER TABLE `actuarial_loss_development_v1.loss_development_triangles`
ADD CONSTRAINT fk_premium_cohort 
FOREIGN KEY (accident_year, line_of_business) 
REFERENCES `actuarial_loss_development_v1.premium_cohorts` (accident_year, line_of_business) NOT ENFORCED;


-- Seeding Premium Cohorts (8 Accident Years x 3 Lines of Business = 24 rows)
INSERT INTO `actuarial_loss_development_v1.premium_cohorts` 
(accident_year, line_of_business, written_premium, earned_premium, underwriting_year_status, currency, created_at)
VALUES
  -- Workers Compensation (High premium, long-tail development)
  (2018, 'Workers_Comp', 25000000.00, 24500000.00, 'CLOSED', 'USD', CURRENT_TIMESTAMP()),
  (2019, 'Workers_Comp', 26200000.00, 25800000.00, 'CLOSED', 'USD', CURRENT_TIMESTAMP()),
  (2020, 'Workers_Comp', 24000000.00, 23800000.00, 'CLOSED', 'USD', CURRENT_TIMESTAMP()),
  (2021, 'Workers_Comp', 27500000.00, 27000000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP()),
  (2022, 'Workers_Comp', 29000000.00, 28500000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP()),
  (2023, 'Workers_Comp', 31000000.00, 30100000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP()),
  (2024, 'Workers_Comp', 32500000.00, 31800000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP()),
  (2025, 'Workers_Comp', 34000000.00, 17000000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP()), -- Partial earned for recent year

  -- Commercial Auto (Medium premium, medium-tail development)
  (2018, 'Commercial_Auto', 15000000.00, 14800000.00, 'CLOSED', 'USD', CURRENT_TIMESTAMP()),
  (2019, 'Commercial_Auto', 15800000.00, 15500000.00, 'CLOSED', 'USD', CURRENT_TIMESTAMP()),
  (2020, 'Commercial_Auto', 14200000.00, 14000000.00, 'CLOSED', 'USD', CURRENT_TIMESTAMP()),
  (2021, 'Commercial_Auto', 16500000.00, 16200000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP()),
  (2022, 'Commercial_Auto', 17000000.00, 16800000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP()),
  (2023, 'Commercial_Auto', 18500000.00, 18000000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP()),
  (2024, 'Commercial_Auto', 19000000.00, 18700000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP()),
  (2025, 'Commercial_Auto', 20500000.00, 10250000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP()),

  -- General Liability (Medium premium, very long-tail development)
  (2018, 'General_Liability', 18000000.00, 17800000.00, 'CLOSED', 'USD', CURRENT_TIMESTAMP()),
  (2019, 'General_Liability', 19000000.00, 18600000.00, 'CLOSED', 'USD', CURRENT_TIMESTAMP()),
  (2020, 'General_Liability', 17500000.00, 17200000.00, 'CLOSED', 'USD', CURRENT_TIMESTAMP()),
  (2021, 'General_Liability', 19500000.00, 19100000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP()),
  (2022, 'General_Liability', 21000000.00, 20500000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP()),
  (2023, 'General_Liability', 22000000.00, 21400000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP()),
  (2024, 'General_Liability', 23500000.00, 23000000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP()),
  (2025, 'General_Liability', 25000000.00, 12500000.00, 'OPEN',   'USD', CURRENT_TIMESTAMP());


-- Seeding Workers' Compensation development snapshots (36 rows)
INSERT INTO `actuarial_loss_development_v1.loss_development_triangles`
(accident_year, line_of_business, development_lag_months, evaluation_date, cumulative_paid_claims, outstanding_case_reserves, reported_claims_count, closed_claims_count, open_claims_count, ultimate_loss_estimate_current, updated_at)
VALUES
  -- AY 2018 Workers_Comp (Fully Developed over 96 Months to Ultimate)
  (2018, 'Workers_Comp', 12, '2018-12-31',  4200000.00, 12500000.00,  850, 320, 530, 18500000.00, CURRENT_TIMESTAMP()),
  (2018, 'Workers_Comp', 24, '2019-12-31',  8100000.00,  8800000.00,  980, 510, 470, 18200000.00, CURRENT_TIMESTAMP()),
  (2018, 'Workers_Comp', 36, '2020-12-31', 11400000.00,  5900000.00, 1020, 690, 330, 18000000.00, CURRENT_TIMESTAMP()),
  (2018, 'Workers_Comp', 48, '2021-12-31', 13800000.00,  3700000.00, 1040, 810, 230, 17950000.00, CURRENT_TIMESTAMP()),
  (2018, 'Workers_Comp', 60, '2022-12-31', 15200000.00,  2200000.00, 1045, 920, 125, 17800000.00, CURRENT_TIMESTAMP()),
  (2018, 'Workers_Comp', 72, '2023-12-31', 16100000.00,  1200000.00, 1048, 975,  73, 17750000.00, CURRENT_TIMESTAMP()),
  (2018, 'Workers_Comp', 84, '2024-12-31', 16800000.00,   450000.00, 1050,1020,  30, 17650000.00, CURRENT_TIMESTAMP()),
  (2018, 'Workers_Comp', 96, '2025-12-31', 17150000.00,    80000.00, 1050,1045,   5, 17600000.00, CURRENT_TIMESTAMP()),

  -- AY 2019 Workers_Comp
  (2019, 'Workers_Comp', 12, '2019-12-31',  4500000.00, 13100000.00,  910, 340, 570, 19400000.00, CURRENT_TIMESTAMP()),
  (2019, 'Workers_Comp', 24, '2020-12-31',  8600000.00,  9200000.00, 1010, 540, 470, 19100000.00, CURRENT_TIMESTAMP()),
  (2019, 'Workers_Comp', 36, '2021-12-31', 12100000.00,  6100000.00, 1050, 720, 330, 18900000.00, CURRENT_TIMESTAMP()),
  (2019, 'Workers_Comp', 48, '2022-12-31', 14500000.00,  3800000.00, 1070, 840, 230, 18800000.00, CURRENT_TIMESTAMP()),
  (2019, 'Workers_Comp', 60, '2023-12-31', 15900000.00,  2100000.00, 1075, 950, 125, 18600000.00, CURRENT_TIMESTAMP()),
  (2019, 'Workers_Comp', 72, '2024-12-31', 16900000.00,  1000000.00, 1078,1010,  68, 18450000.00, CURRENT_TIMESTAMP()),
  (2019, 'Workers_Comp', 84, '2025-12-31', 17500000.00,   350000.00, 1080,1055,  25, 18300000.00, CURRENT_TIMESTAMP()),

  -- AY 2020 Workers_Comp
  (2020, 'Workers_Comp', 12, '2020-12-31',  4100000.00, 12200000.00,  820, 310, 510, 17900000.00, CURRENT_TIMESTAMP()),
  (2020, 'Workers_Comp', 24, '2021-12-31',  7900000.00,  8400000.00,  940, 490, 450, 17500000.00, CURRENT_TIMESTAMP()),
  (2020, 'Workers_Comp', 36, '2022-12-31', 11100000.00,  5500000.00,  980, 660, 320, 17200000.00, CURRENT_TIMESTAMP()),
  (2020, 'Workers_Comp', 48, '2023-12-31', 13300000.00,  3400000.00, 1000, 780, 220, 17100000.00, CURRENT_TIMESTAMP()),
  (2020, 'Workers_Comp', 60, '2024-12-31', 14600000.00,  1900000.00, 1005, 880, 125, 16950000.00, CURRENT_TIMESTAMP()),
  (2020, 'Workers_Comp', 72, '2025-12-31', 15400000.00,   950000.00, 1010, 940,  70, 16800000.00, CURRENT_TIMESTAMP()),

  -- AY 2021 Workers_Comp
  (2021, 'Workers_Comp', 12, '2021-12-31',  4700000.00, 13900000.00,  950, 360, 590, 20500000.00, CURRENT_TIMESTAMP()),
  (2021, 'Workers_Comp', 24, '2022-12-31',  9100000.00,  9800000.00, 1060, 570, 490, 20100000.00, CURRENT_TIMESTAMP()),
  (2021, 'Workers_Comp', 36, '2023-12-31', 12800000.00,  6500000.00, 1100, 760, 340, 19900000.00, CURRENT_TIMESTAMP()),
  (2021, 'Workers_Comp', 48, '2024-12-31', 15300000.00,  4100000.00, 1120, 890, 230, 19800000.00, CURRENT_TIMESTAMP()),
  (2021, 'Workers_Comp', 60, '2025-12-31', 16800000.00,  2300000.00, 1125,1000, 125, 19600000.00, CURRENT_TIMESTAMP()),

  -- AY 2022 Workers_Comp
  (2022, 'Workers_Comp', 12, '2022-12-31',  5000000.00, 14600000.00, 1010, 380, 630, 21600000.00, CURRENT_TIMESTAMP()),
  (2022, 'Workers_Comp', 24, '2023-12-31',  9600000.00, 10300000.00, 1120, 600, 520, 21200000.00, CURRENT_TIMESTAMP()),
  (2022, 'Workers_Comp', 36, '2024-12-31', 13500000.00,  6900000.00, 1160, 800, 360, 2100000.00, CURRENT_TIMESTAMP()),
  (2022, 'Workers_Comp', 48, '2025-12-31', 16100000.00,  4300000.00, 1180, 940, 240, 20850000.00, CURRENT_TIMESTAMP()),

  -- AY 2023 Workers_Comp
  (2023, 'Workers_Comp', 12, '2023-12-31',  5300000.00, 15500000.00, 1080, 410, 670, 22900000.00, CURRENT_TIMESTAMP()),
  (2023, 'Workers_Comp', 24, '2024-12-31', 10100000.00, 11000000.00, 1190, 640, 550, 22500000.00, CURRENT_TIMESTAMP()),
  (2023, 'Workers_Comp', 36, '2025-12-31', 14200000.00,  7300000.00, 1230, 850, 380, 22200000.00, CURRENT_TIMESTAMP()),

  -- AY 2024 Workers_Comp
  (2024, 'Workers_Comp', 12, '2024-12-31',  5500000.00, 16300000.00, 1130, 430, 700, 24100000.00, CURRENT_TIMESTAMP()),
  (2024, 'Workers_Comp', 24, '2025-12-31', 10600000.00, 11500000.00, 1250, 670, 580, 23600000.00, CURRENT_TIMESTAMP()),

  -- AY 2025 Workers_Comp
  (2025, 'Workers_Comp', 12, '2025-12-31',  2900000.00,  8700000.00,  600, 230, 370, 12900000.00, CURRENT_TIMESTAMP());


-- Seeding Commercial Auto development snapshots (36 rows)
INSERT INTO `actuarial_loss_development_v1.loss_development_triangles`
(accident_year, line_of_business, development_lag_months, evaluation_date, cumulative_paid_claims, outstanding_case_reserves, reported_claims_count, closed_claims_count, open_claims_count, ultimate_loss_estimate_current, updated_at)
VALUES
  -- AY 2018 Commercial_Auto (Fast Settlement/Medium Tail)
  (2018, 'Commercial_Auto', 12, '2018-12-31',  4800000.00,  5100000.00, 1200, 650, 550, 10500000.00, CURRENT_TIMESTAMP()),
  (2018, 'Commercial_Auto', 24, '2019-12-31',  7500000.00,  2600000.00, 1420,1050, 370, 10300000.00, CURRENT_TIMESTAMP()),
  (2018, 'Commercial_Auto', 36, '2020-12-31',  8900000.00,  1200000.00, 1450,1280, 170, 10200000.00, CURRENT_TIMESTAMP()),
  (2018, 'Commercial_Auto', 48, '2021-12-31',  9600000.00,   450000.00, 1460,1390,  70, 10100000.00, CURRENT_TIMESTAMP()),
  (2018, 'Commercial_Auto', 60, '2022-12-31',  9900000.00,   150000.00, 1465,1440,  25, 10100000.00, CURRENT_TIMESTAMP()),
  (2018, 'Commercial_Auto', 72, '2023-12-31', 10020000.00,    40000.00, 1465,1458,   7, 10070000.00, CURRENT_TIMESTAMP()),
  (2018, 'Commercial_Auto', 84, '2024-12-31', 10050000.00,    10000.00, 1465,1463,   2, 10065000.00, CURRENT_TIMESTAMP()),
  (2018, 'Commercial_Auto', 96, '2025-12-31', 10060000.00,         0.00, 1465,1465,   0, 10060000.00, CURRENT_TIMESTAMP()),

  -- AY 2019 Commercial_Auto
  (2019, 'Commercial_Auto', 12, '2019-12-31',  5000000.00,  5400000.00, 1250, 680, 570, 11100000.00, CURRENT_TIMESTAMP()),
  (2019, 'Commercial_Auto', 24, '2020-12-31',  7900000.00,  2700000.00, 1480,1100, 380, 10900000.00, CURRENT_TIMESTAMP()),
  (2019, 'Commercial_Auto', 36, '2021-12-31',  9400000.00,  1300000.00, 1510,1330, 180, 10800000.00, CURRENT_TIMESTAMP()),
  (2019, 'Commercial_Auto', 48, '2022-12-31', 10100000.00,   470000.00, 1520,1450,  70, 10700000.00, CURRENT_TIMESTAMP()),
  (2019, 'Commercial_Auto', 60, '2023-12-31', 10400000.00,   160000.00, 1525,1500,  25, 10600000.00, CURRENT_TIMESTAMP()),
  (2019, 'Commercial_Auto', 72, '2024-12-31', 10520000.00,    45000.00, 1525,1517,   8, 10580000.00, CURRENT_TIMESTAMP()),
  (2019, 'Commercial_Auto', 84, '2025-12-31', 10550000.00,    12000.00, 1525,1522,   3, 10570000.00, CURRENT_TIMESTAMP()),

  -- AY 2020 Commercial_Auto
  (2020, 'Commercial_Auto', 12, '2020-12-31',  4500000.00,  4800000.00, 1120, 610, 510,  9900000.00, CURRENT_TIMESTAMP()),
  (2020, 'Commercial_Auto', 24, '2021-12-31',  7100000.00,  2400000.00, 1330, 990, 340,  9700000.00, CURRENT_TIMESTAMP()),
  (2020, 'Commercial_Auto', 36, '2022-12-31',  8400000.00,  1100000.00, 1360,1190, 170,  9600000.00, CURRENT_TIMESTAMP()),
  (2020, 'Commercial_Auto', 48, '2023-12-31',  9100000.00,   420000.00, 1370,1300,  70,  9550000.00, CURRENT_TIMESTAMP()),
  (2020, 'Commercial_Auto', 60, '2024-12-31',  9350000.00,   140000.00, 1375,1350,  25,  9500000.00, CURRENT_TIMESTAMP()),
  (2020, 'Commercial_Auto', 72, '2025-12-31',  9460000.00,    35000.00, 1375,1367,   8,  9500000.00, CURRENT_TIMESTAMP()),

  -- AY 2021 Commercial_Auto
  (2021, 'Commercial_Auto', 12, '2021-12-31',  5200000.00,  5600000.00, 1310, 710, 600, 11500000.00, CURRENT_TIMESTAMP()),
  (2021, 'Commercial_Auto', 24, '2022-12-31',  8200000.00,  2800000.00, 1550,1150, 400, 11300000.00, CURRENT_TIMESTAMP()),
  (2021, 'Commercial_Auto', 36, '2023-12-31',  9800000.00,  1400000.00, 1580,1390, 190, 11200000.00, CURRENT_TIMESTAMP()),
  (2021, 'Commercial_Auto', 48, '2024-12-31', 10500000.00,   490000.00, 1590,1520,  70, 11100000.00, CURRENT_TIMESTAMP()),
  (2021, 'Commercial_Auto', 60, '2025-12-31', 10800000.00,   170000.00, 1595,1570,  25, 11000000.00, CURRENT_TIMESTAMP()),

  -- AY 2022 Commercial_Auto
  (2022, 'Commercial_Auto', 12, '2022-12-31',  5400000.00,  5800000.00, 1350, 730, 620, 11900000.00, CURRENT_TIMESTAMP()),
  (2022, 'Commercial_Auto', 24, '2023-12-31',  8500000.00,  2900000.00, 1600,1190, 410, 11700000.00, CURRENT_TIMESTAMP()),
  (2022, 'Commercial_Auto', 36, '2024-12-31', 10100000.00,  1500000.00, 1630,1430, 200, 11600000.00, CURRENT_TIMESTAMP()),
  (2022, 'Commercial_Auto', 48, '2025-12-31', 10900000.00,   510000.00, 1640,1570,  70, 11500000.00, CURRENT_TIMESTAMP()),

  -- AY 2023 Commercial_Auto
  (2023, 'Commercial_Auto', 12, '2023-12-31',  5900000.00,  6300000.00, 1470, 800, 670, 12900000.00, CURRENT_TIMESTAMP()),
  (2023, 'Commercial_Auto', 24, '2024-12-31',  9300000.00,  3200000.00, 1740,1290, 450, 12700000.00, CURRENT_TIMESTAMP()),
  (2023, 'Commercial_Auto', 36, '2025-12-31', 11100000.00,  1600000.00, 1770,1550, 220, 12600000.00, CURRENT_TIMESTAMP()),

  -- AY 2024 Commercial_Auto
  (2024, 'Commercial_Auto', 12, '2024-12-31',  6100000.00,  6500000.00, 1510, 820, 690, 13300000.00, CURRENT_TIMESTAMP()),
  (2024, 'Commercial_Auto', 24, '2025-12-31',  9600000.00,  3300000.00, 1790,1330, 460, 13100000.00, CURRENT_TIMESTAMP()),

  -- AY 2025 Commercial_Auto
  (2025, 'Commercial_Auto', 12, '2025-12-31',  3300000.00,  3500000.00,  810, 440, 370,  7100000.00, CURRENT_TIMESTAMP());


-- Seeding General Liability development snapshots (36 rows)
INSERT INTO `actuarial_loss_development_v1.loss_development_triangles`
(accident_year, line_of_business, development_lag_months, evaluation_date, cumulative_paid_claims, outstanding_case_reserves, reported_claims_count, closed_claims_count, open_claims_count, ultimate_loss_estimate_current, updated_at)
VALUES
  -- AY 2018 General_Liability (Slow Settlement / Very Long Tail)
  (2018, 'General_Liability', 12, '2018-12-31',  1800000.00,  9200000.00,  410, 110, 300, 12500000.00, CURRENT_TIMESTAMP()),
  (2018, 'General_Liability', 24, '2019-12-31',  3800000.00,  7800000.00,  550, 230, 320, 12200000.00, CURRENT_TIMESTAMP()),
  (2018, 'General_Liability', 36, '2020-12-31',  5900000.00,  5900000.00,  620, 340, 280, 1200000.00, CURRENT_TIMESTAMP()),
  (2018, 'General_Liability', 48, '2021-12-31',  7600000.00,  4300000.00,  660, 430, 230, 11900000.00, CURRENT_TIMESTAMP()),
  (2018, 'General_Liability', 60, '2022-12-31',  8900000.00,  2900000.00,  680, 510, 170, 11800000.00, CURRENT_TIMESTAMP()),
  (2018, 'General_Liability', 72, '2023-12-31',  9800000.00,  1900000.00,  690, 580, 110, 11750000.00, CURRENT_TIMESTAMP()),
  (2018, 'General_Liability', 84, '2024-12-31', 10500000.00,  1100000.00,  695, 630,  65, 11650000.00, CURRENT_TIMESTAMP()),
  (2018, 'General_Liability', 96, '2025-12-31', 11000000.00,   550000.00,  698, 665,  33, 11600000.00, CURRENT_TIMESTAMP()),

  -- AY 2019 General_Liability
  (2019, 'General_Liability', 12, '2019-12-31',  1900000.00,  9600000.00,  430, 115, 315, 13100000.00, CURRENT_TIMESTAMP()),
  (2019, 'General_Liability', 24, '2020-12-31',  4000000.00,  8100000.00,  570, 240, 330, 12800000.00, CURRENT_TIMESTAMP()),
  (2019, 'General_Liability', 36, '2021-12-31',  6200000.00,  6100000.00,  640, 350, 290, 12600000.00, CURRENT_TIMESTAMP()),
  (2019, 'General_Liability', 48, '2022-12-31',  8000000.00,  4500000.00,  680, 445, 235, 12500000.00, CURRENT_TIMESTAMP()),
  (2019, 'General_Liability', 60, '2023-12-31',  9400000.00,  3000000.00,  700, 525, 175, 12400000.00, CURRENT_TIMESTAMP()),
  (2019, 'General_Liability', 72, '2024-12-31', 10300000.00,  2000000.00,  710, 597, 113, 12350000.00, CURRENT_TIMESTAMP()),
  (2019, 'General_Liability', 84, '2025-12-31', 11000000.00,  1150000.00,  715, 648,  67, 12200000.00, CURRENT_TIMESTAMP()),

  -- AY 2020 General_Liability
  (2020, 'General_Liability', 12, '2020-12-31',  1750000.00,  8900000.00,  400, 108, 292, 12100000.00, CURRENT_TIMESTAMP()),
  (2020, 'General_Liability', 24, '2021-12-31',  3700000.00,  7500000.00,  530, 225, 305, 11800000.00, CURRENT_TIMESTAMP()),
  (2020, 'General_Liability', 36, '2022-12-31',  5700000.00,  5700000.00,  600, 330, 270, 11650000.00, CURRENT_TIMESTAMP()),
  (2020, 'General_Liability', 48, '2023-12-31',  7400000.00,  4150000.00,  640, 420, 220, 11550000.00, CURRENT_TIMESTAMP()),
  (2020, 'General_Liability', 60, '2024-12-31',  8700000.00,  2750000.00,  660, 495, 165, 11450000.00, CURRENT_TIMESTAMP()),
  (2020, 'General_Liability', 72, '2025-12-31',  9550000.00,  1800000.00,  670, 563, 107, 11350000.00, CURRENT_TIMESTAMP()),

  -- AY 2021 General_Liability
  (2021, 'General_Liability', 12, '2021-12-31',  2000000.00, 10100000.00,  450, 120, 330, 13700000.00, CURRENT_TIMESTAMP()),
  (2021, 'General_Liability', 24, '2022-12-31',  4200000.00,  8600000.00,  590, 250, 340, 13400000.00, CURRENT_TIMESTAMP()),
  (2021, 'General_Liability', 36, '2023-12-31',  6500000.00,  6500000.00,  670, 365, 305, 13200000.00, CURRENT_TIMESTAMP()),
  (2021, 'General_Liability', 48, '2024-12-31',  8400000.00,  4800000.00,  710, 465, 245, 13100000.00, CURRENT_TIMESTAMP()),
  (2021, 'General_Liability', 60, '2025-12-31',  9850000.00,  3200000.00,  730, 548, 182, 13000000.00, CURRENT_TIMESTAMP()),

  -- AY 2022 General_Liability
  (2022, 'General_Liability', 12, '2022-12-31',  2100000.00, 10900000.00,  480, 128, 352, 14700000.00, CURRENT_TIMESTAMP()),
  (2022, 'General_Liability', 24, '2023-12-31',  4400000.00,  9200000.00,  630, 268, 362, 14400000.00, CURRENT_TIMESTAMP()),
  (2022, 'General_Liability', 36, '2024-12-31',  6800000.00,  7000000.00,  715, 390, 325, 14200000.00, CURRENT_TIMESTAMP()),
  (2022, 'General_Liability', 48, '2025-12-31',  8800000.00,  5100000.00,  760, 498, 262, 14100000.00, CURRENT_TIMESTAMP()),

  -- AY 2023 General_Liability
  (2023, 'General_Liability', 12, '2023-12-31',  2200000.00, 11400000.00,  500, 133, 367, 15400000.00, CURRENT_TIMESTAMP()),
  (2023, 'General_Liability', 24, '2024-12-31',  4600000.00,  9600000.00,  660, 280, 380, 15000000.00, CURRENT_TIMESTAMP()),
  (2023, 'General_Liability', 36, '2025-12-31',  7100000.00,  7300000.00,  750, 410, 340, 14800000.00, CURRENT_TIMESTAMP()),

  -- AY 2024 General_Liability
  (2024, 'General_Liability', 12, '2024-12-31',  2400000.00, 12200000.00,  540, 144, 396, 16500000.00, CURRENT_TIMESTAMP()),
  (2024, 'General_Liability', 24, '2025-12-31',  5000000.00, 10300000.00,  710, 302, 408, 16100000.00, CURRENT_TIMESTAMP()),

  -- AY 2025 General_Liability
  (2025, 'General_Liability', 12, '2025-12-31',  1300000.00,  6600000.00,  290,  78, 212,  8900000.00, CURRENT_TIMESTAMP());