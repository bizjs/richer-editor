import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "es2022",
  clean: true,
  sourcemap: true,
  dts: {
    sourcemap: true,
  },
  css: {
    splitting: false,
    fileName: "styles.css",
  },
  deps: {
    skipNodeModulesBundle: true,
  },
  exports: {
    legacy: true,
  },
  publint: true,
});
