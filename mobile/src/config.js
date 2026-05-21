// En el celular define EXPO_PUBLIC_API_URL o EXPO_PUBLIC_API_HOST (IP de tu PC en la misma WiFi)
const API_HOST = process.env.EXPO_PUBLIC_API_HOST || '192.168.18.132';
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '5000';

// Con ngrok en el celular: EXPO_PUBLIC_API_URL=https://xxxx.ngrok-free.app/api/v1
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  `http://${API_HOST}:${API_PORT}/api/v1`;

const config = {
  API_URL,
  DEFAULT_LOCATION: {
    latitude: -12.1068,
    longitude: -76.9628,
    name: 'Universidad Ricardo Palma',
  },
  RADAR_RADIUS: 5000,
};

export default config;
