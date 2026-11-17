/**
 * Offline phone-to-phone messaging.
 *
 * Uses the LifelineMesh native module (modules/lifeline-mesh), which wraps
 * Google Nearby Connections: phones find each other over Bluetooth and
 * Wi-Fi Direct with no internet or cell signal. Every message is relayed
 * onward by each phone that receives it (up to MAX_HOPS), so it can travel
 * across a neighbourhood from phone to phone.
 */
import { PermissionsAndroid, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

const Native = requireOptionalNativeModule('LifelineMesh');
const MAX_HOPS = 6;
const seen = new Set();
const listeners = new Set();

export const meshAvailable = !!Native;

export async function requestMeshPermissions() {
  if (Platform.OS !== 'android') return false;
  const P = PermissionsAndroid.PERMISSIONS;
  const wanted = [P.ACCESS_FINE_LOCATION];
  if (Platform.Version >= 31) wanted.push(P.BLUETOOTH_SCAN, P.BLUETOOTH_ADVERTISE, P.BLUETOOTH_CONNECT);
  if (Platform.Version >= 33 && P.NEARBY_WIFI_DEVICES) wanted.push(P.NEARBY_WIFI_DEVICES);
  const result = await PermissionsAndroid.requestMultiple(wanted.filter(Boolean));
  return Object.values(result).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
}

let subscribed = false;
let peersCallback = null;

export async function startMesh(displayName, { onPeers } = {}) {
  if (!Native) return false;
  const ok = await requestMeshPermissions();
  if (!ok) return false;
  peersCallback = onPeers;
  if (!subscribed) subscribeNative();
  try {
    await Native.start(displayName.slice(0, 30) || 'Lifeline');
    return true;
  } catch (e) {
    return false;
  }
}

function subscribeNative() {
  subscribed = true;
  Native.addListener('onPeersChanged', (e) => peersCallback && peersCallback(e.count));
  Native.addListener('onMessage', (e) => {
    let msg;
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    if (!msg || !msg.id || seen.has(msg.id)) return;
    seen.add(msg.id);
    listeners.forEach((fn) => fn(msg));
    if ((msg.hops || 0) < MAX_HOPS) {
      Native.broadcast(JSON.stringify({ ...msg, hops: (msg.hops || 0) + 1 }));
    }
  });
}

export function stopMesh() {
  try {
    Native && Native.stop();
  } catch {}
}

/** Sends to every nearby phone. Returns how many phones it went to directly. */
export function meshSend(kind, item) {
  if (!Native) return 0;
  seen.add(item.id);
  return Native.broadcast(JSON.stringify({ kind, ...item, hops: 0 }));
}

export function onMeshMessage(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
