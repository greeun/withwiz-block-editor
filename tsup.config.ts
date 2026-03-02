import { defineConfig } from "tsup";

// Compile all source files individually (no cross-file bundling)
// This preserves the subpath exports structure:
//   dist/index.js, dist/context/BlockEditorProvider.js, etc.
export default defineConfig({
  entry: [
    "src/index.ts",
    "src/types.ts",
    "src/blocks/**/*.ts",
    "src/components/**/*.tsx",
    "src/context/**/*.tsx",
    "src/core/**/*.ts",
    "src/hooks/**/*.ts",
  ],
  format: ["esm"],
  outExtension: () => ({ js: ".js" }),
  platform: "browser",
  dts: false,
  splitting: true,
  clean: true,
  outDir: "dist",
  external: ["react", "react-dom"],
});
