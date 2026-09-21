import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// Modules that ship RUNTIME mock rows. Routes must NOT import these — they
// must query real Supabase. Keep in sync with
// src/__tests__/routes-real-supabase.integration.test.ts (FORBIDDEN_MOCK_MODULES).
const FORBIDDEN_MOCK_MODULES = [
  "@/lib/member-app-data",
  "@/lib/extra-data",
  "@/lib/members-data",
  "@/lib/networking-data",
  "@/lib/opportunities-data",
  "@/lib/marketplace-data",
  "@/lib/renewal-data",
  "@/lib/reviews-data",
];

// Legacy routes still on mock modules. Same ratchet as the integration test.
// Removing an entry here is how we prove progress on the backend cutover.
const KNOWN_VIOLATIONS = [
  "src/routes/activity.tsx",
  "src/routes/companies.$companyId.tsx",
  "src/routes/companies.tsx",
  "src/routes/fees.tsx",
  "src/routes/marketplace.$productId.tsx",
  "src/routes/marketplace.my-quotes.tsx",
  "src/routes/marketplace.tsx",
  "src/routes/marketplace.workspace.tsx",
  "src/routes/members.$memberId.tsx",
  "src/routes/members.index.tsx",
  "src/routes/network.tsx",
  "src/routes/news.tsx",
  "src/routes/notifications.tsx",
  "src/routes/opportunities.$id.edit.tsx",
  "src/routes/opportunities.$id.tsx",
  "src/routes/opportunities.tsx",
  "src/routes/renewal.tsx",
  "src/routes/segments.tsx",
];

const mockImportRestriction = {
  "no-restricted-imports": [
    "error",
    {
      paths: FORBIDDEN_MOCK_MODULES.map((name) => ({
        name,
        message:
          `"${name}" ships runtime mock rows and must not be imported from routes. ` +
          `Migrate to a real Supabase query (server fn or @/integrations/supabase/client).`,
      })),
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      "dist",
      ".output",
      ".vinxi",
      "src/routeTree.gen.ts",
      "src/integrations/supabase/types.ts",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Block NEW mock imports from any route file at lint time.
  {
    files: ["src/routes/**/*.{ts,tsx}"],
    rules: mockImportRestriction,
  },
  // Business Connect mobile layer (BC-Mobile-0B): presentation-only boundary.
  // Blocks server-only modules, service-role/admin clients, and mock data
  // from entering the BC mobile client graph.
  {
    files: [
      "src/components/business-connect/mobile/**/*.{ts,tsx}",
      "src/routes/connect-app.{ts,tsx}",
      "src/routes/connect-app.*.{ts,tsx}",
      // BC-Mobile-1A: Home composition hook is part of the presentation
      // boundary — same restrictions (no .server, no admin client, no mocks).
      "src/hooks/use-business-connect-home.ts",
      "src/hooks/use-v-sheet.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/*.server", "**/*.server.*"],
              message: "Server-only modules (*.server) must not enter the BC mobile client graph.",
            },
          ],
          paths: [
            ...FORBIDDEN_MOCK_MODULES.map((name) => ({
              name,
              message: "Mock data is forbidden in the BC mobile layer (BC-Mobile-0A cutover).",
            })),
            {
              name: "@/integrations/supabase/client.server",
              message: "The privileged server client must never be imported from client code.",
            },
          ],
        },
      ],
    },
  },
  // Ratchet: legacy routes exempted until they migrate. Removing an entry
  // here (and from the integration test) is how we advance the cutover.
  {
    files: KNOWN_VIOLATIONS,
    rules: { "no-restricted-imports": "off" },
  },
  eslintPluginPrettier,
);
