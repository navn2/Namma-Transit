
# NAMMA TRANSIT ENTERPRISE MASTER SPECIFICATION
## Authoritative Product, Architecture, Migration, AI, Data and Transformation Blueprint
### Successor Platform to EcoLens

Version: 1.0
Status: Master Reference
Audience: Founders, Engineers, Designers, AI Coding Agents, Antigravity

---

# EXECUTIVE DIRECTIVE

This document is the authoritative blueprint for transforming EcoLens into NAMMA TRANSIT.

NAMMA TRANSIT shall be treated as a civic mobility intelligence platform whose primary objective is restoring trust in public transportation through predictive intelligence, crowdsourced telemetry, adaptive routing, and equitable access.

The system must preserve reusable engineering assets from EcoLens while replacing environmental intelligence with transit reliability intelligence.

---

# PART I — STRATEGIC FOUNDATION

## Mission

Restore trust in public transportation.

## Vision

Create the operating intelligence layer for urban transit systems.

## Core Outcome

A commuter should know:

- whether the vehicle will arrive
- whether the transfer will succeed
- whether a delay is expected
- whether a better alternative exists

before beginning a trip.

---

# Problem Statement

Current transit applications answer:

"Where is my vehicle?"

NAMMA TRANSIT answers:

"Can I trust this journey?"

Major challenges:

1. GPS Blind Spots
2. Fragmented Agencies
3. Missed Transfers
4. Poor Last-Mile Connectivity
5. Information Inequality
6. Low Confidence in Transit Systems

---

# Success Metrics

TRS Accuracy > 85%

Prediction Latency < 2s

Blind Spot Coverage Improvement > 60%

Connection Failure Reduction > 40%

Crowd Verification Accuracy > 90%

Monthly Active User Retention > 50%

---

# PART II — ECOLENS MIGRATION STRATEGY

## Preserve

Backend:
- FastAPI
- PostgreSQL
- PostGIS
- Redis
- Authentication
- Notifications
- Trip Infrastructure

Engineering:
- Deployment Pipelines
- Analytics Frameworks
- User Management

## Remove

- PM2.5
- Carbon Layers
- NDVI
- Heat Maps
- Noise Layers
- Exposure Analytics
- Environmental Forecasting
- Insurance Integrations
- Emission Detection

## Replace

EcoScore -> TRS

Environmental Segments -> Transit Segments

Exposure Dashboard -> Confidence Dashboard

Environmental Forecasts -> Reliability Forecasts

---

# PART III — PRODUCT MODULES

## Module 1: LiveMap Engine

Responsibilities:

- Unified transit visualization
- Vehicle tracking
- Route visualization
- Transfer indicators
- Delay visualization
- Crowd visualization

Supported Networks:

- MTC
- Chennai Metro
- Suburban Rail

Key UI Elements:

- Vehicle markers
- Route paths
- Reliability overlays
- Transfer confidence badges

---

## Module 2: Reliability Intelligence Engine

Purpose:

Predict transit confidence.

Output:

Trip Reliability Score (TRS)

Range:

0–100

Bands:

90–100 Exceptional

80–89 Reliable

60–79 Moderate

40–59 Risk

0–39 Avoid

Feature Categories:

Historical:
- route delays
- adherence patterns
- average congestion

Realtime:
- traffic
- weather
- GPS confidence
- crowd reports

Contextual:
- weekday
- holidays
- festivals
- peak hours

Model Stack:

Primary:
- XGBoost

Secondary:
- Delay Forecasting
- Transfer Risk Estimation
- Congestion Prediction

Retraining:

Weekly automated retraining.

---

## Module 3: Crowd Pulse Network

Objective:

Transform passengers into anonymous telemetry nodes.

Pipeline:

Sensor Capture
-> Motion Analysis
-> Route Matching
-> Verification
-> Confidence Scoring
-> Upload

Signals:

GPS
Accelerometer
Gyroscope
Stop Sequences

Outputs:

Verified route telemetry.

---

## Module 4: Adaptive Last-Mile Protection

Purpose:

Prevent missed connections.

Workflow:

Delay Detected
-> Transfer Risk Calculation
-> Alternative Search
-> User Alert
-> Confirmation

Supported Transfers:

Bus -> Metro

Bus -> Train

Metro -> Bus

Metro -> Train

Train -> Metro

---

## Module 5: Equity Infrastructure

Channels:

Mobile App

SMS

USSD

IVR

Offline Mode

Objectives:

Accessibility

Low-data operation

Tamil-first experience

Digital inclusion

---

# PART IV — USER FLOWS

## Journey Planning

Launch

Search

Compare Routes

View TRS

Select Route

Begin Journey

Receive Alerts

Complete Journey

---

## Crowd Contribution

Passive Tracking

Verification

Reward Assignment

Upload

---

## IVR Flow

Call

Speak Stop Name

Resolve Location

Return Vehicle Information

---

# PART V — REWARDS ECONOMY

## Yatri Points

Verified Trip:
5

Verified Crowd Report:
10

High Confidence Telemetry:
2

Daily Streak:
5

Weekly Streak:
25

---

## Redemption

500 Points = ₹50

Metro Rewards

Transit Coupons

Partner Benefits

---

## Fraud Prevention

GPS Validation

Speed Validation

Duplicate Detection

Device Trust Score

Route Consistency Checks

---

# PART VI — DATA ARCHITECTURE

## Database Stack

PostgreSQL

PostGIS

Redis

Kafka

---

## Core Tables

users

vehicles

routes

transit_segments

crowd_reports

telemetry_events

reliability_predictions

reward_transactions

ivr_requests

sms_subscriptions

alerts

---

## Sample Users Schema

Fields:

user_id

phone_number

language

reward_balance

trust_score

created_at

---

## Vehicle Schema

vehicle_id

route_id

vehicle_type

current_position

confidence_score

last_seen

---

# PART VII — API ARCHITECTURE

## Route Planning

GET /routes/plan

Response:

route
duration
fare
TRS
transfers

---

## Live Vehicles

GET /vehicles/live

---

## Reliability

GET /reliability/trs

---

## Crowd Reporting

POST /crowd/report

---

## Rewards

POST /rewards/redeem

---

## Voice

GET /voice/lookup

---

## Alerts

POST /alerts/subscribe

---

# PART VIII — REALTIME ARCHITECTURE

Frontend

-> WebSocket Gateway

-> Event Router

-> Redis Streams

-> Clients

Events:

vehicle_update

delay_update

trs_update

alert_triggered

reward_earned

---

# PART IX — SECURITY

Principles:

Privacy by Design

Consent First

Encryption Everywhere

No Public User Tracking

No Identity Exposure

Controls:

TLS

JWT

Rate Limiting

Audit Logs

Encryption At Rest

---

# PART X — ADMIN PORTALS

## Municipal Dashboard

Heatmaps

Congestion

Reliability Trends

Transfer Risk Zones

Passenger Flow

## Corporate Dashboard

Shift Planning

Employee Commute Reliability

Transit Adoption Metrics

---

# PART XI — DESIGN SYSTEM

Name:

Strategic Cartographer

Typography:

Space Grotesk

Inter

JetBrains Mono

Principles:

Grid Based

Functional

Data Dense

Minimal Ornamentation

Civic Infrastructure Aesthetic

---

# PART XII — DEPLOYMENT

AWS Mumbai

Services:

ECS

RDS PostgreSQL

Redis

Kafka

CloudFront

S3

Monitoring:

Prometheus

Grafana

Centralized Logging

---

# PART XIII — ROADMAP

Phase 1

Chennai

Phase 2

Bengaluru

Hyderabad

Phase 3

Mumbai

Pune

Delhi

---

# FINAL TRANSFORMATION INSTRUCTIONS FOR ANTIGRAVITY

1. Preserve EcoLens engineering maturity.
2. Remove all environmental intelligence systems.
3. Introduce reliability intelligence systems.
4. Make TRS the primary metric.
5. Build Crowd Pulse as a core subsystem.
6. Build Equity Infrastructure as a core subsystem.
7. Prioritize trust over ETA.
8. Prioritize confidence over speed.
9. Design for municipal deployment.
10. Design for multi-city expansion.

This document supersedes all prior specifications and should be treated as the authoritative transformation blueprint.
