# Contributing to rollup-plugin-react-scoped-css

Thanks for your interest in improving the plugin! Contributions of every size
are welcome — bug reports, documentation fixes, new test cases, and code.

## Code of Conduct

Be civil and constructive in issues, pull requests, and reviews. Disagreement
about technical decisions is fine; personal attacks, harassment, and abusive
behavior are not. Maintainers may edit or remove comments and close
contributions that do not meet this standard.

Anyone is free to open a PR and contribute to this project... just be civilized!

## Ways to contribute

### Reporting bugs

Before opening an issue, please search
[existing issues](https://github.com/cmseguin/rollup-plugin-react-scoped-css/issues)
to avoid duplicates. A good bug report includes:

- the plugin version (from `package.json` or `npm ls rollup-plugin-react-scoped-css`),
- your bundler and version (Vite, Rollup, or Rolldown), plus your Node version,
- a minimal reproduction — the smallest component and stylesheet that show the
  problem, ideally as a link to a repository or a code sandbox,
- the actual output and the output you expected,
- any error output in full.

### Suggesting features

Open an issue describing the problem you are trying to solve before writing
code. Explain the use case and, if possible, how other libraries handle it.
Features that can be implemented by an existing CSS or bundler plugin are
usually out of scope — this plugin deliberately does not transpile JSX,
preprocess SCSS/LESS, or bundle CSS.

### Improving documentation

The README is the primary documentation. Fixes for typos, unclear examples, or
missing caveats are always appreciated and can go straight to a pull request.

## Development setup

**Requirements:** Node >= 18 (CI runs Node 24) and npm.

```sh
git clone https://github.com/cmseguin/rollup-plugin-react-scoped-css.git
cd rollup-plugin-react-scoped-css
npm ci
npm run build
```

Useful scripts:

| Script | What it does |
| --- | --- |
| `npm run build` | Type-checks and compiles `src/` to `dist/` with `tsc` |
| `npm run build:watch` | Rebuilds on change |
| `npm test` | Runs the Jest unit test suite |
| `npm run lint` | Runs ESLint (including Prettier formatting checks) |
| `npm run test:e2e` | Runs the browser compatibility harness (see below) |

## Project structure

```text
src/
├── index.ts              # Plugin entry point: the Vite plugin and the
│                         # pre/post halves used by Rollup and Rolldown
├── ast-program.ts        # Walks the compiled React output
├── ast-transformer.ts    # Adds the data-<hash> attributes to JSX elements
├── ast-iterator.ts       # Generic AST traversal helpers
├── parsers/              # Babel output parsers (classic and automatic JSX)
├── css/
│   ├── scope-css.ts      # The CSS scoper and selector rewriting
│   └── css-features.spec.ts  # CSS support matrix tests
└── utils/                # Shared helpers
e2e/                      # Playwright harness for Vite, Rollup, and Rolldown
```

Unit tests live next to the code they cover as `*.spec.ts`. The e2e harness
installs the packed plugin into isolated throwaway projects under
`e2e/.cache/`, so it is slow but exercises the real published artifact.

## Running tests

Unit tests are fast and should cover any new scoping logic:

```sh
npm test
```

The end-to-end harness drives a real browser against Vite 5–8, Rollup, and
Rolldown. It needs Node >= 20.19 and a Playwright browser:

```sh
npm run test:e2e:install   # once; installs Chromium
npm run test:e2e           # all bundlers
```

See the [Testing](README.md#testing) section of the README for the full option
list. If your change touches CSS scoping, please add cases to
`src/css/scope-css.spec.ts` or `src/css/css-features.spec.ts` rather than
relying on the e2e harness alone.

## Coding standards

- **TypeScript** with `strict` mode enabled. Add types; avoid `any`.
- **Formatting** is enforced by Prettier through ESLint. Run `npm run lint`
  before pushing (or `npx eslint --fix` on the files you changed).
- Match the style of the surrounding code: small, focused modules with
  descriptive names.
- Keep the plugin's scope tight. It transforms CSS and JSX; it should not start
  transpiling, bundling, or resolving dependencies.
- New behavior needs tests. New options need a JSDoc comment in the plugin
  options type and a README entry.

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/)
and releases are automated with
[semantic-release](https://github.com/semantic-release/semantic-release). The
commit message controls the next version number, so it matters:

| Prefix | Use for | Effect |
| --- | --- | --- |
| `feat:` | A new feature | Minor release |
| `fix:` | A bug fix | Patch release |
| `docs:` | Documentation only | No release |
| `test:` | Tests only | No release |
| `chore:` | Tooling, dependencies, CI | No release |
| `refactor:` | Code change with no behavior change | No release |
| `perf:` | Performance improvement | Patch release |

A scope is optional but encouraged, e.g. `fix(css): scope selectors inside
container queries`. A `!` after the type or scope marks a breaking change:

```text
feat(css)!: rename the deep selector to ::deep
```

Pull requests are squash-merged, so the PR title becomes the commit message —
please make it conventional too.

## Pull request process

1. Fork the repository and create a topic branch from `main`
   (`git checkout -b fix/scoped-at-rules`).
2. Make your change, add tests, and update the README if you changed behavior
   or options.
3. Make sure the full suite passes locally:

   ```sh
   npm run build && npm test && npm run lint
   ```

4. Open the pull request against `main`. Describe the problem, the approach,
   and any trade-offs. Link related issues with `Closes #123`.
5. CI runs the build, unit tests, lint, and the e2e harness. All jobs must be
   green before a review.
6. Address review feedback by pushing additional commits; the branch is
   squash-merged when approved.

Draft pull requests are welcome if you want early feedback on an approach.

## Release process

Releases are cut automatically from `main` by semantic-release on every merge.
It determines the version from the commit history, publishes to npm, creates the
GitHub release with generated notes, and commits the new version back to the
repository with `[skip ci]`. Maintainers do not publish manually — merging a
`feat:` or `fix:` pull request is the release.

Prereleases are published under the `alpha` npm tag from `releases/<version>-alpha`
branches, independently of `main`. You do not need to do anything special for
those; contributors work against `main`.

## Questions

If anything here is unclear, open a
[discussion or issue](https://github.com/cmseguin/rollup-plugin-react-scoped-css/issues).
We would rather answer a question than have you guess.
