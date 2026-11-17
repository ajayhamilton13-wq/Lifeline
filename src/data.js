import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection, doc, setDoc, deleteDoc, onSnapshot, query, where, orderBy, limit,
  Timestamp, serverTimestamp, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { REPORT_WINDOW_MS } from './geo';

const OUTBOX_KEY = 'lifeline.outbox';

function fromDoc(d) {
  const data = d.data();
  const ts = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
  return { ...data, id: d.id, createdAt: ts };
}

function toCloud(item, myUid) {
  const { id, ...rest } = item;
  const out = { ...rest, createdAt: Timestamp.fromMillis(item.createdAt) };
  // Relayed items keep the original author in `from`; `uid` is always the uploader.
  if (item.uid !== myUid) {
    out.from = item.from || item.uid;
    out.via = 'mesh';
    out.uid = myUid;
  }
  if (!out.note) delete out.note;
  return out;
}

// ---------- Live subscriptions ----------

export function subscribeReports(cb) {
  const since = Timestamp.fromMillis(Date.now() - REPORT_WINDOW_MS);
  const q = query(collection(db, 'reports'), where('createdAt', '>', since), orderBy('createdAt', 'desc'), limit(500));
  return onSnapshot(q, (snap) => cb(snap.docs.map(fromDoc)), () => {});
}

export function subscribeMessages(cb) {
  const since = Timestamp.fromMillis(Date.now() - REPORT_WINDOW_MS);
  const q = query(collection(db, 'messages'), where('createdAt', '>', since), orderBy('createdAt', 'desc'), limit(300));
  return onSnapshot(q, (snap) => cb(snap.docs.map(fromDoc)), () => {});
}

export function subscribeResources(cb) {
  const q = query(collection(db, 'resources'), orderBy('updatedAt', 'desc'), limit(300));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {});
}

export async function fetchReportsSince(ms) {
  const q = query(collection(db, 'reports'), where('createdAt', '>', Timestamp.fromMillis(ms)), orderBy('createdAt', 'desc'), limit(300));
  const snap = await getDocs(q);
  return snap.docs.map(fromDoc);
}

// ---------- Writes ----------

export async function uploadItem(kind, item, myUid) {
  const col = kind === 'report' ? 'reports' : 'messages';
  await setDoc(doc(db, col, item.id), toCloud(item, myUid));
}

export async function saveResource(uid, data) {
  await setDoc(doc(db, 'resources', uid), { ...data, uid, updatedAt: serverTimestamp() });
}

export async function removeResource(uid) {
  await deleteDoc(doc(db, 'resources', uid));
}

export async function saveUser(uid, name) {
  await setDoc(doc(db, 'users', uid), { name, updatedAt: serverTimestamp() }, { merge: true });
}

// ---------- Outbox: things created while offline, uploaded when internet returns ----------

export async function addToOutbox(kind, item) {
  const list = JSON.parse((await AsyncStorage.getItem(OUTBOX_KEY)) || '[]');
  if (!list.find((x) => x.item.id === item.id)) list.push({ kind, item });
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(list));
}

export async function flushOutbox(myUid) {
  const list = JSON.parse((await AsyncStorage.getItem(OUTBOX_KEY)) || '[]');
  if (!list.length) return 0;
  const keep = [];
  let sent = 0;
  for (const entry of list) {
    const tooOld = Date.now() - entry.item.createdAt > REPORT_WINDOW_MS;
    if (tooOld) continue;
    try {
      await uploadItem(entry.kind, entry.item, myUid);
      sent += 1;
    } catch (e) {
      // Already uploaded by someone else, or rejected: drop it. Network errors: keep.
      const code = String(e?.code || '');
      if (!code.includes('permission') && !code.includes('already')) keep.push(entry);
    }
  }
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(keep));
  return sent;
}
