import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  getNearbyReports,
} from '../services/ReportsService';

import {
  AccidentReport,
} from '../types/reports.types';

export function useNearbyReports() {
  const [reports, setReports] =
    useState<AccidentReport[]>([]);

  const [loading, setLoading] =
    useState(true);

  const refreshReports =
    useCallback(async () => {
      setLoading(true);

      try {
        const nearbyReports =
          await getNearbyReports();

        setReports(nearbyReports);
      } finally {
        setLoading(false);
      }
    }, []);

  const upsertReport =
    useCallback((report: AccidentReport) => {
    setReports((currentReports) => {
      // Remove if resolved
      if (report.status === 'resolved') {
        return currentReports.filter((item) => item.id !== report.id);
      }

      const existingReport =
        currentReports.some(
          (item) => item.id === report.id
        );

      if (!existingReport) {
        return [
          report,
          ...currentReports,
        ];
      }

      return currentReports.map((item) =>
        item.id === report.id
          ? report
          : item
      );
    });
    }, []);

  const removeReport = useCallback((reportId: string) => {
    setReports((currentReports) =>
      currentReports.filter((item) => item.id !== reportId)
    );
  }, []);

  useEffect(() => {
    refreshReports();
  }, [refreshReports]);

  return {
    reports,
    loading,
    refreshReports,
    upsertReport,
    removeReport,
  };
}
