# dsa-preset

A plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) that replaces the built-in model selector with a command palette. Press **Alt+M** anywhere in the Web UI to search, filter, and switch models across configured providers.

## Install

```sh
dsh plugin --profile web add github:subfocusx/dsh-preset
```

Restart `dsh web`, then press **Alt+M** or click the model trigger in the composer area.

## Features

- Global palette: fuzzy search over model and provider names, arrow-key navigation, favorites, recent models.
- Provider configuration: add, edit, or remove provider routes (endpoint, protocol, credential reference) from the UI.
- Connection check: discover live models, validate API keys, classify Responses/Chat Completions protocol support.
- Model presets: bundled capacity presets with online refresh.
- Request retries: per-provider and per-model transient-failure retry rules.
- Relay: loopback-only fixed-destination relay for providers whose canonical domain is unreachable locally.
- Media tools (optional): OpenRouter image/video generation, disabled for paid models by default.

## Configuration

All settings live in the `dsa-preset` profile patch namespace. Every field is optional:

```yaml
- id: dsa-preset
  config:
    openrouterMedia:
      enabled: false
```

## Development

```sh
pnpm install
pnpm check   # typecheck + tests + build
```

Prebuilt `lib/` files are committed, so installs from GitHub need no build step.

## Requirements

- Node.js >= 22.19
- DeepSeek Harness >= 0.1.2-alpha.3
- pnpm >= 11.21 (development only)

## License

[MIT](LICENSE)
