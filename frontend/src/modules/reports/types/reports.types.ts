export type AccidentReportSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type AccidentReportStatus =
  | 'active'
  | 'helping'
  | 'ambulanceArrived'
  | 'victimRescued'
  | 'roadCleared'
  | 'resolved';

export type AccidentReportAction =
  | 'canHelp'
  | 'ambulanceCalled'
  | 'policeInformed'
  | 'falseReport';

export type AccidentReportLocation = {
  latitude: number;
  longitude: number;
  address: string;
};

export type AccidentReportReply = {
  id: string;
  authorName: string;
  authorUid?: string;
  message: string;
  createdAt: string;
};

export type ActionUser = {
  uid: string;
  name: string;
  timestamp: string;
};

export type AccidentReport = {
  id: string;
  title: string;
  description: string;
  severity: AccidentReportSeverity;
  status: AccidentReportStatus;
  location: AccidentReportLocation;
  distanceMeters: number;
  createdAt: string;
  updatedAt?: string;
  actions: Partial<Record<AccidentReportAction, number>>;
  actionUsers?: Partial<Record<AccidentReportAction, ActionUser[]>>;
  replies: AccidentReportReply[];
};

export type CreateAccidentReportInput = Pick<
  AccidentReport,
  'title' | 'description' | 'severity' | 'location'
>;
