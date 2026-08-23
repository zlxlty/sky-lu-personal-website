export default {
  "*.{astro,css,html,js,cjs,mjs,json,jsonc,jsx,md,mdx,svg,ts,tsx,yaml,yml}":
    "prettier --check",
  "*.{astro,js,cjs,mjs,jsx,ts,tsx}": "eslint",
};
