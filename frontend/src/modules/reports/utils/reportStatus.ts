import {
  AccidentReportSeverity,
  AccidentReportStatus,
} from '../types/reports.types';

export function getReportStatusLabel(status: AccidentReportStatus) {
  const labels: Record<AccidentReportStatus, string> = {
    active: 'Active',
    helping: 'Help on way',
    resolved: 'Resolved',
  };

  return labels[status];
}

export function getReportSeverityLabel(severity: AccidentReportSeverity) {
  const labels: Record<AccidentReportSeverity, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };

  return labels[severity];
}

export function getReportSeverityColor(severity: AccidentReportSeverity) {
  const colors: Record<AccidentReportSeverity, string> = {
    low: '#2563EB',
    medium: '#D97706',
    high: '#DC2626',
    critical: '#7F1D1D',
  };

  return colors[severity];
}
