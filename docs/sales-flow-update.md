# Product Requirements Document: Discovery Call Framework & A/B Close Model

**Document Version:** 1.0  
**Date:** August 28, 2025  
**Owner:** Christian Cabaluna  
**Stakeholders:** Burkhard Berger (CEO)

---

## 1. Executive Summary

### 1.1 Objective
Implement a new discovery call framework with mandatory $500 activation fee and A/B close structure (Permanent Hire vs Flexible Talent) to solve the core business problem of $0 invoiced revenue despite $73,250 in signed contracts.

### 1.2 Key Changes
- **Current State:** $0 activation fee, single placement model (25%), 4.5% conversion rate
- **Target State:** $500 refundable activation fee, dual service models, improved conversion through commitment psychology

### 1.3 Expected Impact
- **Week 1:** 5+ activation fees ($2,500+ immediate revenue)
- **Month 1:** $10,000+ monthly revenue target
- **Operational:** Reduced ghosting, priority client focus, sustainable cash flow

---

## 2. Background & Context

### 2.1 Current Business Situation (Facts)
- **Financial Status:** -$2,349 monthly burn, 90-day runway, $7,000 cash
- **Performance Metrics:** 176 leads over 8 months, 8 placements (4.5% conversion vs 15-25% industry standard)
- **Revenue Problem:** $73,250 in signed contracts, $0 invoiced
- **Operational Load:** Christian at 60 hrs/week across US, Australia, Europe time zones

### 2.2 Root Cause Analysis (CEO Findings)
**Primary Problem (70% priority):** Zero upfront fee model
- 50%+ of clients work with multiple recruiters charging deposits
- Clients pay Genius fee PLUS lose sunk costs to competitors
- Results in psychological lock-in disadvantage

**Secondary Problem (30% priority):** Missing market segment
- Clients wanting 3-6 month flexibility vs 12-month permanent commitments
- Current model only serves permanent placements

### 2.3 Strategic Imperative
- **Timeline:** 90-day proof of concept deadline
- **Target:** $10K monthly revenue minimum
- **Philosophy:** Lean execution over complex planning
- **Approach:** Filtering leads is beneficial, not detrimental

---

## 3. Problem Statement

### 3.1 Core Issues
1. **Cash Flow Crisis:** Despite quality delivery, zero revenue conversion due to no commitment mechanism
2. **Competitive Disadvantage:** Free model creates double-payment psychology for clients
3. **Market Gap:** No flexibility option for short-term or pilot hiring needs
4. **Operational Unsustainability:** Single-person bottleneck serving non-paying prospects

### 3.2 Success Criteria
- Transform from "hope-based" to "commitment-based" business model
- Generate immediate cash flow through activation fees
- Reduce operational waste on non-serious prospects
- Create sustainable revenue pipeline within 60 days

---

## 4. Solution Overview

### 4.1 Core Solution Components
1. **Mandatory $500 Activation Fee** - refundable but practically non-refundable
2. **A/B Service Structure** - Permanent Hire vs Flexible Talent options
3. **Updated Discovery Call Script** - integrated with slide presentation
4. **Risk-Free Positioning** - maintains client confidence while requiring commitment

### 4.2 Service Model Details

#### Option A: Permanent Hire
- **Activation Fee:** $500 (credited toward placement)
- **Placement Fee:** 25% of first-year salary (vs industry 35%)
- **Guarantee:** 6-month replacement
- **Client Relationship:** Direct employment, client manages payroll/compliance
- **Ongoing Support:** Setup assistance, then independent relationship

#### Option B: Flexible Talent (Recommended)
- **Activation Fee:** $500 (credited toward first month)
- **Monthly Fees:** $1,000 (under $3K salary), $1,500 ($3K-6K), $2,000 (over $6K)
- **Guarantee:** Unlimited replacements during contract
- **Client Relationship:** Genius manages payroll, compliance, ongoing support
- **Buyout Option:** 20% of first-year salary for permanent conversion

---

## 5. Functional Requirements

### 5.1 Discovery Call Script Requirements
- **FR-001:** Must present candidates first, then transition to service options
- **FR-002:** Must include bridge statements between each slide presentation
- **FR-003:** Must explain line-by-line comparison of both service options
- **FR-004:** Must position activation fee as risk-free with 3-candidate guarantee
- **FR-005:** Must avoid mentioning 3-round endorsement process in verbal presentation

### 5.2 Slide Presentation Requirements
- **FR-006:** Slide 2: Candidate presentation with quality positioning
- **FR-007:** Slide 3: The Genius Advantage (6 benefits overview)
- **FR-008:** Slide 4: Cost savings comparison
- **FR-009:** Slide 5: Hiring process with vetting statistics (250-300 candidates)
- **FR-010:** Slide 6: Next steps including Dream Candidate Profile explanation
- **FR-011:** Slide 7: On-the-ground sourcing with CEO credibility
- **FR-012:** Slide 8: Try Risk-Free Hiring pricing table with A/B options
- **FR-013:** Final slide: Thank you with decision return to pricing table

### 5.3 Pricing & Payment Requirements
- **FR-014:** $500 activation fee required for all new clients
- **FR-015:** Stripe payment integration with updated descriptions for both options
- **FR-016:** Credit activation fee toward placement fee (Option A) or first month (Option B)
- **FR-017:** Refund only if 3 qualified candidates not delivered ("great fit" standard)

### 5.4 Service Delivery Requirements
- **FR-018:** 7-10 day candidate delivery timeline (happy path messaging)
- **FR-019:** Dream Candidate Profile creation based on form submission + discovery call
- **FR-020:** Video introductions and assessments for all presented candidates
- **FR-021:** Priority service for paid clients over unpaid prospects

---

## 6. Non-Functional Requirements

### 6.1 Performance Requirements
- **NFR-001:** Discovery call duration: 20 minutes maximum
- **NFR-002:** Slide transitions must be smooth with natural bridge statements
- **NFR-003:** Payment collection within 48 hours of call completion

### 6.2 User Experience Requirements
- **NFR-004:** Professional presentation flow with logical progression
- **NFR-005:** Clear value differentiation between service options
- **NFR-006:** Risk-free messaging maintains client confidence

### 6.3 Operational Requirements
- **NFR-007:** Script must be immediately executable without additional preparation
- **NFR-008:** Process must reduce Christian's workload through client filtering
- **NFR-009:** System must prioritize paid clients automatically

---

## 7. User Stories & Acceptance Criteria

### 7.1 As a Prospect
**US-001:** As a qualified prospect, I want to understand both service options clearly so I can choose the best fit for my needs.
- **AC:** Both options are explained line-by-line with specific benefits
- **AC:** Pricing is transparent and clearly differentiated
- **AC:** Risk-free guarantee is clearly communicated

**US-002:** As a prospect, I want to feel confident about the activation fee so I don't perceive it as a scam.
- **AC:** Activation fee is positioned as protective, not punitive
- **AC:** Credit mechanism is clearly explained
- **AC:** Refund conditions are specific and achievable

### 7.2 As Christian (Sales Rep)
**US-003:** As the sales rep, I want a structured script so I can deliver consistent presentations.
- **AC:** Script provides exact language for each section
- **AC:** Bridge statements are natural and smooth
- **AC:** Objection handling is integrated

**US-004:** As the sales rep, I want to filter serious clients so I can focus on paying prospects.
- **AC:** Activation fee requirement filters unqualified leads
- **AC:** Payment confirmation triggers priority status
- **AC:** Non-paying prospects can be politely deferred

### 7.3 As Burkhard (CEO)
**US-005:** As the CEO, I want immediate cash flow generation to validate the business model.
- **AC:** Activation fees generate revenue within Week 1
- **AC:** Monthly recurring revenue increases through Option B
- **AC:** Business becomes cash flow positive within 30 days

---

## 8. Technical Specifications

### 8.1 Payment Processing
- **Platform:** Existing Stripe account
- **Payment Links:** Three tiers ($500, $750, $1000) for flexibility
- **Integration:** Manual payment tracking in current CRM
- **Receipts:** Automated email confirmations

### 8.2 CRM Configuration
- **Pipeline Stages:** Updated to include activation status
- **Custom Fields:** Activation amount, payment date, option selected
- **Automation:** Priority flagging for paid clients
- **Tracking:** Conversion rates by activation amount

### 8.3 Presentation Materials
- **Format:** PDF slide deck for screen sharing
- **Content:** Updated with new pricing table and messaging
- **Delivery:** Email follow-up with activation links

---

## 9. Implementation Plan

### 9.1 Phase 1: Immediate Launch (Week 1)
- **Day 1:** Update discovery call script and slide deck
- **Day 2:** Configure Stripe payment links and CRM stages
- **Day 3:** First prospect calls with new model
- **Day 4-5:** Iterate based on initial feedback
- **Week 1 Target:** 5 activation fees collected

### 9.2 Phase 2: Optimization (Week 2-4)
- **Week 2:** Analyze conversion data and refine messaging
- **Week 3:** Implement A/B testing on activation amounts
- **Week 4:** Scale successful approaches
- **Month 1 Target:** $10,000 in activation revenue

### 9.3 Phase 3: Scale (Month 2+)
- **Hire additional support to handle increased paid client load
- **Implement automated systems for Option B service delivery
- **Develop advanced tracking and analytics

---

## 10. Success Metrics

### 10.1 Primary KPIs
- **Activation Rate:** % of qualified leads who pay activation fee (Target: 30%+)
- **Revenue Generation:** Monthly activation fee revenue (Target: $10K Month 1)
- **Option Distribution:** Split between Option A vs Option B selection
- **Refund Rate:** % of activation fees refunded (Target: <5%)

### 10.2 Secondary KPIs
- **Conversion Time:** Lead to activation payment (Target: <48 hours)
- **Client Quality:** Engagement level of paid vs unpaid prospects
- **Operational Efficiency:** Hours spent per paying client vs previous model
- **Pipeline Health:** Weighted value of activated vs non-activated prospects

### 10.3 Business Health Indicators
- **Cash Flow:** Monthly recurring revenue from both service models
- **Client Retention:** Option B client duration and buyout rates  
- **Placement Success:** Final hiring rates for activated clients
- **Operational Sustainability:** Christian's weekly hours and stress levels

---

## 11. Assumptions

### 11.1 Market Assumptions
- **A-001:** US clients will pay $500 activation fee to offshore recruiter
- **A-002:** 30% of qualified leads will convert to activated status
- **A-003:** Option B will be more popular due to flexibility positioning
- **A-004:** Refund rate will remain below 5% with proper qualification

### 11.2 Operational Assumptions
- **A-005:** Christian can manage 10 activated clients simultaneously
- **A-006:** 7-10 day timeline remains achievable with higher client quality
- **A-007:** Current vetting process delivers "great fit" candidates consistently
- **A-008:** Client ghosting will reduce significantly with financial commitment

### 11.3 Financial Assumptions
- **A-009:** Activation fees will generate sufficient cash flow for operations
- **A-010:** Option B monthly revenue will exceed placement fee revenue long-term
- **A-011:** Reduced client volume will not impact overall revenue negatively
- **A-012:** Premium positioning will attract higher-budget clients

### 11.4 Technical Assumptions
- **A-013:** Current Stripe and CRM infrastructure can handle new workflow
- **A-014:** Manual processes can scale until automation is implemented
- **A-015:** Slide presentation format will remain effective via video calls
- **A-016:** Email follow-up process will maintain conversion momentum

---

## 12. Risks & Mitigation Strategies

### 12.1 High-Risk Scenarios
**R-001: Market Rejection of Activation Fee**
- **Risk:** Zero conversions in Week 1
- **Mitigation:** Reduce to $250-350 and test with next 5 leads
- **Contingency:** Return to $0 model with lessons learned

**R-002: Christian Operational Overload**
- **Risk:** Cannot handle even filtered client load
- **Mitigation:** Hire VA/junior recruiter by Week 2
- **Contingency:** Pause new sales until help is hired

**R-003: High Refund Rate**
- **Risk:** >20% refund requests undermine cash flow
- **Mitigation:** Strengthen 3-candidate delivery guarantee
- **Contingency:** Modify refund terms to be more restrictive

### 12.2 Medium-Risk Scenarios
**R-004: Option Distribution Imbalance**
- **Risk:** Everyone chooses Option A, no recurring revenue
- **Mitigation:** Strengthen Option B positioning and benefits
- **Contingency:** Adjust pricing to favor Option B selection

**R-005: Time Zone Coverage Issues**
- **Risk:** Cannot service global client base effectively
- **Mitigation:** Set clear response time expectations (24 hours)
- **Contingency:** Focus on single geographic market initially

---

## 13. Dependencies

### 13.1 Internal Dependencies
- **D-001:** Christian's availability for script execution and client management
- **D-002:** Burkhard's approval for pricing and service model details
- **D-003:** Current CRM and Stripe accounts functioning properly
- **D-004:** Existing slide deck and presentation infrastructure

### 13.2 External Dependencies
- **D-005:** Client market acceptance of activation fee model
- **D-006:** Stripe payment processing reliability
- **D-007:** Lead generation pipeline continuing to generate qualified prospects
- **D-008:** Competitive landscape not shifting dramatically during implementation

### 13.3 Resource Dependencies
- **D-009:** No additional development resources required for Phase 1
- **D-010:** Existing talent pool can deliver quality candidates on timeline
- **D-011:** Current sourcing network can support increased client commitment levels
- **D-012:** Email and communication infrastructure can handle follow-up requirements

---

## 14. Acceptance Criteria

### 14.1 Launch Readiness
- [ ] Discovery call script updated with all required elements
- [ ] Slide deck reflects new pricing and service models
- [ ] Stripe payment links configured and tested
- [ ] CRM pipeline stages updated and functional
- [ ] First prospect call scheduled with new model

### 14.2 Week 1 Success Criteria
- [ ] Minimum 5 activation fees collected
- [ ] $2,500+ immediate revenue generated
- [ ] Both service options selected by at least one client each
- [ ] Zero technical payment failures
- [ ] All client objections documented for iteration

### 14.3 Month 1 Success Criteria
- [ ] $10,000+ total revenue from activation fees
- [ ] 20+ activated clients in pipeline
- [ ] <5% refund rate maintained
- [ ] Sustainable operational workflow established
- [ ] Business cash flow positive

---

**Document Status:** Ready for Implementation  
**Next Review:** Week 1 results analysis  
**Approval Required:** Burkhard Berger (CEO)