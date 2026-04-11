import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const useLovableTagger =
  process.env.VITE_SKIP_LOVABLE_TAGGER !== "1" &&
  process.env.VITE_SKIP_LOVABLE_TAGGER !== "true";

/** GitHub Pages (progetto): https://<user>.github.io/<repo>/ */
const GITHUB_PAGES_BASE = "/lastminutebologna/";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? GITHUB_PAGES_BASE : "/",
  server: {
    host: true,
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && useLovableTagger && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
