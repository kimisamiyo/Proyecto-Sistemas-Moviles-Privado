import * as ImagePicker from 'expo-image-picker';
import client from '../api/client';
import { parseApiErrors } from './validators';

export async function requestGalleryPermission() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export async function pickImageFromGallery() {
  const granted = await requestGalleryPermission();
  if (!granted) {
    throw new Error('Se necesita permiso para acceder a la galería.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.75,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  const mime = asset.mimeType || 'image/jpeg';
  const base64 = asset.base64;
  if (!base64) {
    throw new Error('No se pudo leer la imagen.');
  }

  return {
    uri: asset.uri,
    dataUrl: `data:${mime};base64,${base64}`,
  };
}

export async function uploadImageDataUrl(dataUrl) {
  const { data } = await client.post('/uploads/image', { image: dataUrl });
  return data.url;
}

export async function pickAndUploadCover() {
  const picked = await pickImageFromGallery();
  if (!picked) return null;
  const url = await uploadImageDataUrl(picked.dataUrl);
  return { url, localUri: picked.uri };
}

export async function pickAndUploadAlbumPhoto() {
  return pickAndUploadCover();
}
