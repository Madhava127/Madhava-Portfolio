# K. Madhava — Portfolio

Responsive portfolio built with Vite, vanilla JavaScript, and CSS.

## Local development

```sh
npm ci
npm run dev
```

Create a production build with `npm run build`. GitHub Pages deployment is handled by `.github/workflows/deploy.yml`; the Vite base path is configured for `/Madhava-Portfolio/`.

The public-repository cards use GitHub's unauthenticated public API. If GitHub is unreachable or rate-limits the request, the portfolio shows a bounded error state and a link to the profile. Certificate preview PNGs are rendered from the original IBM PDFs; the PDFs remain the authoritative documents.
