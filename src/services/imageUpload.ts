import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useAuthStore } from "../store/authStore";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.hamddu.online";

const MAX_DIMENSION = 1200;
const COMPRESS_QUALITY = 0.75;

export type PickAndUploadResult =
  | { ok: true; url: string; mediaId: string }
  | { ok: false; error: string };

export type ImageSource = "gallery" | "camera";

async function compressImage(
  uri: string,
  originalWidth: number,
  originalHeight: number,
): Promise<string> {
  const actions: ImageManipulator.Action[] = [];

  if (originalWidth > MAX_DIMENSION || originalHeight > MAX_DIMENSION) {
    if (originalWidth >= originalHeight) {
      actions.push({ resize: { width: MAX_DIMENSION } });
    } else {
      actions.push({ resize: { height: MAX_DIMENSION } });
    }
  }

  const result = await ImageManipulator.manipulateAsync(
    uri,
    actions,
    { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

export async function pickImage(
  source: ImageSource = "gallery",
): Promise<ImagePicker.ImagePickerResult> {
  if (source === "camera") {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      throw new Error("카메라 접근 권한이 필요해요.");
    }
    return ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: true,
      aspect: [4, 3],
    });
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error("사진 접근 권한이 필요해요.");
  }
  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
    allowsEditing: true,
    aspect: [4, 3],
  });
}

export async function pickAndUploadImage(
  source: ImageSource = "gallery",
): Promise<PickAndUploadResult> {
  try {
    const result = await pickImage(source);

    if (result.canceled || !result.assets?.[0]) {
      return { ok: false, error: "cancelled" };
    }

    const asset = result.assets[0];
    const compressedUri = await compressImage(
      asset.uri,
      asset.width ?? 0,
      asset.height ?? 0,
    );

    const token = useAuthStore.getState().accessToken;
    if (!token) {
      return { ok: false, error: "로그인이 필요해요." };
    }

    const form = new FormData();
    form.append("file", {
      uri: compressedUri,
      name: `photo_${Date.now()}.jpg`,
      type: "image/jpeg",
    } as any);

    const res = await fetch(`${API_BASE_URL}/api/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const rawBody = await res.text();
    console.log(`[upload] status=${res.status} body=`, rawBody);

    if (!res.ok) {
      let parsed: any = {};
      try { parsed = JSON.parse(rawBody); } catch {}
      return { ok: false, error: `HTTP ${res.status}: ${parsed.error ?? parsed.message ?? rawBody}` };
    }

    const { url, id: mediaId } = JSON.parse(rawBody);
    return { ok: true, url, mediaId };
  } catch (e: any) {
    if (e?.message?.includes("권한")) {
      return { ok: false, error: e.message };
    }
    return { ok: false, error: e?.message ?? "네트워크 오류" };
  }
}

export async function pickAndUploadImageWithSource(
  onSourceSelect: () => Promise<ImageSource>,
): Promise<PickAndUploadResult> {
  try {
    const source = await onSourceSelect();
    return pickAndUploadImage(source);
  } catch {
    return { ok: false, error: "취소됨" };
  }
}
