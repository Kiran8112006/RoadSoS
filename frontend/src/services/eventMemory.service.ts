let suspiciousEvent: any =
null;

const TEST_EVENT_TTL_MS =
  15000;

export const createSuspiciousEvent =
(
  data: any
) => {

  suspiciousEvent = {

    ...data,

    timestamp:
      Date.now(),

  };

};

export const getSuspiciousEvent =
() => {

  if (
    suspiciousEvent &&
    Date.now() - suspiciousEvent.timestamp > TEST_EVENT_TTL_MS
  ) {
    suspiciousEvent = null;
  }

  return suspiciousEvent;

};

export const clearSuspiciousEvent =
() => {

  suspiciousEvent = null;

};
