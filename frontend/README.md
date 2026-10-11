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
**Clean Routes** page. It uses Amazon Location Routes v2 and reads the API key from
`AMAZON_LOCATION` in `frontend/.env.local` and uses `us-east-1` unless `VITE_AWS_REGION` overrides
it. Restart Vite after changing either value. The Routes v2 API-key flow does not require a Route
Calculator name. The key is sent to Amazon Location from the browser, so restrict it in AWS to the
Routes capability and the deployed site's allowed referrers. Treat it as a browser-visible API key,
not as a server-side secret.

Route-level air quality scoring is optional and is not provided by this repository's API today.
To enable green-corridor classification, configure `VITE_ROUTE_AQI_SCORE_URL` to a trusted backend
that accepts `POST { "geometry": { "type": "LineString", "coordinates": [[longitude, latitude], ...] } }`
and returns `{ "average_aqi": number, "is_green_corridor": boolean, "source": string, "observed_at": string }`.
The UI only shows a green-corridor badge when that backend returns the explicit classification and
score; otherwise it shows Amazon's route time and distance without implying cleaner air.

## Delhi AQI map

The authenticated **Delhi AQI map** page uses MapLibre GL JS with an existing Amazon Location map
resource. Set `AWS_LOCATION_MAP_NAME` in `frontend/.env.local` to that map's name in the configured
region; `AMAZON_LOCATION` remains the browser-safe Amazon Location API key. The map key is included
in the frontend bundle by design, so restrict it to the app's web origins and map-rendering
operations. The map resource must already exist and the key must permit its style and tile requests.
Place search is proxied through the backend and uses AWS SDK credentials: the local AWS CLI profile
chain or the Lambda execution role. Do not put AWS secret access keys in frontend variables.

The AQI station endpoint (`GET /api/aqi/stations`) uses the CPCB real-time data.gov.in resource.
Set `DATA_GOV_IN_API_KEY` in `backend/.env.local`; optionally set `CPCB_AQI_RESOURCE_ID` to override
the resource identifier. Records without valid coordinates or enough pollutant observations for an
Indian CPCB AQI are omitted. An explicit unavailable response is shown when the token is missing or
the feed contains no usable data; no station readings or boundary are fabricated. The map resource
name and available styles could not be enumerated with the current AWS profile, so the page expects
an existing map name and uses that resource's default style.
Vite explicitly exposes only the API base URL, route-score URL, Amazon Location browser key, map
name, and region; unrelated `VITE_` variables such as Bedrock bearer tokens are not bundled.

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
