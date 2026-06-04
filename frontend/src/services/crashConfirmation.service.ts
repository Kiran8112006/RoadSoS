export const confirmCrash = (

  risk: number,

  deceleration: number,

  hasEvent: boolean,

  inactive: boolean

) => {

  const highRisk =
    risk > 20;

  return (

    highRisk &&

    hasEvent

  );

};