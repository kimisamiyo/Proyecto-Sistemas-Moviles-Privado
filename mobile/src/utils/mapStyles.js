/** Estilo claro smoke — etiquetas legibles (#3f646c sobre fondo #faf9f7). */
export const smokeMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#faf9f7' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#3f646c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e8e6e3' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#41484a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadad8' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c2e9f3' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#274c54' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eceae6' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#625e56' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#625e56' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#032f36' }] },
];
