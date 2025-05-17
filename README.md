# Vue 3, Vite, Capacitor

Mobile app to interact with BLE perpherals like https://github.com/digital-codes/bleSensor

Tested on Android and Browser: Chrome on Android, Chromium on Linux, Bluefy on iOS, Edge on Windows


# Android

keystore in /home/kugel/daten/work/keystores/mypctl/android.jks

when publishing new release, make sure to update version 

> versionCode 1
> versionName "1.0"

in android/app/build.gradle

set sdk location in android/local.properties

> sdk.dir=/home/kugel/Android/Sdk


# Chromium
maybe in group bluetooth


snap run chromium \
  --enable-experimental-web-platform-features \
  --enable-web-bluetooth


localhost:
snap run chromium \
  --enable-experimental-web-platform-features \
  --enable-web-bluetooth \
  --unsafely-treat-insecure-origin-as-secure=http://localhost:8000
