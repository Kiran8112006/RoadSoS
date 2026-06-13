import axios from 'axios';

import {
  getAuthHeaders,
} from '../../../services/api/profile.api';

import {
  AccidentReport,
  AccidentReportAction,
  CreateAccidentReportInput,
} from '../types/reports.types';

const rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL || '';

const API_BASE_URL =
  rawApiUrl
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

const reportsUrl =
  `${API_BASE_URL}/api/reports`;

export async function getNearbyReports() {
  const headers =
    await getAuthHeaders();

  const response =
    await axios.get<{
      reports: AccidentReport[];
    }>(
      `${reportsUrl}/nearby`,
      {
        headers,
      }
    );

  return response.data.reports;
}

export async function createAccidentReport(
  report: CreateAccidentReportInput
) {
  const headers =
    await getAuthHeaders();

  const response =
    await axios.post<{
      report: AccidentReport;
    }>(
      reportsUrl,
      report,
      {
        headers,
      }
    );

  return response.data.report;
}

export async function submitReportAction(
  reportId: string,
  action: AccidentReportAction
) {
  const headers =
    await getAuthHeaders();

  const response =
    await axios.post<{
      report: AccidentReport;
    }>(
      `${reportsUrl}/${reportId}/actions`,
      {
        action,
      },
      {
        headers,
      }
    );

  return response.data.report;
}

export async function addReportReply(
  reportId: string,
  message: string
) {
  const headers =
    await getAuthHeaders();

  const response =
    await axios.post<{
      report: AccidentReport;
    }>(
      `${reportsUrl}/${reportId}/replies`,
      {
        message,
      },
      {
        headers,
      }
    );

  return response.data.report;
}

export async function updateReportStatus(
  reportId: string,
  status: string
) {
  const headers =
    await getAuthHeaders();

  const response =
    await axios.post<{
      report: AccidentReport;
    }>(
      `${reportsUrl}/${reportId}/status`,
      {
        status,
      },
      {
        headers,
      }
    );

  return response.data.report;
}
