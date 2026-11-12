export interface DQMPrincipleCounts {
  Accuracy: number;
  Consistency: number;
  Completeness: number;
  Timeliness: number;
  Reliability: number;
  Relevance: number;
}

export interface AuditSummary {
  totalRecords: number;
  totalFields: number;
  issueEvents: number;
  uniqueAffectedRecords: number;
  affectedRecordsPercent: number;
  consistencyPatternsCount: number;
  duplicateRowsCount: number;
  categoryCounts: Record<string, number>;
  dqmCounts: DQMPrincipleCounts;
}

export interface ErrorLogItem {
  id: string;
  rowNumber: number;
  rowIndex: number;
  fieldName: string;
  originalValue: string;
  issueCategory: string;
  primaryPrinciple: string;
  dqmPrinciples: string[];
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  autoFixable: boolean;
  suggestedAction: string;
}

export interface ReviewQueueItem {
  id: string;
  rowNumber: number;
  rowIndex?: number;
  field: string;
  currentValue: string;
  category: string;
  primaryPrinciple: string;
  dqmPrinciples?: string[];
  severity: string;
  reasonForReview: string;
  suggestedNextAction: string;
  status: 'Pending' | 'Reviewed' | 'Approved' | 'Rejected';
  notes?: string;
  manualValue?: string;
  reviewedAt?: string;
}

export interface GovernanceRule {
  id: string;
  rule_name: string;
  rule_description: string;
  dqm_principle: string;
  enforcement_level: 'Mandatory' | 'Advisory';
  is_active: boolean;
  created_at: string;
}

export interface ChangelogItem {
  rowNumber: number;
  field: string;
  originalValue: string;
  newValue: string;
  rule: string;
  type: string;
}

export interface AuditSession {
  id: string;
  fileName: string;
  uploadedAt: string;
  summary: AuditSummary;
  status: string;
  errorLog?: ErrorLogItem[];
  baseline?: Record<string, any>;
}

export interface ComparisonData {
  originalIssueEvents: number;
  newIssueEvents: number;
  issueEventsResolved: number;
  originalAffectedRecords: number;
  newAffectedRecords: number;
  affectedRecordsResolved: number;
  percentReduction: number;
  newCategories: Record<string, number>;
  newDqm: DQMPrincipleCounts;
}

