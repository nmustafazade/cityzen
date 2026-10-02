# Cityzen Mobile

Citizen-focused React Native application built with Expo, TypeScript and Expo Router. It uses the same Cityzen API and accounts as the web application.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_API_URL` to an address reachable from the device.
3. Install dependencies with `npm install`.
4. Start the backend from `server/` on port `5051`.
5. Start mobile with `npm start`.

Connection examples:

- Physical phone: use the development computer's LAN IP, such as `http://192.168.x.x:5051`.
- Android emulator: normally use `http://10.0.2.2:5051`.
- iOS Simulator: `http://localhost:5051` normally reaches the Mac backend.

Run `npm run ios` or `npm run android` to open a configured simulator/emulator. Use an Expo Go version compatible with SDK 57. After changing the API address, restart with `npx expo start --clear`. Location and photo-library access are requested when the associated action is selected. The app stores JWT access tokens in Expo SecureStore.

The maps use OpenStreetMap tiles and require network access. Municipality, Department Head and Employee workspaces remain web-only.

Mobile includes authentication, citizen reports, service requests, notifications, and city-information detail pages. It does not yet reproduce every web workflow, including advanced service forms, appointments, and document uploads. Browser export is not configured; use the separate `web/` application.

## Checks

```bash
npm run typecheck
npm run lint
npx expo-doctor
```
