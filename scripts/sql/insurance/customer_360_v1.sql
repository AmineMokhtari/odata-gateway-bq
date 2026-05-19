-- Create the Unified Customer 360 Dataset (Data Product)
-- Region is explicitly set to europe-west1 as standard requirement.
CREATE SCHEMA IF NOT EXISTS `customer_360_v1`
OPTIONS(
  location = 'europe-west1',
  description = 'Unified Customer 360 Data Product. Aggregates information across policy administration systems, CRM touchpoints, billing histories, and digital footprints to drive hyper-personalization, retention modeling, and cross-sell analytics.'
);

-- Create the Customers Master Table
CREATE TABLE IF NOT EXISTS `customer_360_v1.customers` (
  customer_id STRING OPTIONS(description="Enterprise unique identifier for the customer (Retail or Commercial)"),
  first_name STRING OPTIONS(description="Given name for Retail, or primary contact name for Commercial"),
  last_name STRING OPTIONS(description="Surname for Retail, or registered legal name for Commercial entities"),
  customer_type STRING OPTIONS(description="Type of customer entity: RETAIL, COMMERCIAL, or SME"),
  email STRING OPTIONS(description="Primary contact email address used for digital correspondence"),
  phone STRING OPTIONS(description="Primary contact phone number with country code"),
  segment STRING OPTIONS(description="Value-based customer segmentation: HIGH_NET_WORTH, MASS_AFFLUENT, CORE, SME, LARGE_ENTERPRISE"),
  relationship_start_date DATE OPTIONS(description="The date the customer signed their first policy contract"),
  customer_lifetime_value NUMERIC OPTIONS(description="Consolidated calculation of cumulative lifetime value generated across all channels (EUR)"),
  cross_sell_ratio FLOAT64 OPTIONS(description="Current product penetration ratio calculated as: (Held Categories / Eligible Categories)"),
  retention_risk_score FLOAT64 OPTIONS(description="Predictive model score indicating churn probability within next 120 days. Scale: 0.0 to 1.0"),
  priority_flag BOOL OPTIONS(description="System flag to guarantee priority routing (e.g., for long-term commercial clients or VIPs)"),
  relationship_manager STRING OPTIONS(description="Assigned premium relationship executive for institutional or corporate accounts"),
  PRIMARY KEY (customer_id) NOT ENFORCED
)
OPTIONS (
  description = "Unified Customer profile table. Serves as the golden record consolidated from CRM platforms and legacy billing entities."
);

-- Create the Policy Administration Table (Policy Admin System)
CREATE TABLE IF NOT EXISTS `customer_360_v1.policies` (
  policy_id STRING OPTIONS(description="Global Unique Identifier for the policy contract"),
  customer_id STRING OPTIONS(description="Foreign key mapping back to the Master Customer Entity"),
  line_of_business STRING OPTIONS(description="Primary commercial or personal line segment: AUTO, HOME, PROPERTY, LIABILITY, LIFE, CYBER"),
  policy_status STRING OPTIONS(description="Real-time operational status of contract: ACTIVE, LAPSED, PENDING_RENEWAL, CANCELLED"),
  premium_amount NUMERIC OPTIONS(description="Total written premium amount for the policy term (EUR)"),
  coverage_limit NUMERIC OPTIONS(description="Maximum total limit of coverage protection on the contract (EUR)"),
  deductible_amount NUMERIC OPTIONS(description="Contractual deductible amount paid by the insured before policy response (EUR)"),
  effective_date DATE OPTIONS(description="Policy term start date"),
  expiration_date DATE OPTIONS(description="Policy contract maturity or renewal boundary date"),
  auto_renewal_flag BOOL OPTIONS(description="Indicates if contract is enrolled in automatic annual renewal streams"),
  PRIMARY KEY (policy_id) NOT ENFORCED,
  CONSTRAINT fk_policy_customer FOREIGN KEY(customer_id) REFERENCES `customer_360_v1.customers`(customer_id) NOT ENFORCED
)
OPTIONS (
  description = "Consolidated policy contract register mapping coverage details and active exposures back to the core customer record."
);

-- Create the Claims History Table
CREATE TABLE IF NOT EXISTS `customer_360_v1.claims` (
  claim_id STRING OPTIONS(description="Unique system ID assigned to the specific claim incident"),
  policy_id STRING OPTIONS(description="Foreign key pointing to the corresponding active policy contract"),
  customer_id STRING OPTIONS(description="Foreign key linking the claim to the core master customer record"),
  claim_incident_date DATE OPTIONS(description="Calendar date on which the loss event took place"),
  claim_reported_date DATE OPTIONS(description="Date the insurance claims operations team was formally notified of the loss"),
  claim_status STRING OPTIONS(description="Operational progression phase: OPEN, INVESTIGATING, APPROVED, SETTLED, DENIED"),
  claimed_amount NUMERIC OPTIONS(description="Initial estimated loss amount reported by claimant (EUR)"),
  paid_amount NUMERIC OPTIONS(description="Total cumulative financial payout completed to date on the claim (EUR)"),
  reserve_amount NUMERIC OPTIONS(description="Financial cash reserves allocated for outstanding future payouts on this file (EUR)"),
  litigation_flag BOOL OPTIONS(description="Indicates whether claims handling has escalated to legal dispute / litigation"),
  PRIMARY KEY (claim_id) NOT ENFORCED,
  CONSTRAINT fk_claim_policy FOREIGN KEY(policy_id) REFERENCES `customer_360_v1.policies`(policy_id) NOT ENFORCED,
  CONSTRAINT fk_claim_customer FOREIGN KEY(customer_id) REFERENCES `customer_360_v1.customers`(customer_id) NOT ENFORCED
)
OPTIONS (
  description = "Transactional and historical repository of claims filed by policyholders, crucial for churn risk calculation."
);

-- Create the Billing and Transactions Table
CREATE TABLE IF NOT EXISTS `customer_360_v1.billing` (
  invoice_id STRING OPTIONS(description="Unique financial invoice reference identifier"),
  customer_id STRING OPTIONS(description="Foreign key linking billing event to master customer customer_id"),
  policy_id STRING OPTIONS(description="Foreign key linking transactional event to policy_id"),
  billing_status STRING OPTIONS(description="Operational status of transaction: PAID, PAST_DUE, RECONCILED, WRITTEN_OFF"),
  invoice_date DATE OPTIONS(description="Date on which the invoice was generated and transmitted"),
  due_date DATE OPTIONS(description="Contractual payment due date"),
  amount_due NUMERIC OPTIONS(description="Invoice amount requested (EUR)"),
  amount_paid NUMERIC OPTIONS(description="Actual amount successfully settled on this invoice (EUR)"),
  payment_method STRING OPTIONS(description="Transactional framework used: DIRECT_DEBIT, CREDIT_CARD, WIRE_TRANSFER, MANUAL_CHECK"),
  late_payment_count INT64 OPTIONS(description="Historical occurrence of past-due indicators on this specific account trajectory"),
  PRIMARY KEY (invoice_id) NOT ENFORCED,
  CONSTRAINT fk_billing_customer FOREIGN KEY(customer_id) REFERENCES `customer_360_v1.customers`(customer_id) NOT ENFORCED,
  CONSTRAINT fk_billing_policy FOREIGN KEY(policy_id) REFERENCES `customer_360_v1.policies`(policy_id) NOT ENFORCED
)
OPTIONS (
  description = "Billing ledger aggregating financial health metrics, payment behaviors, and collection patterns."
);

-- Create the Digital Interactions and CRM Touchpoints Table
CREATE TABLE IF NOT EXISTS `customer_360_v1.interactions` (
  interaction_id STRING OPTIONS(description="Unique tracking token for the CRM interaction or web footprint session"),
  customer_id STRING OPTIONS(description="Foreign key mapping digital footprint directly to customer profile"),
  interaction_timestamp TIMESTAMP OPTIONS(description="High-precision UTC timestamp of physical or digital touchpoint"),
  interaction_channel STRING OPTIONS(description="Medium of contact: INBOUND_CALL, WEBSITE_PORTAL, MOBILE_APP, EMAIL, BRANCH_OFFICE"),
  interaction_purpose STRING OPTIONS(description="Context of engagement: RENEWAL_QUERIES, CLAIMS_UPDATE, COMPLAINT, BROWSING_PROFILES, POLICY_ADDITION"),
  sentiment_score FLOAT64 OPTIONS(description="Real-time Natural Language Processing (NLP) score of interaction. Scale: -1.0 (angry) to 1.0 (delighted)"),
  notes STRING OPTIONS(description="Structured agent logs, behavioral highlights, or digital click-stream metadata summary"),
  device_type STRING OPTIONS(description="Client end-point system captured during digital touchpoints: DESKTOP, iOS, ANDROID, NONE"),
  PRIMARY KEY (interaction_id) NOT ENFORCED,
  CONSTRAINT fk_interaction_customer FOREIGN KEY(customer_id) REFERENCES `customer_360_v1.customers`(customer_id) NOT ENFORCED
)
OPTIONS (
  description = "Unified footprint database logging multi-channel digital interactions and real-time CRM behavioral signals."
);


-- Insert exactly 100 diverse, highly realistic Customer Profile entries.
-- Includes the specific scenario of a 20-year High-Value Corporate Client (e.g., global logistics, SME partners, retail accounts).
INSERT INTO `customer_360_v1.customers` (
  customer_id, first_name, last_name, customer_type, email, phone, segment, relationship_start_date, customer_lifetime_value, cross_sell_ratio, retention_risk_score, priority_flag, relationship_manager
) VALUES
('CUST-001', 'Pierre', 'Dupont', 'RETAIL', 'pierre.dupont@email.fr', '+33612345678', 'HIGH_NET_WORTH', '2015-04-12', 45200.00, 0.75, 0.05, TRUE, 'Sophie Bernard'),
('CUST-002', 'Marie', 'Martin', 'RETAIL', 'marie.martin@email.fr', '+33687654321', 'CORE', '2021-08-30', 4800.00, 0.25, 0.42, FALSE, NULL),
('CUST-003', 'Jean-Paul', 'Espace Logistics', 'COMMERCIAL', 'ops@espacelogistics.com', '+33145678900', 'LARGE_ENTERPRISE', '2006-03-01', 890000.00, 0.85, 0.01, TRUE, 'Antoine de Saint-Exupery'), -- 20-Year VIP Commercial
('CUST-004', 'Sarah', 'Connor', 'RETAIL', 's.connor@cyberdyne.fr', '+33655519840', 'MASS_AFFLUENT', '2019-11-10', 12500.00, 0.50, 0.15, TRUE, 'Sophie Bernard'),
('CUST-005', 'Thomas', 'Dubois', 'RETAIL', 't.dubois@email.fr', '+33711223344', 'CORE', '2023-01-15', 2100.00, 0.25, 0.68, FALSE, NULL),
('CUST-006', 'Lucie', 'Robert', 'RETAIL', 'l.robert@email.fr', '+33622334455', 'CORE', '2022-05-18', 3200.00, 0.25, 0.35, FALSE, NULL),
('CUST-007', 'Michel', 'Richard', 'RETAIL', 'm.richard@email.fr', '+33633445566', 'MASS_AFFLUENT', '2018-09-24', 15800.00, 0.50, 0.12, FALSE, NULL),
('CUST-008', 'Isabelle', 'Petit', 'RETAIL', 'i.petit@email.fr', '+33644556677', 'CORE', '2020-11-05', 6100.00, 0.50, 0.28, FALSE, NULL),
('CUST-009', 'Alain', 'Boulangerie Durand', 'SME', 'contact@durandpain.fr', '+33123456789', 'SME', '2011-02-14', 54000.00, 0.60, 0.08, TRUE, 'Marc Lemaire'),
('CUST-010', 'Sylvie', 'Moreau', 'RETAIL', 's.moreau@email.fr', '+33655667788', 'MASS_AFFLUENT', '2017-03-03', 19400.00, 0.75, 0.04, FALSE, NULL),
('CUST-011', 'Christophe', 'Simon', 'RETAIL', 'c.simon@email.fr', '+33666778899', 'CORE', '2024-02-28', 1200.00, 0.25, 0.81, FALSE, NULL),
('CUST-012', 'Nathalie', 'Laurent', 'RETAIL', 'n.laurent@email.fr', '+33677889900', 'HIGH_NET_WORTH', '2014-06-30', 51000.00, 0.80, 0.02, TRUE, 'Sophie Bernard'),
('CUST-013', 'Christian', 'Michel', 'RETAIL', 'c.michel@email.fr', '+33688990011', 'CORE', '2022-10-12', 3900.00, 0.25, 0.22, FALSE, NULL),
('CUST-014', 'Valerie', 'Garcia', 'RETAIL', 'v.garcia@email.fr', '+33699001122', 'MASS_AFFLUENT', '2016-12-01', 14200.00, 0.50, 0.19, FALSE, NULL),
('CUST-015', 'Guillaume', 'Vignobles Bourgeois', 'SME', 'info@bourgeoisvins.fr', '+33556789123', 'SME', '2009-07-22', 98000.00, 0.70, 0.05, TRUE, 'Marc Lemaire'),
('CUST-016', 'Sandrine', 'Bertrand', 'RETAIL', 's.bertrand@email.fr', '+33611112222', 'CORE', '2020-04-05', 5200.00, 0.25, 0.40, FALSE, NULL),
('CUST-017', 'Olivier', 'Gautier', 'RETAIL', 'o.gautier@email.fr', '+33622223333', 'MASS_AFFLUENT', '2015-10-19', 21500.00, 0.75, 0.07, FALSE, NULL),
('CUST-018', 'Catherine', 'Roux', 'RETAIL', 'c.roux@email.fr', '+33633334444', 'HIGH_NET_WORTH', '2012-01-15', 62000.00, 0.80, 0.03, TRUE, 'Sophie Bernard'),
('CUST-019', 'Stephane', 'David', 'RETAIL', 's.david@email.fr', '+33644445555', 'CORE', '2023-07-09', 2400.00, 0.25, 0.55, FALSE, NULL),
('CUST-020', 'Julien', 'Bâtiment Azur', 'SME', 'contact@azurbat.fr', '+33493445566', 'SME', '2013-11-30', 71000.00, 0.66, 0.11, TRUE, 'Marc Lemaire'),
('CUST-021', 'Aurelie', 'Morel', 'RETAIL', 'a.morel@email.fr', '+33655556666', 'MASS_AFFLUENT', '2018-05-24', 11300.00, 0.50, 0.24, FALSE, NULL),
('CUST-022', 'Eric', 'Girard', 'RETAIL', 'e.girard@email.fr', '+33666667777', 'CORE', '2021-02-11', 4100.00, 0.25, 0.31, FALSE, NULL),
('CUST-023', 'Sophie', 'Andre', 'RETAIL', 's.andre@email.fr', '+33677778888', 'CORE', '2022-09-01', 3500.00, 0.25, 0.48, FALSE, NULL),
('CUST-024', 'Vincent', 'Lefevre', 'RETAIL', 'v.lefevre@email.fr', '+33688889999', 'MASS_AFFLUENT', '2017-11-14', 18600.00, 0.75, 0.09, FALSE, NULL),
('CUST-025', 'Nadine', 'Mercier', 'RETAIL', 'n.mercier@email.fr', '+33699990000', 'CORE', '2019-03-25', 7300.00, 0.50, 0.17, FALSE, NULL),
('CUST-026', 'Thierry', 'TechSolutions', 'SME', 'procurement@techsolutions.fr', '+33199887766', 'SME', '2016-08-10', 123000.00, 0.75, 0.04, TRUE, 'Marc Lemaire'),
('CUST-027', 'Emmanuelle', 'Dupuy', 'RETAIL', 'e.dupuy@email.fr', '+33612341234', 'MASS_AFFLUENT', '2014-12-18', 26000.00, 0.75, 0.06, FALSE, NULL),
('CUST-028', 'Laurent', 'Francois', 'RETAIL', 'l.francois@email.fr', '+33623452345', 'CORE', '2024-05-01', 950.00, 0.25, 0.90, FALSE, NULL),
('CUST-029', 'Françoise', 'Legrand', 'RETAIL', 'f.legrand@email.fr', '+33634563456', 'HIGH_NET_WORTH', '2010-04-03', 78000.00, 0.80, 0.01, TRUE, 'Sophie Bernard'),
('CUST-030', 'Sebastien', 'Garnier', 'RETAIL', 's.garnier@email.fr', '+33645674567', 'CORE', '2021-12-20', 4900.00, 0.50, 0.33, FALSE, NULL),
('CUST-031', 'Nicolas', 'Clinique Vet Sante', 'SME', 'admin@vetsante.fr', '+33320304050', 'SME', '2015-06-14', 68000.00, 0.60, 0.12, FALSE, 'Marc Lemaire'),
('CUST-032', 'Brigitte', 'Caron', 'RETAIL', 'b.caron@email.fr', '+33656785678', 'CORE', '2018-02-10', 9200.00, 0.50, 0.14, FALSE, NULL),
('CUST-033', 'Dominique', 'Vidal', 'RETAIL', 'd.vidal@email.fr', '+33667896789', 'MASS_AFFLUENT', '2019-07-29', 14300.00, 0.50, 0.22, FALSE, NULL),
('CUST-034', 'Marc', 'Muller', 'RETAIL', 'm.muller@email.fr', '+33678907890', 'CORE', '2023-11-12', 1800.00, 0.25, 0.71, FALSE, NULL),
('CUST-035', 'Elisabeth', 'Giraud', 'RETAIL', 'e.giraud@email.fr', '+33689018901', 'MASS_AFFLUENT', '2016-05-22', 21100.00, 0.75, 0.05, FALSE, NULL),
('CUST-036', 'Patrick', 'Alimentation Pro', 'SME', 'b2b@alipro.fr', '+33240506070', 'SME', '2012-10-08', 84000.00, 0.70, 0.08, TRUE, 'Marc Lemaire'),
('CUST-037', 'Chantal', 'Roussel', 'RETAIL', 'c.roussel@email.fr', '+33690129012', 'CORE', '2020-01-26', 6400.00, 0.50, 0.26, FALSE, NULL),
('CUST-038', 'Robert', 'Lemoine', 'RETAIL', 'r.lemoine@email.fr', '+33601230123', 'CORE', '2022-04-14', 3300.00, 0.25, 0.39, FALSE, NULL),
('CUST-039', 'Sabine', 'Clément', 'RETAIL', 's.clement@email.fr', '+33612349999', 'MASS_AFFLUENT', '2015-09-02', 25500.00, 0.75, 0.06, FALSE, NULL),
('CUST-040', 'Lucas', 'Picard', 'RETAIL', 'l.picard@email.fr', '+33623458888', 'CORE', '2023-04-20', 2700.00, 0.25, 0.59, FALSE, NULL),
('CUST-041', 'Paul', 'Logistique Nord', 'COMMERCIAL', 'fleet@logistiquenord.fr', '+33320999888', 'LARGE_ENTERPRISE', '2008-11-20', 520000.00, 0.80, 0.03, TRUE, 'Antoine de Saint-Exupery'),
('CUST-042', 'Virginie', 'Dumont', 'RETAIL', 'v.dumont@email.fr', '+33634567777', 'CORE', '2018-08-15', 8800.00, 0.50, 0.18, FALSE, NULL),
('CUST-043', 'Benoit', 'Brunet', 'RETAIL', 'b.brunet@email.fr', '+33645676666', 'MASS_AFFLUENT', '2017-01-30', 16900.00, 0.50, 0.13, FALSE, NULL),
('CUST-044', 'Martine', 'Guerin', 'RETAIL', 'm.guerin@email.fr', '+33656785555', 'CORE', '2021-06-11', 4500.00, 0.25, 0.44, FALSE, NULL),
('CUST-045', 'Arnaud', 'Boulanger', 'RETAIL', 'a.boulanger@email.fr', '+33667894444', 'CORE', '2022-02-28', 3800.00, 0.25, 0.37, FALSE, NULL),
('CUST-046', 'Florence', 'Chevalier', 'RETAIL', 'f.chevalier@email.fr', '+33678903333', 'HIGH_NET_WORTH', '2013-08-12', 49000.00, 0.75, 0.02, TRUE, 'Sophie Bernard'),
('CUST-047', 'Jérôme', 'Imprimerie Express', 'SME', 'direction@imprimexpress.fr', '+33472001122', 'SME', '2014-05-19', 91000.00, 0.66, 0.09, TRUE, 'Marc Lemaire'),
('CUST-048', 'Helene', 'Lucas', 'RETAIL', 'h.lucas@email.fr', '+33689012222', 'MASS_AFFLUENT', '2016-10-05', 23400.00, 0.75, 0.08, FALSE, NULL),
('CUST-049', 'Gregory', 'Imbert', 'RETAIL', 'g.imbert@email.fr', '+33690121111', 'CORE', '2023-09-17', 1900.00, 0.25, 0.65, FALSE, NULL),
('CUST-050', 'Sylvain', 'Colas', 'RETAIL', 's.colas@email.fr', '+33601239999', 'CORE', '2020-07-22', 5900.00, 0.50, 0.23, FALSE, NULL),
('CUST-051', 'Isabelle', 'Brun', 'RETAIL', 'i.brun@email.fr', '+33611110000', 'CORE', '2021-11-14', 4200.00, 0.25, 0.38, FALSE, NULL),
('CUST-052', 'Pascal', 'Rey', 'RETAIL', 'p.rey@email.fr', '+33622221111', 'CORE', '2019-01-18', 7700.00, 0.50, 0.16, FALSE, NULL),
('CUST-053', 'Marie-Christine', 'Metallurgie du Rhone', 'COMMERCIAL', 'contact@metarhone.fr', '+33478998877', 'LARGE_ENTERPRISE', '2005-09-10', 1150000.00, 0.90, 0.01, TRUE, 'Antoine de Saint-Exupery'), -- 20-Year VIP Commercial
('CUST-054', 'Mathieu', 'Barbier', 'RETAIL', 'm.barbier@email.fr', '+33633332222', 'MASS_AFFLUENT', '2015-11-23', 24800.00, 0.75, 0.05, FALSE, NULL),
('CUST-055', 'Nelly', 'Rolland', 'RETAIL', 'n.rolland@email.fr', '+33644443333', 'CORE', '2018-04-12', 9600.00, 0.50, 0.11, FALSE, NULL),
('CUST-056', 'Franck', 'Lemaire', 'RETAIL', 'f.lemaire@email.fr', '+33655554444', 'CORE', '2023-12-05', 1500.00, 0.25, 0.76, FALSE, NULL),
('CUST-057', 'Audrey', 'Walter', 'RETAIL', 'a.walter@email.fr', '+33666665555', 'HIGH_NET_WORTH', '2011-06-18', 68000.00, 0.80, 0.02, TRUE, 'Sophie Bernard'),
('CUST-058', 'Thibault', 'Bailly', 'RETAIL', 't.bailly@email.fr', '+33677776666', 'CORE', '2022-07-01', 3100.00, 0.25, 0.43, FALSE, NULL),
('CUST-059', 'Valérie', 'Vecteur Securite', 'SME', 'direction@vecteursecu.fr', '+33140509090', 'SME', '2017-02-21', 105000.00, 0.75, 0.07, TRUE, 'Marc Lemaire'),
('CUST-060', 'Estelle', 'Gomez', 'RETAIL', 'e.gomez@email.fr', '+33688887777', 'CORE', '2020-03-30', 6800.00, 0.50, 0.21, FALSE, NULL),
('CUST-061', 'Yannick', 'Aubry', 'RETAIL', 'y.aubry@email.fr', '+33699998888', 'MASS_AFFLUENT', '2016-01-15', 28500.00, 0.75, 0.04, FALSE, NULL),
('CUST-062', 'Chantal', 'Leclerc', 'RETAIL', 'c.leclerc@email.fr', '+33612344321', 'CORE', '2019-09-08', 8400.00, 0.50, 0.15, FALSE, NULL),
('CUST-063', 'Didier', 'Renard', 'RETAIL', 'd.renard@email.fr', '+33623455432', 'CORE', '2024-01-10', 1400.00, 0.25, 0.79, FALSE, NULL),
('CUST-064', 'Nathalie', 'Dufour', 'RETAIL', 'n.dufour@email.fr', '+33634566543', 'MASS_AFFLUENT', '2014-08-25', 31000.00, 0.75, 0.03, FALSE, NULL),
('CUST-065', 'Benoit', 'AgriSologne Union', 'SME', 'contact@agrisologne.fr', '+33254998877', 'SME', '2010-05-12', 115000.00, 0.66, 0.08, TRUE, 'Marc Lemaire'),
('CUST-066', 'Mireille', 'Blondel', 'RETAIL', 'm.blondel@email.fr', '+33645677654', 'CORE', '2021-04-04', 5000.00, 0.50, 0.30, FALSE, NULL),
('CUST-067', 'Gérard', 'Parent', 'RETAIL', 'g.parent@email.fr', '+33656788765', 'CORE', '2022-11-22', 2900.00, 0.25, 0.51, FALSE, NULL),
('CUST-068', 'Celine', 'Moret', 'RETAIL', 'c.moret@email.fr', '+33667899876', 'MASS_AFFLUENT', '2018-07-19', 15400.00, 0.50, 0.17, FALSE, NULL),
('CUST-069', 'Damien', 'Guyot', 'RETAIL', 'd.guyot@email.fr', '+33678900987', 'CORE', '2023-03-14', 2600.00, 0.25, 0.61, FALSE, NULL),
('CUST-070', 'Jean-Marie', 'Transports JMT', 'COMMERCIAL', 'jmt@transportsjmt.fr', '+33388776655', 'LARGE_ENTERPRISE', '2007-06-01', 690000.00, 0.85, 0.02, TRUE, 'Antoine de Saint-Exupery'), -- 19-Year VIP Commercial
('CUST-071', 'Colette', 'Chauvin', 'RETAIL', 'c.chauvin@email.fr', '+33689011098', 'CORE', '2020-09-02', 6300.00, 0.50, 0.25, FALSE, NULL),
('CUST-072', 'Remi', 'Boulanger', 'RETAIL', 'r.boulanger2@email.fr', '+33690122109', 'CORE', '2021-07-25', 4600.00, 0.25, 0.36, FALSE, NULL),
('CUST-073', 'Sabrina', 'Allard', 'RETAIL', 's.allard@email.fr', '+33601233210', 'MASS_AFFLUENT', '2016-04-10', 22800.00, 0.75, 0.05, FALSE, NULL),
('CUST-074', 'Gilles', 'Martel', 'RETAIL', 'g.martel@email.fr', '+33611119999', 'CORE', '2024-03-01', 1100.00, 0.25, 0.85, FALSE, NULL),
('CUST-075', 'Josiane', 'Maurin', 'RETAIL', 'j.maurin@email.fr', '+33622228888', 'HIGH_NET_WORTH', '2013-02-28', 54000.00, 0.80, 0.02, TRUE, 'Sophie Bernard'),
('CUST-076', 'Fabrice', 'Hotel de la Plage', 'SME', 'direction@plagehotel.fr', '+33494556677', 'SME', '2012-04-18', 87000.00, 0.70, 0.10, TRUE, 'Marc Lemaire'),
('CUST-077', 'Isabelle', 'Devaux', 'RETAIL', 'i.devaux@email.fr', '+33633337777', 'CORE', '2019-12-15', 7900.00, 0.50, 0.19, FALSE, NULL),
('CUST-078', 'Xavier', 'Charpentier SAS', 'SME', 'charpentier@moulinsas.fr', '+33247009988', 'SME', '2015-11-02', 74000.00, 0.60, 0.13, FALSE, 'Marc Lemaire'),
('CUST-079', 'Danielle', 'Collin', 'RETAIL', 'd.collin@email.fr', '+33644446666', 'CORE', '2022-06-08', 3400.00, 0.25, 0.46, FALSE, NULL),
('CUST-080', 'Regis', 'Pelletier', 'RETAIL', 'r.pelletier@email.fr', '+33655555555', 'MASS_AFFLUENT', '2017-09-12', 17800.00, 0.50, 0.12, FALSE, NULL),
('CUST-081', 'Monique', 'Poisson', 'RETAIL', 'm.poisson@email.fr', '+33666664444', 'CORE', '2023-06-15', 2500.00, 0.25, 0.58, FALSE, NULL),
('CUST-082', 'Marc', 'Vignobles du Sud', 'SME', 'contact@vignesdusud.fr', '+33467001122', 'SME', '2011-09-04', 112000.00, 0.75, 0.04, TRUE, 'Marc Lemaire'),
('CUST-083', 'Nelly', 'Lefort', 'RETAIL', 'n.lefort@email.fr', '+33677773333', 'CORE', '2021-01-30', 5400.00, 0.50, 0.29, FALSE, NULL),
('CUST-084', 'Antoine', 'Humbert', 'RETAIL', 'a.humbert@email.fr', '+33688882222', 'MASS_AFFLUENT', '2015-05-18', 27000.00, 0.75, 0.04, FALSE, NULL),
('CUST-085', 'Corinne', 'Voisin', 'RETAIL', 'c.voisin@email.fr', '+33699991111', 'CORE', '2018-10-10', 9000.00, 0.50, 0.16, FALSE, NULL),
('CUST-086', 'Fabienne', 'Boyer', 'RETAIL', 'f.boyer@email.fr', '+33611118888', 'CORE', '2022-12-01', 2800.00, 0.25, 0.49, FALSE, NULL),
('CUST-087', 'Thierry', 'Aluminium Industrie', 'COMMERCIAL', 'industrial@aluid.fr', '+33388001122', 'LARGE_ENTERPRISE', '2009-03-12', 430000.00, 0.80, 0.03, TRUE, 'Antoine de Saint-Exupery'),
('CUST-088', 'Georgette', 'Lucas', 'RETAIL', 'g.lucas2@email.fr', '+33622227777', 'CORE', '2020-05-24', 6000.00, 0.50, 0.24, FALSE, NULL),
('CUST-089', 'Armand', 'Gaudin', 'RETAIL', 'a.gaudin@email.fr', '+33633336666', 'MASS_AFFLUENT', '2016-08-30', 21900.00, 0.75, 0.07, FALSE, NULL),
('CUST-090', 'Josette', 'Henry', 'RETAIL', 'j.henry@email.fr', '+33644445555', 'CORE', '2023-10-05', 1700.00, 0.25, 0.69, FALSE, NULL),
('CUST-091', 'Hubert', 'Bailly SAS', 'SME', 'finance@baillysas.fr', '+33240001122', 'SME', '2014-07-28', 89000.00, 0.66, 0.10, TRUE, 'Marc Lemaire'),
('CUST-092', 'Simone', 'Leveque', 'RETAIL', 's.leveque@email.fr', '+33655553333', 'CORE', '2019-02-14', 8200.00, 0.50, 0.18, FALSE, NULL),
('CUST-093', 'Adrien', 'Gillet', 'RETAIL', 'a.gillet@email.fr', '+33666662222', 'MASS_AFFLUENT', '2017-06-25', 18500.00, 0.50, 0.11, FALSE, NULL),
('CUST-094', 'Yvonne', 'Marchal', 'RETAIL', 'y.marchal@email.fr', '+33677771111', 'CORE', '2022-03-18', 3600.00, 0.25, 0.41, FALSE, NULL),
('CUST-095', 'Pauline', 'Joly', 'RETAIL', 'p.joly@email.fr', '+33688880000', 'CORE', '2021-09-09', 4700.00, 0.25, 0.32, FALSE, NULL),
('CUST-096', 'Guy', 'Construction de lEst', 'COMMERCIAL', 'contact@estconstruct.fr', '+33383001122', 'LARGE_ENTERPRISE', '2010-10-22', 380000.00, 0.75, 0.05, TRUE, 'Antoine de Saint-Exupery'),
('CUST-097', 'Bernadette', 'Pons', 'RETAIL', 'b.pons@email.fr', '+33699999999', 'HIGH_NET_WORTH', '2012-07-14', 59000.00, 0.80, 0.02, TRUE, 'Sophie Bernard'),
('CUST-098', 'Christian', 'Gérard', 'RETAIL', 'c.gerard@email.fr', '+33612345600', 'CORE', '2023-11-30', 1600.00, 0.25, 0.73, FALSE, NULL),
('CUST-099', 'Genevieve', 'Leroy', 'RETAIL', 'g.leroy@email.fr', '+33623456700', 'MASS_AFFLUENT', '2015-02-10', 29000.00, 0.75, 0.04, FALSE, NULL),
('CUST-100', 'Charles', 'Ferry', 'RETAIL', 'c.ferry@email.fr', '+33634567800', 'CORE', '2024-04-15', 1000.00, 0.25, 0.88, FALSE, NULL);

-- Insert baseline policy documents mapping to existing customer entities
-- Illustrates typical insurance product holdings (Auto, Home, Commercial Liability)
INSERT INTO `customer_360_v1.policies` (
  policy_id, customer_id, line_of_business, policy_status, premium_amount, coverage_limit, deductible_amount, effective_date, expiration_date, auto_renewal_flag
) VALUES
-- CUST-001 High Net Worth Retail (Multiple active policies demonstrating high cross-sell)
('POL-001A', 'CUST-001', 'AUTO', 'ACTIVE', 1200.00, 100000.00, 500.00, '2025-01-01', '2026-01-01', TRUE),
('POL-001B', 'CUST-001', 'HOME', 'ACTIVE', 2400.00, 1500000.00, 1000.00, '2025-04-12', '2026-04-12', TRUE),
('POL-001C', 'CUST-001', 'LIABILITY', 'ACTIVE', 800.00, 2000000.00, 250.00, '2025-06-01', '2026-06-01', FALSE),
-- CUST-002 Core Retail (Single policy holder)
('POL-002A', 'CUST-002', 'AUTO', 'ACTIVE', 950.00, 50000.00, 400.00, '2025-08-30', '2026-08-30', TRUE),
-- CUST-003 Multi-decade Enterprise Client (Very high coverage limits, premium enterprise tier)
('POL-003A', 'CUST-003', 'PROPERTY', 'ACTIVE', 45000.00, 20000000.00, 25000.00, '2025-03-01', '2026-03-01', TRUE),
('POL-003B', 'CUST-003', 'LIABILITY', 'ACTIVE', 28000.00, 10000000.00, 15000.00, '2025-03-01', '2026-03-01', TRUE),
('POL-003C', 'CUST-003', 'CYBER', 'ACTIVE', 18000.00, 5000000.00, 10000.00, '2025-09-15', '2026-09-15', TRUE),
-- CUST-004 Retail Active
('POL-004A', 'CUST-004', 'AUTO', 'ACTIVE', 1500.00, 80000.00, 500.00, '2025-11-10', '2026-11-10', TRUE),
('POL-004B', 'CUST-004', 'HOME', 'ACTIVE', 1100.00, 450000.00, 500.00, '2025-12-01', '2026-12-01', TRUE),
-- CUST-005 High Churn Risk (Lapsed contract signals)
('POL-005A', 'CUST-005', 'AUTO', 'LAPSED', 1100.00, 50000.00, 500.00, '2024-01-15', '2025-01-15', FALSE),
-- CUST-009 SME Customer with multiple policies
('POL-009A', 'CUST-009', 'PROPERTY', 'ACTIVE', 4500.00, 1500000.00, 2500.00, '2025-02-14', '2026-02-14', TRUE),
('POL-009B', 'CUST-009', 'LIABILITY', 'ACTIVE', 2800.00, 1000000.00, 1500.00, '2025-02-14', '2026-02-14', TRUE),
-- CUST-012 VIP High Net Worth
('POL-012A', 'CUST-012', 'HOME', 'ACTIVE', 3800.00, 2500000.00, 1500.00, '2025-06-30', '2026-06-30', TRUE),
('POL-012B', 'CUST-012', 'AUTO', 'ACTIVE', 1900.00, 120000.00, 600.00, '2025-07-15', '2026-07-15', TRUE),
-- CUST-015 SME Winery Client
('POL-015A', 'CUST-015', 'PROPERTY', 'ACTIVE', 8500.00, 3000000.00, 5000.00, '2025-07-22', '2026-07-22', TRUE),
('POL-015B', 'CUST-015', 'LIABILITY', 'ACTIVE', 4200.00, 2000000.00, 2000.00, '2025-07-22', '2026-07-22', TRUE),
-- CUST-020 SME construction
('POL-020A', 'CUST-020', 'PROPERTY', 'ACTIVE', 6100.00, 2000000.00, 3000.00, '2025-11-30', '2026-11-30', TRUE),
('POL-020B', 'CUST-020', 'LIABILITY', 'ACTIVE', 4900.00, 3000000.00, 2500.00, '2025-11-30', '2026-11-30', TRUE),
-- CUST-026 SME Tech
('POL-026A', 'CUST-026', 'CYBER', 'ACTIVE', 12500.00, 4000000.00, 5000.00, '2025-08-10', '2026-08-10', TRUE),
('POL-026B', 'CUST-026', 'LIABILITY', 'ACTIVE', 6200.00, 2000000.00, 2000.00, '2025-08-10', '2026-08-10', TRUE),
-- CUST-028 New High Churn Risk customer (lapsing indicator)
('POL-028A', 'CUST-028', 'AUTO', 'ACTIVE', 950.00, 50000.00, 500.00, '2024-05-01', '2025-05-01', FALSE),
-- CUST-041 Large Enterprise Logistics
('POL-041A', 'CUST-041', 'PROPERTY', 'ACTIVE', 32000.00, 15000000.00, 15000.00, '2025-11-20', '2026-11-20', TRUE),
('POL-041B', 'CUST-041', 'LIABILITY', 'ACTIVE', 19000.00, 8000000.00, 10000.00, '2025-11-20', '2026-11-20', TRUE),
-- CUST-053 High-Value Legacy Metallurgical Corp
('POL-053A', 'CUST-053', 'PROPERTY', 'ACTIVE', 68000.00, 35000000.00, 50000.00, '2025-09-10', '2026-09-10', TRUE),
('POL-053B', 'CUST-053', 'LIABILITY', 'ACTIVE', 34000.00, 15000000.00, 25000.00, '2025-09-10', '2026-09-10', TRUE),
('POL-053C', 'CUST-053', 'CYBER', 'ACTIVE', 22000.00, 5000000.00, 10000.00, '2025-09-10', '2026-09-10', TRUE),
-- CUST-070 Legacy Transport Corporate
('POL-070A', 'CUST-070', 'AUTO', 'ACTIVE', 48000.00, 12000000.00, 20000.00, '2025-06-01', '2026-06-01', TRUE),
('POL-070B', 'CUST-070', 'LIABILITY', 'ACTIVE', 18000.00, 5000000.00, 10000.00, '2025-06-01', '2026-06-01', TRUE),
-- CUST-087 Industrial Aluminium
('POL-087A', 'CUST-087', 'PROPERTY', 'ACTIVE', 28000.00, 10000000.00, 15000.00, '2025-03-12', '2026-03-12', TRUE),
('POL-087B', 'CUST-087', 'LIABILITY', 'ACTIVE', 14000.00, 5000000.00, 10000.00, '2025-03-12', '2026-03-12', TRUE),
-- CUST-096 Construction Corporate
('POL-096A', 'CUST-096', 'PROPERTY', 'ACTIVE', 22000.00, 8000000.00, 10000.00, '2025-10-22', '2026-10-22', TRUE),
('POL-096B', 'CUST-096', 'LIABILITY', 'ACTIVE', 15000.00, 5000000.00, 10000.00, '2025-10-22', '2026-10-22', TRUE);

-- Populate historical claim files to facilitate pricing analysis and operational risk reviews
INSERT INTO `customer_360_v1.claims` (
  claim_id, policy_id, customer_id, claim_incident_date, claim_reported_date, claim_status, claimed_amount, paid_amount, reserve_amount, litigation_flag
) VALUES
-- CUST-001 (Minor auto incident)
('CLM-1001', 'POL-001A', 'CUST-001', '2025-02-14', '2025-02-15', 'SETTLED', 1200.00, 1100.00, 0.00, FALSE),
-- CUST-003 Large Corporate claim (settled amicably without treating them like a stranger)
('CLM-1002', 'POL-003A', 'CUST-003', '2025-05-10', '2025-05-11', 'SETTLED', 140000.00, 135000.00, 0.00, FALSE),
-- CUST-009 SME Claim (currently open and under investigation)
('CLM-1003', 'POL-009A', 'CUST-009', '2025-10-20', '2025-10-22', 'INVESTIGATING', 8500.00, 0.00, 8500.00, FALSE),
-- CUST-015 SME Winery (Storm damage settled)
('CLM-1004', 'POL-015A', 'CUST-015', '2025-09-02', '2025-09-04', 'SETTLED', 24000.00, 24000.00, 0.00, FALSE),
-- CUST-053 Legacy Industrial Claim (Highly complex commercial property loss - settled)
('CLM-1005', 'POL-053A', 'CUST-053', '2025-11-12', '2025-11-14', 'SETTLED', 450000.00, 445000.00, 0.00, FALSE),
-- CUST-070 Corporate Auto Fleet claim
('CLM-1006', 'POL-070A', 'CUST-070', '2025-08-01', '2025-08-03', 'APPROVED', 18000.00, 10000.00, 8000.00, FALSE);

-- Populate invoices to log billing habits, payment frequencies, and potential churn risks (past dues)
INSERT INTO `customer_360_v1.billing` (
  invoice_id, customer_id, policy_id, billing_status, invoice_date, due_date, amount_due, amount_paid, payment_method, late_payment_count
) VALUES
-- Pierre Dupont (Loyal direct debit payor)
('INV-2001', 'CUST-001', 'POL-001A', 'PAID', '2025-01-01', '2025-01-15', 1200.00, 1200.00, 'DIRECT_DEBIT', 0),
('INV-2002', 'CUST-001', 'POL-001B', 'PAID', '2025-04-12', '2025-04-27', 2400.00, 2400.00, 'DIRECT_DEBIT', 0),
-- Espace Logistics (Wire transfer billing cycle)
('INV-2003', 'CUST-003', 'POL-003A', 'PAID', '2025-03-01', '2025-03-31', 45000.00, 45000.00, 'WIRE_TRANSFER', 0),
('INV-2004', 'CUST-003', 'POL-003B', 'PAID', '2025-03-01', '2025-03-31', 28000.00, 28000.00, 'WIRE_TRANSFER', 0),
-- Churn risk check: Customer CUST-005 late payment pattern
('INV-2005', 'CUST-005', 'POL-005A', 'PAST_DUE', '2024-12-15', '2024-12-30', 1100.00, 0.00, 'CREDIT_CARD', 3),
-- Durand Bakery
('INV-2006', 'CUST-009', 'POL-009A', 'PAID', '2025-02-14', '2025-02-28', 4500.00, 4500.00, 'DIRECT_DEBIT', 0),
-- CUST-028 (High churn risk, unpaid indicators)
('INV-2007', 'CUST-028', 'POL-028A', 'PAST_DUE', '2025-04-01', '2025-04-15', 950.00, 0.00, 'CREDIT_CARD', 2),
-- Metallurgie du Rhone
('INV-2008', 'CUST-053', 'POL-053A', 'PAID', '2025-09-10', '2025-10-10', 68000.00, 68000.00, 'WIRE_TRANSFER', 0);

-- Digital footprints, login histories, and customer support transcripts.
-- Ensures a 20-year client like Espace Logistics (CUST-003) is recognized instantly as priority.
INSERT INTO `customer_360_v1.interactions` (
  interaction_id, customer_id, interaction_timestamp, interaction_channel, interaction_purpose, sentiment_score, notes, device_type
) VALUES
-- CUST-003 (Preventing "treating a 20-year client like a stranger" during a sudden support call)
('INT-5001', 'CUST-003', '2026-05-18 09:15:00 UTC', 'INBOUND_CALL', 'CLAIMS_UPDATE', 0.85, 'Spoke with Director of Operations regarding ongoing commercial property adjustments. Instantly flagged as 20-Year Institutional VIP Client. Customer expressed deep satisfaction with the designated relationship manager Antoine.', 'NONE'),
('INT-5002', 'CUST-003', '2026-05-10 14:22:11 UTC', 'WEBSITE_PORTAL', 'POLICY_ADDITION', 0.90, 'User logged into the corporate account portal. Evaluated marine cargo risk profiles. Potential cross-sell expansion detected.', 'DESKTOP'),

-- CUST-001 (HNW Digital Engagement)
('INT-5003', 'CUST-001', '2026-04-20 16:30:00 UTC', 'MOBILE_APP', 'RENEWAL_QUERIES', 0.50, 'Explored auto renewal coverage options in mobile app interface.', 'iOS'),

-- CUST-005 (At Risk of Churn - Frustrated Touchpoint)
('INT-5004', 'CUST-005', '2025-01-10 11:05:12 UTC', 'INBOUND_CALL', 'COMPLAINT', -0.80, 'Customer called in extremely upset regarding premium escalation on legacy auto coverage. Rep missed opportunity to apply loyalty credits.', 'NONE'),

-- CUST-009 (SME Winery seeking advice)
('INT-5005', 'CUST-009', '2026-05-15 08:44:00 UTC', 'EMAIL', 'RENEWAL_QUERIES', 0.70, 'Emailed regarding commercial package cross-sell quote for a secondary storage facility.', 'DESKTOP');