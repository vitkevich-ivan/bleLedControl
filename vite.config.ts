import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["lamp.svg"],
      manifest: {
        name: "Luma BLE — управление лампой",
        short_name: "Luma BLE",
        description: "Локальное управление LED LAMP по Bluetooth",
        theme_color: "#10131a",
        background_color: "#10131a",
        display: "standalone",
        start_url: ".",
        scope: ".",
        icons: [
          {
            src: "lamp.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,svg,woff2}"]
      }
    })
  ]
});
