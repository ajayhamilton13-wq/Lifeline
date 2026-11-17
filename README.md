# Lifeline

Lifeline is an Android app for power and water outages. It shows outages around you, alerts you when one starts, keeps you messaging when there's no internet, and helps neighbours share what they have.

## Features

- **Live outage map.** Areas with power cuts, no water or low water pressure light up on an OpenStreetMap map. An area glows once 3 or more people have reported it. Your location is found automatically.
- **Alerts.** You get a notification when an outage is reported or confirmed within 5 km of you. The app also checks about every 15 minutes while it's closed.
- **Offline messaging.**
  - **Phone to phone:** messages and reports travel between Lifeline phones over Bluetooth and Wi-Fi Direct (Google Nearby Connections), with no Wi-Fi, data or signal. Each phone passes them on, up to 6 hops.
  - **Gateway:** when any phone in the chain has internet, it uploads what it received for everyone.
  - **SMS:** a fallback button texts your saved contacts your message and location using normal credit.
- **Resource sharing.** You can list what you could share in an emergency, such as water, generator power, charging, first aid, transport or shelter. Neighbours see your listing on the map and in the Share tab.

## Tech

- Expo (React Native), Firebase Auth and Firestore on the free Spark plan
- Leaflet and OpenStreetMap in a WebView, with no map API key needed
- A custom native module in `modules/lifeline-mesh`, written in Kotlin with Google Nearby Connections
- Firestore security rules in `firestore.rules`, already published to the `lifeline-79de9` project

## Build the APK

You need Node.js 20 or newer and a free Expo account.

```bash
git clone https://github.com/ajayhamilton13-wq/Lifeline.git
cd Lifeline
npm install
npx expo install --fix        # lines package versions up with the Expo SDK
npm install -g eas-cli
eas login                     # Expo account: ajay5
eas init                      # links the project, answer Yes
eas build -p android --profile preview
```

When the build finishes, EAS gives you a link to download the `.apk`. Install it on Android phones.

Offline phone-to-phone messaging only works in the built APK. It doesn't work in Expo Go.

## Project layout

```
App.js                  sign-in gate
src/AppContext.js       location, internet status, mesh, live data
src/screens/            Map, Alerts, Chat, Share, Me, Auth
src/mesh.js             offline relay logic
src/background.js       background outage checks
modules/lifeline-mesh/  native Nearby Connections module (Android)
firestore.rules         database security rules
```
