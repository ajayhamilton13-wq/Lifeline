/**
 * Checks for new outages near you about every 15 minutes, even when the app
 * is closed, and shows a notification. Android decides the exact timing.
 */
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebase';
import { fetchReportsSince } from './data';
import { buildClusters, distanceKm, NEARBY_KM, TYPES, REPORT_WINDOW_MS, formatDistance } from './geo';
import { notify } from './notify';

export const TASK_NAME = 'lifeline-outage-check';
const LAST_CHECK = 'lifeline.lastCheck';
const NOTIFIED = 'lifeline.notified';
export const LAST_LOCATION = 'lifeline.lastLocation';

/** Shared by the background task and the open app. Returns clusters it alerted about. */
export async function alertNewClusters(clusters, myUid, me) {
  if (!me) return [];
  const notified = JSON.parse((await AsyncStorage.getItem(NOTIFIED)) || '{}');
  const fresh = [];
  for (const c of clusters) {
    const d = distanceKm(me, c);
    if (d > NEARBY_KM) continue;
    if (c.reporters.length === 1 && c.reporters[0] === myUid) continue;
    const stage = c.confirmed ? 'confirmed' : 'reported';
    if (notified[c.key] === stage || notified[c.key] === 'confirmed') continue;
    notified[c.key] = stage;
    fresh.push(c);
    const t = TYPES[c.type];
    await notify(
      c.confirmed ? `${t.label} confirmed near you` : `${t.label} reported near you`,
      `${c.count} ${c.count === 1 ? 'person' : 'people'} · ${formatDistance(d)}`,
    );
  }
  // Forget alerts older than the report window.
  const keys = Object.keys(notified);
  if (keys.length > 300) keys.slice(0, keys.length - 300).forEach((k) => delete notified[k]);
  await AsyncStorage.setItem(NOTIFIED, JSON.stringify(notified));
  return fresh;
}

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    await auth.authStateReady();
    const user = auth.currentUser;
    const me = JSON.parse((await AsyncStorage.getItem(LAST_LOCATION)) || 'null');
    if (!user || !me) return BackgroundTask.BackgroundTaskResult.Success;
    const reports = await fetchReportsSince(Date.now() - REPORT_WINDOW_MS);
    await alertNewClusters(buildClusters(reports), user.uid, me);
    await AsyncStorage.setItem(LAST_CHECK, String(Date.now()));
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundCheck() {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) return false;
    const already = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (!already) await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: 15 });
    return true;
  } catch (e) {
    return false;
  }
}
