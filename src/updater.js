/**
 * In-app updates for the sideloaded APK.
 *
 * Checks the latest GitHub Release of the Lifeline repo. If its tag (e.g. v1.2.0)
 * is newer than this app's version and it has an .apk attached, the app offers
 * the update, downloads the APK and opens Android's installer.
 *
 * To ship an update: raise "version" in app.json, build the APK, then create a
 * GitHub Release tagged v<version> with the .apk attached.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';

export const REPO = 'ajayhamilton13-wq/Lifeline';
export const currentVersion = Constants.expoConfig?.version || '0.0.0';
const RECHECK_MS = 6 * 60 * 60 * 1000;

export function isNewer(remote, local) {
  const a = String(remote).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const b = String(local).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return false;
}

export async function fetchLatestRelease() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(res.status === 404 ? 'No releases published yet.' : `GitHub returned ${res.status}.`);
  const rel = await res.json();
  const apk = (rel.assets || []).find((a) => a.name && a.name.toLowerCase().endsWith('.apk'));
  return {
    version: String(rel.tag_name || '').replace(/^v/i, ''),
    notes: (rel.body || '').trim(),
    name: rel.name || rel.tag_name,
    url: apk ? apk.browser_download_url : null,
    size: apk ? apk.size : 0,
  };
}

async function installApk(update, onProgress) {
  const dest = `${FileSystem.cacheDirectory}lifeline-${update.version}.apk`;
  await FileSystem.deleteAsync(dest, { idempotent: true });
  const task = FileSystem.createDownloadResumable(update.url, dest, {}, (p) => {
    const total = p.totalBytesExpectedToWrite || update.size;
    if (total > 0 && onProgress) onProgress(Math.min(1, p.totalBytesWritten / total));
  });
  const result = await task.downloadAsync();
  if (!result || result.status !== 200) throw new Error('The download did not finish. Check your internet and try again.');
  const contentUri = await FileSystem.getContentUriAsync(result.uri);
  // FLAG_GRANT_READ_URI_PERMISSION = 1
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    flags: 1,
    type: 'application/vnd.android.package-archive',
  });
}

const Ctx = createContext(null);
export const useUpdates = () => useContext(Ctx);

export function UpdateProvider({ children }) {
  const [available, setAvailable] = useState(null); // release info when newer exists
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState(null); // 0..1 while downloading
  const [error, setError] = useState(null);
  const lastCheck = useRef(0);

  const check = useCallback(async ({ manual = false } = {}) => {
    if (Platform.OS !== 'android') return null;
    setChecking(true);
    setError(null);
    try {
      const rel = await fetchLatestRelease();
      lastCheck.current = Date.now();
      if (rel.url && isNewer(rel.version, currentVersion)) {
        setAvailable(rel);
        if (manual) setDismissed(false);
        return rel;
      }
      setAvailable(null);
      return null;
    } catch (e) {
      if (manual) setError(e.message);
      return { error: e.message || 'Could not reach GitHub.' };
    } finally {
      setChecking(false);
    }
  }, []);

  // Check on launch and whenever the app returns to the foreground (at most every 6 hours).
  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && Date.now() - lastCheck.current > RECHECK_MS) check();
    });
    return () => sub.remove();
  }, [check]);

  const install = useCallback(async () => {
    if (!available) return;
    setError(null);
    setProgress(0);
    try {
      await installApk(available, setProgress);
    } catch (e) {
      setError(e.message || 'Update failed.');
    } finally {
      setProgress(null);
    }
  }, [available]);

  const value = {
    currentVersion, available, checking, progress, error,
    showPrompt: !!available && !dismissed,
    dismiss: () => setDismissed(true),
    reopen: () => setDismissed(false),
    check, install,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
