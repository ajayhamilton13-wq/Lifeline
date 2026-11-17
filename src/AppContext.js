import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import { auth } from './firebase';
import {
  subscribeReports, subscribeMessages, subscribeResources, uploadItem, addToOutbox, flushOutbox, saveUser,
} from './data';
import { buildClusters, distanceKm, makeId, CHAT_KM } from './geo';
import { startMesh, stopMesh, meshSend, onMeshMessage, meshAvailable } from './mesh';
import { setupNotifications } from './notify';
import { alertNewClusters, registerBackgroundCheck, LAST_LOCATION } from './background';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const CONTACTS_KEY = 'lifeline.smsContacts';

function mergeById(...lists) {
  const map = new Map();
  lists.flat().forEach((x) => {
    if (x && x.id && !map.has(x.id)) map.set(x.id, x);
  });
  return [...map.values()];
}

export function AppProvider({ user, initialName, children }) {
  const [name, setName] = useState(initialName || user.displayName || (user.email || 'Neighbour').split('@')[0]);

  // On sign-up the account exists a moment before the name is saved.
  useEffect(() => {
    if (initialName) setName(initialName);
  }, [initialName]);
  const [location, setLocation] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [online, setOnline] = useState(true);
  const [peers, setPeers] = useState(0);
  const [meshOn, setMeshOn] = useState(false);

  const [cloudReports, setCloudReports] = useState([]);
  const [localReports, setLocalReports] = useState([]);
  const [cloudMessages, setCloudMessages] = useState([]);
  const [localMessages, setLocalMessages] = useState([]);
  const [resources, setResources] = useState([]);
  const [smsContacts, setSmsContactsState] = useState([]);

  const locationRef = useRef(null);
  const onlineRef = useRef(true);

  // ---- Location: detected automatically, kept up to date ----
  useEffect(() => {
    let sub;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        return;
      }
      const update = (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        locationRef.current = loc;
        setLocation(loc);
        AsyncStorage.setItem(LAST_LOCATION, JSON.stringify(loc));
      };
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last) update(last);
        update(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      } catch {}
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 150, timeInterval: 60000 },
        update,
      );
    })();
    return () => sub && sub.remove();
  }, []);

  // ---- Internet status; upload anything queued while offline ----
  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      const isOnline = !!state.isConnected && state.isInternetReachable !== false;
      if (isOnline && !onlineRef.current) flushOutbox(user.uid);
      onlineRef.current = isOnline;
      setOnline(isOnline);
    });
  }, [user.uid]);

  // ---- Cloud data ----
  useEffect(() => subscribeReports(setCloudReports), []);
  useEffect(() => subscribeMessages(setCloudMessages), []);
  useEffect(() => subscribeResources(setResources), []);

  // ---- Notifications, background checks, profile ----
  useEffect(() => {
    setupNotifications().then((ok) => ok && registerBackgroundCheck());
    saveUser(user.uid, name).catch(() => {});
    flushOutbox(user.uid).catch(() => {});
    AsyncStorage.getItem(CONTACTS_KEY).then((v) => v && setSmsContactsState(JSON.parse(v)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Offline mesh ----
  useEffect(() => {
    let alive = true;
    startMesh(name, { onPeers: (n) => alive && setPeers(n) }).then((ok) => alive && setMeshOn(ok));
    const off = onMeshMessage((msg) => {
      const { kind, hops, ...item } = msg;
      if (kind === 'report') setLocalReports((l) => mergeById([item], l));
      if (kind === 'chat') setLocalMessages((l) => mergeById([{ ...item, via: 'mesh' }], l));
      // If this phone has internet, act as a gateway and pass it to the cloud.
      if (onlineRef.current && (kind === 'report' || kind === 'chat')) {
        uploadItem(kind, item, user.uid).catch(() => {});
      }
    });
    return () => {
      alive = false;
      off();
      stopMesh();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Combined views ----
  const reports = useMemo(() => mergeById(cloudReports, localReports), [cloudReports, localReports]);
  const clusters = useMemo(() => buildClusters(reports), [reports]);

  const messages = useMemo(() => {
    const all = mergeById(cloudMessages, localMessages);
    const near = location ? all.filter((m) => distanceKm(location, m) <= CHAT_KM) : all;
    return near.sort((a, b) => b.createdAt - a.createdAt);
  }, [cloudMessages, localMessages, location]);

  // ---- Alerts while the app is open ----
  useEffect(() => {
    if (location) alertNewClusters(clusters, user.uid, location);
  }, [clusters, location, user.uid]);

  // ---- Actions ----
  const deliver = useCallback(
    async (kind, item) => {
      const direct = meshSend(kind, item);
      if (onlineRef.current) {
        try {
          await uploadItem(kind, item, user.uid);
          return { cloud: true, direct };
        } catch {}
      }
      await addToOutbox(kind, item);
      return { cloud: false, direct };
    },
    [user.uid],
  );

  const submitReport = useCallback(
    async ({ type, status = 'out', note = '', at }) => {
      const where = at || locationRef.current;
      if (!where) throw new Error('Waiting for your location. Make sure location is turned on.');
      const item = {
        id: makeId(), uid: user.uid, name, type, status,
        note: note.trim().slice(0, 280), lat: where.lat, lng: where.lng, createdAt: Date.now(),
      };
      setLocalReports((l) => [item, ...l]);
      return deliver('report', item);
    },
    [deliver, name, user.uid],
  );

  const sendMessage = useCallback(
    async (text) => {
      const where = locationRef.current;
      if (!where) throw new Error('Waiting for your location. Make sure location is turned on.');
      const item = {
        id: makeId(), uid: user.uid, name, text: text.trim().slice(0, 1000),
        lat: where.lat, lng: where.lng, createdAt: Date.now(),
      };
      setLocalMessages((l) => [item, ...l]);
      return deliver('chat', item);
    },
    [deliver, name, user.uid],
  );

  const setSmsContacts = useCallback(async (list) => {
    setSmsContactsState(list);
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(list));
  }, []);

  const value = {
    user, name, setName, location, locationDenied, online, peers, meshOn, meshAvailable,
    reports, clusters, messages, resources, smsContacts, setSmsContacts,
    submitReport, sendMessage,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function signOutUser() {
  stopMesh();
  return auth.signOut();
}
