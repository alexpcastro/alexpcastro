# Portfolio Website Built on React

Personal website built on React.

## Local development

Use Node.js 22, then install the locked dependencies and start the development server:

```sh
npm ci
npm run dev
```

## Production build and preview

```sh
npm run build
npm start
```

`npm start` serves only the optimized files in `build/`, with a single-page-app fallback. It binds to `0.0.0.0` and uses Cloud Run's `PORT`, or port 8080 for a local preview. It does not start the React development server. Rebuild after source changes before previewing them.

## Deployment

The Google Cloud Build trigger in project `apctg-cloud` watches the `prod` branch. It runs `npm ci` and `npm run build` with Node.js 22, then deploys the source to Cloud Run service `alexpcastro-prod` in `us-east1`. The source build uses Google Buildpacks, which runs the build script and uses `npm start` as the runtime entrypoint.

Pushing to `prod` deploys to **https://alexpcastro.com**. Keep proposed changes off that branch until the deployment is approved.
