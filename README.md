# davlabs-us.github.io

Homepage for [davlabs.us](https://davlabs.us/).

## Dopewar

Play the eight-city game at [davlabs.us/dopewar/](https://davlabs.us/dopewar/).
The game includes Austin and Miami, vehicle upgrades, properties, and local saves.
Saves are stored per browser and website; localhost saves do not transfer automatically.

- `dopewar-source/`: game source copied from the Dopewar project.
- `dopewar/`: compiled production files served by GitHub Pages.

To update the game, sync the latest `src/`, `index.html`, `tsconfig.json`, and dependency
files into `dopewar-source/`, retaining its `build:site` script. With Node.js 22 installed:

```sh
cd dopewar-source
npm ci
npm run build:site
cd ..
git add dopewar-source dopewar
git commit -m "Update Dopewar game"
git push origin main
```

The build runs the game tests, checks TypeScript, and uses `/dopewar/` for asset URLs.
Commit both the source and generated files. GitHub Pages deploys `main` from the
repository root after pushing. The homepage and `CNAME` continue to serve davlabs.us.
