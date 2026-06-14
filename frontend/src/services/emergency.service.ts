export const triggerEmergency = async (
  latitude: number,
  longitude: number,
  userId: string,
) => {
  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/emergency/trigger`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          userId,
        }),
      }
    );

    const data = await response.json();

    console.log(data);

    return data;
  } catch (error) {
    console.log('Emergency trigger error:', error);
    throw error;
  }
};