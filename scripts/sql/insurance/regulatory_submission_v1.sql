
-- ==============================================================================
-- Data Product: Regulatory Submissions
-- Description: Tracks the status, metadata, and validation results of regulatory 
--              reports (e.g., SFDR, CSRD, Taxonomy) submitted to authorities.
-- ==============================================================================

-- Create Dataset
CREATE SCHEMA IF NOT EXISTS `regulatory_submission_v1`
  OPTIONS(
    location="europe-west1",
    description="Dataset tracking the lifecycle and status of regulatory reports."
  );

-- Create Table
CREATE TABLE IF NOT EXISTS `regulatory_submission_v1.submission_status` (
    submission_id STRING NOT NULL OPTIONS(description="Unique identifier for the regulatory submission."),
    reporting_entity_id STRING NOT NULL OPTIONS(description="Identifier of the entity making the submission."),
    regulation_framework STRING NOT NULL OPTIONS(description="The regulatory framework (e.g., 'SFDR', 'CSRD', 'EU_Taxonomy')."),
    report_type STRING NOT NULL OPTIONS(description="Specific report type (e.g., 'PAI_Statement', 'Pre_contractual')."),
    reference_period STRING NOT NULL OPTIONS(description="The period the report covers (e.g., '2024-Q4', 'FY2024')."),
    submission_date TIMESTAMP OPTIONS(description="Timestamp when the report was submitted."),
    submission_status STRING NOT NULL OPTIONS(description="Current status (e.g., 'Draft', 'Pending_Approval', 'Submitted', 'Accepted', 'Rejected')."),
    regulatory_authority STRING OPTIONS(description="The authority receiving the report (e.g., 'ESMA', 'NCA_FR', 'BaFin')."),
    validation_errors INT64 OPTIONS(description="Number of validation errors found prior to or during submission."),
    submitted_by STRING OPTIONS(description="User or system that performed the submission."),
    PRIMARY KEY (submission_id) NOT ENFORCED
)
OPTIONS(
  description="Table monitoring the workflow and final status of regulatory reporting obligations."
);

-- Insert Sample Data (100 rows)
INSERT INTO `regulatory_submission_v1.submission_status` (submission_id, reporting_entity_id, regulation_framework, report_type, reference_period, submission_date, submission_status, regulatory_authority, validation_errors, submitted_by)
VALUES
  -- SFDR PAI Statements (FY 2024, submitted mid-2025)
  ('SUB-25-001', 'LEI-1005', 'SFDR', 'PAI_Statement_Article_4', 'FY2024', TIMESTAMP '2025-06-25 10:15:00 UTC', 'Accepted', 'ESMA', 0, 'system_auto'),
  ('SUB-25-002', 'LEI-2055', 'SFDR', 'PAI_Statement_Article_4', 'FY2024', TIMESTAMP '2025-06-28 14:30:00 UTC', 'Accepted', 'ESMA', 0, 'j.doe@futurefinance.com'),
  ('SUB-25-003', 'LEI-3099', 'SFDR', 'PAI_Statement_Article_4', 'FY2024', TIMESTAMP '2025-06-29 09:45:00 UTC', 'Rejected', 'ESMA', 3, 'm.smith@assetmgmt.eu'),
  ('SUB-25-004', 'LEI-3099', 'SFDR', 'PAI_Statement_Article_4', 'FY2024', TIMESTAMP '2025-06-30 11:00:00 UTC', 'Accepted', 'ESMA', 0, 'm.smith@assetmgmt.eu'),
  ('SUB-25-005', 'LEI-4122', 'SFDR', 'PAI_Statement_Article_4', 'FY2024', TIMESTAMP '2025-06-30 15:20:00 UTC', 'Pending_Review', 'ESMA', 1, 'system_auto'),
  ('SUB-25-006', 'LEI-5511', 'SFDR', 'PAI_Statement_Article_4', 'FY2024', NULL, 'Draft', NULL, 12, 'a.jones@investco.com'),
  ('SUB-25-007', 'LEI-6633', 'SFDR', 'PAI_Statement_Article_4', 'FY2024', TIMESTAMP '2025-06-20 08:00:00 UTC', 'Accepted', 'ESMA', 0, 'system_auto'),
  ('SUB-25-008', 'LEI-7744', 'SFDR', 'PAI_Statement_Article_4', 'FY2024', TIMESTAMP '2025-06-29 16:45:00 UTC', 'Accepted', 'ESMA', 0, 'r.roe@globalfunds.net'),
  ('SUB-25-009', 'LEI-8855', 'SFDR', 'PAI_Statement_Article_4', 'FY2024', TIMESTAMP '2025-06-27 10:30:00 UTC', 'Rejected', 'ESMA', 5, 'system_auto'),
  ('SUB-25-010', 'LEI-9966', 'SFDR', 'PAI_Statement_Article_4', 'FY2024', TIMESTAMP '2025-06-28 11:15:00 UTC', 'Accepted', 'ESMA', 0, 't.banks@wealthpartners.eu'),
  
  -- EU Taxonomy Alignment Reports (FY 2024)
  ('SUB-25-011', 'LEI-1001', 'EU_Taxonomy', 'Alignment_Report', 'FY2024', TIMESTAMP '2025-03-15 09:00:00 UTC', 'Accepted', 'NCA_FR', 0, 'reporting_team@ecotech.fr'),
  ('SUB-25-012', 'LEI-1002', 'EU_Taxonomy', 'Alignment_Report', 'FY2024', TIMESTAMP '2025-03-20 14:00:00 UTC', 'Accepted', 'BaFin', 0, 'compliance@globalenergy.de'),
  ('SUB-25-013', 'LEI-1006', 'EU_Taxonomy', 'Alignment_Report', 'FY2024', TIMESTAMP '2025-03-25 11:30:00 UTC', 'Rejected', 'AFM', 2, 'system_auto'),
  ('SUB-25-014', 'LEI-1006', 'EU_Taxonomy', 'Alignment_Report', 'FY2024', TIMESTAMP '2025-03-28 10:00:00 UTC', 'Accepted', 'AFM', 0, 'j.vandenberg@agrigrow.nl'),
  ('SUB-25-015', 'LEI-1012', 'EU_Taxonomy', 'Alignment_Report', 'FY2024', TIMESTAMP '2025-03-10 16:45:00 UTC', 'Accepted', 'FCA', 0, 'sustainability@greenenergy.uk'),
  ('SUB-25-016', 'LEI-1016', 'EU_Taxonomy', 'Alignment_Report', 'FY2024', TIMESTAMP '2025-03-29 09:15:00 UTC', 'Pending_Review', 'CNMV', 0, 'system_auto'),
  ('SUB-25-017', 'LEI-1020', 'EU_Taxonomy', 'Alignment_Report', 'FY2024', NULL, 'Pending_Approval', NULL, 0, 'b.smith@biotech.ch'),
  ('SUB-25-018', 'LEI-2001', 'EU_Taxonomy', 'Alignment_Report', 'FY2024', TIMESTAMP '2025-03-22 13:20:00 UTC', 'Accepted', 'NCA_FR', 0, 'system_auto'),
  ('SUB-25-019', 'LEI-2002', 'EU_Taxonomy', 'Alignment_Report', 'FY2024', TIMESTAMP '2025-03-27 15:50:00 UTC', 'Accepted', 'BaFin', 0, 'm.muller@industrialcorp.de'),
  ('SUB-25-020', 'LEI-2003', 'EU_Taxonomy', 'Alignment_Report', 'FY2024', TIMESTAMP '2025-03-30 08:30:00 UTC', 'Accepted', 'CBI', 0, 'compliance@irishfunds.ie'),

  -- CSRD Reports (FY 2024, large entities)
  ('SUB-25-021', 'LEI-1002', 'CSRD', 'Sustainability_Statement', 'FY2024', TIMESTAMP '2025-04-10 10:00:00 UTC', 'Accepted', 'National_Registry_DE', 0, 'csrd_team@globalenergy.de'),
  ('SUB-25-022', 'LEI-1004', 'CSRD', 'Sustainability_Statement', 'FY2024', TIMESTAMP '2025-04-15 14:15:00 UTC', 'Accepted', 'National_Registry_FR', 0, 'reporting@retailgiant.fr'),
  ('SUB-25-023', 'LEI-1008', 'CSRD', 'Sustainability_Statement', 'FY2024', TIMESTAMP '2025-04-20 09:30:00 UTC', 'Rejected', 'National_Registry_PL', 4, 'system_auto'),
  ('SUB-25-024', 'LEI-1008', 'CSRD', 'Sustainability_Statement', 'FY2024', TIMESTAMP '2025-04-25 11:00:00 UTC', 'Accepted', 'National_Registry_PL', 0, 'k.novak@heavymetals.pl'),
  ('SUB-25-025', 'LEI-1011', 'CSRD', 'Sustainability_Statement', 'FY2024', TIMESTAMP '2025-04-28 16:00:00 UTC', 'Accepted', 'National_Registry_IT', 0, 'sustainability@automakers.it'),
  ('SUB-25-026', 'LEI-1014', 'CSRD', 'Sustainability_Statement', 'FY2024', NULL, 'Draft', NULL, 15, 'team@aerospace.se'),
  ('SUB-25-027', 'LEI-1015', 'CSRD', 'Sustainability_Statement', 'FY2024', TIMESTAMP '2025-04-12 13:45:00 UTC', 'Accepted', 'National_Registry_ES', 0, 'system_auto'),
  ('SUB-25-028', 'LEI-1018', 'CSRD', 'Sustainability_Statement', 'FY2024', TIMESTAMP '2025-04-22 10:20:00 UTC', 'Accepted', 'National_Registry_NL', 0, 'compliance@logistics.nl'),
  ('SUB-25-029', 'LEI-3001', 'CSRD', 'Sustainability_Statement', 'FY2024', TIMESTAMP '2025-04-29 08:15:00 UTC', 'Pending_Review', 'National_Registry_BE', 1, 'system_auto'),
  ('SUB-25-030', 'LEI-3002', 'CSRD', 'Sustainability_Statement', 'FY2024', TIMESTAMP '2025-04-30 15:30:00 UTC', 'Accepted', 'National_Registry_FI', 0, 'reporting@nordicpaper.fi'),

  -- Historical SFDR PAI Statements (FY 2023)
  ('SUB-24-001', 'LEI-1005', 'SFDR', 'PAI_Statement_Article_4', 'FY2023', TIMESTAMP '2024-06-20 11:00:00 UTC', 'Accepted', 'ESMA', 0, 'system_auto'),
  ('SUB-24-002', 'LEI-2055', 'SFDR', 'PAI_Statement_Article_4', 'FY2023', TIMESTAMP '2024-06-25 15:45:00 UTC', 'Accepted', 'ESMA', 0, 'j.doe@futurefinance.com'),
  ('SUB-24-003', 'LEI-3099', 'SFDR', 'PAI_Statement_Article_4', 'FY2023', TIMESTAMP '2024-06-28 10:30:00 UTC', 'Accepted', 'ESMA', 0, 'm.smith@assetmgmt.eu'),
  ('SUB-24-004', 'LEI-4122', 'SFDR', 'PAI_Statement_Article_4', 'FY2023', TIMESTAMP '2024-06-29 14:15:00 UTC', 'Accepted', 'ESMA', 0, 'system_auto'),
  ('SUB-24-005', 'LEI-5511', 'SFDR', 'PAI_Statement_Article_4', 'FY2023', TIMESTAMP '2024-06-30 09:00:00 UTC', 'Accepted', 'ESMA', 0, 'a.jones@investco.com'),
  ('SUB-24-006', 'LEI-6633', 'SFDR', 'PAI_Statement_Article_4', 'FY2023', TIMESTAMP '2024-06-15 08:30:00 UTC', 'Accepted', 'ESMA', 0, 'system_auto'),
  ('SUB-24-007', 'LEI-7744', 'SFDR', 'PAI_Statement_Article_4', 'FY2023', TIMESTAMP '2024-06-26 16:00:00 UTC', 'Accepted', 'ESMA', 0, 'r.roe@globalfunds.net'),
  ('SUB-24-008', 'LEI-8855', 'SFDR', 'PAI_Statement_Article_4', 'FY2023', TIMESTAMP '2024-06-28 11:45:00 UTC', 'Accepted', 'ESMA', 0, 'system_auto'),
  ('SUB-24-009', 'LEI-9966', 'SFDR', 'PAI_Statement_Article_4', 'FY2023', TIMESTAMP '2024-06-27 13:20:00 UTC', 'Accepted', 'ESMA', 0, 't.banks@wealthpartners.eu'),
  ('SUB-24-010', 'LEI-1010', 'SFDR', 'PAI_Statement_Article_4', 'FY2023', TIMESTAMP '2024-06-29 10:10:00 UTC', 'Accepted', 'ESMA', 0, 'system_auto'),

  -- SFDR Pre-contractual Disclosures (Article 8/9 Funds)
  ('SUB-PC-001', 'FUND-A-01', 'SFDR', 'Pre_contractual_Art8', '2025-Q1', TIMESTAMP '2025-01-10 09:00:00 UTC', 'Accepted', 'NCA_LU', 0, 'legal@fundadmin.lu'),
  ('SUB-PC-002', 'FUND-A-02', 'SFDR', 'Pre_contractual_Art8', '2025-Q1', TIMESTAMP '2025-01-12 14:30:00 UTC', 'Accepted', 'NCA_IE', 0, 'compliance@irishmanco.ie'),
  ('SUB-PC-003', 'FUND-B-01', 'SFDR', 'Pre_contractual_Art9', '2025-Q1', TIMESTAMP '2025-01-15 11:15:00 UTC', 'Rejected', 'NCA_LU', 2, 'system_auto'),
  ('SUB-PC-004', 'FUND-B-01', 'SFDR', 'Pre_contractual_Art9', '2025-Q1', TIMESTAMP '2025-01-20 10:00:00 UTC', 'Accepted', 'NCA_LU', 0, 'legal@fundadmin.lu'),
  ('SUB-PC-005', 'FUND-C-01', 'SFDR', 'Pre_contractual_Art8', '2025-Q2', NULL, 'Draft', NULL, 5, 'product_team@amc.fr'),
  ('SUB-PC-006', 'FUND-C-02', 'SFDR', 'Pre_contractual_Art8', '2025-Q2', NULL, 'Pending_Approval', NULL, 0, 'product_team@amc.fr'),
  ('SUB-PC-007', 'FUND-D-01', 'SFDR', 'Pre_contractual_Art9', '2025-Q2', TIMESTAMP '2025-04-05 08:45:00 UTC', 'Accepted', 'BaFin', 0, 'system_auto'),
  ('SUB-PC-008', 'FUND-E-01', 'SFDR', 'Pre_contractual_Art8', '2025-Q2', TIMESTAMP '2025-04-10 15:20:00 UTC', 'Accepted', 'AFM', 0, 'compliance@dutchfunds.nl'),
  ('SUB-PC-009', 'FUND-F-01', 'SFDR', 'Pre_contractual_Art8', '2025-Q3', NULL, 'Draft', NULL, 8, 'system_auto'),
  ('SUB-PC-010', 'FUND-G-01', 'SFDR', 'Pre_contractual_Art9', '2025-Q3', NULL, 'Draft', NULL, 1, 'l.chen@globalinvest.uk'),
  
  -- Various other submissions to reach 100 rows
  ('SUB-MISC-01', 'LEI-7001', 'MiFID_II', 'ESG_Preferences_Template', '2025-Q1', TIMESTAMP '2025-03-31 23:50:00 UTC', 'Accepted', 'ESMA', 0, 'system_auto'),
  ('SUB-MISC-02', 'LEI-7002', 'MiFID_II', 'ESG_Preferences_Template', '2025-Q1', TIMESTAMP '2025-03-31 22:10:00 UTC', 'Accepted', 'ESMA', 0, 'system_auto'),
  ('SUB-MISC-03', 'LEI-7003', 'MiFID_II', 'ESG_Preferences_Template', '2025-Q1', TIMESTAMP '2025-04-01 08:30:00 UTC', 'Accepted', 'ESMA', 0, 'system_auto'),
  ('SUB-MISC-04', 'LEI-7004', 'MiFID_II', 'ESG_Preferences_Template', '2025-Q1', TIMESTAMP '2025-03-30 14:45:00 UTC', 'Accepted', 'ESMA', 0, 'system_auto'),
  ('SUB-MISC-05', 'LEI-7005', 'MiFID_II', 'ESG_Preferences_Template', '2025-Q1', TIMESTAMP '2025-03-31 16:20:00 UTC', 'Accepted', 'ESMA', 0, 'system_auto'),
  ('SUB-MISC-06', 'LEI-8001', 'TCFD', 'Climate_Risk_Report', 'FY2024', TIMESTAMP '2025-05-15 10:00:00 UTC', 'Accepted', 'FCA', 0, 'risk_team@ukbank.co.uk'),
  ('SUB-MISC-07', 'LEI-8002', 'TCFD', 'Climate_Risk_Report', 'FY2024', TIMESTAMP '2025-05-20 11:30:00 UTC', 'Accepted', 'FCA', 0, 'system_auto'),
  ('SUB-MISC-08', 'LEI-8003', 'TCFD', 'Climate_Risk_Report', 'FY2024', TIMESTAMP '2025-05-25 09:15:00 UTC', 'Pending_Review', 'FCA', 0, 'm.davis@insurecorp.uk'),
  ('SUB-MISC-09', 'LEI-8004', 'TCFD', 'Climate_Risk_Report', 'FY2024', NULL, 'Draft', NULL, 3, 'system_auto'),
  ('SUB-MISC-10', 'LEI-8005', 'TCFD', 'Climate_Risk_Report', 'FY2024', TIMESTAMP '2025-05-10 14:00:00 UTC', 'Accepted', 'FCA', 0, 'c.wilson@assetmgr.uk'),
  ('SUB-MISC-11', 'LEI-9001', 'UK_SDR', 'Product_Label_Notification', '2025-Q2', TIMESTAMP '2025-06-01 09:00:00 UTC', 'Accepted', 'FCA', 0, 'legal@ukfunds.co.uk'),
  ('SUB-MISC-12', 'LEI-9002', 'UK_SDR', 'Product_Label_Notification', '2025-Q2', TIMESTAMP '2025-06-05 10:30:00 UTC', 'Rejected', 'FCA', 1, 'system_auto'),
  ('SUB-MISC-13', 'LEI-9002', 'UK_SDR', 'Product_Label_Notification', '2025-Q2', TIMESTAMP '2025-06-10 11:00:00 UTC', 'Accepted', 'FCA', 0, 'legal@ukfunds.co.uk'),
  ('SUB-MISC-14', 'LEI-9003', 'UK_SDR', 'Product_Label_Notification', '2025-Q2', NULL, 'Pending_Approval', NULL, 0, 'p.evans@wealthuk.com'),
  ('SUB-MISC-15', 'LEI-9004', 'UK_SDR', 'Product_Label_Notification', '2025-Q2', TIMESTAMP '2025-06-15 14:45:00 UTC', 'Accepted', 'FCA', 0, 'system_auto'),
  ('SUB-MISC-16', 'LEI-1001', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-10 10:00:00 UTC', 'Accepted', 'National_Registry_FR', 0, 'system_auto'),
  ('SUB-MISC-17', 'LEI-1002', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-12 11:30:00 UTC', 'Accepted', 'National_Registry_DE', 0, 'system_auto'),
  ('SUB-MISC-18', 'LEI-1003', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-15 09:15:00 UTC', 'Accepted', 'National_Registry_IE', 0, 'system_auto'),
  ('SUB-MISC-19', 'LEI-1004', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-18 14:00:00 UTC', 'Accepted', 'National_Registry_FR', 0, 'system_auto'),
  ('SUB-MISC-20', 'LEI-1005', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-20 16:30:00 UTC', 'Accepted', 'National_Registry_LU', 0, 'system_auto'),
  ('SUB-MISC-21', 'LEI-1006', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-22 10:45:00 UTC', 'Accepted', 'National_Registry_NL', 0, 'system_auto'),
  ('SUB-MISC-22', 'LEI-1007', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-25 13:20:00 UTC', 'Accepted', 'National_Registry_UK', 0, 'system_auto'),
  ('SUB-MISC-23', 'LEI-1008', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-28 08:50:00 UTC', 'Accepted', 'National_Registry_PL', 0, 'system_auto'),
  ('SUB-MISC-24', 'LEI-1009', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-29 11:10:00 UTC', 'Accepted', 'National_Registry_ES', 0, 'system_auto'),
  ('SUB-MISC-25', 'LEI-1010', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-30 15:40:00 UTC', 'Accepted', 'National_Registry_IT', 0, 'system_auto'),
  ('SUB-MISC-26', 'LEI-1011', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-11 09:25:00 UTC', 'Accepted', 'National_Registry_IT', 0, 'system_auto'),
  ('SUB-MISC-27', 'LEI-1012', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-14 14:55:00 UTC', 'Accepted', 'National_Registry_UK', 0, 'system_auto'),
  ('SUB-MISC-28', 'LEI-1013', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-17 10:05:00 UTC', 'Accepted', 'National_Registry_DK', 0, 'system_auto'),
  ('SUB-MISC-29', 'LEI-1014', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-19 16:15:00 UTC', 'Accepted', 'National_Registry_SE', 0, 'system_auto'),
  ('SUB-MISC-30', 'LEI-1015', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-21 11:35:00 UTC', 'Accepted', 'National_Registry_ES', 0, 'system_auto'),
  ('SUB-MISC-31', 'LEI-1016', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-24 08:40:00 UTC', 'Accepted', 'National_Registry_FR', 0, 'system_auto'),
  ('SUB-MISC-32', 'LEI-1017', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-26 13:50:00 UTC', 'Accepted', 'National_Registry_IT', 0, 'system_auto'),
  ('SUB-MISC-33', 'LEI-1018', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-27 15:10:00 UTC', 'Accepted', 'National_Registry_NL', 0, 'system_auto'),
  ('SUB-MISC-34', 'LEI-1019', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-29 09:55:00 UTC', 'Accepted', 'National_Registry_DE', 0, 'system_auto'),
  ('SUB-MISC-35', 'LEI-1020', 'CSRD', 'Sustainability_Statement', 'FY2023', TIMESTAMP '2024-04-30 14:25:00 UTC', 'Accepted', 'National_Registry_CH', 0, 'system_auto'),
  ('SUB-MISC-36', 'LEI-1001', 'EU_Taxonomy', 'Alignment_Report', 'FY2023', TIMESTAMP '2024-03-15 09:00:00 UTC', 'Accepted', 'NCA_FR', 0, 'system_auto'),
  ('SUB-MISC-37', 'LEI-1002', 'EU_Taxonomy', 'Alignment_Report', 'FY2023', TIMESTAMP '2024-03-20 14:00:00 UTC', 'Accepted', 'BaFin', 0, 'system_auto'),
  ('SUB-MISC-38', 'LEI-1006', 'EU_Taxonomy', 'Alignment_Report', 'FY2023', TIMESTAMP '2024-03-28 10:00:00 UTC', 'Accepted', 'AFM', 0, 'system_auto'),
  ('SUB-MISC-39', 'LEI-1012', 'EU_Taxonomy', 'Alignment_Report', 'FY2023', TIMESTAMP '2024-03-10 16:45:00 UTC', 'Accepted', 'FCA', 0, 'system_auto'),
  ('SUB-MISC-40', 'LEI-1016', 'EU_Taxonomy', 'Alignment_Report', 'FY2023', TIMESTAMP '2024-03-29 09:15:00 UTC', 'Accepted', 'CNMV', 0, 'system_auto');