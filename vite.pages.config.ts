import react from "@vitejs/plugin-react";
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    root: resolve(process.cwd(), "pages"),
    publicDir: resolve(process.cwd(), "public"),
    plugins: [
      react(),
      {
        name: "pocket-archive-pages-fallback",
        closeBundle() {
          copyFileSync(
            resolve(process.cwd(), "pages-dist", "index.html"),
            resolve(process.cwd(), "pages-dist", "404.html"),
          );
        },
      },
    ],
    define: {
      "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
      "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      "process.env.NEXT_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY": JSON.stringify(env.NEXT_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY),
      "process.env.NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY": JSON.stringify(env.NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY),
      "process.env.NEXT_PUBLIC_TOSS_PAYMENT_API_URL": JSON.stringify(env.NEXT_PUBLIC_TOSS_PAYMENT_API_URL),
    },
    build: {
      outDir: resolve(process.cwd(), "pages-dist"),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(process.cwd(), "pages", "index.html"),
          mypage: resolve(process.cwd(), "pages", "mypage", "index.html"),
          paymentSuccess: resolve(process.cwd(), "pages", "payment", "success", "index.html"),
          paymentFail: resolve(process.cwd(), "pages", "payment", "fail", "index.html"),
        },
      },
    },
  };
});
