import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  const plugins: PluginOption[] = [
    react({
      babel: {
        presets: [
          "@babel/preset-typescript",
          ["@babel/preset-react", { runtime: "automatic" }],
        ],
      },
    }),
    {
      name: "disable-native-esbuild-for-build",
      config: (_, env) => env.command === "build" ? {
        esbuild: false,
        build: {
          target: "esnext",
          minify: "terser",
          cssMinify: false,
        },
      } : undefined,
    },
  ];

  if (command === "serve" && mode === "development" && process.env.LOVABLE_DISABLE_TAGGER !== "1") {
    const { componentTagger } = await import("lovable-tagger");
    plugins.push(componentTagger() as PluginOption);
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    define: {
      __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
      __CAP_DEV__: JSON.stringify(process.env.CAP_DEV === '1'),
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
