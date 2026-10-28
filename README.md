# K. Madhava — Portfolio

Responsive portfolio built with Vite, vanilla JavaScript, and CSS.

## Local development

```sh
npm ci
npm run dev
```

Create a production build with `npm run build`. GitHub Pages deployment is handled by `.github/workflows/deploy.yml`; the Vite base path is configured for `/Madhava-Portfolio/`. In repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions** to publish the built `dist` artifact. The source HTML also uses relative runtime paths so it can still load when Pages serves the repository root directly.

The public-repository cards use GitHub's unauthenticated public API. If GitHub is unreachable or rate-limits the request, the portfolio shows a bounded error state and a link to the profile. Certificate preview PNGs are rendered from the original IBM PDFs; the PDFs remain the authoritative documents.
