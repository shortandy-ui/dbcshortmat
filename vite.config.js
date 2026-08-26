import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // when running `npm run dev` locally, forward /api calls to Azure Functions Core Tools (func start), if you're running it
      "/api": "http://localhost:7071",
    },
  },
});
