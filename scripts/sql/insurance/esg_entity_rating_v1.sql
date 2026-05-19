-- ==============================================================================
-- Data Product: ESG Entity Ratings
-- Description: Stores Environmental, Social, and Governance ratings and scores 
--              for various entities (companies, investments, etc.) to support 
--              sustainable finance reporting and investment decisions.
-- ==============================================================================

-- Create Dataset
CREATE SCHEMA IF NOT EXISTS `esg_entity_rating_v1`
  OPTIONS(
    location="europe-west1",
    description="Dataset containing ESG ratings and scores for entities."
  );

-- Create Table
CREATE TABLE IF NOT EXISTS `esg_entity_rating_v1.entity_esg_scores` (
    rating_id STRING NOT NULL OPTIONS(description="Unique identifier for the ESG rating record."),
    entity_id STRING NOT NULL OPTIONS(description="Unique identifier of the entity (e.g., LEI, ISIN, internal ID)."),
    entity_name STRING OPTIONS(description="Name of the entity being rated."),
    provider_name STRING NOT NULL OPTIONS(description="Name of the ESG data provider (e.g., MSCI, Sustainalytics, Internal)."),
    rating_date DATE NOT NULL OPTIONS(description="Date the rating was issued or updated."),
    overall_esg_score FLOAT64 OPTIONS(description="Overall composite ESG score (typically 0-100)."),
    environmental_score FLOAT64 OPTIONS(description="Environmental pillar score."),
    social_score FLOAT64 OPTIONS(description="Social pillar score."),
    governance_score FLOAT64 OPTIONS(description="Governance pillar score."),
    rating_grade STRING OPTIONS(description="Letter grade or category (e.g., AAA, B-, High Risk)."),
    controversy_flag BOOLEAN OPTIONS(description="Indicates if the entity is involved in severe controversies."),
    PRIMARY KEY (rating_id) NOT ENFORCED
)
OPTIONS(
  description="Table storing historical and current ESG scores from various providers."
);

-- Insert Sample Data (100 rows)
INSERT INTO `esg_entity_rating_v1.entity_esg_scores` (rating_id, entity_id, entity_name, provider_name, rating_date, overall_esg_score, environmental_score, social_score, governance_score, rating_grade, controversy_flag)
VALUES
  ('R-1001', 'LEI-1001', 'EcoTech Innovations', 'SustainScore', DATE '2025-01-15', 85.5, 90.2, 80.1, 86.2, 'AAA', false),
  ('R-1002', 'LEI-1002', 'Global Energy Corp', 'SustainScore', DATE '2025-01-15', 45.2, 30.5, 55.0, 50.1, 'C', true),
  ('R-1003', 'LEI-1003', 'HealthPlus Pharma', 'SustainScore', DATE '2025-01-16', 72.0, 65.0, 85.5, 65.5, 'A', false),
  ('R-1004', 'LEI-1004', 'Retail Giant Inc', 'SustainScore', DATE '2025-01-16', 58.5, 45.0, 60.2, 70.3, 'BBB', false),
  ('R-1005', 'LEI-1005', 'Future Finance Bank', 'SustainScore', DATE '2025-01-17', 78.9, 70.1, 80.5, 86.1, 'AA', false),
  ('R-1006', 'LEI-1006', 'AgriGrow Holdings', 'SustainScore', DATE '2025-01-17', 62.1, 55.4, 65.0, 65.9, 'BB', true),
  ('R-1007', 'LEI-1007', 'Tech Solutions Ltd', 'SustainScore', DATE '2025-01-18', 88.0, 85.0, 89.5, 89.5, 'AAA', false),
  ('R-1008', 'LEI-1008', 'Heavy Metals Mining', 'SustainScore', DATE '2025-01-18', 35.0, 20.1, 40.5, 44.4, 'D', true),
  ('R-1009', 'LEI-1009', 'Consumer Goods Co', 'SustainScore', DATE '2025-01-19', 65.5, 60.0, 70.0, 66.5, 'A', false),
  ('R-1010', 'LEI-1010', 'Urban Real Estate', 'SustainScore', DATE '2025-01-19', 70.2, 75.5, 60.1, 75.0, 'A', false),
  ('R-1011', 'LEI-1011', 'AutoMakers Int', 'SustainScore', DATE '2025-01-20', 55.0, 40.0, 60.0, 65.0, 'BBB', false),
  ('R-1012', 'LEI-1012', 'Green Energy Partners', 'SustainScore', DATE '2025-01-20', 92.5, 98.0, 85.0, 94.5, 'AAA', false),
  ('R-1013', 'LEI-1013', 'Food Supply Chain', 'SustainScore', DATE '2025-01-21', 60.5, 50.5, 65.5, 65.5, 'BB', false),
  ('R-1014', 'LEI-1014', 'AeroSpace Dynamics', 'SustainScore', DATE '2025-01-21', 48.0, 35.0, 50.0, 59.0, 'C', true),
  ('R-1015', 'LEI-1015', 'Telecom Networks', 'SustainScore', DATE '2025-01-22', 75.5, 70.0, 80.0, 76.5, 'AA', false),
  ('R-1016', 'LEI-1016', 'Water Utilities Corp', 'SustainScore', DATE '2025-01-22', 82.0, 90.0, 75.0, 81.0, 'AA', false),
  ('R-1017', 'LEI-1017', 'Fashion Retailers', 'SustainScore', DATE '2025-01-23', 50.5, 30.0, 55.0, 66.5, 'BB', true),
  ('R-1018', 'LEI-1018', 'Logistics Worldwide', 'SustainScore', DATE '2025-01-23', 52.0, 40.0, 55.0, 61.0, 'BBB', false),
  ('R-1019', 'LEI-1019', 'Media & Ent Group', 'SustainScore', DATE '2025-01-24', 68.0, 60.0, 75.0, 69.0, 'A', false),
  ('R-1020', 'LEI-1020', 'BioTech Research', 'SustainScore', DATE '2025-01-24', 80.5, 75.0, 85.0, 81.5, 'AA', false),
  -- Data from Provider B
  ('R-2001', 'LEI-1001', 'EcoTech Innovations', 'ESG_MetricsPro', DATE '2025-02-01', 84.0, 88.0, 82.0, 82.0, 'Excellent', false),
  ('R-2002', 'LEI-1002', 'Global Energy Corp', 'ESG_MetricsPro', DATE '2025-02-01', 42.0, 28.0, 52.0, 46.0, 'Poor', true),
  ('R-2003', 'LEI-1003', 'HealthPlus Pharma', 'ESG_MetricsPro', DATE '2025-02-02', 70.5, 62.0, 88.0, 61.5, 'Good', false),
  ('R-2004', 'LEI-1004', 'Retail Giant Inc', 'ESG_MetricsPro', DATE '2025-02-02', 59.0, 48.0, 61.0, 68.0, 'Average', false),
  ('R-2005', 'LEI-1005', 'Future Finance Bank', 'ESG_MetricsPro', DATE '2025-02-03', 80.0, 72.0, 82.0, 86.0, 'Excellent', false),
  ('R-2006', 'LEI-1006', 'AgriGrow Holdings', 'ESG_MetricsPro', DATE '2025-02-03', 60.0, 52.0, 66.0, 62.0, 'Average', true),
  ('R-2007', 'LEI-1007', 'Tech Solutions Ltd', 'ESG_MetricsPro', DATE '2025-02-04', 86.5, 82.0, 90.0, 87.5, 'Excellent', false),
  ('R-2008', 'LEI-1008', 'Heavy Metals Mining', 'ESG_MetricsPro', DATE '2025-02-04', 32.0, 18.0, 42.0, 36.0, 'Poor', true),
  ('R-2009', 'LEI-1009', 'Consumer Goods Co', 'ESG_MetricsPro', DATE '2025-02-05', 66.0, 58.0, 72.0, 68.0, 'Good', false),
  ('R-2010', 'LEI-1010', 'Urban Real Estate', 'ESG_MetricsPro', DATE '2025-02-05', 72.0, 78.0, 58.0, 80.0, 'Good', false),
  ('R-2011', 'LEI-1011', 'AutoMakers Int', 'ESG_MetricsPro', DATE '2025-02-06', 56.5, 42.0, 58.0, 69.5, 'Average', false),
  ('R-2012', 'LEI-1012', 'Green Energy Partners', 'ESG_MetricsPro', DATE '2025-02-06', 94.0, 99.0, 84.0, 99.0, 'Outstanding', false),
  ('R-2013', 'LEI-1013', 'Food Supply Chain', 'ESG_MetricsPro', DATE '2025-02-07', 62.0, 52.0, 64.0, 70.0, 'Average', false),
  ('R-2014', 'LEI-1014', 'AeroSpace Dynamics', 'ESG_MetricsPro', DATE '2025-02-07', 46.5, 32.0, 52.0, 55.5, 'Poor', true),
  ('R-2015', 'LEI-1015', 'Telecom Networks', 'ESG_MetricsPro', DATE '2025-02-08', 74.0, 68.0, 82.0, 72.0, 'Good', false),
  ('R-2016', 'LEI-1016', 'Water Utilities Corp', 'ESG_MetricsPro', DATE '2025-02-08', 84.5, 92.0, 72.0, 89.5, 'Excellent', false),
  ('R-2017', 'LEI-1017', 'Fashion Retailers', 'ESG_MetricsPro', DATE '2025-02-09', 48.0, 25.0, 58.0, 61.0, 'Poor', true),
  ('R-2018', 'LEI-1018', 'Logistics Worldwide', 'ESG_MetricsPro', DATE '2025-02-09', 54.5, 42.0, 56.0, 65.5, 'Average', false),
  ('R-2019', 'LEI-1019', 'Media & Ent Group', 'ESG_MetricsPro', DATE '2025-02-10', 69.5, 62.0, 78.0, 68.5, 'Good', false),
  ('R-2020', 'LEI-1020', 'BioTech Research', 'ESG_MetricsPro', DATE '2025-02-10', 79.0, 72.0, 88.0, 77.0, 'Good', false),
  -- Internal Ratings Q1 2025
  ('R-3001', 'LEI-1001', 'EcoTech Innovations', 'Internal_Risk_Model', DATE '2025-03-31', 86.0, 89.0, 81.0, 88.0, 'Low Risk', false),
  ('R-3002', 'LEI-1002', 'Global Energy Corp', 'Internal_Risk_Model', DATE '2025-03-31', 40.0, 25.0, 50.0, 45.0, 'High Risk', true),
  ('R-3003', 'LEI-1003', 'HealthPlus Pharma', 'Internal_Risk_Model', DATE '2025-03-31', 73.0, 66.0, 86.0, 67.0, 'Medium-Low Risk', false),
  ('R-3004', 'LEI-1004', 'Retail Giant Inc', 'Internal_Risk_Model', DATE '2025-03-31', 57.0, 44.0, 59.0, 68.0, 'Medium Risk', false),
  ('R-3005', 'LEI-1005', 'Future Finance Bank', 'Internal_Risk_Model', DATE '2025-03-31', 79.0, 71.0, 81.0, 85.0, 'Low Risk', false),
  ('R-3006', 'LEI-1006', 'AgriGrow Holdings', 'Internal_Risk_Model', DATE '2025-03-31', 61.0, 54.0, 65.0, 64.0, 'Medium Risk', true),
  ('R-3007', 'LEI-1007', 'Tech Solutions Ltd', 'Internal_Risk_Model', DATE '2025-03-31', 87.0, 84.0, 89.0, 88.0, 'Low Risk', false),
  ('R-3008', 'LEI-1008', 'Heavy Metals Mining', 'Internal_Risk_Model', DATE '2025-03-31', 34.0, 19.0, 41.0, 42.0, 'Severe Risk', true),
  ('R-3009', 'LEI-1009', 'Consumer Goods Co', 'Internal_Risk_Model', DATE '2025-03-31', 65.0, 59.0, 71.0, 65.0, 'Medium Risk', false),
  ('R-3010', 'LEI-1010', 'Urban Real Estate', 'Internal_Risk_Model', DATE '2025-03-31', 71.0, 76.0, 59.0, 78.0, 'Medium-Low Risk', false),
  ('R-3011', 'LEI-1011', 'AutoMakers Int', 'Internal_Risk_Model', DATE '2025-03-31', 56.0, 41.0, 59.0, 68.0, 'Medium Risk', false),
  ('R-3012', 'LEI-1012', 'Green Energy Partners', 'Internal_Risk_Model', DATE '2025-03-31', 93.0, 98.0, 84.0, 97.0, 'Minimal Risk', false),
  ('R-3013', 'LEI-1013', 'Food Supply Chain', 'Internal_Risk_Model', DATE '2025-03-31', 61.0, 51.0, 64.0, 68.0, 'Medium Risk', false),
  ('R-3014', 'LEI-1014', 'AeroSpace Dynamics', 'Internal_Risk_Model', DATE '2025-03-31', 47.0, 34.0, 51.0, 56.0, 'High Risk', true),
  ('R-3015', 'LEI-1015', 'Telecom Networks', 'Internal_Risk_Model', DATE '2025-03-31', 75.0, 69.0, 81.0, 75.0, 'Medium-Low Risk', false),
  ('R-3016', 'LEI-1016', 'Water Utilities Corp', 'Internal_Risk_Model', DATE '2025-03-31', 83.0, 91.0, 73.0, 85.0, 'Low Risk', false),
  ('R-3017', 'LEI-1017', 'Fashion Retailers', 'Internal_Risk_Model', DATE '2025-03-31', 49.0, 28.0, 56.0, 63.0, 'High Risk', true),
  ('R-3018', 'LEI-1018', 'Logistics Worldwide', 'Internal_Risk_Model', DATE '2025-03-31', 53.0, 41.0, 55.0, 63.0, 'Medium Risk', false),
  ('R-3019', 'LEI-1019', 'Media & Ent Group', 'Internal_Risk_Model', DATE '2025-03-31', 69.0, 61.0, 76.0, 70.0, 'Medium-Low Risk', false),
  ('R-3020', 'LEI-1020', 'BioTech Research', 'Internal_Risk_Model', DATE '2025-03-31', 80.0, 74.0, 86.0, 80.0, 'Low Risk', false),
   -- Historical Data Q4 2024
  ('R-4001', 'LEI-1001', 'EcoTech Innovations', 'SustainScore', DATE '2024-10-15', 82.5, 88.2, 78.1, 81.2, 'AA', false),
  ('R-4002', 'LEI-1002', 'Global Energy Corp', 'SustainScore', DATE '2024-10-15', 48.2, 32.5, 58.0, 54.1, 'C', true),
  ('R-4003', 'LEI-1003', 'HealthPlus Pharma', 'SustainScore', DATE '2024-10-16', 71.0, 64.0, 84.5, 64.5, 'A', false),
  ('R-4004', 'LEI-1004', 'Retail Giant Inc', 'SustainScore', DATE '2024-10-16', 59.5, 46.0, 61.2, 71.3, 'BBB', false),
  ('R-4005', 'LEI-1005', 'Future Finance Bank', 'SustainScore', DATE '2024-10-17', 77.9, 68.1, 79.5, 86.1, 'AA', false),
  ('R-4006', 'LEI-1006', 'AgriGrow Holdings', 'SustainScore', DATE '2024-10-17', 63.1, 56.4, 66.0, 66.9, 'BB', false),
  ('R-4007', 'LEI-1007', 'Tech Solutions Ltd', 'SustainScore', DATE '2024-10-18', 85.0, 82.0, 86.5, 86.5, 'AA', false),
  ('R-4008', 'LEI-1008', 'Heavy Metals Mining', 'SustainScore', DATE '2024-10-18', 38.0, 22.1, 44.5, 47.4, 'D', true),
  ('R-4009', 'LEI-1009', 'Consumer Goods Co', 'SustainScore', DATE '2024-10-19', 66.5, 61.0, 71.0, 67.5, 'A', false),
  ('R-4010', 'LEI-1010', 'Urban Real Estate', 'SustainScore', DATE '2024-10-19', 71.2, 76.5, 61.1, 76.0, 'A', false),
  ('R-4011', 'LEI-1011', 'AutoMakers Int', 'SustainScore', DATE '2024-10-20', 54.0, 38.0, 59.0, 65.0, 'BBB', false),
  ('R-4012', 'LEI-1012', 'Green Energy Partners', 'SustainScore', DATE '2024-10-20', 91.5, 96.0, 84.0, 94.5, 'AAA', false),
  ('R-4013', 'LEI-1013', 'Food Supply Chain', 'SustainScore', DATE '2024-10-21', 59.5, 49.5, 64.5, 64.5, 'BB', false),
  ('R-4014', 'LEI-1014', 'AeroSpace Dynamics', 'SustainScore', DATE '2024-10-21', 49.0, 36.0, 51.0, 60.0, 'C', false),
  ('R-4015', 'LEI-1015', 'Telecom Networks', 'SustainScore', DATE '2024-10-22', 74.5, 69.0, 79.0, 75.5, 'A', false),
  ('R-4016', 'LEI-1016', 'Water Utilities Corp', 'SustainScore', DATE '2024-10-22', 81.0, 89.0, 74.0, 80.0, 'AA', false),
  ('R-4017', 'LEI-1017', 'Fashion Retailers', 'SustainScore', DATE '2024-10-23', 52.5, 32.0, 57.0, 68.5, 'BB', true),
  ('R-4018', 'LEI-1018', 'Logistics Worldwide', 'SustainScore', DATE '2024-10-23', 51.0, 39.0, 54.0, 60.0, 'BBB', false),
  ('R-4019', 'LEI-1019', 'Media & Ent Group', 'SustainScore', DATE '2024-10-24', 67.0, 59.0, 74.0, 68.0, 'A', false),
  ('R-4020', 'LEI-1020', 'BioTech Research', 'SustainScore', DATE '2024-10-24', 79.5, 74.0, 84.0, 80.5, 'AA', false),
  -- Internal Ratings Q4 2024
  ('R-5001', 'LEI-1001', 'EcoTech Innovations', 'Internal_Risk_Model', DATE '2024-12-31', 84.0, 86.0, 79.0, 87.0, 'Low Risk', false),
  ('R-5002', 'LEI-1002', 'Global Energy Corp', 'Internal_Risk_Model', DATE '2024-12-31', 45.0, 30.0, 55.0, 50.0, 'High Risk', true),
  ('R-5003', 'LEI-1003', 'HealthPlus Pharma', 'Internal_Risk_Model', DATE '2024-12-31', 72.0, 65.0, 85.0, 66.0, 'Medium-Low Risk', false),
  ('R-5004', 'LEI-1004', 'Retail Giant Inc', 'Internal_Risk_Model', DATE '2024-12-31', 58.0, 45.0, 60.0, 69.0, 'Medium Risk', false),
  ('R-5005', 'LEI-1005', 'Future Finance Bank', 'Internal_Risk_Model', DATE '2024-12-31', 78.0, 70.0, 80.0, 84.0, 'Low Risk', false),
  ('R-5006', 'LEI-1006', 'AgriGrow Holdings', 'Internal_Risk_Model', DATE '2024-12-31', 62.0, 55.0, 66.0, 65.0, 'Medium Risk', false),
  ('R-5007', 'LEI-1007', 'Tech Solutions Ltd', 'Internal_Risk_Model', DATE '2024-12-31', 85.0, 81.0, 87.0, 87.0, 'Low Risk', false),
  ('R-5008', 'LEI-1008', 'Heavy Metals Mining', 'Internal_Risk_Model', DATE '2024-12-31', 37.0, 22.0, 44.0, 45.0, 'Severe Risk', true),
  ('R-5009', 'LEI-1009', 'Consumer Goods Co', 'Internal_Risk_Model', DATE '2024-12-31', 66.0, 60.0, 72.0, 66.0, 'Medium Risk', false),
  ('R-5010', 'LEI-1010', 'Urban Real Estate', 'Internal_Risk_Model', DATE '2024-12-31', 72.0, 77.0, 60.0, 79.0, 'Medium-Low Risk', false),
  ('R-5011', 'LEI-1011', 'AutoMakers Int', 'Internal_Risk_Model', DATE '2024-12-31', 55.0, 40.0, 58.0, 67.0, 'Medium Risk', false),
  ('R-5012', 'LEI-1012', 'Green Energy Partners', 'Internal_Risk_Model', DATE '2024-12-31', 92.0, 97.0, 83.0, 96.0, 'Minimal Risk', false),
  ('R-5013', 'LEI-1013', 'Food Supply Chain', 'Internal_Risk_Model', DATE '2024-12-31', 60.0, 50.0, 63.0, 67.0, 'Medium Risk', false),
  ('R-5014', 'LEI-1014', 'AeroSpace Dynamics', 'Internal_Risk_Model', DATE '2024-12-31', 48.0, 35.0, 52.0, 57.0, 'High Risk', false),
  ('R-5015', 'LEI-1015', 'Telecom Networks', 'Internal_Risk_Model', DATE '2024-12-31', 74.0, 68.0, 80.0, 74.0, 'Medium-Low Risk', false),
  ('R-5016', 'LEI-1016', 'Water Utilities Corp', 'Internal_Risk_Model', DATE '2024-12-31', 82.0, 90.0, 72.0, 84.0, 'Low Risk', false),
  ('R-5017', 'LEI-1017', 'Fashion Retailers', 'Internal_Risk_Model', DATE '2024-12-31', 51.0, 30.0, 58.0, 65.0, 'High Risk', true),
  ('R-5018', 'LEI-1018', 'Logistics Worldwide', 'Internal_Risk_Model', DATE '2024-12-31', 52.0, 40.0, 54.0, 62.0, 'Medium Risk', false),
  ('R-5019', 'LEI-1019', 'Media & Ent Group', 'Internal_Risk_Model', DATE '2024-12-31', 68.0, 60.0, 75.0, 69.0, 'Medium-Low Risk', false),
  ('R-5020', 'LEI-1020', 'BioTech Research', 'Internal_Risk_Model', DATE '2024-12-31', 79.0, 73.0, 85.0, 79.0, 'Low Risk', false);

