import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" gør at alle asset-links bliver relative, så siden virker
// uanset om den ligger på https://<bruger>.github.io/<repo-navn>/
// eller på en helt anden adresse (fx eget domæne senere).
export default defineConfig({
  plugins: [react()],
  base: "./",
});
