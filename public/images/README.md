This folder stores static image assets (PNG, JPG, SVG, WebP, etc.).

How to reference in the app:
- Place files here: public/images/...
- Use absolute paths from the web root in JSX/CSS:
  - <img src="/images/logo.png" />
  - background-image: url('/images/bg.webp');

Notes:
- Everything in `public/` is served at the site root by Vite/Vercel.
- For TypeScript imports and asset hashing, consider importing images from `src/` instead (Vite will bundle and hash).
- Keep file names lowercase-with-dashes for consistency.
