import { app, BrowserWindow, dialog } from "electron";
import { join } from "path";
import { setupIPC } from "./ipc";
import { closeStorage, getStorageMode } from "./services/storage";
import logger from "./logger";
import { loadWindowState, saveWindowState } from "./window-state";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const state = loadWindowState();
  logger.info("[Main] Restoring window state:", state);

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 1024,
    minHeight: 768,
    title: "BMAD Board",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (state.isMaximized) {
    mainWindow.maximize();
  }

  logger.info("[Main] Window created");

  const win = mainWindow;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  function debouncedSave(w: BrowserWindow): void {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveWindowState(w);
      logger.info("[Main] Window bounds saved");
    }, 500);
  }

  win.on("resize", () => debouncedSave(win));
  win.on("move", () => debouncedSave(win));

  win.on("close", () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveWindowState(win);
    logger.info("[Main] Window closed, state saved");
  });

  win.on("closed", () => {
    mainWindow = null;
  });

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

let ipcCleanup: { disposeWatchers: () => void } | null = null;

app
  .whenReady()
  .then(() => {
    logger.info("[Main] App ready, cwd:", process.cwd());
    try {
      const mode = getStorageMode();
      logger.info(`[Main] Storage initialized in ${mode} mode`);
    } catch (err) {
      logger.error("[Main] Storage init failed:", err);
      dialog.showErrorBox('Storage Error', 'Failed to initialize storage. The application will now exit.');
      app.quit();
      return;
    }
    ipcCleanup = setupIPC(() => mainWindow);
    createWindow();
  })
  .catch((err: unknown) => {
    logger.error("[Main] Fatal error during startup:", err);
    app.quit();
  });

app.on("will-quit", () => {
  if (ipcCleanup) {
    ipcCleanup.disposeWatchers();
    ipcCleanup = null;
  }
  closeStorage();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
