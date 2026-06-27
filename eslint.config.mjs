import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // eslint-plugin-react-hooks v6 (shipped with Next 16) adds two aggressive
      // rules that fire on legitimate, intentional patterns in this codebase:
      //
      // - set-state-in-effect: our client-capability detection (matchMedia,
      //   navigator, WebGL probing in use-device-capability.ts, and the
      //   reduced-motion / boot / slot-name effects) MUST run in an effect —
      //   those browser APIs don't exist during SSR, so reading them at render
      //   time is impossible. setState-in-effect is React's sanctioned
      //   "synchronize with an external system" exception here.
      // - refs ("cannot access refs during render"): scroll-context.tsx reads
      //   lenisRef.current inside a useMemo on purpose, so consumers receive the
      //   Lenis instance once it initializes.
      //
      // These are correct as written; the rules can't see the SSR intent. We
      // disable just these two (NOT all of react-hooks — rules-of-hooks etc.
      // still catch real bugs).
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;
