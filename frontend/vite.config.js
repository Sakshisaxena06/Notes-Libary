import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ✅ Simple config — let Vite handle .env normally
export default defineConfig({
  plugins: [react()],
});