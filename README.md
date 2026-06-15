# Wanderlust Travel Tracker

A responsive TypeScript country explorer based on the Frontend Mentor REST
Countries challenge. The project expands the original brief with local
accounts, visited-country tracking, journal entries, photo uploads, and a
world-map view.

![Wanderlust country grid](images/Screenshot%202026-04-13%20at%203.42.38%E2%80%AFAM.png)

## Live Site

[View the GitHub Pages deployment](https://hirefabiola.github.io/REST_Countries_API/)

## Features

- Browse and search 250 countries
- Filter countries by region
- View country details and neighboring countries
- Toggle light and dark themes
- Register a local account and track visited countries
- Add journal entries and travel photos
- Visualize visited countries on a world map

## Country Data

REST Countries deprecated its unauthenticated v3.1 API in June 2026. The v5
API requires a private key, which should not be embedded in a static frontend.
This app therefore uses a trimmed local snapshot of the project's
[open-source v3.1 dataset](https://gitlab.com/restcountries/restcountries/-/blob/master/src/main/resources/countriesV3.1.json)
at `data/countries.json`.

Search, region filtering, country details, and border lookups all run against
that browser-cached snapshot. Updating country data requires replacing the
snapshot and rebuilding the app.

## Built With

- Semantic HTML
- CSS and Bootstrap 5
- TypeScript
- jsVectorMap
- Browser `localStorage`

## Development

```bash
npm install
npm test
```

`npm test` compiles the TypeScript and runs the country-data tests. GitHub
Pages serves the generated `main.js` and `countryData.js` files directly from
the repository root.

## Author

Fabiola Aurelien
