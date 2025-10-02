export interface FilterCondition {
  id: string;
  columnId: string;
  operator: FilterOperator;
  value: string;
}

export interface FilterGroup {
  id: string;
  type: 'and' | 'or';
  conditions: FilterCondition[];
  groups?: FilterGroup[];
}

export interface ViewFilters {
  type: 'and' | 'or';
  conditions: FilterCondition[];
  groups: FilterGroup[];
}

export interface SortConfig {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface ViewConfig {
  id: string;
  name: string;
  tableId: string;
  isDefault: boolean;
  filters?: ViewFilters;
  sorts?: SortConfig[];
  hiddenColumns?: string[];
}

export type FilterOperator = 
  | 'contains'
  | 'does_not_contain'
  | 'is'
  | 'is_not'
  | 'is_empty'
  | 'is_not_empty'
  | 'starts_with'
  | 'ends_with'
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'is_before'
  | 'is_after'
  | 'is_on_or_before'
  | 'is_on_or_after'
  | 'is_within'
  | 'is_exactly';

export const FILTER_OPERATORS: Record<FilterOperator, { label: string; requiresValue: boolean; supportedTypes: string[] }> = {
  contains: { label: 'contains', requiresValue: true, supportedTypes: ['text'] },
  does_not_contain: { label: 'does not contain', requiresValue: true, supportedTypes: ['text'] },
  is: { label: 'is', requiresValue: true, supportedTypes: ['text', 'select'] },
  is_not: { label: 'is not', requiresValue: true, supportedTypes: ['text', 'select'] },
  is_empty: { label: 'is empty', requiresValue: false, supportedTypes: ['text', 'number', 'date'] },
  is_not_empty: { label: 'is not empty', requiresValue: false, supportedTypes: ['text', 'number', 'date'] },
  starts_with: { label: 'starts with', requiresValue: true, supportedTypes: ['text'] },
  ends_with: { label: 'ends with', requiresValue: true, supportedTypes: ['text'] },
  equals: { label: 'equals', requiresValue: true, supportedTypes: ['number', 'date'] },
  not_equals: { label: 'does not equal', requiresValue: true, supportedTypes: ['number', 'date'] },
  greater_than: { label: 'is greater than', requiresValue: true, supportedTypes: ['number', 'date'] },
  less_than: { label: 'is less than', requiresValue: true, supportedTypes: ['number', 'date'] },
  greater_than_or_equal: { label: 'is greater than or equal to', requiresValue: true, supportedTypes: ['number', 'date'] },
  less_than_or_equal: { label: 'is less than or equal to', requiresValue: true, supportedTypes: ['number', 'date'] },
  is_before: { label: 'is before', requiresValue: true, supportedTypes: ['date'] },
  is_after: { label: 'is after', requiresValue: true, supportedTypes: ['date'] },
  is_on_or_before: { label: 'is on or before', requiresValue: true, supportedTypes: ['date'] },
  is_on_or_after: { label: 'is on or after', requiresValue: true, supportedTypes: ['date'] },
  is_within: { label: 'is within', requiresValue: true, supportedTypes: ['date'] },
  is_exactly: { label: 'is exactly', requiresValue: true, supportedTypes: ['date'] },
};
