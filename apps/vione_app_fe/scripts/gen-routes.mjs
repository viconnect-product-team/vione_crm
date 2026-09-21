#!/usr/bin/env node
// Regenerates src/routeTree.gen.ts from the files in src/routes.
// Runs automatically before dev/build (see predev/prebuild npm scripts) so the
// route tree never goes stale after a route is added, renamed, or deleted.

import fs from "node:fs/promises";
import { Generator, getConfig } from "@tanstack/router-generator";

const root = process.cwd();
const config = getConfig(
  {
    routesDirectory: "./src/routes",
    generatedRouteTree: "./src/routeTree.gen.ts",
  },
  root,
);

const generator = new Generator({ config, root });

try {
  await generator.run();
  if (generator.crawlingResult) {
    const res = generator.buildRouteTree(generator.crawlingResult);
    if (res?.routeTreeContent) {
      await fs.writeFile("./src/routeTree.gen.ts", res.routeTreeContent, "utf-8");
      console.log("[gen-routes] routeTree.gen.ts successfully written to disk with all routes.");
    }
  }
} catch (err) {
  console.error("[gen-routes] Failed to generate route tree:", err);
  process.exit(1);
}
