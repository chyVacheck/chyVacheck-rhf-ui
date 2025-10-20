import { defineConfig } from "tsup";
import tsconfigPathsImport from "@esbuild-plugins/tsconfig-paths";
const tsconfigPaths =
  (tsconfigPathsImport as any).default ?? (tsconfigPathsImport as any);

import path from "path";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/form/index.ts",
    "src/form/fields/index.ts",
    "src/form/parts/index.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ["react", "react-dom", "react-hook-form", "zod"],
  esbuildPlugins: [
    tsconfigPaths({
      tsconfig: path.resolve(__dirname, "tsconfig.json"),
    }),
  ],
});
