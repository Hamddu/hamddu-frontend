import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useAuthStore } from "../store/authStore";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.hamddu.online";

const MAX_DIMENSION = 1200;
const COMPRESS_QUALITY = 0.75;

export type PickAndUploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

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

export async function pickAndUploadImage(): Promise<PickAndUploadResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    return { ok: false, error: "사진 접근 권한이 필요해요." };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.[0]) {
    return { ok: false, error: "cancelled" };
  }

  const asset = result.assets[0];
  const compressedUri = await compressImage(
    asset.uri,
    asset.width ?? 0,
    asset.height ?? 0,
  );

  try {
    const token = useAuthStore.getState().accessToken;

    const fileRes = await fetch(compressedUri);
    const blob = await fileRes.blob();

    const form = new FormData();
    form.append("file", blob, `photo_${Date.now()}.jpg`);

    const res = await fetch(`${API_BASE_URL}/api/media/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: (body as any).error ?? "업로드 실패" };
    }

    const { url } = await res.json();
    return { ok: true, url };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "네트워크 오류" };
  }
}
