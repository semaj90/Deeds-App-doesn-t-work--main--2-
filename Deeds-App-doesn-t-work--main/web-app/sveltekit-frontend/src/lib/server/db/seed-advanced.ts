import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';

const databasePath = resolve('../../dev.db');
const sqlite = new Database(databasePath);
const db = drizzle(sqlite, { schema });

async function seedAdvancedData() {
  console.log('Seeding advanced features data...');
  
  const adminUserId = 'user_admin01';
  const regularUserId = 'user_regular01';
  
  // Create sample cases
  const case1Id = uuidv4();
  const case2Id = uuidv4();
  const case3Id = uuidv4();
  
  await db.insert(schema.cases).values([
    {
      id: case1Id,
      title: 'Financial Fraud Investigation',
      description: 'Investigation into a complex financial fraud scheme involving multiple corporations and individuals. The scheme appears to involve fraudulent invoicing, money laundering, and tax evasion.',
      createdBy: adminUserId,
      status: 'active',
      data: JSON.stringify({
        caseType: 'fraud',
        priority: 'high',
        state: 'under_review'
      }),
      tags: JSON.stringify(['fraud', 'financial', 'corporate', 'money-laundering']),
      dangerScore: 8
    },
    {
      id: case2Id,
      title: 'Cybercrime Network Takedown',
      description: 'Multi-jurisdictional operation to dismantle a cybercrime network engaged in ransomware attacks, data theft, and cryptocurrency fraud.',
      createdBy: adminUserId,
      status: 'active',
      data: JSON.stringify({
        caseType: 'cybercrime',
        priority: 'critical',
        state: 'active'
      }),
      tags: JSON.stringify(['cybercrime', 'ransomware', 'cryptocurrency', 'international']),
      dangerScore: 9
    },
    {
      id: case3Id,
      title: 'Environmental Crime - Illegal Dumping',
      description: 'Investigation into illegal dumping of hazardous waste by industrial companies. Environmental impact assessment shows significant contamination of local water sources.',
      createdBy: regularUserId,
      status: 'draft',
      data: JSON.stringify({
        caseType: 'environmental',
        priority: 'medium',
        state: 'draft'
      }),
      tags: JSON.stringify(['environmental', 'hazardous-waste', 'contamination', 'industrial']),
      dangerScore: 6
    }
  ]);
  
  // Create case events for the event store pattern
  await db.insert(schema.caseEvents).values([
    {
      id: uuidv4(),
      caseId: case1Id,
      eventType: 'created',
      eventData: JSON.stringify({ title: 'Financial Fraud Investigation', initialState: 'draft' }),
      newState: 'draft',
      userId: adminUserId,
      metadata: JSON.stringify({ source: 'initial_creation' }),
      timestamp: new Date()
    },
    {
      id: uuidv4(),
      caseId: case1Id,
      eventType: 'status_changed',
      eventData: JSON.stringify({ from: 'draft', to: 'under_review', reason: 'Evidence review completed' }),
      previousState: 'draft',
      newState: 'under_review',
      userId: adminUserId,
      metadata: JSON.stringify({ automatic: false }),
      timestamp: new Date()
    },
    {
      id: uuidv4(),
      caseId: case2Id,
      eventType: 'created',
      eventData: JSON.stringify({ title: 'Cybercrime Network Takedown', initialState: 'active' }),
      newState: 'active',
      userId: adminUserId,
      metadata: JSON.stringify({ source: 'urgent_case', priority: 'critical' }),
      timestamp: new Date()
    }
  ]);
  
  // Create case relationships to demonstrate AI-powered suggestions
  await db.insert(schema.caseRelationships).values([
    {
      id: uuidv4(),
      parentCaseId: case1Id,
      relatedCaseId: case2Id,
      relationshipType: 'related',
      confidence: 0.75,
      aiAnalysis: JSON.stringify({
        sharedEntities: ['financial institutions', 'cryptocurrency'],
        similarPatterns: ['complex schemes', 'multi-jurisdictional'],
        nlpConfidence: 0.75
      }),
      description: 'Both cases involve cryptocurrency and complex financial schemes',
      discoveredBy: 'nlp',
      createdBy: adminUserId
    }
  ]);
  
  // Create saved statements for auto-completion
  await db.insert(schema.savedStatements).values([
    {
      id: uuidv4(),
      title: 'Standard Opening Statement - Fraud Cases',
      content: 'The defendant is charged with conducting a sophisticated fraud scheme designed to deceive investors and financial institutions through the use of false representations and material omissions.',
      category: 'opening',
      tags: JSON.stringify(['fraud', 'financial', 'standard']),
      usageCount: 15,
      caseTypes: JSON.stringify(['fraud', 'financial']),
      isPublic: true,
      createdBy: adminUserId,
      lastUsed: new Date()
    },
    {
      id: uuidv4(),
      title: 'Evidence Chain of Custody Template',
      content: 'The evidence was collected on [DATE] by [OFFICER] at [LOCATION]. Chain of custody was maintained throughout the collection, transport, and analysis process. The evidence was stored in secure facilities and handled only by authorized personnel.',
      category: 'evidence_description',
      tags: JSON.stringify(['evidence', 'chain-of-custody', 'template']),
      usageCount: 23,
      caseTypes: JSON.stringify(['all']),
      isPublic: true,
      createdBy: adminUserId,
      lastUsed: new Date()
    },
    {
      id: uuidv4(),
      title: 'Cybercrime Technical Evidence',
      content: 'Digital forensic analysis revealed network intrusion artifacts, including malicious executables, command and control communications, and encrypted data exfiltration. The analysis was conducted using industry-standard forensic tools and methodologies.',
      category: 'evidence_description',
      tags: JSON.stringify(['cybercrime', 'digital-forensics', 'technical']),
      usageCount: 8,
      caseTypes: JSON.stringify(['cybercrime', 'fraud']),
      isPublic: true,
      createdBy: adminUserId,
      lastUsed: new Date()
    }
  ]);
  
  // Create case templates for enhanced forms
  await db.insert(schema.caseTemplates).values([
    {
      id: uuidv4(),
      name: 'Fraud Investigation Template',
      description: 'Standard template for financial fraud investigations including all required fields and common evidence types',
      caseType: 'fraud',
      template: JSON.stringify({
        title: '[CASE_TYPE] - [DEFENDANT_NAME]',
        description: 'Investigation into [FRAUD_TYPE] involving [PARTIES]. Estimated financial impact: [AMOUNT].',
        requiredFields: ['defendant_name', 'fraud_type', 'financial_impact', 'jurisdiction'],
        evidenceTypes: ['financial_records', 'communications', 'expert_analysis'],
        standardTags: ['fraud', 'financial']
      }),
      fields: JSON.stringify([
        { name: 'defendant_name', type: 'text', required: true, label: 'Defendant Name' },
        { name: 'fraud_type', type: 'select', required: true, label: 'Type of Fraud', options: ['ponzi', 'embezzlement', 'securities', 'tax'] },
        { name: 'financial_impact', type: 'number', required: true, label: 'Estimated Financial Impact ($)' },
        { name: 'jurisdiction', type: 'select', required: true, label: 'Primary Jurisdiction', options: ['federal', 'state', 'local'] }
      ]),
      usageCount: 12,
      isPublic: true,
      createdBy: adminUserId
    },
    {
      id: uuidv4(),
      name: 'Cybercrime Case Template',
      description: 'Template for cybercrime investigations including technical evidence requirements',
      caseType: 'cybercrime',
      template: JSON.stringify({
        title: 'Cybercrime Investigation - [ATTACK_TYPE]',
        description: '[ATTACK_TYPE] incident affecting [VICTIM_ORG]. Attack vector: [VECTOR]. Estimated impact: [IMPACT].',
        requiredFields: ['attack_type', 'victim_organization', 'attack_vector', 'technical_impact'],
        evidenceTypes: ['network_logs', 'malware_samples', 'digital_forensics', 'victim_statements'],
        standardTags: ['cybercrime', 'digital-evidence']
      }),
      fields: JSON.stringify([
        { name: 'attack_type', type: 'select', required: true, label: 'Attack Type', options: ['ransomware', 'data_breach', 'ddos', 'phishing'] },
        { name: 'victim_organization', type: 'text', required: true, label: 'Victim Organization' },
        { name: 'attack_vector', type: 'select', required: true, label: 'Attack Vector', options: ['email', 'web', 'network', 'physical'] },
        { name: 'technical_impact', type: 'textarea', required: true, label: 'Technical Impact Assessment' }
      ]),
      usageCount: 7,
      isPublic: true,
      createdBy: adminUserId
    }
  ]);
  
  // Create text fragments for demonstration of text movement feature
  await db.insert(schema.caseTextFragments).values([
    {
      id: uuidv4(),
      caseId: case1Id,
      fragmentType: 'evidence_note',
      content: 'Analysis of bank records shows suspicious transfer patterns between accounts held by the defendant and shell companies. Transfers occurred immediately before and after major business transactions.',
      position: 1,
      isActive: true,
      tags: JSON.stringify(['financial-analysis', 'bank-records', 'suspicious-activity']),
      createdBy: adminUserId
    },
    {
      id: uuidv4(),
      caseId: case1Id,
      fragmentType: 'legal_argument',
      content: 'The pattern of transactions demonstrates intent to defraud under 18 USC § 1341. The defendant\'s use of multiple shell companies and false documentation establishes the requisite elements of mail fraud.',
      position: 2,
      isActive: true,
      tags: JSON.stringify(['legal-theory', 'fraud-elements', '18-usc-1341']),
      createdBy: adminUserId
    }
  ]);
  
  // Create user preferences for the enhanced features
  await db.insert(schema.userPreferences).values([
    {
      id: uuidv4(),
      userId: adminUserId,
      preferenceType: 'auto_complete',
      preferences: JSON.stringify({
        enableSuggestions: true,
        maxSuggestions: 5,
        includeRecentCases: true,
        includeSavedStatements: true,
        enableNLPSuggestions: true
      })
    },
    {
      id: uuidv4(),
      userId: adminUserId,
      preferenceType: 'case_templates',
      preferences: JSON.stringify({
        defaultTemplate: 'fraud',
        autoApplyTemplates: true,
        showTemplateLibrary: true
      })
    },
    {
      id: uuidv4(),
      userId: adminUserId,
      preferenceType: 'nlp_settings',
      preferences: JSON.stringify({
        enableRelationshipDetection: true,
        autoSuggestSimilarCases: true,
        confidenceThreshold: 0.7,
        enableSemanticSearch: true
      })
    }
  ]);
  
  console.log('✅ Advanced features data seeded successfully!');
  console.log('Created:');
  console.log('- 3 sample cases with different types and priorities');
  console.log('- Case events demonstrating event store pattern');
  console.log('- Case relationships with AI analysis');
  console.log('- Saved statements for auto-completion');
  console.log('- Case templates for enhanced forms');
  console.log('- Text fragments for drag-and-drop functionality');
  console.log('- User preferences for personalization');
}

seedAdvancedData().catch(console.error);
