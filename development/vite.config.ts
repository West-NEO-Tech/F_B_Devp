import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "wouter", "@tanstack/react-query"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "wouter",
      "@tanstack/react-query",
      "recharts",
      "lucide-react",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-context-menu",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-label",
      "@radix-ui/react-menubar",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-toggle",
      "@radix-ui/react-toggle-group",
      "@radix-ui/react-tooltip",
    ],
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    open: false,
    proxy: {
      "/api": {
        target: "http://localhost:8100",
        changeOrigin: true,
      },
    },
    warmup: {
      clientFiles: [
        "./src/App.tsx",
        "./src/pages/overview.tsx",
        "./src/pages/projects.tsx",
        "./src/pages/project-detail.tsx",
        "./src/components/app-sidebar.tsx",
      ],
    },
    watch: {
      // Polling is intentionally disabled on /mnt/ (WSL2 Windows fs).
      // Polling floods the 9P layer with stat() calls and blocks Vite
      // from serving requests, causing 20s+ page load times.
      // Native fs events may miss occasional saves — use Ctrl+R if HMR
      // misses a change.
      usePolling: false,
    },
  },
});
