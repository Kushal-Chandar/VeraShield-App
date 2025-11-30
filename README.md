# VeraShield – Smart Dispenser Companion App

[![React](https://img.shields.io/badge/React-18%2B-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-BLE-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Platforms](https://img.shields.io/badge/Android_%7C_iOS-Mobile-3DDC84?logo=android&logoColor=white)](#)


[![Live Demo](https://img.shields.io/badge/Live_Demo-Open-green)](https://kushal-chandar.github.io/VeraShield-App/#/demo)

VeraShield is a mobile app for configuring and controlling the VeraShield smart spray dispenser over Bluetooth Low Energy (BLE).

You can discover nearby devices, trigger sprays, set schedules, monitor battery and user statistics

---

## 🔗 Live demo and media

- 👉 [Live demo](https://kushal-chandar.github.io/VeraShield-App/#/demo)
- **Video walkthrough:**


- **Screenshots:**
  - Quick Actions and Time Sync
    ![VeraShield – Actions](./assets/time_settings.JPG)
  - Device control and scheduling  
    ![VeraShield – Scheduling](./assets/scheduling.JPG)
  - Statistics
    ![VeraShield – Statistics](./assets/statistics.JPG)

## 🧩 What this app does

The app is the companion client for the VeraShield BLE dispenser:

- **Device discovery & time sync**
  - Scan for nearby VeraShield devices over BLE
  - Connect and keep device time in sync

- **Control & automation**
  - Trigger sprays manually from the app
  - Create and edit schedules for automatic sprays
  - Use intensity presets tuned for different environments

- **Monitoring**
  - Check current battery level
  - View user statistics and usage trends
  - Review recent spray history

- **Alerts**
  - Get notified when the device sprays
  - See updates when schedules change
  - Warnings for high settings to avoid environmental damage

## 🛠 Tech stack

This project is built as a modern cross-platform app:

- **Core**
  - React + TypeScript
  - Vite for fast dev builds
  - Tailwind CSS for styling

- **Mobile / Native**
  - Capacitor for native builds
  - Capacitor BLE plugin for Bluetooth Low Energy communication

- **Target platforms**
  - Android 6.0+
  - iOS 11+