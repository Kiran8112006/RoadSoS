let pendingCrashTimestamp: number | null = null;

export const startPendingCrash = () => {

  if (!pendingCrashTimestamp) {

    pendingCrashTimestamp = Date.now();

  }

};

export const clearPendingCrash = () => {

  pendingCrashTimestamp = null;

};

export const isPendingCrashValidated = () => {

  if (!pendingCrashTimestamp) {

    return false;

  }

  return (

    Date.now() -

    pendingCrashTimestamp >

    5000

  );

};