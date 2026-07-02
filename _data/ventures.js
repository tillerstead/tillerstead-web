// Tillerstead Ventures - Data Backend for Investor Portal
// Central data source for all venture projects and metrics

const venturesData = {
  // Overall venture statistics
  stats: {
    activeProjects: 12,
    totalInvestment: 1200000,
    averageROI: 23.5,
    activePartnerships: 28,
    lastUpdated: '2026-01-23',
  },

  // Active investment projects
  projects: [
    {
      id: 'ocean-county-flip',
      category: 'real-estate',
      title: 'Ocean County Multi-Unit Flip',
      description:
        '3-unit property renovation - 6 bathrooms total, premium finishes for resale market',
      investment: 180000,
      projectedROI: 28,
      timeline: 90,
      status: 'in-progress',
      progress: 45,
      location: 'Ocean County, NJ',
      details: {
        units: 3,
        bathrooms: 6,
        squareFeet: 3200,
        purchasePrice: 450000,
        renovationBudget: 180000,
        projectedSale: 750000,
        profitTarget: 120000,
        materialCosts: 65000,
        laborCosts: 85000,
        contingency: 30000,
      },
      milestones: [
        { name: 'Property Acquisition', date: '2025-12-15', status: 'complete' },
        { name: 'Demo & Framing', date: '2026-01-05', status: 'complete' },
        { name: 'Plumbing & Electrical', date: '2026-01-20', status: 'in-progress' },
        { name: 'Tile Installation', date: '2026-02-01', status: 'pending' },
        { name: 'Final Finishes', date: '2026-02-15', status: 'pending' },
        { name: 'Listing', date: '2026-03-01', status: 'pending' },
      ],
    },
    {
      id: 'spring-apprenticeship',
      category: 'academy',
      title: 'Spring 2026 Apprenticeship Program',
      description: '8-week intensive tile installation certification - 12 students enrolled',
      investment: 15000,
      revenue: 36000,
      profitMargin: 42,
      timeline: 8,
      status: 'enrolling',
      progress: 75,
      details: {
        students: 12,
        maxCapacity: 15,
        tuitionPerStudent: 3000,
        instructorCost: 12000,
        materialCost: 4000,
        facilityCost: 2000,
        marketingCost: 3000,
        netProfit: 15000,
      },
      curriculum: [
        'Surface Preparation & Layout',
        'Thinset Mixing & Application',
        'Large Format Tile Installation',
        'Shower Pan Construction',
        'Waterproofing Systems',
        'Heated Floor Installation',
        'Natural Stone Techniques',
        'Final Certification Exam',
      ],
    },
    {
      id: 'supplier-network',
      category: 'trade-partners',
      title: 'Premium Supplier Network Expansion',
      description:
        'Onboarding 5 new tile suppliers to referral network - quarterly revenue share model',
      investment: 12000,
      annualRevenue: 84000,
      paybackPeriod: 2,
      status: 'planning',
      progress: 20,
      details: {
        suppliersTarget: 5,
        suppliersOnboarded: 1,
        averageCommission: 8,
        projectedReferrals: 180,
        averageOrderValue: 5800,
        setupCostPerSupplier: 2400,
        monthlyMaintenance: 800,
      },
      suppliers: [
        {
          name: 'Premium Tile & Stone Co.',
          location: 'Toms River, NJ',
          status: 'active',
          productsOffered: ['Porcelain', 'Natural Stone', 'Glass Tile'],
          commissionRate: 8,
          referralsSent: 24,
        },
        {
          name: 'Atlantic Marble & Granite',
          location: 'Atlantic City, NJ',
          status: 'onboarding',
          productsOffered: ['Marble', 'Granite', 'Quartz'],
          commissionRate: 10,
          referralsSent: 0,
        },
      ],
    },
    {
      id: 'tech-investment-project-mgmt',
      category: 'tech',
      title: 'Construction Project Management Software',
      description: 'Investment in contractor scheduling and project tracking SaaS platform',
      investment: 250000,
      equityStake: 15,
      projectedValuation: 3000000,
      status: 'active',
      progress: 60,
      details: {
        company: 'BuildTrack Solutions',
        founded: 2024,
        employees: 8,
        currentMRR: 28000,
        targetMRR: 100000,
        customerCount: 140,
        churnRate: 4.2,
        averageContractValue: 200,
      },
    },
    {
      id: 'sei-mvp-development',
      category: 'tech',
      title: 'SweatEquity Insurance (SEI) MVP',
      description:
        'Safe-driver rewarded auto insurance model with transparent fund allocation and compliance-first architecture',
      investment: 150000,
      equityStake: 100,
      projectedValuation: 5000000,
      status: 'in-progress',
      progress: 35,
      details: {
        product: 'SweatEquity Insurance',
        founded: 2026,
        employees: 3,
        developmentStage: 'MVP Beta',
        targetLaunch: 'Q4 2026',
        pilotState: 'NJ',
        betaMembers: 0,
        targetBetaMembers: 500,
        techStack: 'Next.js, FastAPI, PostgreSQL, Redis',
        complianceStatus: 'Pre-filing',
        ipProtection: 'Proprietary algorithms server-side only',
      },
      milestones: [
        { name: 'MVP Core Features', date: '2026-03-01', status: 'in-progress' },
        { name: 'Actuarial Modeling', date: '2026-06-01', status: 'pending' },
        { name: 'State Regulatory Filing', date: '2026-09-01', status: 'pending' },
        { name: 'Beta Launch (NJ)', date: '2026-12-01', status: 'pending' },
      ],
    },
  ],

  // Real Estate Partnership Calculator Data
  realEstateDefaults: {
    purchasePricePerUnit: 150000,
    bathroomsPerUnit: 2,
    materialCostPerBathroom: 8000,
    laborCostPerBathroom: 6000,
    contingencyPercent: 15,
    closingCostPercent: 3,
    realtorCommissionPercent: 6,
    holdingCostsMonthly: 2000,
    expectedAppreciationPercent: 25,
    timelineMonths: 3,
  },

  // Academy Revenue Calculator Data
  academyDefaults: {
    studentsPerClass: 12,
    tuitionPerStudent: 3000,
    classesPerYear: 4,
    instructorCostPerClass: 12000,
    materialCostPerClass: 4000,
    facilityCostPerClass: 2000,
    marketingCostPerClass: 3000,
    adminOverheadPercent: 10,
  },

  // Partnership Structure Calculator Data
  partnershipDefaults: {
    totalInvestment: 100000,
    equitySplit: { investor: 60, operator: 40 },
    managementFeePercent: 5,
    profitThreshold: 10000,
    carriedInterestPercent: 20,
    vestingPeriodMonths: 12,
  },

  // Historical Performance Data
  historicalROI: [
    { quarter: 'Q1 2025', roi: 18.2 },
    { quarter: 'Q2 2025', roi: 21.5 },
    { quarter: 'Q3 2025', roi: 24.8 },
    { quarter: 'Q4 2025', roi: 23.5 },
  ],

  // Partner Network
  partners: [
    {
      id: 'partner-001',
      name: 'Coastal Properties LLC',
      type: 'Real Estate Developer',
      projectsCompleted: 8,
      totalInvestment: 620000,
      averageROI: 26.4,
      status: 'active',
      joinedDate: '2024-06-15',
    },
    {
      id: 'partner-002',
      name: 'Jersey Shore Contractors Association',
      type: 'Trade Organization',
      referralsSent: 42,
      revenueGenerated: 156000,
      commissionPaid: 12480,
      status: 'active',
      joinedDate: '2024-09-01',
    },
    {
      id: 'partner-003',
      name: 'BuildSmart Training Institute',
      type: 'Education Partner',
      studentsReferred: 28,
      coMarketingValue: 18000,
      status: 'active',
      joinedDate: '2025-01-10',
    },
  ],

  // Document Library
  documents: [
    {
      title: 'Partnership Agreement Template',
      category: 'Legal',
      url: '/ventures/docs/partnership-agreement.pdf',
      updated: '2026-01-15',
      size: '2.4 MB',
    },
    {
      title: 'Q4 2025 Investor Report',
      category: 'Financial',
      url: '/ventures/docs/q4-2025-report.pdf',
      updated: '2026-01-08',
      size: '1.8 MB',
    },
    {
      title: 'Due Diligence Checklist',
      category: 'Onboarding',
      url: '/ventures/docs/due-diligence.pdf',
      updated: '2025-12-20',
      size: '850 KB',
    },
    {
      title: 'Real Estate Investment Guide',
      category: 'Education',
      url: '/ventures/docs/real-estate-guide.pdf',
      updated: '2025-11-30',
      size: '3.2 MB',
    },
    {
      title: 'Academy Curriculum Overview',
      category: 'Academy',
      url: '/ventures/docs/academy-curriculum.pdf',
      updated: '2026-01-05',
      size: '1.5 MB',
    },
  ],

  // Contact Preferences for Ventures
  contactInfo: {
    venturesEmail: 'ventures@tillerstead.com',
    investorRelations: 'investors@tillerstead.com',
    partnershipInquiries: 'partnerships@tillerstead.com',
    academyInfo: 'academy@tillerstead.com',
    phone: '(732) 555-TILE',
    officeHours: 'Monday-Friday 9am-5pm EST',
  },
};

// Export for use in calculator tools and investor portal
if (typeof module !== 'undefined' && module.exports) {
  module.exports = venturesData;
}
