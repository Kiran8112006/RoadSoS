const rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL || '';

const API_BASE_URL =
  rawApiUrl
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

export const acknowledgeEmergencyAlert =
async (
  alertId: string
) => {

  if (!alertId) {
    return;
  }

  const response =
    await fetch(
      `${API_BASE_URL}/api/alerts/acknowledge`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId,
        }),
      }
    );

  if (!response.ok) {

    const text =
      await response.text();

    throw new Error(
      text || 'Failed to acknowledge alert'
    );

  }

  return response.json();

};
