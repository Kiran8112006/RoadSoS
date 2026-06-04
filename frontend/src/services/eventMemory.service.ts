let suspiciousEvent: any =
null;

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

  return suspiciousEvent;

};

export const clearSuspiciousEvent =
() => {

  suspiciousEvent = null;

};