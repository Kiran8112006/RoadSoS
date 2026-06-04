let previousSpeed = 0;

let previousTimestamp =
  Date.now();

export const calculateDeceleration =
(
  currentSpeed: number
) => {

  const now = Date.now();

  const deltaTime =
    (
      now -
      previousTimestamp
    ) / 1000;

  if (deltaTime <= 0) {

    return 0;

  }

  const deceleration =
    (
      previousSpeed -
      currentSpeed
    ) / deltaTime;

  previousSpeed =
    currentSpeed;

  previousTimestamp =
    now;

  return deceleration;

};