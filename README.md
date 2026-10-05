# React + TypeScript + Vite

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
  # Maison Moderne

  Boutique de démonstration React + TypeScript construite à partir des exercices du Jour 1. Le catalogue, le panier et la liste des commandes utilisent les types, unions discriminées, génériques et utility types du cours.

  ## Démarrer

  ```sh
  npm install
  npm run dev
  ```

  Vérifications disponibles :

  ```sh
  npm run build
  npm run lint
  ```

  ## Organisation

  - `src/types/ecommerce.ts` : produits, panier, actions exhaustives, fonctions génériques et hook `useFetch<T>`.
  - `src/types/orders.ts` : commandes, statuts, événements métier, `pluck`, `satisfies` et regroupement par statut.
  - `src/components/` : catalogue et commandes, avec rendu explicite des états de chargement.
  - `public/data/` : réponses JSON locales utilisées pour la démonstration, sans backend à installer.

  Les photos du catalogue et les polices sont chargées depuis Unsplash et Google Fonts; une connexion Internet est nécessaire pour ces éléments visuels. Les données et fonctionnalités de démonstration restent locales.

