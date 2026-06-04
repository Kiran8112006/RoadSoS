import {
  useState,
} from 'react';

import {
  submitReportAction,
} from '../services/ReportsService';

import {
  AccidentReport,
  AccidentReportAction,
} from '../types/reports.types';

export function useReportActions() {
  const [submittingAction, setSubmittingAction] =
    useState<AccidentReportAction | null>(null);

  async function takeAction(
    reportId: string,
    action: AccidentReportAction
  ): Promise<AccidentReport> {
    setSubmittingAction(action);

    try {
      return await submitReportAction(
        reportId,
        action
      );
    } finally {
      setSubmittingAction(null);
    }
  }

  return {
    submittingAction,
    takeAction,
  };
}
