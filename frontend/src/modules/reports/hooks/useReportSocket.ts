import {
  useEffect,
} from 'react';

import {
  subscribeToReportAlerts,
} from '../services/ReportsRealtimeService';

import {
  AccidentReport,
} from '../types/reports.types';

export function useReportSocket(
  onReportReceived: (report: AccidentReport) => void
) {
  useEffect(() => {
    const unsubscribe =
      subscribeToReportAlerts(onReportReceived);

    return unsubscribe;
  }, [onReportReceived]);
}
