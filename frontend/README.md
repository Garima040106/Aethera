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

The protected **Clean Routes** page uses Amazon Location Routes v2. It reads the API key from
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
