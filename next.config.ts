import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    // sass-embedded is the fast (Dart VM) compiler; `sass` is the JS fallback.
    implementation: "sass-embedded",
    // Lets any .scss file do `@use 'mixins' as *` instead of counting `../`s.
    loadPaths: ["src/styles"],
  },
};

export default nextConfig;
