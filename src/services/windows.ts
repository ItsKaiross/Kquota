import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize, PhysicalPosition } from "@tauri-apps/api/dpi";
import { Window, primaryMonitor } from "@tauri-apps/api/window";
import type { ProviderId } from "../types/usage";

export type DockPosition = "top" | "taskbar" | "side";
const openCards = new Map<ProviderId, WebviewWindow>();

export async function openProviderCard(provider: ProviderId, dock: DockPosition = "top") {
  if (!("__TAURI_INTERNALS__" in window)) return false;
  const label = `usage-${provider}`;
  const width = dock === "side" ? 220 : 392;
  const height = dock === "side" ? 188 : 76;
  const existing = openCards.get(provider) ?? await Window.getByLabel(label);
  if (existing) {
    await existing.setSize(new LogicalSize(width, height));
    await existing.show();
    await existing.setAlwaysOnTop(true);
    await existing.setFocus();
    return true;
  }

  const monitor = await primaryMonitor();
  const scale = monitor?.scaleFactor ?? 1;
  const area = monitor?.workArea;
  const screenX = (area?.position.x ?? monitor?.position.x ?? 0) / scale;
  const screenY = (area?.position.y ?? monitor?.position.y ?? 0) / scale;
  const screenW = (area?.size.width ?? monitor?.size.width ?? 1920) / scale;
  const screenH = (area?.size.height ?? monitor?.size.height ?? 1080) / scale;
  const providerOffset = provider === "codex" ? height + 8 : 0;
  const x = dock === "side" ? screenX + screenW - width - 12 : screenX + (screenW - width) / 2;
  const y = dock === "taskbar" ? screenY + screenH - height - 54 - providerOffset : screenY + 12 + providerOffset;

  const card = new WebviewWindow(label, {
    url: `/?card=${provider}&dock=${dock}`,
    title: `${provider} usage`, width, height, x: Math.round(x), y: Math.round(y),
    decorations: false, transparent: true, alwaysOnTop: true, resizable: false,
    skipTaskbar: true, shadow: false, focus: true, visible: false,
  });
  openCards.set(provider, card);

  await new Promise<void>((resolve, reject) => {
    void card.once("tauri://created", () => resolve());
    void card.once("tauri://error", (error) => {
      openCards.delete(provider);
      reject(error);
    });
    void card.once("tauri://destroyed", () => openCards.delete(provider));
  });
  await card.show();
  await card.setAlwaysOnTop(true);
  // Constructor coordinates are logical; correct the final position with the
  // monitor work area in physical pixels after Windows has created the HWND.
  const activeMonitor = await primaryMonitor();
  const work = activeMonitor?.workArea;
  const outer = await card.outerSize();
  if (work) {
    const gap = Math.round(12 * (activeMonitor?.scaleFactor ?? 1));
    const slot = provider === "codex" ? outer.height + gap : 0;
    const px = dock === "side"
      ? work.position.x + work.size.width - outer.width - gap
      : work.position.x + Math.round((work.size.width - outer.width) / 2);
    const py = dock === "taskbar"
      ? work.position.y + work.size.height - outer.height - gap - slot
      : work.position.y + gap + slot;
    await card.setPosition(new PhysicalPosition(px, py));
  }
  await card.setFocus();
  return true;
}

export async function closeProviderCard(provider: ProviderId) {
  if (!("__TAURI_INTERNALS__" in window)) return false;
  const existing = openCards.get(provider);
  if (existing) await existing.close();
  openCards.delete(provider);
  return true;
}
