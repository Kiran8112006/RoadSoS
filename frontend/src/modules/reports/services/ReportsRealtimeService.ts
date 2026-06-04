import {
  io,
  Socket,
} from 'socket.io-client';

import {
  AccidentReport,
} from '../types/reports.types';

type ReportListener = (report: AccidentReport) => void;

const rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL || '';

const SOCKET_URL =
  rawApiUrl
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL);
  }

  return socket;
}

export function updateUserLocation(location: { latitude: number; longitude: number }) {
  const activeSocket = getSocket();
  activeSocket.emit('user:location', location);
}

export function subscribeToReportAlerts(
  listener: ReportListener
) {
  const activeSocket =
    getSocket();

  activeSocket.on(
    'report:created',
    listener
  );

  activeSocket.on(
    'report:updated',
    listener
  );

  activeSocket.on(
    'report:nearby',
    listener
  );

  return () => {
    activeSocket.off(
      'report:created',
      listener
    );

    activeSocket.off(
      'report:updated',
      listener
    );

    activeSocket.off(
      'report:nearby',
      listener
    );
  };
}

export function subscribeToResolvedReports(
  onResolved: (data: { id: string }) => void
) {
  const activeSocket = getSocket();
  activeSocket.on('report:resolved', onResolved);
  return () => {
    activeSocket.off('report:resolved', onResolved);
  };
}
