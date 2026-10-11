# React + TypeScript + Vite

## Demo dashboard access

Run the frontend with `npm run dev`, open the local Vite URL, and choose **Older adult** or
**Advanced User** to open that role's sign-in and separate dashboard.

Older adult demo:

- Email: `demo@aethera.health`
- Password: `AetheraDemo2026!`

Advanced User demo:

- Email: `caregiver@aethera.health`
- Password: `AetheraCare2026!`

These are frontend-only demo gates. Credentials and checks are shipped in the browser bundle; do
not use this mechanism to protect real accounts, personal information, or a production deployment.
Each account opens only its corresponding dashboard. Sign out from the app header to clear the
browser session.

## Amazon Location routes

The older-adult dashboard embeds the route planner, which is also available on the protected
**Clean Routes** page. Route calculation is sent to the backend (`POST /api/location/routes`), which
uses AWS SDK for JavaScript v3 `GeoRoutesClient` and `CalculateRoutesCommand`. Locally, authenticate
with the configured AWS CLI profile; in Lambda, the execution role provides credentials. The
frontend does not send the Amazon Location route request directly, avoiding browser CORS and keeping
AWS credentials out of the browser.

Route AQI scoring is provided by this backend at `POST /api/routes/score`. It uses recent CPCB
stations within 1.5 km of the route and returns an explicit green-corridor classification only when
at least one usable reading is available. `VITE_ROUTE_AQI_SCORE_URL` can override the default
backend URL when a separate trusted scorer is deployed.

## Delhi AQI map

The interactive Delhi map uses MapLibre GL JS with OpenStreetMap raster tiles. No AWS map resource
or browser key is required. OpenStreetMap attribution is shown in the map control; the public tile
service is subject to the OpenStreetMap tile usage policy, so use a suitable tile provider for
high-volume production traffic.

Place search remains a backend operation and uses the configured Amazon Location SDK integration.
The browser receives no AWS credentials or provider API keys.

The AQI station endpoint (`GET /api/aqi/stations`) uses the existing CPCB real-time data.gov.in
resource. Configure `CPCB_API_KEY` (or `DATA_GOV_IN_API_KEY`) and optionally
`CPCB_AQI_RESOURCE_ID` in `backend/.env.local`. OpenAQ is a separate source: setting
`OPENAQ_API_KEY` enables its existing PM2.5 feed for environmental forecasts unless
`ENABLE_OPENAQ=false` is set explicitly. OpenAQ concentrations are not silently presented as CPCB
AQI stations. NASA FIRMS reports satellite fire hotspots, not AQI readings.

The route planner posts route geometry to the backend AQI scorer. It marks a corridor green only
when recent CPCB stations within 1.5 km of the route support an average Indian AQI of 100 or below;
routes without nearby current station readings remain unclassified. No station readings are
fabricated.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
