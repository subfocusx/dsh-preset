window.__ModuleLoader__.load({
	id: "dsa-preset",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_dom = require("react-dom");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/model.ts
		function choiceKey(providerId, modelId) {
			return `${providerId}\u0000${modelId}`;
		}
		function selectionFor(provider, model) {
			return {
				provider: provider.id,
				model: model.id,
				...model.reasoning?.defaultEffort === void 0 ? {} : { reasoningEffort: model.reasoning.defaultEffort }
			};
		}
		function flattenChoices(groups) {
			let catalogIndex = 0;
			return groups.flatMap((provider) => provider.models.map((model) => ({
				key: choiceKey(provider.id, model.id),
				provider,
				model,
				selection: selectionFor(provider, model),
				catalogIndex: catalogIndex++
			})));
		}
		function currentChoice(choices, current) {
			if (current === null) return void 0;
			return choices.find((choice) => choice.provider.id === current.provider && choice.model.id === current.model);
		}
		function normalize(value) {
			return value?.trim().toLocaleLowerCase() ?? "";
		}
		function scoreField(field, token, weight) {
			if (field === token) return 1e3 + weight;
			if (field.startsWith(token)) return 700 + weight;
			if (field.split(/[^a-z0-9]+/u).some((part) => part.startsWith(token))) return 500 + weight;
			if (field.includes(token)) return 250 + weight;
			return -1;
		}
		function searchScore(choice, query) {
			const tokens = normalize(query).split(/\s+/u).filter(Boolean);
			if (tokens.length === 0) return 0;
			const fields = [
				[normalize(choice.model.name), 80],
				[normalize(choice.model.id), 70],
				[normalize(choice.provider.name), 55],
				[normalize(choice.provider.id), 45],
				[normalize(choice.model.description), 10]
			];
			let score = 0;
			for (const token of tokens) {
				let tokenScore = -1;
				for (const [field, weight] of fields) tokenScore = Math.max(tokenScore, scoreField(field, token, weight));
				if (tokenScore < 0) return null;
				score += tokenScore;
			}
			return score;
		}
		function rankChoices(choices, options) {
			const favoriteRank = new Map(options.favorites.map((key, index) => [key, index]));
			const recentRank = new Map(options.recents.map((key, index) => [key, index]));
			const quickFilter = options.quickFilter ?? "all";
			const currentKey = options.current === null ? null : choiceKey(options.current.provider, options.current.model);
			return choices.filter((choice) => options.providerId === null || choice.provider.id === options.providerId).filter((choice) => quickFilter === "all" || quickFilter === "favorites" && favoriteRank.has(choice.key) || quickFilter === "recents" && recentRank.has(choice.key)).map((choice) => ({
				choice,
				score: searchScore(choice, options.query)
			})).filter((entry) => entry.score !== null).sort((left, right) => {
				if (left.choice.key === currentKey) return -1;
				if (right.choice.key === currentKey) return 1;
				const leftFavorite = favoriteRank.get(left.choice.key);
				const rightFavorite = favoriteRank.get(right.choice.key);
				if (leftFavorite !== void 0 || rightFavorite !== void 0) {
					if (leftFavorite === void 0) return 1;
					if (rightFavorite === void 0) return -1;
					if (leftFavorite !== rightFavorite) return leftFavorite - rightFavorite;
				}
				const leftRecent = recentRank.get(left.choice.key);
				const rightRecent = recentRank.get(right.choice.key);
				if (leftRecent !== void 0 || rightRecent !== void 0) {
					if (leftRecent === void 0) return 1;
					if (rightRecent === void 0) return -1;
					if (leftRecent !== rightRecent) return leftRecent - rightRecent;
				}
				if (left.score !== right.score) return right.score - left.score;
				return left.choice.catalogIndex - right.choice.catalogIndex;
			}).map((entry) => entry.choice);
		}
		function pushRecent(recents, key, limit = 12) {
			return [key, ...recents.filter((entry) => entry !== key)].slice(0, limit);
		}
		function toggleFavorite(favorites, key) {
			return favorites.includes(key) ? favorites.filter((entry) => entry !== key) : [key, ...favorites];
		}
		validateRegistry({
			version: 5,
			updatedAt: "2026-09-20",
			presets: [
				{
					"id": "agnes-2-5-flash",
					"name": "Agnes 2.5 Flash",
					"aliases": ["agnes-2-5-flash", "agnes-2.5-flash"],
					"contextWindow": 524288,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Agnes model docs",
					"sourceUrl": "https://wiki.agnes-ai.com/en/docs/agnes-25-flash"
				},
				{
					"id": "agnes-2-5-pro",
					"name": "Agnes 2.5 Pro",
					"aliases": ["agnes-2-5-pro", "agnes-2.5-pro"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Agnes model docs",
					"sourceUrl": "https://wiki.agnes-ai.com/en/docs/agnes-25-pro"
				},
				{
					"id": "agnes-2-5-pro-beta",
					"name": "Agnes 2.5 Pro Beta",
					"aliases": ["agnes-2-5-pro-beta", "agnes-2.5-pro-beta"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Agnes model docs",
					"sourceUrl": "https://wiki.agnes-ai.com/en/docs/agnes-25-pro-beta"
				},
				{
					"id": "agnes-3-0-flash",
					"name": "Agnes 3.0 Flash",
					"aliases": ["agnes-3-0-flash", "agnes-3.0-flash"],
					"contextWindow": 524288,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Agnes model docs",
					"sourceUrl": "https://wiki.agnes-ai.com/en/docs/agnes-30-flash"
				},
				{
					"id": "amazon-bedrock-amazon-nova-2-lite-v1:0",
					"name": "Amazon Bedrock: Nova 2 Lite",
					"aliases": ["amazon-nova-2-lite-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-amazon-nova-lite-v1:0",
					"name": "Amazon Bedrock: Nova Lite",
					"aliases": ["amazon-nova-lite-v1:0"],
					"contextWindow": 3e5,
					"maxTokens": 8192,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-amazon-nova-micro-v1:0",
					"name": "Amazon Bedrock: Nova Micro",
					"aliases": ["amazon-nova-micro-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-amazon-nova-pro-v1:0",
					"name": "Amazon Bedrock: Nova Pro",
					"aliases": ["amazon-nova-pro-v1:0"],
					"contextWindow": 3e5,
					"maxTokens": 8192,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-fable-5",
					"name": "Amazon Bedrock: Claude Fable 5",
					"aliases": ["anthropic-claude-fable-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-fable-5-1",
					"name": "Amazon Bedrock: Claude Fable 5.1",
					"aliases": ["anthropic-claude-fable-5-1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-haiku-4-5-20251001-v1:0",
					"name": "Amazon Bedrock: Claude Haiku 4.5",
					"aliases": ["anthropic-claude-haiku-4-5-20251001-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-opus-4-1-20250805-v1:0",
					"name": "Amazon Bedrock: Claude Opus 4.1",
					"aliases": ["anthropic-claude-opus-4-1-20250805-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-opus-4-5-20251101-v1:0",
					"name": "Amazon Bedrock: Claude Opus 4.5",
					"aliases": ["anthropic-claude-opus-4-5-20251101-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-opus-4-6-v1",
					"name": "Amazon Bedrock: Claude Opus 4.6",
					"aliases": ["anthropic-claude-opus-4-6-v1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-opus-4-7",
					"name": "Amazon Bedrock: Claude Opus 4.7",
					"aliases": ["anthropic-claude-opus-4-7"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-opus-4-8",
					"name": "Amazon Bedrock: Claude Opus 4.8",
					"aliases": ["anthropic-claude-opus-4-8"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-sonnet-4-5-20250929-v1:0",
					"name": "Amazon Bedrock: Claude Sonnet 4.5",
					"aliases": ["anthropic-claude-sonnet-4-5-20250929-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-sonnet-4-6",
					"name": "Amazon Bedrock: Claude Sonnet 4.6",
					"aliases": ["anthropic-claude-sonnet-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-sonnet-5",
					"name": "Amazon Bedrock: Claude Sonnet 5",
					"aliases": ["anthropic-claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-au-anthropic-claude-haiku-4-5-20251001-v1:0",
					"name": "Amazon Bedrock: Claude Haiku 4.5 (AU)",
					"aliases": ["au-anthropic-claude-haiku-4-5-20251001-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-au-anthropic-claude-opus-4-6-v1",
					"name": "Amazon Bedrock: AU Anthropic Claude Opus 4.6",
					"aliases": ["au-anthropic-claude-opus-4-6-v1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-au-anthropic-claude-opus-4-8",
					"name": "Amazon Bedrock: Claude Opus 4.8 (AU)",
					"aliases": ["au-anthropic-claude-opus-4-8"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-au-anthropic-claude-opus-5",
					"name": "Amazon Bedrock: Claude Opus 5 (AU)",
					"aliases": ["au-anthropic-claude-opus-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-au-anthropic-claude-sonnet-4-5-20250929-v1:0",
					"name": "Amazon Bedrock: Claude Sonnet 4.5 (AU)",
					"aliases": ["au-anthropic-claude-sonnet-4-5-20250929-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-au-anthropic-claude-sonnet-4-6",
					"name": "Amazon Bedrock: AU Anthropic Claude Sonnet 4.6",
					"aliases": ["au-anthropic-claude-sonnet-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-au-anthropic-claude-sonnet-5",
					"name": "Amazon Bedrock: Claude Sonnet 5 (AU)",
					"aliases": ["au-anthropic-claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-deepseek-r1-v1:0",
					"name": "Amazon Bedrock: DeepSeek-R1",
					"aliases": ["deepseek-r1-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-deepseek-v3-v1:0",
					"name": "Amazon Bedrock: DeepSeek-V3.1",
					"aliases": ["deepseek-v3-v1:0"],
					"contextWindow": 163840,
					"maxTokens": 81920,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-fable-5",
					"name": "Amazon Bedrock: Claude Fable 5 (EU)",
					"aliases": ["eu-anthropic-claude-fable-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-haiku-4-5-20251001-v1:0",
					"name": "Amazon Bedrock: Claude Haiku 4.5 (EU)",
					"aliases": ["eu-anthropic-claude-haiku-4-5-20251001-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-opus-4-5-20251101-v1:0",
					"name": "Amazon Bedrock: Claude Opus 4.5 (EU)",
					"aliases": ["eu-anthropic-claude-opus-4-5-20251101-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-opus-4-6-v1",
					"name": "Amazon Bedrock: Claude Opus 4.6 (EU)",
					"aliases": ["eu-anthropic-claude-opus-4-6-v1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-opus-4-7",
					"name": "Amazon Bedrock: Claude Opus 4.7 (EU)",
					"aliases": ["eu-anthropic-claude-opus-4-7"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-opus-4-8",
					"name": "Amazon Bedrock: Claude Opus 4.8 (EU)",
					"aliases": ["eu-anthropic-claude-opus-4-8"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-opus-5",
					"name": "Amazon Bedrock: Claude Opus 5 (EU)",
					"aliases": ["eu-anthropic-claude-opus-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-sonnet-4-5-20250929-v1:0",
					"name": "Amazon Bedrock: Claude Sonnet 4.5 (EU)",
					"aliases": ["eu-anthropic-claude-sonnet-4-5-20250929-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-sonnet-4-6",
					"name": "Amazon Bedrock: Claude Sonnet 4.6 (EU)",
					"aliases": ["eu-anthropic-claude-sonnet-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-sonnet-5",
					"name": "Amazon Bedrock: Claude Sonnet 5 (EU)",
					"aliases": ["eu-anthropic-claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-fable-5",
					"name": "Amazon Bedrock: Claude Fable 5 (Global)",
					"aliases": ["global-anthropic-claude-fable-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-fable-5-1",
					"name": "Amazon Bedrock: Claude Fable 5.1 (Global)",
					"aliases": ["global-anthropic-claude-fable-5-1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-haiku-4-5-20251001-v1:0",
					"name": "Amazon Bedrock: Claude Haiku 4.5 (Global)",
					"aliases": ["global-anthropic-claude-haiku-4-5-20251001-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-opus-4-5-20251101-v1:0",
					"name": "Amazon Bedrock: Claude Opus 4.5 (Global)",
					"aliases": ["global-anthropic-claude-opus-4-5-20251101-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-opus-4-6-v1",
					"name": "Amazon Bedrock: Claude Opus 4.6 (Global)",
					"aliases": ["global-anthropic-claude-opus-4-6-v1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-opus-4-7",
					"name": "Amazon Bedrock: Claude Opus 4.7 (Global)",
					"aliases": ["global-anthropic-claude-opus-4-7"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-opus-4-8",
					"name": "Amazon Bedrock: Claude Opus 4.8 (Global)",
					"aliases": ["global-anthropic-claude-opus-4-8"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-opus-5",
					"name": "Amazon Bedrock: Claude Opus 5 (Global)",
					"aliases": ["global-anthropic-claude-opus-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-sonnet-4-5-20250929-v1:0",
					"name": "Amazon Bedrock: Claude Sonnet 4.5 (Global)",
					"aliases": ["global-anthropic-claude-sonnet-4-5-20250929-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-sonnet-4-6",
					"name": "Amazon Bedrock: Claude Sonnet 4.6 (Global)",
					"aliases": ["global-anthropic-claude-sonnet-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-sonnet-5",
					"name": "Amazon Bedrock: Claude Sonnet 5 (Global)",
					"aliases": ["global-anthropic-claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-openai-gpt-5-6-luna",
					"name": "Amazon Bedrock: GPT-5.6 Luna (Global)",
					"aliases": ["global-openai-gpt-5-6-luna"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-openai-gpt-5-6-sol",
					"name": "Amazon Bedrock: GPT-5.6 Sol (Global)",
					"aliases": ["global-openai-gpt-5-6-sol"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-openai-gpt-5-6-terra",
					"name": "Amazon Bedrock: GPT-5.6 Terra (Global)",
					"aliases": ["global-openai-gpt-5-6-terra"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-google-gemma-3-27b-it",
					"name": "Amazon Bedrock: Google Gemma 3 27B Instruct",
					"aliases": ["google-gemma-3-27b-it"],
					"contextWindow": 202752,
					"maxTokens": 8192,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-google-gemma-3-4b-it",
					"name": "Amazon Bedrock: Gemma 3 4B IT",
					"aliases": ["google-gemma-3-4b-it"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-jp-anthropic-claude-haiku-4-5-20251001-v1:0",
					"name": "Amazon Bedrock: Claude Haiku 4.5 (JP)",
					"aliases": ["jp-anthropic-claude-haiku-4-5-20251001-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-jp-anthropic-claude-opus-4-7",
					"name": "Amazon Bedrock: Claude Opus 4.7 (JP)",
					"aliases": ["jp-anthropic-claude-opus-4-7"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-jp-anthropic-claude-opus-4-8",
					"name": "Amazon Bedrock: Claude Opus 4.8 (JP)",
					"aliases": ["jp-anthropic-claude-opus-4-8"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-jp-anthropic-claude-opus-5",
					"name": "Amazon Bedrock: Claude Opus 5 (JP)",
					"aliases": ["jp-anthropic-claude-opus-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-jp-anthropic-claude-sonnet-4-5-20250929-v1:0",
					"name": "Amazon Bedrock: Claude Sonnet 4.5 (JP)",
					"aliases": ["jp-anthropic-claude-sonnet-4-5-20250929-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-jp-anthropic-claude-sonnet-4-6",
					"name": "Amazon Bedrock: Claude Sonnet 4.6 (JP)",
					"aliases": ["jp-anthropic-claude-sonnet-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-jp-anthropic-claude-sonnet-5",
					"name": "Amazon Bedrock: Claude Sonnet 5 (JP)",
					"aliases": ["jp-anthropic-claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-meta-llama3-1-70b-instruct-v1:0",
					"name": "Amazon Bedrock: Llama 3.1 70B Instruct",
					"aliases": ["meta-llama3-1-70b-instruct-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-meta-llama3-1-8b-instruct-v1:0",
					"name": "Amazon Bedrock: Llama 3.1 8B Instruct",
					"aliases": ["meta-llama3-1-8b-instruct-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-meta-llama3-3-70b-instruct-v1:0",
					"name": "Amazon Bedrock: Llama 3.3 70B Instruct",
					"aliases": ["meta-llama3-3-70b-instruct-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-meta-llama4-maverick-17b-instruct-v1:0",
					"name": "Amazon Bedrock: Llama 4 Maverick 17B Instruct",
					"aliases": ["meta-llama4-maverick-17b-instruct-v1:0"],
					"contextWindow": 1e6,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-meta-llama4-scout-17b-instruct-v1:0",
					"name": "Amazon Bedrock: Llama 4 Scout 17B Instruct",
					"aliases": ["meta-llama4-scout-17b-instruct-v1:0"],
					"contextWindow": 35e5,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-minimax-minimax-m2",
					"name": "Amazon Bedrock: MiniMax M2",
					"aliases": ["minimax-minimax-m2"],
					"contextWindow": 204608,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-minimax-minimax-m2-1",
					"name": "Amazon Bedrock: MiniMax M2.1",
					"aliases": ["minimax-minimax-m2-1"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-minimax-minimax-m2-5",
					"name": "Amazon Bedrock: MiniMax M2.5",
					"aliases": ["minimax-minimax-m2-5"],
					"contextWindow": 196608,
					"maxTokens": 98304,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-devstral-2-123b",
					"name": "Amazon Bedrock: Devstral 2 123B",
					"aliases": ["mistral-devstral-2-123b"],
					"contextWindow": 256e3,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-magistral-small-2509",
					"name": "Amazon Bedrock: Magistral Small 1.2",
					"aliases": ["mistral-magistral-small-2509"],
					"contextWindow": 128e3,
					"maxTokens": 4e4,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-ministral-3-14b-instruct",
					"name": "Amazon Bedrock: Ministral 14B 3.0",
					"aliases": ["mistral-ministral-3-14b-instruct"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-ministral-3-3b-instruct",
					"name": "Amazon Bedrock: Ministral 3 3B",
					"aliases": ["mistral-ministral-3-3b-instruct"],
					"contextWindow": 256e3,
					"maxTokens": 8192,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-ministral-3-8b-instruct",
					"name": "Amazon Bedrock: Ministral 3 8B",
					"aliases": ["mistral-ministral-3-8b-instruct"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-mistral-large-3-675b-instruct",
					"name": "Amazon Bedrock: Mistral Large 3",
					"aliases": ["mistral-mistral-large-3-675b-instruct"],
					"contextWindow": 256e3,
					"maxTokens": 8192,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-pixtral-large-2502-v1:0",
					"name": "Amazon Bedrock: Pixtral Large (25.02)",
					"aliases": ["mistral-pixtral-large-2502-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 8192,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-voxtral-mini-3b-2507",
					"name": "Amazon Bedrock: Voxtral Mini 3B 2507",
					"aliases": ["mistral-voxtral-mini-3b-2507"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-voxtral-small-24b-2507",
					"name": "Amazon Bedrock: Voxtral Small 24B 2507",
					"aliases": ["mistral-voxtral-small-24b-2507"],
					"contextWindow": 32e3,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-moonshot-kimi-k2-thinking",
					"name": "Amazon Bedrock: Kimi K2 Thinking",
					"aliases": ["moonshot-kimi-k2-thinking"],
					"contextWindow": 262143,
					"maxTokens": 16e3,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-moonshotai-kimi-k2-5",
					"name": "Amazon Bedrock: Kimi K2.5",
					"aliases": ["moonshotai-kimi-k2-5"],
					"contextWindow": 262143,
					"maxTokens": 16e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-nvidia-nemotron-nano-12b-v2",
					"name": "Amazon Bedrock: NVIDIA Nemotron Nano 12B v2 VL BF16",
					"aliases": ["nvidia-nemotron-nano-12b-v2"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-nvidia-nemotron-nano-3-30b",
					"name": "Amazon Bedrock: NVIDIA Nemotron Nano 3 30B",
					"aliases": ["nvidia-nemotron-nano-3-30b"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-nvidia-nemotron-nano-9b-v2",
					"name": "Amazon Bedrock: NVIDIA Nemotron Nano 9B v2",
					"aliases": ["nvidia-nemotron-nano-9b-v2"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-nvidia-nemotron-super-3-120b",
					"name": "Amazon Bedrock: NVIDIA Nemotron 3 Super 120B A12B",
					"aliases": ["nvidia-nemotron-super-3-120b"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-5-4",
					"name": "Amazon Bedrock: GPT-5.4",
					"aliases": ["openai-gpt-5-4"],
					"contextWindow": 272e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-5-5",
					"name": "Amazon Bedrock: GPT-5.5",
					"aliases": ["openai-gpt-5-5"],
					"contextWindow": 272e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-5-6-luna",
					"name": "Amazon Bedrock: GPT-5.6 Luna",
					"aliases": ["openai-gpt-5-6-luna"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-5-6-sol",
					"name": "Amazon Bedrock: GPT-5.6 Sol",
					"aliases": ["openai-gpt-5-6-sol"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-5-6-terra",
					"name": "Amazon Bedrock: GPT-5.6 Terra",
					"aliases": ["openai-gpt-5-6-terra"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-oss-120b",
					"name": "Amazon Bedrock: gpt-oss-120b",
					"aliases": ["openai-gpt-oss-120b"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-oss-120b-1:0",
					"name": "Amazon Bedrock: gpt-oss-120b",
					"aliases": ["openai-gpt-oss-120b-1:0"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-oss-20b",
					"name": "Amazon Bedrock: gpt-oss-20b",
					"aliases": ["openai-gpt-oss-20b"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-oss-20b-1:0",
					"name": "Amazon Bedrock: gpt-oss-20b",
					"aliases": ["openai-gpt-oss-20b-1:0"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-oss-safeguard-120b",
					"name": "Amazon Bedrock: GPT OSS Safeguard 120B",
					"aliases": ["openai-gpt-oss-safeguard-120b"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-oss-safeguard-20b",
					"name": "Amazon Bedrock: GPT OSS Safeguard 20B",
					"aliases": ["openai-gpt-oss-safeguard-20b"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-qwen-qwen3-235b-a22b-2507-v1:0",
					"name": "Amazon Bedrock: Qwen3 235B A22B 2507",
					"aliases": ["qwen-qwen3-235b-a22b-2507-v1:0"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-qwen-qwen3-32b-v1:0",
					"name": "Amazon Bedrock: Qwen3 32B (dense)",
					"aliases": ["qwen-qwen3-32b-v1:0"],
					"contextWindow": 16384,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-qwen-qwen3-coder-30b-a3b-v1:0",
					"name": "Amazon Bedrock: Qwen3 Coder 30B A3B Instruct",
					"aliases": ["qwen-qwen3-coder-30b-a3b-v1:0"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-qwen-qwen3-coder-480b-a35b-v1:0",
					"name": "Amazon Bedrock: Qwen3 Coder 480B A35B Instruct",
					"aliases": ["qwen-qwen3-coder-480b-a35b-v1:0"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-qwen-qwen3-coder-next",
					"name": "Amazon Bedrock: Qwen3 Coder Next",
					"aliases": ["qwen-qwen3-coder-next"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-qwen-qwen3-next-80b-a3b",
					"name": "Amazon Bedrock: Qwen/Qwen3-Next-80B-A3B-Instruct",
					"aliases": ["qwen-qwen3-next-80b-a3b"],
					"contextWindow": 262e3,
					"maxTokens": 262e3,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-qwen-qwen3-vl-235b-a22b",
					"name": "Amazon Bedrock: Qwen/Qwen3-VL-235B-A22B-Instruct",
					"aliases": ["qwen-qwen3-vl-235b-a22b"],
					"contextWindow": 262e3,
					"maxTokens": 262e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-fable-5",
					"name": "Amazon Bedrock: Claude Fable 5 (US)",
					"aliases": ["us-anthropic-claude-fable-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-fable-5-1",
					"name": "Amazon Bedrock: Claude Fable 5.1 (US)",
					"aliases": ["us-anthropic-claude-fable-5-1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-haiku-4-5-20251001-v1:0",
					"name": "Amazon Bedrock: Claude Haiku 4.5 (US)",
					"aliases": ["us-anthropic-claude-haiku-4-5-20251001-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-opus-4-1-20250805-v1:0",
					"name": "Amazon Bedrock: Claude Opus 4.1 (US)",
					"aliases": ["us-anthropic-claude-opus-4-1-20250805-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-opus-4-5-20251101-v1:0",
					"name": "Amazon Bedrock: Claude Opus 4.5 (US)",
					"aliases": ["us-anthropic-claude-opus-4-5-20251101-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-opus-4-6-v1",
					"name": "Amazon Bedrock: Claude Opus 4.6 (US)",
					"aliases": ["us-anthropic-claude-opus-4-6-v1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-opus-4-7",
					"name": "Amazon Bedrock: Claude Opus 4.7 (US)",
					"aliases": ["us-anthropic-claude-opus-4-7"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-opus-4-8",
					"name": "Amazon Bedrock: Claude Opus 4.8 (US)",
					"aliases": ["us-anthropic-claude-opus-4-8"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-opus-5",
					"name": "Amazon Bedrock: Claude Opus 5 (US)",
					"aliases": ["us-anthropic-claude-opus-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-sonnet-4-5-20250929-v1:0",
					"name": "Amazon Bedrock: Claude Sonnet 4.5 (US)",
					"aliases": ["us-anthropic-claude-sonnet-4-5-20250929-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-sonnet-4-6",
					"name": "Amazon Bedrock: Claude Sonnet 4.6 (US)",
					"aliases": ["us-anthropic-claude-sonnet-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-sonnet-5",
					"name": "Amazon Bedrock: Claude Sonnet 5 (US)",
					"aliases": ["us-anthropic-claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-deepseek-r1-v1:0",
					"name": "Amazon Bedrock: DeepSeek-R1 (US)",
					"aliases": ["us-deepseek-r1-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-meta-llama4-maverick-17b-instruct-v1:0",
					"name": "Amazon Bedrock: Llama 4 Maverick 17B Instruct (US)",
					"aliases": ["us-meta-llama4-maverick-17b-instruct-v1:0"],
					"contextWindow": 1e6,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-meta-llama4-scout-17b-instruct-v1:0",
					"name": "Amazon Bedrock: Llama 4 Scout 17B Instruct (US)",
					"aliases": ["us-meta-llama4-scout-17b-instruct-v1:0"],
					"contextWindow": 35e5,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-writer-palmyra-x4-v1:0",
					"name": "Amazon Bedrock: Palmyra X4",
					"aliases": ["writer-palmyra-x4-v1:0"],
					"contextWindow": 122880,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-writer-palmyra-x5-v1:0",
					"name": "Amazon Bedrock: Palmyra X5",
					"aliases": ["writer-palmyra-x5-v1:0"],
					"contextWindow": 104e4,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-xai-grok-4-3",
					"name": "Amazon Bedrock: Grok 4.3",
					"aliases": ["xai-grok-4-3"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-xai-grok-4-6",
					"name": "Amazon Bedrock: Grok 4.6",
					"aliases": ["xai-grok-4-6"],
					"contextWindow": 5e5,
					"maxTokens": 5e5,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-zai-glm-4-7",
					"name": "Amazon Bedrock: GLM-4.7",
					"aliases": ["zai-glm-4-7"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-zai-glm-4-7-flash",
					"name": "Amazon Bedrock: GLM-4.7-Flash",
					"aliases": ["zai-glm-4-7-flash"],
					"contextWindow": 2e5,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-zai-glm-5",
					"name": "Amazon Bedrock: GLM-5",
					"aliases": ["zai-glm-5"],
					"contextWindow": 202752,
					"maxTokens": 101376,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "ant-ling-ling-2-6-1t",
					"name": "Ant Ling: Ling 2.6 1T",
					"aliases": ["ling-2-6-1t"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "Ant Ling docs",
					"sourceUrl": "https://ling.antgroup.com/"
				},
				{
					"id": "ant-ling-ling-2-6-flash",
					"name": "Ant Ling: Ling 2.6 Flash",
					"aliases": ["ling-2-6-flash"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "Ant Ling docs",
					"sourceUrl": "https://ling.antgroup.com/"
				},
				{
					"id": "ant-ling-ring-2-6-1t",
					"name": "Ant Ling: Ring 2.6 1T",
					"aliases": ["ring-2-6-1t"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "Ant Ling docs",
					"sourceUrl": "https://ling.antgroup.com/"
				},
				{
					"id": "anthropic-claude-fable-5",
					"name": "Anthropic Claude Fable 5",
					"aliases": ["claude-fable-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-fable-5-1",
					"name": "Anthropic: Claude Fable 5.1",
					"aliases": ["claude-fable-5-1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-haiku-4-5-20251001",
					"name": "Anthropic: Claude Haiku 4.5",
					"aliases": ["claude-haiku-4-5-20251001"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-haiku-4.5",
					"name": "Anthropic Claude Haiku 4.5",
					"aliases": ["claude-haiku-4-5"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "anthropic-claude-opus-4-5",
					"name": "Anthropic: Claude Opus 4.5 (latest)",
					"aliases": ["claude-opus-4-5"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-opus-4-5-20251101",
					"name": "Anthropic: Claude Opus 4.5",
					"aliases": ["claude-opus-4-5-20251101"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-opus-4-7",
					"name": "Anthropic: Claude Opus 4.7",
					"aliases": ["claude-opus-4-7"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-opus-4.6",
					"name": "Anthropic Claude Opus 4.6",
					"aliases": ["claude-opus-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "anthropic-claude-opus-4.8",
					"name": "Anthropic Claude Opus 4.8",
					"aliases": ["claude-opus-4-8"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-opus-5",
					"name": "Anthropic Claude Opus 5",
					"aliases": ["claude-opus-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-sonnet-4-5",
					"name": "Anthropic: Claude Sonnet 4.5 (latest)",
					"aliases": ["claude-sonnet-4-5"],
					"contextWindow": 1e6,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-sonnet-4-5-20250929",
					"name": "Anthropic: Claude Sonnet 4.5",
					"aliases": ["claude-sonnet-4-5-20250929"],
					"contextWindow": 1e6,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-sonnet-4.6",
					"name": "Anthropic Claude Sonnet 4.6",
					"aliases": ["claude-sonnet-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "anthropic-claude-sonnet-5",
					"name": "Anthropic Claude Sonnet 5",
					"aliases": ["claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "baseten-glm-5-2-fast",
					"name": "Baseten: GLM 5.2 Fast",
					"aliases": ["glm-5-2-fast", "zai-org/glm-5-2-fast"],
					"contextWindow": 1048576,
					"maxTokens": 262144,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Baseten model docs",
					"sourceUrl": "https://docs.baseten.co/"
				},
				{
					"id": "baseten-glm-5-3-fast",
					"name": "Baseten: GLM 5.3 Fast",
					"aliases": ["glm-5-3-fast", "zai-org/glm-5-3-fast"],
					"contextWindow": 1048576,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Baseten model docs",
					"sourceUrl": "https://docs.baseten.co/"
				},
				{
					"id": "baseten-nemotron-120b-a12b",
					"name": "Baseten: Nemotron Super",
					"aliases": ["nemotron-120b-a12b", "nvidia/nemotron-120b-a12b"],
					"contextWindow": 202800,
					"maxTokens": 202800,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "off",
						"high": "high"
					},
					"sourceLabel": "Baseten model docs",
					"sourceUrl": "https://docs.baseten.co/"
				},
				{
					"id": "baseten-nvidia-nemotron-3-ultra-550b-a55b",
					"name": "Baseten: Nemotron Ultra",
					"aliases": ["nvidia-nemotron-3-ultra-550b-a55b", "nvidia/nvidia-nemotron-3-ultra-550b-a55b"],
					"contextWindow": 202800,
					"maxTokens": 202800,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "off",
						"high": "high"
					},
					"sourceLabel": "Baseten model docs",
					"sourceUrl": "https://docs.baseten.co/"
				},
				{
					"id": "cerebras-gemma-4-31b",
					"name": "Cerebras: Gemma 4 31B IT",
					"aliases": ["gemma-4-31b"],
					"contextWindow": 131072,
					"maxTokens": 40960,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "Cerebras model docs",
					"sourceUrl": "https://inference-docs.cerebras.ai/models/overview"
				},
				{
					"id": "cloudflare-workers-ai-granite-4-0-h-micro",
					"name": "Cloudflare Workers AI: Granite 4.0 H Micro",
					"aliases": ["granite-4-0-h-micro", "@cf/ibm-granite/granite-4-0-h-micro"],
					"contextWindow": 131e3,
					"maxTokens": 131e3,
					"input": ["text"],
					"sourceLabel": "Cloudflare Workers AI docs",
					"sourceUrl": "https://developers.cloudflare.com/workers-ai/"
				},
				{
					"id": "cloudflare-workers-ai-llama-3-3-70b-instruct-fp8-fast",
					"name": "Cloudflare Workers AI: Llama 3.3 70B Instruct fp8 Fast",
					"aliases": ["llama-3-3-70b-instruct-fp8-fast", "@cf/meta/llama-3-3-70b-instruct-fp8-fast"],
					"contextWindow": 24e3,
					"maxTokens": 24e3,
					"input": ["text"],
					"sourceLabel": "Cloudflare Workers AI docs",
					"sourceUrl": "https://developers.cloudflare.com/workers-ai/"
				},
				{
					"id": "cloudflare-workers-ai-llama-4-scout-17b-16e-instruct",
					"name": "Cloudflare Workers AI: Llama 4 Scout 17B 16E Instruct",
					"aliases": ["llama-4-scout-17b-16e-instruct", "@cf/meta/llama-4-scout-17b-16e-instruct"],
					"contextWindow": 131e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "Cloudflare Workers AI docs",
					"sourceUrl": "https://developers.cloudflare.com/workers-ai/"
				},
				{
					"id": "cloudflare-workers-ai-mistral-small-3-1-24b-instruct",
					"name": "Cloudflare Workers AI: Mistral Small 3.1 24B Instruct",
					"aliases": ["mistral-small-3-1-24b-instruct", "@cf/mistralai/mistral-small-3-1-24b-instruct"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Cloudflare Workers AI docs",
					"sourceUrl": "https://developers.cloudflare.com/workers-ai/"
				},
				{
					"id": "cloudflare-workers-ai-nemotron-3-120b-a12b",
					"name": "Cloudflare Workers AI: Nemotron 3 Super 120B",
					"aliases": ["nemotron-3-120b-a12b", "@cf/nvidia/nemotron-3-120b-a12b"],
					"contextWindow": 256e3,
					"maxTokens": 256e3,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "Cloudflare Workers AI docs",
					"sourceUrl": "https://developers.cloudflare.com/workers-ai/"
				},
				{
					"id": "cloudflare-workers-ai-qwen3-30b-a3b-fp8",
					"name": "Cloudflare Workers AI: Qwen3 30B A3b fp8",
					"aliases": ["qwen3-30b-a3b-fp8", "@cf/qwen/qwen3-30b-a3b-fp8"],
					"contextWindow": 32768,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "Cloudflare Workers AI docs",
					"sourceUrl": "https://developers.cloudflare.com/workers-ai/"
				},
				{
					"id": "cohere-command-a",
					"name": "Cohere Command A",
					"aliases": [
						"command-a",
						"cohere-command-a",
						"command-a-03-2025"
					],
					"contextWindow": 262144,
					"input": ["text"],
					"sourceLabel": "Cohere Command A docs",
					"sourceUrl": "https://docs.cohere.com/docs/command-a"
				},
				{
					"id": "deepseek-v4-flash",
					"name": "DeepSeek V4 Flash",
					"aliases": ["deepseek-v4-flash"],
					"contextWindow": 1e6,
					"maxTokens": 384e3,
					"input": ["text"],
					"reasoningEfforts": {
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "DeepSeek API docs",
					"sourceUrl": "https://api-docs.deepseek.com/quick_start/pricing"
				},
				{
					"id": "deepseek-v4-flash-vision-exp",
					"name": "DeepSeek V4 Flash Vision Exp",
					"aliases": ["deepseek-v4-flash-vision-exp"],
					"contextWindow": 1e6,
					"maxTokens": 384e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "DeepSeek API docs",
					"sourceUrl": "https://api-docs.deepseek.com/quick_start/pricing"
				},
				{
					"id": "deepseek-v4-pro",
					"name": "DeepSeek V4 Pro",
					"aliases": ["deepseek-v4-pro"],
					"contextWindow": 1e6,
					"maxTokens": 384e3,
					"input": ["text"],
					"reasoningEfforts": {
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "DeepSeek API docs",
					"sourceUrl": "https://api-docs.deepseek.com/quick_start/pricing"
				},
				{
					"id": "doubao-1-5-pro-32k",
					"name": "Doubao 1.5 Pro 32K",
					"aliases": [
						"doubao-1-5-pro-32k",
						"doubao-1.5-pro-32k",
						"doubao-1-5-pro-32k-250115"
					],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "火山方舟模型列表",
					"sourceUrl": "https://www.volcengine.com/docs/82379/1799865"
				},
				{
					"id": "doubao-seed-1-6",
					"name": "Doubao Seed 1.6",
					"aliases": [
						"doubao-seed-1-6",
						"doubao-seed-1.6",
						"doubao-seed-1-6-250615"
					],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "火山方舟模型列表",
					"sourceUrl": "https://www.volcengine.com/docs/82379/1799865"
				},
				{
					"id": "doubao-seed-1-6-vision",
					"name": "Doubao Seed 1.6 Vision",
					"aliases": ["doubao-seed-1-6-vision", "doubao-seed-1.6-vision"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "火山方舟模型列表",
					"sourceUrl": "https://www.volcengine.com/docs/82379/1799865"
				},
				{
					"id": "doubao-seed-1-8",
					"name": "Doubao Seed 1.8",
					"aliases": [
						"doubao-seed-1-8",
						"doubao-seed-1.8",
						"doubao-seed-1-8-251228"
					],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "火山方舟模型列表",
					"sourceUrl": "https://www.volcengine.com/docs/82379/1799865"
				},
				{
					"id": "doubao-seed-2-0-code-preview",
					"name": "Doubao Seed 2.0 Code Preview",
					"aliases": ["doubao-seed-2-0-code-preview", "doubao-seed-2.0-code-preview"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"sourceLabel": "火山方舟模型列表",
					"sourceUrl": "https://www.volcengine.com/docs/82379/1799865"
				},
				{
					"id": "doubao-seed-character",
					"name": "Doubao Seed Character",
					"aliases": [
						"doubao-seed-character",
						"doubao-seed-character-260628",
						"doubao-seed-character-251128"
					],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "火山方舟模型列表",
					"sourceUrl": "https://www.volcengine.com/docs/82379/1799865"
				},
				{
					"id": "fireworks-glm-5p2",
					"name": "Fireworks: GLM 5.2",
					"aliases": ["glm-5p2", "accounts/fireworks/models/glm-5p2"],
					"contextWindow": 1048575,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"low": "high",
						"medium": "high",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-glm-5p2-fast",
					"name": "Fireworks: GLM 5.2 Fast",
					"aliases": ["glm-5p2-fast", "accounts/fireworks/routers/glm-5p2-fast"],
					"contextWindow": 1048575,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"low": "high",
						"medium": "high",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-glm-5p3",
					"name": "Fireworks: GLM 5.3",
					"aliases": ["glm-5p3", "accounts/fireworks/models/glm-5p3"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-glm-5p3-flash",
					"name": "Fireworks: GLM 5.3 Flash",
					"aliases": ["glm-5p3-flash", "accounts/fireworks/models/glm-5p3-flash"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-kimi-k2p6",
					"name": "Fireworks: Kimi K2.6",
					"aliases": ["kimi-k2p6", "accounts/fireworks/models/kimi-k2p6"],
					"contextWindow": 262e3,
					"maxTokens": 262e3,
					"input": ["text", "image"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-kimi-k2p7-code",
					"name": "Fireworks: Kimi K2.7 Code",
					"aliases": ["kimi-k2p7-code", "accounts/fireworks/models/kimi-k2p7-code"],
					"contextWindow": 262e3,
					"maxTokens": 262e3,
					"input": ["text", "image"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-kimi-k3-fast",
					"name": "Fireworks: Kimi K3 Fast",
					"aliases": ["kimi-k3-fast", "accounts/fireworks/routers/kimi-k3-fast"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-muse-glimmer-30b",
					"name": "Fireworks: Muse Glimmer 30B",
					"aliases": ["muse-glimmer-30b", "accounts/fireworks/models/muse-glimmer-30b"],
					"contextWindow": 131072,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-nemotron-3-ultra-nvfp4",
					"name": "Fireworks: Nemotron 3 Ultra 550B A55B",
					"aliases": ["nemotron-3-ultra-nvfp4", "accounts/fireworks/models/nemotron-3-ultra-nvfp4"],
					"contextWindow": 262144,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-nemotron-lightning-3p5-30b-a3b",
					"name": "Fireworks: Nemotron 3.5 Lightning 30B A3B",
					"aliases": ["nemotron-lightning-3p5-30b-a3b", "accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-qwen3p7-plus",
					"name": "Fireworks: Qwen 3.7 Plus",
					"aliases": ["qwen3p7-plus", "accounts/fireworks/models/qwen3p7-plus"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-qwen3p8-2p4t-a95b",
					"name": "Fireworks: Qwen3.8 2.4T A95B",
					"aliases": ["qwen3p8-2p4t-a95b", "accounts/fireworks/models/qwen3p8-2p4t-a95b"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-qwen3p8-max",
					"name": "Fireworks: Qwen3.8 Max",
					"aliases": ["qwen3p8-max", "accounts/fireworks/models/qwen3p8-max"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "github-copilot-mai-code-1-1-flash",
					"name": "GitHub Copilot: MAI-Code-1.1-Flash",
					"aliases": ["mai-code-1-1-flash"],
					"contextWindow": 256e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "GitHub Copilot docs",
					"sourceUrl": "https://docs.github.com/en/copilot"
				},
				{
					"id": "github-copilot-mai-code-1-flash-picker",
					"name": "GitHub Copilot: MAI-Code-1-Flash",
					"aliases": ["mai-code-1-flash-picker"],
					"contextWindow": 256e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "GitHub Copilot docs",
					"sourceUrl": "https://docs.github.com/en/copilot"
				},
				{
					"id": "google-deep-research-max-preview-04-2026",
					"name": "Google: Deep Research Max Preview (Apr-21-2026)",
					"aliases": ["deep-research-max-preview-04-2026"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-deep-research-preview-04-2026",
					"name": "Google: Deep Research Preview (Apr-21-2026)",
					"aliases": ["deep-research-preview-04-2026"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-2-5-computer-use-preview-10-2025",
					"name": "Google: Gemini 2.5 Computer Use Preview 10-2025",
					"aliases": ["gemini-2-5-computer-use-preview-10-2025"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-2-5-flash-lite",
					"name": "Google: Gemini 2.5 Flash-Lite",
					"aliases": ["gemini-2-5-flash-lite"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-2.5-flash",
					"name": "Google Gemini 2.5 Flash",
					"aliases": ["gemini-2-5-flash"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "google-gemini-2.5-pro",
					"name": "Google Gemini 2.5 Pro",
					"aliases": ["gemini-2-5-pro"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "google-gemini-3-1-flash-lite",
					"name": "Google: Gemini 3.1 Flash Lite",
					"aliases": ["gemini-3-1-flash-lite"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-1-flash-lite-image",
					"name": "Google: Nano Banana 2 Lite",
					"aliases": ["gemini-3-1-flash-lite-image"],
					"contextWindow": 65536,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-1-flash-lite-preview",
					"name": "Google: Gemini 3.1 Flash Lite Preview",
					"aliases": ["gemini-3-1-flash-lite-preview"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-1-flash-live-preview",
					"name": "Google: Gemini 3.1 Flash Live Preview",
					"aliases": ["gemini-3-1-flash-live-preview"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-1-pro-preview",
					"name": "Google: Gemini 3.1 Pro Preview",
					"aliases": ["gemini-3-1-pro-preview"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "LOW",
						"high": "HIGH"
					},
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-1-pro-preview-customtools",
					"name": "Google: Gemini 3.1 Pro Preview Custom Tools",
					"aliases": ["gemini-3-1-pro-preview-customtools"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "LOW",
						"high": "HIGH"
					},
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-5-flash",
					"name": "Google: Gemini 3.5 Flash",
					"aliases": ["gemini-3-5-flash"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-5-flash-lite",
					"name": "Google: Gemini 3.5 Flash Lite",
					"aliases": ["gemini-3-5-flash-lite"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-7-flash",
					"name": "Google: Gemini 3.7 Flash",
					"aliases": ["gemini-3-7-flash"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-8-flash",
					"name": "Google: Gemini 3.8 Flash",
					"aliases": ["gemini-3-8-flash"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-flash-preview",
					"name": "Google: Gemini 3 Flash Preview",
					"aliases": ["gemini-3-flash-preview"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3.6-flash",
					"name": "Google Gemini 3.6 Flash",
					"aliases": ["gemini-3-6-flash"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models/gemini"
				},
				{
					"id": "google-gemini-flash-latest",
					"name": "Google: Gemini Flash Latest",
					"aliases": ["gemini-flash-latest"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-flash-lite-latest",
					"name": "Google: Gemini Flash-Lite Latest",
					"aliases": ["gemini-flash-lite-latest"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemma-4-26b-a4b-it",
					"name": "Google: Gemma 4 26B A4B IT",
					"aliases": ["gemma-4-26b-a4b-it"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "MINIMAL",
						"high": "HIGH"
					},
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemma-4-31b-it",
					"name": "Google: Gemma 4 31B IT",
					"aliases": ["gemma-4-31b-it"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "MINIMAL",
						"high": "HIGH"
					},
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "groq-llama-3-1-8b-instant",
					"name": "Groq: Llama 3.1 8B",
					"aliases": ["llama-3-1-8b-instant"],
					"contextWindow": 131072,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Groq model docs",
					"sourceUrl": "https://console.groq.com/docs/models"
				},
				{
					"id": "groq-llama-3-3-70b-versatile",
					"name": "Groq: Llama 3.3 70B",
					"aliases": ["llama-3-3-70b-versatile"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "Groq model docs",
					"sourceUrl": "https://console.groq.com/docs/models"
				},
				{
					"id": "huggingface-deepseek-v3",
					"name": "Hugging Face: DeepSeek-V3",
					"aliases": ["deepseek-v3", "deepseek-ai/deepseek-v3"],
					"contextWindow": 64e3,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-deepseek-v3-0324",
					"name": "Hugging Face: DeepSeek V3 0324",
					"aliases": ["deepseek-v3-0324", "deepseek-ai/deepseek-v3-0324"],
					"contextWindow": 163840,
					"maxTokens": 163840,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-deepseek-v3-1",
					"name": "Hugging Face: DeepSeek-V3.1",
					"aliases": ["deepseek-v3-1", "deepseek-ai/deepseek-v3-1"],
					"contextWindow": 131072,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-glm-4-6v-flash",
					"name": "Hugging Face: GLM-4.6V-Flash",
					"aliases": ["glm-4-6v-flash", "zai-org/glm-4-6v-flash"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-kimi-k2-instruct",
					"name": "Hugging Face: Kimi-K2-Instruct",
					"aliases": ["kimi-k2-instruct", "moonshotai/kimi-k2-instruct"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-kimi-k2-instruct-0905",
					"name": "Hugging Face: Kimi-K2-Instruct-0905",
					"aliases": ["kimi-k2-instruct-0905", "moonshotai/kimi-k2-instruct-0905"],
					"contextWindow": 262144,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-llama-3-1-8b-instruct",
					"name": "Hugging Face: Llama-3.1-8B-Instruct",
					"aliases": ["llama-3-1-8b-instruct", "meta-llama/llama-3-1-8b-instruct"],
					"contextWindow": 131072,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-llama-3-3-70b-instruct",
					"name": "Hugging Face: Llama-3.3-70B-Instruct",
					"aliases": ["llama-3-3-70b-instruct", "meta-llama/llama-3-3-70b-instruct"],
					"contextWindow": 131072,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-mimo-v2-flash",
					"name": "Hugging Face: MiMo-V2-Flash",
					"aliases": ["mimo-v2-flash", "xiaomimimo/mimo-v2-flash"],
					"contextWindow": 262144,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-qwen2-5-coder-32b-instruct",
					"name": "Hugging Face: Qwen2.5-Coder-32B-Instruct",
					"aliases": ["qwen2-5-coder-32b-instruct", "qwen/qwen2-5-coder-32b-instruct"],
					"contextWindow": 131072,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-qwen3-235b-a22b-instruct-2507",
					"name": "Hugging Face: Qwen3 235B-A22B Instruct 2507",
					"aliases": ["qwen3-235b-a22b-instruct-2507", "qwen/qwen3-235b-a22b-instruct-2507"],
					"contextWindow": 262144,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-qwen3-coder-480b-a35b-instruct",
					"name": "Hugging Face: Qwen3-Coder-480B-A35B-Instruct",
					"aliases": ["qwen3-coder-480b-a35b-instruct", "qwen/qwen3-coder-480b-a35b-instruct"],
					"contextWindow": 262144,
					"maxTokens": 66536,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "hunyuan-a13b",
					"name": "Hunyuan A13B",
					"aliases": ["hunyuan-a13b", "hunyuan-a13b-260112"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "腾讯混元产品概述",
					"sourceUrl": "https://cloud.tencent.com/document/product/1729/104753"
				},
				{
					"id": "hunyuan-t1-vision",
					"name": "Hunyuan T1 Vision",
					"aliases": ["hunyuan-t1-vision", "hunyuan-t1-vision-20250916"],
					"maxTokens": 20480,
					"input": ["text", "image"],
					"sourceLabel": "腾讯混元产品概述",
					"sourceUrl": "https://cloud.tencent.com/document/product/1729/104753"
				},
				{
					"id": "hunyuan-vision-1-5-instruct",
					"name": "Hunyuan Vision 1.5 Instruct",
					"aliases": ["hunyuan-vision-1-5-instruct", "hunyuan-vision-1.5-instruct"],
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "腾讯混元产品概述",
					"sourceUrl": "https://cloud.tencent.com/document/product/1729/104753"
				},
				{
					"id": "kimi-coding-k3",
					"name": "Kimi For Coding: Kimi K3",
					"aliases": ["k3"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Kimi For Coding docs",
					"sourceUrl": "https://www.kimi.com/coding"
				},
				{
					"id": "kimi-coding-k3-256k",
					"name": "Kimi For Coding: Kimi K3-256K",
					"aliases": ["k3-256k"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Kimi For Coding docs",
					"sourceUrl": "https://www.kimi.com/coding"
				},
				{
					"id": "kimi-coding-kimi-for-coding",
					"name": "Kimi For Coding: Kimi K2.7 Code",
					"aliases": ["kimi-for-coding"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "Kimi For Coding docs",
					"sourceUrl": "https://www.kimi.com/coding"
				},
				{
					"id": "kimi-coding-kimi-for-coding-highspeed",
					"name": "Kimi For Coding: Kimi For Coding HighSpeed",
					"aliases": ["kimi-for-coding-highspeed"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "Kimi For Coding docs",
					"sourceUrl": "https://www.kimi.com/coding"
				},
				{
					"id": "minimax-m2.5",
					"name": "MiniMax M2.5",
					"aliases": ["minimax-m2-5"],
					"contextWindow": 196608,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "MiniMax model docs",
					"sourceUrl": "https://platform.minimax.io/docs/guides/models-text"
				},
				{
					"id": "minimax-m2.7",
					"name": "MiniMax M2.7",
					"aliases": ["minimax-m2-7"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "MiniMax model docs",
					"sourceUrl": "https://platform.minimax.io/docs/guides/models-text"
				},
				{
					"id": "minimax-m3",
					"name": "MiniMax M3",
					"aliases": ["minimax-m3"],
					"contextWindow": 1048576,
					"maxTokens": 512e3,
					"input": ["text", "image"],
					"sourceLabel": "MiniMax model docs",
					"sourceUrl": "https://platform.minimax.io/docs/guides/models-text"
				},
				{
					"id": "minimax-minimax-m2-7-highspeed",
					"name": "MiniMax: MiniMax-M2.7-highspeed",
					"aliases": ["minimax-m2-7-highspeed"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "MiniMax model docs",
					"sourceUrl": "https://platform.minimax.io/docs/guides/models-text"
				},
				{
					"id": "mistral-codestral-latest",
					"name": "Mistral: Codestral (latest)",
					"aliases": ["codestral-latest"],
					"contextWindow": 256e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-devstral-2512",
					"name": "Mistral: Devstral 2",
					"aliases": ["devstral-2512"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-devstral-latest",
					"name": "Mistral: Devstral 2",
					"aliases": ["devstral-latest"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-devstral-medium-2507",
					"name": "Mistral: Devstral Medium",
					"aliases": ["devstral-medium-2507"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-devstral-medium-latest",
					"name": "Mistral: Devstral 2 (latest)",
					"aliases": ["devstral-medium-latest"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-devstral-small-2505",
					"name": "Mistral: Devstral Small 2505",
					"aliases": ["devstral-small-2505"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-devstral-small-2507",
					"name": "Mistral: Devstral Small",
					"aliases": ["devstral-small-2507"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-labs-devstral-small-2512",
					"name": "Mistral: Devstral Small 2",
					"aliases": ["labs-devstral-small-2512"],
					"contextWindow": 256e3,
					"maxTokens": 256e3,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-magistral-medium-latest",
					"name": "Mistral: Magistral Medium (latest)",
					"aliases": ["magistral-medium-latest"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-magistral-small",
					"name": "Mistral: Magistral Small",
					"aliases": ["magistral-small"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-ministral-3b-latest",
					"name": "Mistral: Ministral 3B (latest)",
					"aliases": ["ministral-3b-latest"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-ministral-8b-latest",
					"name": "Mistral: Ministral 8B (latest)",
					"aliases": ["ministral-8b-latest"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-large-2411",
					"name": "Mistral: Mistral Large 2.1",
					"aliases": ["mistral-large-2411"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-large-2512",
					"name": "Mistral: Mistral Large 3",
					"aliases": ["mistral-large-2512"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-large-latest",
					"name": "Mistral: Mistral Large (latest)",
					"aliases": ["mistral-large-latest"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-medium-2505",
					"name": "Mistral: Mistral Medium 3",
					"aliases": ["mistral-medium-2505"],
					"contextWindow": 131072,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-medium-2508",
					"name": "Mistral: Mistral Medium 3.1",
					"aliases": ["mistral-medium-2508"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-medium-2604",
					"name": "Mistral: Mistral Medium 3.5",
					"aliases": ["mistral-medium-2604"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-medium-3-5",
					"name": "Mistral: Mistral Medium 3.5",
					"aliases": ["mistral-medium-3-5"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-medium-latest",
					"name": "Mistral: Mistral Medium (latest)",
					"aliases": ["mistral-medium-latest"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-nemo",
					"name": "Mistral: Mistral Nemo",
					"aliases": ["mistral-nemo"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-small-2506",
					"name": "Mistral: Mistral Small 3.2",
					"aliases": ["mistral-small-2506"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-small-2603",
					"name": "Mistral: Mistral Small 4",
					"aliases": ["mistral-small-2603"],
					"contextWindow": 256e3,
					"maxTokens": 256e3,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-small-latest",
					"name": "Mistral: Mistral Small (latest)",
					"aliases": ["mistral-small-latest"],
					"contextWindow": 256e3,
					"maxTokens": 256e3,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-open-mistral-7b",
					"name": "Mistral: Mistral 7B",
					"aliases": ["open-mistral-7b"],
					"contextWindow": 8e3,
					"maxTokens": 8e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-open-mistral-nemo",
					"name": "Mistral: Open Mistral Nemo",
					"aliases": ["open-mistral-nemo"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-open-mixtral-8x22b",
					"name": "Mistral: Mixtral 8x22B",
					"aliases": ["open-mixtral-8x22b"],
					"contextWindow": 64e3,
					"maxTokens": 64e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-open-mixtral-8x7b",
					"name": "Mistral: Mixtral 8x7B",
					"aliases": ["open-mixtral-8x7b"],
					"contextWindow": 32e3,
					"maxTokens": 32e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-pixtral-12b",
					"name": "Mistral: Pixtral 12B",
					"aliases": ["pixtral-12b"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-pixtral-large-latest",
					"name": "Mistral: Pixtral Large (latest)",
					"aliases": ["pixtral-large-latest"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-voxtral-small-latest",
					"name": "Mistral: Voxtral Small (latest)",
					"aliases": ["voxtral-small-latest"],
					"contextWindow": 32e3,
					"maxTokens": 32e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-zai-glm-5-2",
					"name": "Mistral: GLM-5.2",
					"aliases": ["zai-glm-5-2"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "moonshot-kimi-k2.5",
					"name": "Moonshot Kimi K2.5",
					"aliases": ["kimi-k2-5"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshot-kimi-k2.6",
					"name": "Moonshot Kimi K2.6",
					"aliases": ["kimi-k2-6"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshot-kimi-k2.7-code",
					"name": "Moonshot Kimi K2.7 Code",
					"aliases": ["kimi-k2-7-code"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshot-kimi-k3",
					"name": "Moonshot Kimi K3",
					"aliases": ["kimi-k3"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models/kimi-k3"
				},
				{
					"id": "moonshotai-kimi-k2-0711-preview",
					"name": "Moonshot AI: Kimi K2 0711",
					"aliases": ["kimi-k2-0711-preview"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshotai-kimi-k2-0905-preview",
					"name": "Moonshot AI: Kimi K2 0905",
					"aliases": ["kimi-k2-0905-preview"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshotai-kimi-k2-7-code-highspeed",
					"name": "Moonshot AI: Kimi K2.7 Code HighSpeed",
					"aliases": ["kimi-k2-7-code-highspeed"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshotai-kimi-k2-thinking",
					"name": "Moonshot AI: Kimi K2 Thinking",
					"aliases": ["kimi-k2-thinking"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshotai-kimi-k2-thinking-turbo",
					"name": "Moonshot AI: Kimi K2 Thinking Turbo",
					"aliases": ["kimi-k2-thinking-turbo"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshotai-kimi-k2-turbo-preview",
					"name": "Moonshot AI: Kimi K2 Turbo",
					"aliases": ["kimi-k2-turbo-preview"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "nvidia-cosmos-reason2-8b",
					"name": "NVIDIA: Cosmos Reason2 8B",
					"aliases": ["cosmos-reason2-8b", "nvidia/cosmos-reason2-8b"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-gemma-3-4b-it",
					"name": "NVIDIA: Gemma 3 4B IT",
					"aliases": ["gemma-3-4b-it", "google/gemma-3-4b-it"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-llama-3-1-nemotron-70b-instruct",
					"name": "NVIDIA: Llama 3.1 Nemotron 70B Instruct",
					"aliases": ["llama-3-1-nemotron-70b-instruct", "nvidia/llama-3-1-nemotron-70b-instruct"],
					"contextWindow": 128e3,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-llama-3-1-nemotron-ultra-253b-v1",
					"name": "NVIDIA: Llama 3.1 Nemotron Ultra 253B",
					"aliases": ["llama-3-1-nemotron-ultra-253b-v1", "nvidia/llama-3-1-nemotron-ultra-253b-v1"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-llama-3-2-11b-vision-instruct",
					"name": "NVIDIA: Llama 3.2 11b Vision Instruct",
					"aliases": ["llama-3-2-11b-vision-instruct", "meta/llama-3-2-11b-vision-instruct"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text", "image"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-llama-3-2-90b-vision-instruct",
					"name": "NVIDIA: Llama-3.2-90B-Vision-Instruct",
					"aliases": ["llama-3-2-90b-vision-instruct", "meta/llama-3-2-90b-vision-instruct"],
					"contextWindow": 128e3,
					"maxTokens": 8192,
					"input": ["text", "image"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-mistral-7b-instruct-v0-3",
					"name": "NVIDIA: Mistral-7B-Instruct-v0.3",
					"aliases": ["mistral-7b-instruct-v0-3", "mistralai/mistral-7b-instruct-v0-3"],
					"contextWindow": 65536,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-nemotron-3-5-lightning-30b-a3b",
					"name": "NVIDIA: Nemotron 3.5 Lightning 30B A3B",
					"aliases": ["nemotron-3-5-lightning-30b-a3b", "nvidia/nemotron-3-5-lightning-30b-a3b"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-nemotron-3-nano-omni-30b-a3b-reasoning",
					"name": "NVIDIA: Nemotron 3 Nano Omni",
					"aliases": ["nemotron-3-nano-omni-30b-a3b-reasoning", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"],
					"contextWindow": 256e3,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "openai-gpt-4",
					"name": "OpenAI: GPT-4",
					"aliases": ["gpt-4"],
					"contextWindow": 8192,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4-1",
					"name": "OpenAI: GPT-4.1",
					"aliases": ["gpt-4-1"],
					"contextWindow": 1047576,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4-1-mini",
					"name": "OpenAI: GPT-4.1 mini",
					"aliases": ["gpt-4-1-mini"],
					"contextWindow": 1047576,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4-1-nano",
					"name": "OpenAI: GPT-4.1 nano",
					"aliases": ["gpt-4-1-nano"],
					"contextWindow": 1047576,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4-turbo",
					"name": "OpenAI: GPT-4 Turbo",
					"aliases": ["gpt-4-turbo"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4o",
					"name": "OpenAI: GPT-4o",
					"aliases": ["gpt-4o"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4o-2024-05-13",
					"name": "OpenAI: GPT-4o (2024-05-13)",
					"aliases": ["gpt-4o-2024-05-13"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4o-2024-08-06",
					"name": "OpenAI: GPT-4o (2024-08-06)",
					"aliases": ["gpt-4o-2024-08-06"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4o-2024-11-20",
					"name": "OpenAI: GPT-4o (2024-11-20)",
					"aliases": ["gpt-4o-2024-11-20"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4o-mini",
					"name": "OpenAI: GPT-4o mini",
					"aliases": ["gpt-4o-mini"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5",
					"name": "OpenAI GPT-5",
					"aliases": ["gpt-5"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-gpt-5-1",
					"name": "OpenAI: GPT-5.1",
					"aliases": ["gpt-5-1"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-2-chat-latest",
					"name": "OpenAI: GPT-5.2 Chat",
					"aliases": ["gpt-5-2-chat-latest"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"medium": "medium",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-2-pro",
					"name": "OpenAI: GPT-5.2 Pro",
					"aliases": ["gpt-5-2-pro"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-3-chat-latest",
					"name": "OpenAI: GPT-5.3 Chat (latest)",
					"aliases": ["gpt-5-3-chat-latest"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-3-codex-spark",
					"name": "OpenAI: GPT-5.3 Codex Spark",
					"aliases": ["gpt-5-3-codex-spark"],
					"contextWindow": 128e3,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-4-mini",
					"name": "OpenAI: GPT-5.4 mini",
					"aliases": ["gpt-5-4-mini"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-4-nano",
					"name": "OpenAI: GPT-5.4 nano",
					"aliases": ["gpt-5-4-nano"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-5-pro",
					"name": "OpenAI: GPT-5.5 Pro",
					"aliases": ["gpt-5-5-pro"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-chat-latest",
					"name": "OpenAI: GPT-5 Chat Latest",
					"aliases": ["gpt-5-chat-latest"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-mini",
					"name": "OpenAI: GPT-5 Mini",
					"aliases": ["gpt-5-mini"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-nano",
					"name": "OpenAI: GPT-5 Nano",
					"aliases": ["gpt-5-nano"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-pro",
					"name": "OpenAI: GPT-5 Pro",
					"aliases": ["gpt-5-pro"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"high": "high"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5.2",
					"name": "OpenAI GPT-5.2",
					"aliases": ["gpt-5-2"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-gpt-5.3-codex",
					"name": "OpenAI GPT-5.3 Codex",
					"aliases": ["gpt-5-3-codex"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-gpt-5.4",
					"name": "OpenAI GPT-5.4",
					"aliases": ["gpt-5-4"],
					"contextWindow": 272e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-gpt-5.4-pro",
					"name": "OpenAI GPT-5.4 Pro",
					"aliases": ["gpt-5-4-pro"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-gpt-5.5",
					"name": "OpenAI GPT-5.5",
					"aliases": ["gpt-5-5"],
					"contextWindow": 272e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://developers.openai.com/api/docs/models/gpt-5.5"
				},
				{
					"id": "openai-gpt-5.6-luna",
					"name": "OpenAI GPT-5.6 Luna",
					"aliases": ["gpt-5-6-luna"],
					"contextWindow": 272e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://developers.openai.com/api/docs/models/gpt-5.6-luna"
				},
				{
					"id": "openai-gpt-5.6-sol",
					"name": "OpenAI GPT-5.6 Sol",
					"aliases": ["gpt-5-6-sol"],
					"contextWindow": 272e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://developers.openai.com/api/docs/models/gpt-5.6-sol"
				},
				{
					"id": "openai-gpt-5.6-terra",
					"name": "OpenAI GPT-5.6 Terra",
					"aliases": ["gpt-5-6-terra"],
					"contextWindow": 272e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://developers.openai.com/api/docs/models/gpt-5.6-terra"
				},
				{
					"id": "openai-gpt-6-astra",
					"name": "OpenAI: GPT-6 Astra",
					"aliases": ["gpt-6-astra"],
					"contextWindow": 272e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-realtime-2-1",
					"name": "OpenAI: GPT-Realtime-2.1",
					"aliases": ["gpt-realtime-2-1"],
					"contextWindow": 128e3,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-o1",
					"name": "OpenAI: o1",
					"aliases": ["o1"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-o1-pro",
					"name": "OpenAI: o1-pro",
					"aliases": ["o1-pro"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-o3",
					"name": "OpenAI o3",
					"aliases": ["o3"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-o3-mini",
					"name": "OpenAI o3-mini",
					"aliases": ["o3-mini"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-o3-pro",
					"name": "OpenAI: o3-pro",
					"aliases": ["o3-pro"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-o4-mini",
					"name": "OpenAI o4-mini",
					"aliases": ["o4-mini"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "opencode-big-pickle",
					"name": "OpenCode Zen: Big Pickle",
					"aliases": ["big-pickle"],
					"contextWindow": 2e5,
					"maxTokens": 32e3,
					"input": ["text"],
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-gemini-3-1-pro",
					"name": "OpenCode Zen: Gemini 3.1 Pro Preview",
					"aliases": ["gemini-3-1-pro"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "LOW",
						"high": "HIGH"
					},
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-gemini-3-flash",
					"name": "OpenCode Zen: Gemini 3 Flash",
					"aliases": ["gemini-3-flash"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-go-longcat-2-0",
					"name": "OpenCode Go: LongCat-2.0",
					"aliases": ["longcat-2-0"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenCode Go docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-go-muse-spark-1-2-contributor",
					"name": "OpenCode Go: Muse Spark 1.2 Contributor",
					"aliases": ["muse-spark-1-2-contributor"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenCode Go docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-go-muse-spark-1-3-contributor",
					"name": "OpenCode Go: Muse Spark 1.3 Contributor",
					"aliases": ["muse-spark-1-3-contributor"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenCode Go docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-go-omen-alpha",
					"name": "OpenCode Go: Omen Alpha",
					"aliases": ["omen-alpha"],
					"contextWindow": 5e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high"
					},
					"sourceLabel": "OpenCode Go docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-gpt-5-codex",
					"name": "OpenCode Zen: GPT-5 Codex",
					"aliases": ["gpt-5-codex"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-ling-3-0-flash-fin-free",
					"name": "OpenCode Zen: Ling 3.0 Flash Fin Free",
					"aliases": ["ling-3-0-flash-fin-free"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-mimo-v2-5-free",
					"name": "OpenCode Zen: MiMo V2.5 Free",
					"aliases": ["mimo-v2-5-free"],
					"contextWindow": 2e5,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-muse-spark-1-2",
					"name": "OpenCode Zen: Muse Spark 1.2",
					"aliases": ["muse-spark-1-2"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-muse-spark-1-2-contributor-free",
					"name": "OpenCode Zen: Muse Spark 1.2 Free",
					"aliases": ["muse-spark-1-2-contributor-free"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-muse-spark-1-3",
					"name": "OpenCode Zen: Muse Spark 1.3",
					"aliases": ["muse-spark-1-3"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-muse-spark-1-3-contributor-free",
					"name": "OpenCode Zen: Muse Spark 1.3 Free",
					"aliases": ["muse-spark-1-3-contributor-free"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-nemotron-3-5-lightning-free",
					"name": "OpenCode Zen: Nemotron 3.5 Lightning Free",
					"aliases": ["nemotron-3-5-lightning-free"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-nemotron-3-ultra-free",
					"name": "OpenCode Zen: Nemotron 3 Ultra Free",
					"aliases": ["nemotron-3-ultra-free"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-qwen3-5-plus",
					"name": "OpenCode Zen: Qwen3.5 Plus",
					"aliases": ["qwen3-5-plus"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "openrouter-claude-3-haiku",
					"name": "OpenRouter: Anthropic: Claude 3 Haiku",
					"aliases": ["claude-3-haiku", "anthropic/claude-3-haiku"],
					"contextWindow": 2e5,
					"maxTokens": 4096,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-claude-opus-4",
					"name": "OpenRouter: Anthropic: Claude Opus 4",
					"aliases": ["claude-opus-4", "anthropic/claude-opus-4"],
					"contextWindow": 2e5,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-claude-opus-4-1",
					"name": "OpenRouter: Anthropic: Claude Opus 4.1",
					"aliases": ["claude-opus-4-1", "anthropic/claude-opus-4-1"],
					"contextWindow": 2e5,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-claude-sonnet-4",
					"name": "OpenRouter: Anthropic: Claude Sonnet 4",
					"aliases": ["claude-sonnet-4"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-codestral-2508",
					"name": "OpenRouter: Mistral: Codestral 2508",
					"aliases": ["codestral-2508", "mistralai/codestral-2508"],
					"contextWindow": 256e3,
					"maxTokens": 204800,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-deepseek-chat",
					"name": "OpenRouter: DeepSeek: DeepSeek V3",
					"aliases": ["deepseek-chat", "deepseek/deepseek-chat"],
					"contextWindow": 163840,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-deepseek-chat-v3-0324",
					"name": "OpenRouter: DeepSeek: DeepSeek V3 0324",
					"aliases": ["deepseek-chat-v3-0324", "deepseek/deepseek-chat-v3-0324"],
					"contextWindow": 163840,
					"maxTokens": 147456,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-deepseek-chat-v3-1",
					"name": "OpenRouter: DeepSeek: DeepSeek V3.1",
					"aliases": ["deepseek-chat-v3-1", "deepseek/deepseek-chat-v3-1"],
					"contextWindow": 161e3,
					"maxTokens": 144900,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-deepseek-r1",
					"name": "OpenRouter: DeepSeek: R1",
					"aliases": ["deepseek-r1", "deepseek-ai/deepseek-r1"],
					"contextWindow": 64e3,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-deepseek-r1-0528",
					"name": "OpenRouter: DeepSeek: R1 0528",
					"aliases": ["deepseek-r1-0528", "deepseek-ai/deepseek-r1-0528"],
					"contextWindow": 163840,
					"maxTokens": 163840,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-deepseek-v3-1-terminus",
					"name": "OpenRouter: DeepSeek: DeepSeek V3.1 Terminus",
					"aliases": ["deepseek-v3-1-terminus", "deepseek/deepseek-v3-1-terminus"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-deepseek-v3-2-exp",
					"name": "OpenRouter: DeepSeek: DeepSeek V3.2 Exp",
					"aliases": ["deepseek-v3-2-exp", "deepseek/deepseek-v3-2-exp"],
					"contextWindow": 163840,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gemini-2-5-pro-preview",
					"name": "OpenRouter: Google: Gemini 2.5 Pro Preview 06-05",
					"aliases": ["gemini-2-5-pro-preview", "google/gemini-2-5-pro-preview"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gemini-2-5-pro-preview-05-06",
					"name": "OpenRouter: Google: Gemini 2.5 Pro Preview 05-06",
					"aliases": ["gemini-2-5-pro-preview-05-06", "google/gemini-2-5-pro-preview-05-06"],
					"contextWindow": 1048576,
					"maxTokens": 65535,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gemini-3-pro-image",
					"name": "OpenRouter: Google: Nano Banana Pro (Gemini 3 Pro Image)",
					"aliases": ["gemini-3-pro-image", "google/gemini-3-pro-image"],
					"contextWindow": 65536,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gemma-3-12b-it",
					"name": "OpenRouter: Google: Gemma 3 12B",
					"aliases": ["gemma-3-12b-it", "google/gemma-3-12b-it"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gemma-3-27b-it",
					"name": "OpenRouter: Google: Gemma 3 27B",
					"aliases": ["gemma-3-27b-it", "google/gemma-3-27b-it"],
					"contextWindow": 131072,
					"maxTokens": 117964,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-glm-4-5",
					"name": "OpenRouter: Z.ai: GLM 4.5",
					"aliases": ["glm-4-5", "zai-org/glm-4-5"],
					"contextWindow": 131072,
					"maxTokens": 98304,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-glm-4-5-air",
					"name": "OpenRouter: Z.ai: GLM 4.5 Air",
					"aliases": ["glm-4-5-air", "zai-org/glm-4-5-air"],
					"contextWindow": 131072,
					"maxTokens": 98304,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-glm-4-5v",
					"name": "OpenRouter: Z.ai: GLM 4.5V",
					"aliases": ["glm-4-5v", "zai-org/glm-4-5v"],
					"contextWindow": 65536,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-glm-4-6",
					"name": "OpenRouter: Z.ai: GLM 4.6",
					"aliases": ["glm-4-6", "zai-org/glm-4-6"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-glm-4-6v",
					"name": "OpenRouter: Z.ai: GLM 4.6V",
					"aliases": ["glm-4-6v"],
					"contextWindow": 128e3,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-glm-4-7-flash",
					"name": "OpenRouter: Z.ai: GLM 4.7 Flash",
					"aliases": ["glm-4-7-flash", "@cf/zai-org/glm-4-7-flash"],
					"contextWindow": 131072,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-glm-5v-turbo",
					"name": "OpenRouter: Z.ai: GLM 5V Turbo",
					"aliases": ["glm-5v-turbo"],
					"contextWindow": 2e5,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-3-5-turbo",
					"name": "OpenRouter: OpenAI: GPT-3.5 Turbo",
					"aliases": ["gpt-3-5-turbo", "openai/gpt-3-5-turbo"],
					"contextWindow": 16385,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-3-5-turbo-0613",
					"name": "OpenRouter: OpenAI: GPT-3.5 Turbo (older v0613)",
					"aliases": ["gpt-3-5-turbo-0613", "openai/gpt-3-5-turbo-0613"],
					"contextWindow": 4095,
					"maxTokens": 3685,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-3-5-turbo-16k",
					"name": "OpenRouter: OpenAI: GPT-3.5 Turbo 16k",
					"aliases": ["gpt-3-5-turbo-16k", "openai/gpt-3-5-turbo-16k"],
					"contextWindow": 16385,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-4-turbo-preview",
					"name": "OpenRouter: OpenAI: GPT-4 Turbo Preview",
					"aliases": ["gpt-4-turbo-preview", "openai/gpt-4-turbo-preview"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-4o-mini-2024-07-18",
					"name": "OpenRouter: OpenAI: GPT-4o-mini (2024-07-18)",
					"aliases": ["gpt-4o-mini-2024-07-18", "openai/gpt-4o-mini-2024-07-18"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-1-codex",
					"name": "OpenRouter: OpenAI: GPT-5.1-Codex",
					"aliases": ["gpt-5-1-codex"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-1-codex-max",
					"name": "OpenRouter: OpenAI: GPT-5.1-Codex-Max",
					"aliases": ["gpt-5-1-codex-max"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-1-codex-mini",
					"name": "OpenRouter: OpenAI: GPT-5.1-Codex-Mini",
					"aliases": ["gpt-5-1-codex-mini"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-2-chat",
					"name": "OpenRouter: OpenAI: GPT-5.2 Chat",
					"aliases": ["gpt-5-2-chat", "openai/gpt-5-2-chat"],
					"contextWindow": 128e3,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-2-codex",
					"name": "OpenRouter: OpenAI: GPT-5.2-Codex",
					"aliases": ["gpt-5-2-codex"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-6-luna-pro",
					"name": "OpenRouter: OpenAI: GPT-5.6 Luna Pro",
					"aliases": ["gpt-5-6-luna-pro", "openai/gpt-5-6-luna-pro"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-6-sol-pro",
					"name": "OpenRouter: OpenAI: GPT-5.6 Sol Pro",
					"aliases": ["gpt-5-6-sol-pro", "openai/gpt-5-6-sol-pro"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-6-terra-pro",
					"name": "OpenRouter: OpenAI: GPT-5.6 Terra Pro",
					"aliases": ["gpt-5-6-terra-pro", "openai/gpt-5-6-terra-pro"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-6-astra-pro",
					"name": "OpenRouter: OpenAI: GPT-6 Astra Pro",
					"aliases": ["gpt-6-astra-pro", "openai/gpt-6-astra-pro"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-audio",
					"name": "OpenRouter: OpenAI: GPT Audio",
					"aliases": ["gpt-audio", "openai/gpt-audio"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-audio-mini",
					"name": "OpenRouter: OpenAI: GPT Audio Mini",
					"aliases": ["gpt-audio-mini", "openai/gpt-audio-mini"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-chat-latest",
					"name": "OpenRouter: OpenAI: GPT Chat Latest",
					"aliases": ["gpt-chat-latest", "openai/gpt-chat-latest"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-oss-120b",
					"name": "OpenRouter: OpenAI: gpt-oss-120b",
					"aliases": ["gpt-oss-120b", "@cf/openai/gpt-oss-120b"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-oss-20b",
					"name": "OpenRouter: OpenAI: gpt-oss-20b",
					"aliases": ["gpt-oss-20b", "@cf/openai/gpt-oss-20b"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-oss-safeguard-20b",
					"name": "OpenRouter: OpenAI: gpt-oss-safeguard-20b",
					"aliases": ["gpt-oss-safeguard-20b", "openai/gpt-oss-safeguard-20b"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-grok-4-20",
					"name": "OpenRouter: SpaceXAI: Grok 4.20",
					"aliases": ["grok-4-20", "x-ai/grok-4-20"],
					"contextWindow": 2e6,
					"maxTokens": 18e5,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-grok-build-0-1",
					"name": "OpenRouter: SpaceXAI: Grok Build 0.1",
					"aliases": ["grok-build-0-1"],
					"contextWindow": 256e3,
					"maxTokens": 256e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-hy3",
					"name": "OpenRouter: Tencent: Hy3",
					"aliases": ["hy3", "tencent/hy3"],
					"contextWindow": 262144,
					"maxTokens": 128e3,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-hy3-preview",
					"name": "OpenRouter: Tencent: Hy3 preview",
					"aliases": ["hy3-preview", "tencent/hy3-preview"],
					"contextWindow": 262144,
					"maxTokens": 235929,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-hy4-preview",
					"name": "OpenRouter: Tencent: Hy4 preview",
					"aliases": ["hy4-preview"],
					"contextWindow": 1024e3,
					"maxTokens": 64e3,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-inkling",
					"name": "OpenRouter: Thinking Machines: Inkling",
					"aliases": ["inkling", "thinkingmachines/inkling"],
					"contextWindow": 524288,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-inkling-small",
					"name": "OpenRouter: Thinking Machines: Inkling Small",
					"aliases": ["inkling-small", "thinkingmachines/inkling-small"],
					"contextWindow": 524288,
					"maxTokens": 1048576,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-kimi-k2",
					"name": "OpenRouter: MoonshotAI: Kimi K2 0711",
					"aliases": ["kimi-k2", "moonshotai/kimi-k2"],
					"contextWindow": 131072,
					"maxTokens": 100352,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-kimi-k2-0905",
					"name": "OpenRouter: MoonshotAI: Kimi K2 0905",
					"aliases": ["kimi-k2-0905", "moonshotai/kimi-k2-0905"],
					"contextWindow": 262144,
					"maxTokens": 100352,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-laguna-s-2-1",
					"name": "OpenRouter: Poolside: Laguna S 2.1",
					"aliases": ["laguna-s-2-1", "poolside/laguna-s-2-1"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-laguna-xs-2-1",
					"name": "OpenRouter: Poolside: Laguna XS 2.1",
					"aliases": ["laguna-xs-2-1", "poolside/laguna-xs-2-1"],
					"contextWindow": 262144,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-ling-3-0-flash",
					"name": "OpenRouter: inclusionAI: Ling 3.0 Flash",
					"aliases": ["ling-3-0-flash", "inclusionai/ling-3-0-flash"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-ling-3-0-flash-fin",
					"name": "OpenRouter: inclusionAI: Ling 3.0 Flash Fin",
					"aliases": ["ling-3-0-flash-fin", "inclusionai/ling-3-0-flash-fin"],
					"contextWindow": 262144,
					"maxTokens": 235929,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-minimax-m1",
					"name": "OpenRouter: MiniMax: MiniMax M1",
					"aliases": ["minimax-m1", "minimax/minimax-m1"],
					"contextWindow": 1e6,
					"maxTokens": 4e4,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-minimax-m2",
					"name": "OpenRouter: MiniMax: MiniMax M2",
					"aliases": ["minimax-m2", "minimaxai/minimax-m2"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-minimax-m2-1",
					"name": "OpenRouter: MiniMax: MiniMax M2.1",
					"aliases": ["minimax-m2-1", "minimaxai/minimax-m2-1"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-ministral-14b-2512",
					"name": "OpenRouter: Mistral: Ministral 3 14B 2512",
					"aliases": ["ministral-14b-2512", "mistralai/ministral-14b-2512"],
					"contextWindow": 262144,
					"maxTokens": 209715,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-ministral-3b-2512",
					"name": "OpenRouter: Mistral: Ministral 3 3B 2512",
					"aliases": ["ministral-3b-2512", "mistralai/ministral-3b-2512"],
					"contextWindow": 131072,
					"maxTokens": 104857,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-ministral-8b-2512",
					"name": "OpenRouter: Mistral: Ministral 3 8B 2512",
					"aliases": ["ministral-8b-2512", "mistralai/ministral-8b-2512"],
					"contextWindow": 262144,
					"maxTokens": 209715,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-mistral-large",
					"name": "OpenRouter: Mistral Large",
					"aliases": ["mistral-large", "mistralai/mistral-large"],
					"contextWindow": 128e3,
					"maxTokens": 102400,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-mistral-large-2407",
					"name": "OpenRouter: Mistral Large 2407",
					"aliases": ["mistral-large-2407", "mistralai/mistral-large-2407"],
					"contextWindow": 131072,
					"maxTokens": 104857,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-mistral-medium-3",
					"name": "OpenRouter: Mistral: Mistral Medium 3",
					"aliases": ["mistral-medium-3", "mistralai/mistral-medium-3"],
					"contextWindow": 131072,
					"maxTokens": 104857,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-mistral-medium-3-1",
					"name": "OpenRouter: Mistral: Mistral Medium 3.1",
					"aliases": ["mistral-medium-3-1", "mistralai/mistral-medium-3-1"],
					"contextWindow": 131072,
					"maxTokens": 104857,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-mistral-saba",
					"name": "OpenRouter: Mistral: Saba",
					"aliases": ["mistral-saba", "mistralai/mistral-saba"],
					"contextWindow": 32768,
					"maxTokens": 26214,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-mistral-small-3-2-24b-instruct",
					"name": "OpenRouter: Mistral: Mistral Small 3.2 24B",
					"aliases": ["mistral-small-3-2-24b-instruct", "mistralai/mistral-small-3-2-24b-instruct"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-mixtral-8x22b-instruct",
					"name": "OpenRouter: Mistral: Mixtral 8x22B Instruct",
					"aliases": ["mixtral-8x22b-instruct", "mistralai/mixtral-8x22b-instruct"],
					"contextWindow": 65536,
					"maxTokens": 52428,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-nemotron-3-5-lightning",
					"name": "OpenRouter: NVIDIA: Nemotron 3.5 Lightning",
					"aliases": ["nemotron-3-5-lightning", "nvidia/nemotron-3-5-lightning"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-nemotron-3-nano-30b-a3b",
					"name": "OpenRouter: NVIDIA: Nemotron 3 Nano 30B A3B",
					"aliases": ["nemotron-3-nano-30b-a3b", "nvidia/nemotron-3-nano-30b-a3b"],
					"contextWindow": 262144,
					"maxTokens": 235929,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-nemotron-3-super-120b-a12b",
					"name": "OpenRouter: NVIDIA: Nemotron 3 Super",
					"aliases": ["nemotron-3-super-120b-a12b", "nvidia/nemotron-3-super-120b-a12b"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-nemotron-3-ultra-550b-a55b",
					"name": "OpenRouter: NVIDIA: Nemotron 3 Ultra",
					"aliases": ["nemotron-3-ultra-550b-a55b", "nvidia/nemotron-3-ultra-550b-a55b"],
					"contextWindow": 512300,
					"maxTokens": 512300,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-o3-mini-high",
					"name": "OpenRouter: OpenAI: o3 Mini High",
					"aliases": ["o3-mini-high", "openai/o3-mini-high"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-o4-mini-high",
					"name": "OpenRouter: OpenAI: o4 Mini High",
					"aliases": ["o4-mini-high", "openai/o4-mini-high"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen-2-5-72b-instruct",
					"name": "OpenRouter: Qwen2.5 72B Instruct",
					"aliases": ["qwen-2-5-72b-instruct", "qwen/qwen-2-5-72b-instruct"],
					"contextWindow": 32768,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen-2-5-7b-instruct",
					"name": "OpenRouter: Qwen: Qwen2.5 7B Instruct",
					"aliases": ["qwen-2-5-7b-instruct", "qwen/qwen-2-5-7b-instruct"],
					"contextWindow": 32768,
					"maxTokens": 29491,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen-plus",
					"name": "OpenRouter: Qwen: Qwen-Plus",
					"aliases": ["qwen-plus", "qwen/qwen-plus"],
					"contextWindow": 1e6,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen-plus-2025-07-28",
					"name": "OpenRouter: Qwen: Qwen Plus 0728",
					"aliases": ["qwen-plus-2025-07-28", "qwen/qwen-plus-2025-07-28"],
					"contextWindow": 1e6,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-14b",
					"name": "OpenRouter: Qwen: Qwen3 14B",
					"aliases": ["qwen3-14b", "qwen/qwen3-14b"],
					"contextWindow": 40960,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-235b-a22b",
					"name": "OpenRouter: Qwen: Qwen3 235B A22B",
					"aliases": ["qwen3-235b-a22b", "qwen/qwen3-235b-a22b"],
					"contextWindow": 40960,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-235b-a22b-2507",
					"name": "OpenRouter: Qwen: Qwen3 235B A22B Instruct 2507",
					"aliases": ["qwen3-235b-a22b-2507", "qwen/qwen3-235b-a22b-2507"],
					"contextWindow": 262144,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-235b-a22b-thinking-2507",
					"name": "OpenRouter: Qwen: Qwen3 235B A22B Thinking 2507",
					"aliases": ["qwen3-235b-a22b-thinking-2507", "qwen/qwen3-235b-a22b-thinking-2507"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-30b-a3b",
					"name": "OpenRouter: Qwen: Qwen3 30B A3B",
					"aliases": ["qwen3-30b-a3b", "qwen/qwen3-30b-a3b"],
					"contextWindow": 40960,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-30b-a3b-instruct-2507",
					"name": "OpenRouter: Qwen: Qwen3 30B A3B Instruct 2507",
					"aliases": ["qwen3-30b-a3b-instruct-2507", "qwen/qwen3-30b-a3b-instruct-2507"],
					"contextWindow": 128e3,
					"maxTokens": 32e3,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-30b-a3b-thinking-2507",
					"name": "OpenRouter: Qwen: Qwen3 30B A3B Thinking 2507",
					"aliases": ["qwen3-30b-a3b-thinking-2507", "qwen/qwen3-30b-a3b-thinking-2507"],
					"contextWindow": 81920,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-32b",
					"name": "OpenRouter: Qwen: Qwen3 32B",
					"aliases": ["qwen3-32b", "qwen/qwen3-32b"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-122b-a10b",
					"name": "OpenRouter: Qwen: Qwen3.5-122B-A10B",
					"aliases": ["qwen3-5-122b-a10b", "qwen/qwen3-5-122b-a10b"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-27b",
					"name": "OpenRouter: Qwen: Qwen3.5-27B",
					"aliases": ["qwen3-5-27b", "qwen/qwen3-5-27b"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-35b-a3b",
					"name": "OpenRouter: Qwen: Qwen3.5-35B-A3B",
					"aliases": ["qwen3-5-35b-a3b", "qwen/qwen3-5-35b-a3b"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-397b-a17b",
					"name": "OpenRouter: Qwen: Qwen3.5 397B A17B",
					"aliases": ["qwen3-5-397b-a17b", "qwen/qwen3-5-397b-a17b"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-9b",
					"name": "OpenRouter: Qwen: Qwen3.5-9B",
					"aliases": ["qwen3-5-9b", "qwen/qwen3-5-9b"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-flash-02-23",
					"name": "OpenRouter: Qwen: Qwen3.5-Flash",
					"aliases": ["qwen3-5-flash-02-23", "qwen/qwen3-5-flash-02-23"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-plus-02-15",
					"name": "OpenRouter: Qwen: Qwen3.5 Plus 2026-02-15",
					"aliases": ["qwen3-5-plus-02-15", "qwen/qwen3-5-plus-02-15"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-plus-20260420",
					"name": "OpenRouter: Qwen: Qwen3.5 Plus 2026-04-20",
					"aliases": ["qwen3-5-plus-20260420", "qwen/qwen3-5-plus-20260420"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-6-27b",
					"name": "OpenRouter: Qwen: Qwen3.6 27B",
					"aliases": ["qwen3-6-27b", "qwen/qwen3-6-27b"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"high": "default"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-6-35b-a3b",
					"name": "OpenRouter: Qwen: Qwen3.6 35B A3B",
					"aliases": ["qwen3-6-35b-a3b", "qwen/qwen3-6-35b-a3b"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-6-max-preview",
					"name": "OpenRouter: Qwen: Qwen3.6 Max Preview",
					"aliases": ["qwen3-6-max-preview", "qwen/qwen3-6-max-preview"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-7-flash",
					"name": "OpenRouter: Qwen: Qwen3.7 Flash",
					"aliases": ["qwen3-7-flash", "qwen/qwen3-7-flash"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-8-2-4t-a95b",
					"name": "OpenRouter: Qwen: Qwen3.8 2.4T A95B",
					"aliases": ["qwen3-8-2-4t-a95b", "qwen/qwen3-8-2-4t-a95b"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-8-27b",
					"name": "OpenRouter: Qwen: Qwen3.8 27B",
					"aliases": ["qwen3-8-27b", "@cf/qwen/qwen3-8-27b"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-8-max-0902",
					"name": "OpenRouter: Qwen: Qwen3.8 Max (0902)",
					"aliases": ["qwen3-8-max-0902", "qwen/qwen3-8-max-0902"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-8b",
					"name": "OpenRouter: Qwen: Qwen3 8B",
					"aliases": ["qwen3-8b", "qwen/qwen3-8b"],
					"contextWindow": 131072,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-coder",
					"name": "OpenRouter: Qwen: Qwen3 Coder 480B A35B",
					"aliases": ["qwen3-coder", "qwen/qwen3-coder"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-coder-30b-a3b-instruct",
					"name": "OpenRouter: Qwen: Qwen3 Coder 30B A3B Instruct",
					"aliases": ["qwen3-coder-30b-a3b-instruct", "qwen/qwen3-coder-30b-a3b-instruct"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-coder-flash",
					"name": "OpenRouter: Qwen: Qwen3 Coder Flash",
					"aliases": ["qwen3-coder-flash", "qwen/qwen3-coder-flash"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-coder-next",
					"name": "OpenRouter: Qwen: Qwen3 Coder Next",
					"aliases": ["qwen3-coder-next", "qwen/qwen3-coder-next"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-coder-plus",
					"name": "OpenRouter: Qwen: Qwen3 Coder Plus",
					"aliases": ["qwen3-coder-plus", "qwen/qwen3-coder-plus"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-max",
					"name": "OpenRouter: Qwen: Qwen3 Max",
					"aliases": ["qwen3-max", "qwen/qwen3-max"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-max-thinking",
					"name": "OpenRouter: Qwen: Qwen3 Max Thinking",
					"aliases": ["qwen3-max-thinking", "qwen/qwen3-max-thinking"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-next-80b-a3b-instruct",
					"name": "OpenRouter: Qwen: Qwen3 Next 80B A3B Instruct",
					"aliases": ["qwen3-next-80b-a3b-instruct", "qwen/qwen3-next-80b-a3b-instruct"],
					"contextWindow": 262144,
					"maxTokens": 66536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-next-80b-a3b-thinking",
					"name": "OpenRouter: Qwen: Qwen3 Next 80B A3B Thinking",
					"aliases": ["qwen3-next-80b-a3b-thinking", "qwen/qwen3-next-80b-a3b-thinking"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-vl-235b-a22b-instruct",
					"name": "OpenRouter: Qwen: Qwen3 VL 235B A22B Instruct",
					"aliases": ["qwen3-vl-235b-a22b-instruct", "qwen/qwen3-vl-235b-a22b-instruct"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-vl-235b-a22b-thinking",
					"name": "OpenRouter: Qwen: Qwen3 VL 235B A22B Thinking",
					"aliases": ["qwen3-vl-235b-a22b-thinking", "qwen/qwen3-vl-235b-a22b-thinking"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-vl-30b-a3b-instruct",
					"name": "OpenRouter: Qwen: Qwen3 VL 30B A3B Instruct",
					"aliases": ["qwen3-vl-30b-a3b-instruct", "qwen/qwen3-vl-30b-a3b-instruct"],
					"contextWindow": 262144,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-vl-30b-a3b-thinking",
					"name": "OpenRouter: Qwen: Qwen3 VL 30B A3B Thinking",
					"aliases": ["qwen3-vl-30b-a3b-thinking", "qwen/qwen3-vl-30b-a3b-thinking"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-vl-32b-instruct",
					"name": "OpenRouter: Qwen: Qwen3 VL 32B Instruct",
					"aliases": ["qwen3-vl-32b-instruct", "qwen/qwen3-vl-32b-instruct"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-vl-8b-instruct",
					"name": "OpenRouter: Qwen: Qwen3 VL 8B Instruct",
					"aliases": ["qwen3-vl-8b-instruct", "qwen/qwen3-vl-8b-instruct"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-vl-8b-thinking",
					"name": "OpenRouter: Qwen: Qwen3 VL 8B Thinking",
					"aliases": ["qwen3-vl-8b-thinking", "qwen/qwen3-vl-8b-thinking"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-solar-pro-3",
					"name": "OpenRouter: Upstage: Solar Pro 3",
					"aliases": ["solar-pro-3", "upstage/solar-pro-3"],
					"contextWindow": 131072,
					"maxTokens": 117964,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-solar-pro4",
					"name": "OpenRouter: Upstage: Solar Pro 4",
					"aliases": ["solar-pro4", "upstage/solar-pro4"],
					"contextWindow": 524288,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-step-3-5-flash",
					"name": "OpenRouter: StepFun: Step 3.5 Flash",
					"aliases": ["step-3-5-flash", "stepfun-ai/step-3-5-flash"],
					"contextWindow": 262144,
					"maxTokens": 256e3,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-step-3-7-flash",
					"name": "OpenRouter: StepFun: Step 3.7 Flash",
					"aliases": ["step-3-7-flash", "stepfun-ai/step-3-7-flash"],
					"contextWindow": 262144,
					"maxTokens": 256e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-voxtral-small-24b-2507",
					"name": "OpenRouter: Mistral: Voxtral Small 24B 2507",
					"aliases": ["voxtral-small-24b-2507", "mistralai/voxtral-small-24b-2507"],
					"contextWindow": 32768,
					"maxTokens": 26214,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "perplexity-sonar",
					"name": "Perplexity Sonar",
					"aliases": ["sonar", "perplexity-sonar"],
					"contextWindow": 131072,
					"input": ["text"],
					"sourceLabel": "Perplexity model cards",
					"sourceUrl": "https://docs.perplexity.ai/models/model-cards"
				},
				{
					"id": "perplexity-sonar-pro",
					"name": "Perplexity Sonar Pro",
					"aliases": ["sonar-pro", "perplexity-sonar-pro"],
					"contextWindow": 204800,
					"input": ["text"],
					"sourceLabel": "Perplexity model cards",
					"sourceUrl": "https://docs.perplexity.ai/models/model-cards"
				},
				{
					"id": "perplexity-sonar-pro-search",
					"name": "Perplexity Sonar Pro Search",
					"aliases": ["sonar-pro-search", "perplexity-sonar-pro-search"],
					"contextWindow": 204800,
					"input": ["text"],
					"sourceLabel": "Perplexity model cards",
					"sourceUrl": "https://docs.perplexity.ai/models/model-cards"
				},
				{
					"id": "perplexity-sonar-reasoning-pro",
					"name": "Perplexity Sonar Reasoning Pro",
					"aliases": ["sonar-reasoning-pro", "perplexity-sonar-reasoning-pro"],
					"contextWindow": 131072,
					"input": ["text"],
					"sourceLabel": "Perplexity model cards",
					"sourceUrl": "https://docs.perplexity.ai/models/model-cards"
				},
				{
					"id": "qwen-qwen3.6-flash",
					"name": "Qwen 3.6 Flash",
					"aliases": ["qwen3-6-flash"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "qwen-qwen3.6-plus",
					"name": "Qwen 3.6 Plus",
					"aliases": ["qwen3-6-plus"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "qwen-qwen3.7-max",
					"name": "Qwen 3.7 Max",
					"aliases": ["qwen3-7-max"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "qwen-qwen3.7-plus",
					"name": "Qwen 3.7 Plus",
					"aliases": ["qwen3-7-plus"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "qwen-qwen3.8-max-preview",
					"name": "Qwen 3.8 Max Preview",
					"aliases": ["qwen3.8-max-preview", "qwen/qwen3.8-max-preview"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "qwen-token-plan-deepseek-v3-2",
					"name": "Qwen Token Plan: DeepSeek V3.2",
					"aliases": ["deepseek-v3-2"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "Qwen Token Plan docs",
					"sourceUrl": "https://www.alibabacloud.com/help/en/model-studio"
				},
				{
					"id": "qwen-token-plan-deepseek-v4-flash-0731",
					"name": "Qwen Token Plan: DeepSeek V4 Flash 0731",
					"aliases": ["deepseek-v4-flash-0731"],
					"contextWindow": 1e6,
					"maxTokens": 384e3,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Qwen Token Plan docs",
					"sourceUrl": "https://www.alibabacloud.com/help/en/model-studio"
				},
				{
					"id": "qwen-token-plan-deepseek-v4-pro-0813",
					"name": "Qwen Token Plan: DeepSeek V4 Pro 0813",
					"aliases": ["deepseek-v4-pro-0813"],
					"contextWindow": 1e6,
					"maxTokens": 384e3,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Qwen Token Plan docs",
					"sourceUrl": "https://www.alibabacloud.com/help/en/model-studio"
				},
				{
					"id": "qwen-token-plan-qwen3-8-flash",
					"name": "Qwen Token Plan: Qwen3.8 Flash",
					"aliases": ["qwen3-8-flash"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"xhigh": "xhigh"
					},
					"sourceLabel": "Qwen Token Plan docs",
					"sourceUrl": "https://www.alibabacloud.com/help/en/model-studio"
				},
				{
					"id": "qwen-token-plan-qwen3-8-max",
					"name": "Qwen Token Plan: Qwen3.8 Max",
					"aliases": ["qwen3-8-max"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"xhigh": "xhigh"
					},
					"sourceLabel": "Qwen Token Plan docs",
					"sourceUrl": "https://www.alibabacloud.com/help/en/model-studio"
				},
				{
					"id": "together-llama-3-3-70b-instruct-turbo",
					"name": "Together: Llama 3.3 70B",
					"aliases": ["llama-3-3-70b-instruct-turbo", "meta-llama/llama-3-3-70b-instruct-turbo"],
					"contextWindow": 131072,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Together model docs",
					"sourceUrl": "https://docs.together.ai/docs/inference-models"
				},
				{
					"id": "together-qwen2-5-7b-instruct-turbo",
					"name": "Together: Qwen 2.5 7B Instruct Turbo",
					"aliases": ["qwen2-5-7b-instruct-turbo", "qwen/qwen2-5-7b-instruct-turbo"],
					"contextWindow": 32768,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "Together model docs",
					"sourceUrl": "https://docs.together.ai/docs/inference-models"
				},
				{
					"id": "xai-grok-4-3",
					"name": "xAI: Grok 4.3",
					"aliases": ["grok-4-3"],
					"contextWindow": 1e6,
					"maxTokens": 3e4,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "xAI model docs",
					"sourceUrl": "https://docs.x.ai/docs/models"
				},
				{
					"id": "xai-grok-4-6",
					"name": "xAI: Grok 4.6",
					"aliases": ["grok-4-6"],
					"contextWindow": 5e5,
					"maxTokens": 5e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "xAI model docs",
					"sourceUrl": "https://docs.x.ai/docs/models"
				},
				{
					"id": "xai-grok-4.5",
					"name": "xAI Grok 4.5",
					"aliases": ["grok-4-5"],
					"contextWindow": 5e5,
					"maxTokens": 5e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "xiaomi-mimo-v2-5-pro-ultraspeed",
					"name": "Xiaomi: MiMo-V2.5-Pro-UltraSpeed",
					"aliases": ["mimo-v2-5-pro-ultraspeed"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Xiaomi MiMo repository",
					"sourceUrl": "https://github.com/XiaomiMiMo/MiMo"
				},
				{
					"id": "xiaomi-mimo-v2.5",
					"name": "Xiaomi MiMo V2.5",
					"aliases": ["mimo-v2-5"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"sourceLabel": "Xiaomi MiMo repository",
					"sourceUrl": "https://github.com/XiaomiMiMo/MiMo-V2.5"
				},
				{
					"id": "xiaomi-mimo-v2.5-pro",
					"name": "Xiaomi MiMo V2.5 Pro",
					"aliases": ["mimo-v2-5-pro"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Xiaomi MiMo repository",
					"sourceUrl": "https://github.com/XiaomiMiMo/MiMo-V2.5"
				},
				{
					"id": "zai-glm-4-7",
					"name": "Z.AI: GLM-4.7",
					"aliases": ["glm-4-7"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.3"
				},
				{
					"id": "zai-glm-5",
					"name": "Z.ai GLM-5",
					"aliases": ["glm-5"],
					"contextWindow": 202752,
					"maxTokens": 16384,
					"input": ["text"],
					"reasoningEfforts": {
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5"
				},
				{
					"id": "zai-glm-5-2-highspeed",
					"name": "Z.AI: GLM-5.2 Highspeed",
					"aliases": ["glm-5-2-highspeed"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.3"
				},
				{
					"id": "zai-glm-5-3-flash",
					"name": "Z.AI: GLM-5.3-Flash",
					"aliases": ["glm-5-3-flash"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.3"
				},
				{
					"id": "zai-glm-5-3-highspeed",
					"name": "Z.AI: GLM-5.3 Highspeed",
					"aliases": ["glm-5-3-highspeed"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.3"
				},
				{
					"id": "zai-glm-5-turbo",
					"name": "Z.AI: GLM-5-Turbo",
					"aliases": ["glm-5-turbo"],
					"contextWindow": 2e5,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.3"
				},
				{
					"id": "zai-glm-5.1",
					"name": "Z.ai GLM-5.1",
					"aliases": ["glm-5-1"],
					"contextWindow": 202752,
					"maxTokens": 128e3,
					"input": ["text"],
					"reasoningEfforts": {
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.1"
				},
				{
					"id": "zai-glm-5.2",
					"name": "Z.ai GLM-5.2",
					"aliases": ["glm-5-2"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.2"
				},
				{
					"id": "zai-glm-5.3",
					"name": "Z.ai GLM-5.3",
					"aliases": ["glm-5-3"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.3"
				}
			]
		});
		function validateRegistry(value) {
			if (!isRecord$1(value) || typeof value.version !== "number" || !Number.isInteger(value.version) || typeof value.updatedAt !== "string" || !Array.isArray(value.presets)) throw new TypeError("invalid model preset registry");
			const presets = value.presets.map((entry) => {
				if (!isRecord$1(entry) || typeof entry.id !== "string" || typeof entry.name !== "string" || !Array.isArray(entry.aliases) || entry.aliases.some((alias) => typeof alias !== "string") || typeof entry.sourceLabel !== "string" || typeof entry.sourceUrl !== "string") throw new TypeError("invalid model preset entry");
				const contextWindow = optionalPositiveInteger(entry.contextWindow, "contextWindow");
				const maxTokens = optionalPositiveInteger(entry.maxTokens, "maxTokens");
				const input = entry.input === void 0 ? void 0 : validateInput(entry.input);
				const reasoningEfforts = entry.reasoningEfforts === void 0 ? void 0 : validateReasoningEfforts(entry.reasoningEfforts);
				return {
					id: entry.id,
					name: entry.name,
					aliases: [...entry.aliases],
					...contextWindow === void 0 ? {} : { contextWindow },
					...maxTokens === void 0 ? {} : { maxTokens },
					...input === void 0 ? {} : { input },
					...reasoningEfforts === void 0 ? {} : { reasoningEfforts },
					sourceLabel: entry.sourceLabel,
					sourceUrl: entry.sourceUrl
				};
			});
			return {
				version: value.version,
				updatedAt: value.updatedAt,
				presets
			};
		}
		function optionalPositiveInteger(value, label) {
			if (value === void 0) return void 0;
			const parsed = positiveInteger(value);
			if (parsed === void 0) throw new TypeError(`${label} must be a positive integer`);
			return parsed;
		}
		function positiveInteger(value) {
			return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : void 0;
		}
		function validateInput(value) {
			if (!Array.isArray(value) || value.some((item) => item !== "text" && item !== "image")) throw new TypeError("input must contain only text or image");
			return [...new Set(value)];
		}
		function validateReasoningEfforts(value) {
			if (!isRecord$1(value)) throw new TypeError("reasoningEfforts must be an object");
			const levels = /* @__PURE__ */ new Set([
				"off",
				"minimal",
				"low",
				"medium",
				"high",
				"xhigh",
				"max"
			]);
			const result = {};
			for (const [level, wire] of Object.entries(value)) {
				if (!levels.has(level) || wire !== null && (typeof wire !== "string" || wire === "")) throw new TypeError("reasoningEfforts contains an invalid level or wire value");
				if (wire === null && level !== "off") throw new TypeError("only reasoningEfforts.off may be null");
				result[level] = wire;
			}
			if (Object.keys(result).length === 0 || !Object.keys(result).some((level) => level !== "off")) throw new TypeError("reasoningEfforts must offer at least one enabled level");
			return result;
		}
		function isRecord$1(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		//#endregion
		//#region src/client/model-config.ts
		const REASONING_LEVELS = [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		];
		/** Compact token-count badge: 1050000 → "1.05M", 272000 → "272k", 4096 → "4096". */
		function formatTokenCount(value) {
			if (!Number.isFinite(value) || value <= 0) return "?";
			if (value >= 1e6) {
				const millions = value / 1e6;
				return `${millions >= 10 ? String(Math.round(millions)) : millions.toFixed(millions % 1 === 0 ? 0 : 2).replace(/0+$/u, "").replace(/\.$/u, "")}M`;
			}
			if (value >= 1e3) return `${Math.round(value / 1e3)}k`;
			return String(value);
		}
		const UNIVERSAL_REASONING_EFFORTS = {
			off: null,
			minimal: "minimal",
			low: "low",
			medium: "medium",
			high: "high",
			xhigh: "xhigh",
			max: "max"
		};
		function isRecord(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		function recordAt(value, path) {
			let current = value;
			for (const part of path) {
				if (!isRecord(current)) return void 0;
				current = current[part];
			}
			return isRecord(current) ? current : void 0;
		}
		function providerProfiles(value) {
			const providers = recordAt(value, ["providers"]);
			if (providers === void 0) return {};
			return Object.fromEntries(Object.entries(providers).filter((entry) => isRecord(entry[1])));
		}
		function stringField(value, key) {
			return typeof value[key] === "string" ? value[key] : "";
		}
		function modelRecords(profile) {
			if (!Array.isArray(profile.models)) return [];
			return profile.models.filter(isRecord).map((model) => structuredClone(model));
		}
		function setCompatField(source, key, value) {
			const next = structuredClone(source);
			const compat = isRecord(next.compat) ? structuredClone(next.compat) : {};
			if (value === void 0 || value === "") delete compat[key];
			else compat[key] = value;
			if (Object.keys(compat).length === 0) delete next.compat;
			else next.compat = compat;
			return next;
		}
		function compatValue(source, key) {
			return isRecord(source.compat) ? source.compat[key] : void 0;
		}
		function setReasoningMode(source, mode) {
			const next = structuredClone(source);
			if (mode === "inherit") delete next.reasoningEfforts;
			else if (mode === "disabled") next.reasoningEfforts = false;
			else next.reasoningEfforts = structuredClone(UNIVERSAL_REASONING_EFFORTS);
			return next;
		}
		/** Add selectable reasoning levels and provider-aware dispatch defaults without replacing manual compatibility values. */
		function applyUniversalReasoningDefaults(providerId, profile, model) {
			return applyReasoningDispatchDefaults(providerId, profile, setReasoningMode(model, "all"));
		}
		/** Add provider-aware reasoning dispatch compatibility without changing the model's offered levels. */
		function applyReasoningDispatchDefaults(providerId, profile, model) {
			let next = structuredClone(model);
			const protocol = stringField(profile, "api");
			if (protocol !== "openai-completions") return next;
			const explicitFormat = compatValue(next, "thinkingFormat");
			const format = typeof explicitFormat === "string" ? explicitFormat : inferThinkingFormat(providerId, profile, next);
			if (format !== void 0) next = setCompatDefault(next, "thinkingFormat", format);
			if (format === "qwen" || format === "qwen-chat-template" || format === "chat-template") next = setCompatDefault(next, "supportsReasoningEffort", false);
			else if (format !== "openrouter" && format !== "ant-ling" && format !== "string-thinking") next = setCompatDefault(next, "supportsReasoningEffort", true);
			return applyReasoningCompatibilityDefaults(protocol, next).model;
		}
		/** Ensure one selectable model has all reasoning levels, using modelOverrides for inherited catalogs. */
		function ensureModelReasoning(providerId, profile, modelId) {
			const next = structuredClone(profile);
			const models = modelRecords(next);
			const position = models.findIndex((model) => model.id === modelId);
			if (position >= 0) {
				const current = models[position] ?? {};
				const updated = applyUniversalReasoningDefaults(providerId, next, current);
				if (JSON.stringify(updated) === JSON.stringify(current)) return {
					profile: next,
					changed: false
				};
				models[position] = updated;
				next.models = models;
				return {
					profile: next,
					changed: true
				};
			}
			const overrides = isRecord(next.modelOverrides) ? structuredClone(next.modelOverrides) : {};
			const current = isRecord(overrides[modelId]) ? structuredClone(overrides[modelId]) : {};
			const updated = applyUniversalReasoningDefaults(providerId, next, {
				id: modelId,
				...current
			});
			delete updated.id;
			if (JSON.stringify(updated) === JSON.stringify(current)) return {
				profile: next,
				changed: false
			};
			overrides[modelId] = updated;
			next.modelOverrides = overrides;
			return {
				profile: next,
				changed: true
			};
		}
		function inferThinkingFormat(providerId, profile, model) {
			const identity = `${providerId} ${stringField(profile, "baseURL")} ${stringField(model, "id")} ${stringField(model, "name")}`.toLocaleLowerCase();
			if (identity.includes("openrouter")) return "openrouter";
			if (identity.includes("deepseek")) return "deepseek";
			if (identity.includes("qwen")) return "qwen";
			if (identity.includes("zhipu") || identity.includes("bigmodel") || /\bglm[-_\s]/u.test(identity)) return "zai";
			if (identity.includes("together")) return "together";
		}
		function setCompatDefault(source, key, value) {
			return compatValue(source, key) === void 0 ? setCompatField(source, key, value) : structuredClone(source);
		}
		/**
		* Add the replay fields required by DeepSeek reasoning models behind custom
		* OpenAI-compatible gateways. Explicit compatibility values always win.
		*/
		function applyReasoningCompatibilityDefaults(protocol, model) {
			const next = structuredClone(model);
			if (protocol !== "openai-completions") return {
				model: next,
				changed: false
			};
			const compat = isRecord(next.compat) ? structuredClone(next.compat) : {};
			const explicitThinkingFormat = typeof compat.thinkingFormat === "string" ? compat.thinkingFormat : void 0;
			if (explicitThinkingFormat !== void 0 && explicitThinkingFormat !== "deepseek") return {
				model: next,
				changed: false
			};
			const identity = [next.id, next.name].filter((value) => typeof value === "string").join(" ").toLocaleLowerCase();
			const isDeepSeekDialect = explicitThinkingFormat === "deepseek" || compat.requiresReasoningContentOnAssistantMessages === true || identity.includes("deepseek");
			if (!isDeepSeekDialect) return {
				model: next,
				changed: false
			};
			let changed = false;
			if (isDeepSeekDialect && compat.thinkingFormat === void 0) {
				compat.thinkingFormat = "deepseek";
				changed = true;
			}
			if (compat.requiresReasoningContentOnAssistantMessages === void 0) {
				compat.requiresReasoningContentOnAssistantMessages = true;
				changed = true;
			}
			if (compat.supportsDeveloperRole === void 0) {
				compat.supportsDeveloperRole = false;
				changed = true;
			}
			if (changed) next.compat = compat;
			return {
				model: next,
				changed
			};
		}
		/** Repair all eligible models in a provider profile without changing manual values. */
		function repairProviderCompatibility(profile, modelId) {
			const next = structuredClone(profile);
			const protocol = stringField(next, "api");
			const sourceModels = modelRecords(next);
			const repairedModels = [];
			const models = sourceModels.map((model) => {
				if (modelId !== void 0 && model.id !== modelId) return structuredClone(model);
				const result = applyReasoningCompatibilityDefaults(protocol, model);
				if (result.changed) repairedModels.push(typeof model.id === "string" && model.id.trim() !== "" ? model.id.trim() : "unknown model");
				return result.model;
			});
			if (repairedModels.length > 0) next.models = models;
			if (isRecord(next.modelOverrides)) {
				const overrides = Object.fromEntries(Object.entries(next.modelOverrides).map(([id, value]) => {
					if (!isRecord(value) || modelId !== void 0 && id !== modelId) return [id, value];
					const result = applyReasoningCompatibilityDefaults(protocol, {
						id,
						...value
					});
					const updated = structuredClone(result.model);
					delete updated.id;
					if (result.changed) repairedModels.push(id.trim() || "unknown model");
					return [id, updated];
				}));
				if (repairedModels.length > 0) next.modelOverrides = overrides;
			}
			return {
				profile: next,
				changed: repairedModels.length > 0,
				repairedModels
			};
		}
		//#endregion
		//#region src/client/ProviderIcon.tsx
		/** Inline monochrome brand glyphs; every path inherits currentColor. */
		const GLYPHS = {
			openai: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 3.2 15 5v3.2l2.8 1.6v3.6L15 15v3.2l-3 1.8-3-1.8V15l-2.8-1.6V9.8L9 8.2V5l3-1.8Zm0 2.2-1 .6v2.6l-2.8 1.6v2.4L11 14.2v2.6l1 .6 1-.6v-2.6l2.8-1.6v-2.4L13 8.6V6l-1-.6Z" }),
			anthropic: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M13.8 5h2.9L21 19h-3l-1-3.4h-4.6L11.3 19H8.4L13.8 5Zm.4 4.6-1.4 4.6h3.4l-1.5-4.6h-.5ZM5 15.2 9.4 5h2.4L7.4 15.2H5Z",
				transform: "translate(-1.2 0)"
			}),
			google: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M12 10.2v3.4h4.9c-.2 1.3-1.5 3.8-4.9 3.8-3 0-5.4-2.5-5.4-5.4S9 6.6 12 6.6c1.7 0 2.8.7 3.5 1.3l2.4-2.3C16.4 4.2 14.4 3.4 12 3.4 6.9 3.4 2.8 7.5 2.8 12.4S6.9 21.6 12 21.6c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1-.1-1.5H12Z",
				transform: "scale(.92) translate(1 .4)"
			}),
			deepseek: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M20.2 6.6c-.5-.3-1.2-.2-1.6.1-.3-.9-1-1.7-2-2.1-.5-.2-1 .1-1.1.5l-.3 1.3c-2.7.5-4.9 2-6.3 4.3-.9 1.5-2.4 2.3-4 2.1-.5-.1-.9.2-1 .6-.1.3 0 .7.3 1 1.7 1.4 4 1.9 6.3 1.2 3-1 5.2-3.4 6-6.4.6.2 1.3.1 1.9-.3.8-.5 1.4-1.3 1.8-2.3ZM9.4 16.4c-1 .3-2 .4-3 .1.5.6 1.3 1 2.2 1.1 1.9.2 3.8-.5 5.4-1.9-.7.4-1.5.7-2.3.8-.8.1-1.6 0-2.3-.1Z" }),
			openrouter: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 4h2.4v6.2L18 4.6v6.3l2-.9V14l-2-.9v6.3L6.4 13.8V20H4V4Zm2.4 8.7 9.2 4.6V6.7L6.4 11.3Z" }),
			moonshot: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 7.4-5H14a4 4 0 0 1-6.9-4A4 4 0 0 1 14 9h5.4A8 8 0 0 0 12 4Zm4.9 7h2.8a8.2 8.2 0 0 0 0 0Z" }),
			kimi: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 4h2.6v7.1L14 4h3.3l-6 6.9 6.2 9.1h-3.3l-4.9-7.3-2.7 3.1V20H5V4Zm13.8.6a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8Z" }),
			minimax: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 10h2v4H4v-4Zm3.5-3h2v10h-2V7ZM11 4.5h2v15h-2v-15Zm3.5 2.5h2v10h-2V7ZM18 10h2v4h-2v-4Z" }),
			zai: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 5h14v2.4l-8.6 8.2H19V18H5v-2.4l8.6-8.2H5V5Zm7.6-1.6 1.5 2-1.5 2-1.5-2 1.5-2Z" }),
			qwen: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4a8 8 0 0 1 8 8c0 2.5-1.2 4.8-3 6.2l1.6 2.4-1.9 1.2-1.8-2.7c-.9.3-1.9.5-2.9.5a8 8 0 0 1 0-16Zm0 2.6a5.4 5.4 0 1 0 0 10.8c.5 0 1-.1 1.4-.2l-1.2-1.8 1.9-1.2 1.3 1.9A5.4 5.4 0 0 0 12 6.6Z" }),
			xai: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 4h3.4l4.6 6.6L16.6 4H20l-6.3 8.8L20 20h-3.4L12 13.4 7.4 20H4l6.3-7.2L4 4Z" }),
			xiaomi: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 7h9.5c3.6 0 6.5 2.2 6.5 5s-2.9 5-6.5 5H4v-2.6h9.3c2.1 0 3.7-1 3.7-2.4s-1.6-2.4-3.7-2.4H6.6V17H4V7Zm2.6 2.6v4.8h2.3V9.6H6.6Z" }),
			together: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4.5a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8ZM6.4 13a2.4 2.4 0 1 1 4.8 0 2.4 2.4 0 0 1-4.8 0Zm6.4 0a2.4 2.4 0 1 1 4.8 0 2.4 2.4 0 0 1-4.8 0ZM12 15.8a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8Z" }),
			fireworks: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 3l1.7 4.9L18.6 6l-3.4 3.8 4 2.9-4.9.5.9 4.9-3.2-3.8-3.2 3.8.9-4.9-4.9-.5 4-2.9L5.4 6l4.9 1.9L12 3Z" }),
			groq: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 7h13.5A2.5 2.5 0 0 1 20 9.5V13a4 4 0 0 1-4 4H9.5v-2.6H16a1.4 1.4 0 0 0 1.4-1.4v-.4H12v-2.4h5.4V9.6H4V7Zm5.5 2.6v2.4H4V9.6h5.5Z" }),
			mistral: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M4 6h3v3H4V6Zm4.3 0h3v3h-3V6ZM12.7 6h3v3h-3V6ZM17 6h3v3h-3V6ZM4 9.7h3v3.6H4V9.7Zm12.9 0h3v3.6h-3V9.7ZM4 13.3h3v3.6H4v-3.6Zm4.3 0h3v3.6h-3v-3.6Zm4.4 0h3v3.6h-3v-3.6Zm4.3 0h3v3.6h-3v-3.6ZM8.3 17h3v1.6h-3V17Zm4.4 0h3v1.6h-3V17Z",
				transform: "scale(.9) translate(1.2 1.2)"
			}),
			nvidia: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 6.6c4.3 0 7.6 2.3 9 5.4-1.4 3.1-4.7 5.4-9 5.4-4.3 0-7.6-2.3-9-5.4 1.4-3.1 4.7-5.4 9-5.4Zm0 2.2c-2.6 0-4.9 1.2-6.2 3.2 1.3 2 3.6 3.2 6.2 3.2s4.9-1.2 6.2-3.2c-1.3-2-3.6-3.2-6.2-3.2Zm0 1.2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" }),
			azure: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M10.2 4 5 18.6h4.3l1-2.8 4 2.8h4.9L13.4 4h-3.2Zm.8 4.5 2.5 7.6-3.4-2.4.9-5.2Z" }),
			bedrock: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 5h6v6H5V5Zm8 0h6v6h-6V5ZM5 13h6v6H5v-6Zm8 3h6v3h-6v-3Z" }),
			cloudflare: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M16.9 15.4c.2-2-1.2-3.7-3.4-4.1-.3-1.8-1.9-3.2-4-3.2-2.4 0-4.3 1.8-4.5 4.1-1.6.3-2.7 1.6-2.7 3.2 0 1.8 1.5 3.2 3.4 3.2h10.4c1.6 0 2.9-1.2 2.9-2.8 0-1.4-1-2.6-2.4-2.9l.3 2.5Z",
				transform: "scale(.94) translate(.6 1)"
			}),
			vercel: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4.5 20.5 19h-17L12 4.5Z" }),
			baseten: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 5h3.4v4.6H5V5Zm0 6.2h3.4V19H5v-7.8ZM10.3 5h3.4v8.4h-3.4V5Zm0 10h3.4V19h-3.4v-4ZM15.6 5H19v11h-3.4V5Zm0 12.6H19V19h-3.4v-1.4Z" }),
			cerebras: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4a8 8 0 0 1 6.9 4l-2.2 1.3A5.6 5.6 0 0 0 12 6.4 5.6 5.6 0 0 0 6.4 12 5.6 5.6 0 0 0 12 17.6a5.6 5.6 0 0 0 4.7-2.9l2.2 1.3A8 8 0 1 1 12 4Z" }),
			huggingface: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8ZM9.3 8.6a1 1 0 0 1 1 1v1.2a1 1 0 1 1-2 0V9.6a1 1 0 0 1 1-1Zm5.4 0a1 1 0 0 1 1 1v1.2a1 1 0 1 1-2 0V9.6a1 1 0 0 1 1-1ZM8 13.4c1 1.4 2.4 2.1 4 2.1s3-.7 4-2.1c.3.9-.1 1.7-1 2.4a5 5 0 0 1-3 .9 5 5 0 0 1-3-.9c-.9-.7-1.3-1.5-1-2.4Z" }),
			copilot: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9 4h6c.6 2.4.9 5 .9 8S15.6 17.6 15 20H9c-.6-2.4-.9-5-.9-8S8.4 6.4 9 4Zm-3.2 2c-.4 1.9-.6 4-.6 6s.2 4.1.6 6H4.4C3.5 16.2 3 14.2 3 12s.5-4.2 1.4-6h1.4Zm12.4 0h1.4c.9 1.8 1.4 3.8 1.4 6s-.5 4.2-1.4 6h-1.4c.4-1.9.6-4 .6-6s-.2-4.1-.6-6Z" }),
			opencode: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 5h6.4v2.6H7.6v8.8h3.8V19H5V5Zm7.6 0H19v14h-6.4v-2.6h3.8V7.6h-3.8V5Z" }),
			antling: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 3.4c.9 0 1.6.7 1.6 1.6 0 .6-.3 1.1-.8 1.4l.8 1.6h4.6l2 8.8c.2 1-.4 1.8-1.4 1.8H5.2c-1 0-1.6-.8-1.4-1.8l2-8.8h4.6l.8-1.6c-.5-.3-.8-.8-.8-1.4 0-.9.7-1.6 1.6-1.6ZM6.2 10.2l-1.4 6.2h14.4l-1.4-6.2H6.2Zm2.3 2.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Zm7 0a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" }),
			sensenova: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4a8 8 0 0 1 8 8h-2.6A5.4 5.4 0 0 0 12 6.6 5.4 5.4 0 0 0 6.6 12H4a8 8 0 0 1 8-8Zm0 5.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6ZM4 12h2.6A5.4 5.4 0 0 0 12 17.4 5.4 5.4 0 0 0 17.4 12H20a8 8 0 0 1-16 0Z" }),
			scnet: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M4 6h7v2.4H6.4v2.2H11V13H6.4v2.6H11V18H4V6Zm9 0h7v2.4h-4.6v2.2H20V13h-4.6v5H13V6Z",
				transform: "scale(.98)"
			}),
			stepfun: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 5h9.4a4.6 4.6 0 0 1 0 9.2H8.4V19H5V5Zm3.4 2.6v4h5.8a2 2 0 0 0 0-4H8.4Z" }),
			tencent: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4c4.4 0 8 2.9 8 6.5 0 3.1-2.6 5.7-6.1 6.4l-.3 2.7c0 .5-.6.8-1 .5l-3.4-2.6C6 16.4 4 13.9 4 10.5 4 6.9 7.6 4 12 4Z" }),
			responses: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4a8 8 0 1 1-7.4 5H2.8L6 5l3.2 4H6.9A5.6 5.6 0 1 0 12 6.4c-1.7 0-3.2.7-4.2 1.9L6 6.5A8 8 0 0 1 12 4Z" }),
			completions: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 5h16v11H9.8L6 19.4V16H4V5Zm2.4 2.4v6.2h11.2V7.4H6.4Z" }),
			anthropiccompat: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M6.4 4h11.2c1.3 0 2.4 1.1 2.4 2.4v7.2c0 1.3-1.1 2.4-2.4 2.4H10l-4.2 3.6V16H6.4A2.4 2.4 0 0 1 4 13.6V6.4C4 5.1 5.1 4 6.4 4Z",
				transform: "scale(.92) translate(1 1)"
			}),
			radius: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8Zm0 2.4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 3.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z" }),
			generic: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M10.6 4h2.8l.4 2.3c.6.2 1.2.5 1.7.9l2.2-.8 1.4 2.4-1.7 1.6a7 7 0 0 1 0 2l1.7 1.6-1.4 2.4-2.2-.8c-.5.4-1.1.7-1.7.9l-.4 2.3h-2.8l-.4-2.3a6.6 6.6 0 0 1-1.7-.9l-2.2.8-1.4-2.4 1.7-1.6a7 7 0 0 1 0-2L3.2 8.8l1.4-2.4 2.2.8c.5-.4 1.1-.7 1.7-.9L10.6 4ZM12 9.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z" })
		};
		/** Mid-tone brand accents chosen to read on both light and dark themes. */
		const BRAND_COLORS = {
			openai: "#10a37f",
			anthropic: "#d97757",
			google: "#4285f4",
			deepseek: "#4d6bfe",
			openrouter: "#7c7ff2",
			moonshot: "#5b7fd9",
			kimi: "#4d9fff",
			minimax: "#e0483e",
			zai: "#7c5cff",
			qwen: "#7b5cf0",
			xai: "#9ca3af",
			xiaomi: "#ff6900",
			mistral: "#ff7000",
			nvidia: "#76b900",
			together: "#4f7cf7",
			fireworks: "#a855f7",
			groq: "#f55036",
			azure: "#0078d4",
			bedrock: "#ff9900",
			cloudflare: "#f6821f",
			vercel: "#6b7280",
			baseten: "#4f46e5",
			cerebras: "#f05a28",
			huggingface: "#e3b341",
			copilot: "#57606a",
			opencode: "#0ea5a5",
			antling: "#ff6a00",
			sensenova: "#3b82f6",
			scnet: "#dc2626",
			stepfun: "#2563eb",
			tencent: "#0052d9"
		};
		function ProviderIcon({ id, size = 20, colored = false }) {
			const glyph = GLYPHS[id] ?? GLYPHS.generic;
			const color = colored === true ? BRAND_COLORS[id] : void 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 24 24",
				fill: color ?? "currentColor",
				style: color === void 0 ? void 0 : { color },
				"aria-hidden": "true",
				focusable: "false",
				className: "dsa-provider-icon",
				children: glyph
			});
		}
		//#endregion
		//#region src/client/provider-catalog.ts
		const CUSTOM_TEMPLATES = [
			{
				id: "openai-compatible",
				displayName: "OpenAI Compatible",
				category: "custom",
				icon: "completions",
				baseURL: "https://api.example.com/v1",
				api: "openai-completions",
				hint: "/v1/chat/completions · openai-completions"
			},
			{
				id: "anthropic-compatible",
				displayName: "Anthropic Compatible",
				category: "custom",
				icon: "anthropiccompat",
				baseURL: "https://api.example.com/v1",
				api: "anthropic-messages",
				hint: "/v1/messages · anthropic-messages"
			},
			{
				id: "openai-responses",
				displayName: "OpenAI Responses",
				category: "custom",
				icon: "responses",
				baseURL: "https://api.example.com/v1",
				api: "openai-responses",
				hint: "Responses API · openai-responses"
			},
			{
				id: "openrouter-free",
				displayName: "OpenRouter Free（仅免费）",
				category: "custom",
				icon: "openrouter",
				baseURL: "https://openrouter.ai/api/v1",
				api: "openai-completions",
				credentialRef: "OPENROUTER_API_KEY",
				hint: "启动时自动同步 :free 模型"
			}
		];
		const SUBSCRIPTION_TEMPLATES = [
			{
				id: "github-copilot",
				displayName: "GitHub Copilot",
				category: "subscription",
				icon: "copilot",
				oauthOnly: true
			},
			{
				id: "kimi-for-coding",
				displayName: "Kimi For Coding",
				category: "subscription",
				icon: "kimi",
				oauthOnly: true
			},
			{
				id: "chatgpt-plus-pro",
				displayName: "ChatGPT Plus/Pro",
				category: "subscription",
				icon: "openai",
				oauthOnly: true
			},
			{
				id: "openrouter-oauth",
				displayName: "OpenRouter",
				category: "subscription",
				icon: "openrouter",
				oauthOnly: true
			},
			{
				id: "radius-oauth",
				displayName: "Radius",
				category: "subscription",
				icon: "radius",
				oauthOnly: true
			},
			{
				id: "xai-oauth",
				displayName: "xAI",
				category: "subscription",
				icon: "xai",
				oauthOnly: true
			}
		];
		/** The full DSH built-in provider directory; each adds a catalog-backed route. */
		const CATALOG_TEMPLATES = [
			{
				id: "openai",
				displayName: "OpenAI",
				category: "api-key",
				icon: "openai",
				credentialRef: "OPENAI_API_KEY",
				models: 39,
				hint: "内置目录 · 39 个模型",
				catalog: true
			},
			{
				id: "anthropic",
				displayName: "Anthropic",
				category: "api-key",
				icon: "anthropic",
				credentialRef: "ANTHROPIC_API_KEY",
				models: 11,
				hint: "内置目录 · 11 个模型",
				catalog: true
			},
			{
				id: "deepseek",
				displayName: "DeepSeek",
				category: "api-key",
				icon: "deepseek",
				credentialRef: "DEEPSEEK_API_KEY",
				models: 6,
				hint: "内置目录 · 6 个模型",
				catalog: true
			},
			{
				id: "openrouter",
				displayName: "OpenRouter",
				category: "api-key",
				icon: "openrouter",
				credentialRef: "OPENROUTER_API_KEY",
				models: 362,
				hint: "内置目录 · 362 个模型",
				catalog: true
			},
			{
				id: "google",
				displayName: "Google",
				category: "api-key",
				icon: "google",
				credentialRef: "GEMINI_API_KEY",
				models: 22,
				hint: "内置目录 · 22 个模型",
				catalog: true
			},
			{
				id: "google-vertex",
				displayName: "Google Vertex AI",
				category: "api-key",
				icon: "google",
				models: 9,
				hint: "内置目录 · 需配置项目与凭据",
				catalog: true
			},
			{
				id: "amazon-bedrock",
				displayName: "Amazon Bedrock",
				category: "api-key",
				icon: "bedrock",
				models: 121,
				hint: "内置目录 · 需 AWS 凭据",
				catalog: true
			},
			{
				id: "azure-openai-responses",
				displayName: "Azure OpenAI",
				category: "api-key",
				icon: "azure",
				credentialRef: "AZURE_OPENAI_API_KEY",
				models: 38,
				hint: "内置目录 · 38 个模型",
				catalog: true
			},
			{
				id: "moonshotai",
				displayName: "Moonshot AI",
				category: "api-key",
				icon: "moonshot",
				credentialRef: "MOONSHOT_API_KEY",
				models: 10,
				hint: "内置目录 · 10 个模型",
				catalog: true
			},
			{
				id: "moonshotai-cn",
				displayName: "Moonshot AI CN",
				category: "api-key",
				icon: "moonshot",
				credentialRef: "MOONSHOT_CN_API_KEY",
				models: 10,
				hint: "内置目录 · 中国站",
				catalog: true
			},
			{
				id: "kimi-for-coding-api",
				displayName: "Kimi For Coding",
				category: "api-key",
				icon: "kimi",
				credentialRef: "KIMI_API_KEY",
				models: 4,
				hint: "内置目录 · anthropic-messages",
				catalog: true
			},
			{
				id: "minimax",
				displayName: "MiniMax",
				category: "api-key",
				icon: "minimax",
				credentialRef: "MINIMAX_API_KEY",
				models: 3,
				hint: "内置目录 · 国际站",
				catalog: true
			},
			{
				id: "minimax-cn",
				displayName: "MiniMax CN",
				category: "api-key",
				icon: "minimax",
				credentialRef: "MINIMAX_CN_API_KEY",
				models: 3,
				hint: "内置目录 · 中国站",
				catalog: true
			},
			{
				id: "zai",
				displayName: "Z.AI",
				category: "api-key",
				icon: "zai",
				credentialRef: "ZAI_API_KEY",
				models: 7,
				hint: "内置目录 · GLM 系列",
				catalog: true
			},
			{
				id: "zai-coding-cn",
				displayName: "Z.AI Coding CN",
				category: "api-key",
				icon: "zai",
				credentialRef: "ZAI_CODING_CN_API_KEY",
				models: 10,
				hint: "内置目录 · bigmodel.cn",
				catalog: true
			},
			{
				id: "qwen-token-plan",
				displayName: "Qwen Token Plan",
				category: "api-key",
				icon: "qwen",
				credentialRef: "QWEN_TOKEN_PLAN_API_KEY",
				models: 18,
				hint: "内置目录 · 国际站",
				catalog: true
			},
			{
				id: "qwen-token-plan-cn",
				displayName: "Qwen Token Plan CN",
				category: "api-key",
				icon: "qwen",
				credentialRef: "QWEN_TOKEN_PLAN_CN_API_KEY",
				models: 18,
				hint: "内置目录 · 中国站",
				catalog: true
			},
			{
				id: "qwen-token-plan-individual",
				displayName: "Qwen Token Plan Individual",
				category: "api-key",
				icon: "qwen",
				credentialRef: "QWEN_TOKEN_PLAN_API_KEY",
				models: 9,
				hint: "内置目录 · 个人版",
				catalog: true
			},
			{
				id: "xiaomi",
				displayName: "Xiaomi",
				category: "api-key",
				icon: "xiaomi",
				credentialRef: "XIAOMI_API_KEY",
				models: 3,
				hint: "内置目录 · MiMo 系列",
				catalog: true
			},
			{
				id: "xiaomi-token-plan-ams",
				displayName: "Xiaomi Token Plan AMS",
				category: "api-key",
				icon: "xiaomi",
				credentialRef: "XIAOMI_TOKEN_PLAN_AMS_API_KEY",
				models: 2,
				hint: "内置目录 · 阿姆斯特丹",
				catalog: true
			},
			{
				id: "xiaomi-token-plan-cn",
				displayName: "Xiaomi Token Plan CN",
				category: "api-key",
				icon: "xiaomi",
				credentialRef: "XIAOMI_TOKEN_PLAN_CN_API_KEY",
				models: 2,
				hint: "内置目录 · 中国站",
				catalog: true
			},
			{
				id: "xiaomi-token-plan-sgp",
				displayName: "Xiaomi Token Plan SGP",
				category: "api-key",
				icon: "xiaomi",
				credentialRef: "XIAOMI_TOKEN_PLAN_SGP_API_KEY",
				models: 2,
				hint: "内置目录 · 新加坡",
				catalog: true
			},
			{
				id: "xai",
				displayName: "xAI",
				category: "api-key",
				icon: "xai",
				credentialRef: "XAI_API_KEY",
				models: 3,
				hint: "内置目录 · Grok 系列",
				catalog: true
			},
			{
				id: "mistral",
				displayName: "Mistral",
				category: "api-key",
				icon: "mistral",
				credentialRef: "MISTRAL_API_KEY",
				models: 32,
				hint: "内置目录 · 32 个模型",
				catalog: true
			},
			{
				id: "nvidia",
				displayName: "NVIDIA",
				category: "api-key",
				icon: "nvidia",
				credentialRef: "NVIDIA_API_KEY",
				models: 20,
				hint: "内置目录 · NIM 目录",
				catalog: true
			},
			{
				id: "together",
				displayName: "Together",
				category: "api-key",
				icon: "together",
				credentialRef: "TOGETHER_API_KEY",
				models: 21,
				hint: "内置目录 · 21 个模型",
				catalog: true
			},
			{
				id: "fireworks",
				displayName: "Fireworks",
				category: "api-key",
				icon: "fireworks",
				credentialRef: "FIREWORKS_API_KEY",
				models: 19,
				hint: "内置目录 · 19 个模型",
				catalog: true
			},
			{
				id: "groq",
				displayName: "Groq",
				category: "api-key",
				icon: "groq",
				credentialRef: "GROQ_API_KEY",
				models: 9,
				hint: "内置目录 · 9 个模型",
				catalog: true
			},
			{
				id: "baseten",
				displayName: "Baseten",
				category: "api-key",
				icon: "baseten",
				credentialRef: "BASETEN_API_KEY",
				models: 20,
				hint: "内置目录 · 20 个模型",
				catalog: true
			},
			{
				id: "cerebras",
				displayName: "Cerebras",
				category: "api-key",
				icon: "cerebras",
				credentialRef: "CEREBRAS_API_KEY",
				models: 2,
				hint: "内置目录 · 2 个模型",
				catalog: true
			},
			{
				id: "huggingface",
				displayName: "Hugging Face",
				category: "api-key",
				icon: "huggingface",
				credentialRef: "HF_TOKEN",
				models: 71,
				hint: "内置目录 · Inference Providers",
				catalog: true
			},
			{
				id: "ant-ling",
				displayName: "Ant Ling",
				category: "api-key",
				icon: "antling",
				credentialRef: "ANT_LING_API_KEY",
				models: 3,
				hint: "内置目录 · 3 个模型",
				catalog: true
			},
			{
				id: "opencode",
				displayName: "OpenCode Zen",
				category: "api-key",
				icon: "opencode",
				credentialRef: "OPENCODE_API_KEY",
				models: 63,
				hint: "内置目录 · 63 个模型",
				catalog: true
			},
			{
				id: "opencode-go",
				displayName: "OpenCode Go",
				category: "api-key",
				icon: "opencode",
				credentialRef: "OPENCODE_API_KEY",
				models: 27,
				hint: "内置目录 · 27 个模型",
				catalog: true
			},
			{
				id: "vercel-ai-gateway",
				displayName: "Vercel AI Gateway",
				category: "api-key",
				icon: "vercel",
				credentialRef: "AI_GATEWAY_API_KEY",
				models: 233,
				hint: "内置目录 · 233 个模型",
				catalog: true
			},
			{
				id: "cloudflare-ai-gateway",
				displayName: "Cloudflare AI Gateway",
				category: "api-key",
				icon: "cloudflare",
				models: 50,
				hint: "内置目录 · 需账号与网关 ID",
				catalog: true
			},
			{
				id: "cloudflare-workers-ai",
				displayName: "Cloudflare Workers AI",
				category: "api-key",
				icon: "cloudflare",
				models: 18,
				hint: "内置目录 · 18 个模型",
				catalog: true
			},
			{
				id: "radius",
				displayName: "Radius",
				category: "api-key",
				icon: "radius",
				models: 0,
				hint: "内置目录 · 0 个模型",
				catalog: true
			},
			{
				id: "github-copilot-api",
				displayName: "GitHub Copilot",
				category: "api-key",
				icon: "copilot",
				credentialRef: "COPILOT_GITHUB_TOKEN",
				models: 60,
				hint: "内置目录 · 支持令牌接入",
				catalog: true
			}
		];
		[
			...CUSTOM_TEMPLATES,
			...SUBSCRIPTION_TEMPLATES,
			...CATALOG_TEMPLATES
		];
		const BRAND_RULES = [
			{
				icon: "openrouter",
				brandName: "OpenRouter",
				patterns: [/openrouter/iu]
			},
			{
				icon: "deepseek",
				brandName: "DeepSeek",
				patterns: [/deepseek/iu]
			},
			{
				icon: "anthropic",
				brandName: "Anthropic",
				patterns: [/anthropic|claude/iu]
			},
			{
				icon: "openai",
				brandName: "OpenAI",
				patterns: [/openai|chatgpt|gpt-|^o[134](-|$)/iu]
			},
			{
				icon: "google",
				brandName: "Google",
				patterns: [/google|gemini|generativelanguage|vertex/iu]
			},
			{
				icon: "moonshot",
				brandName: "Moonshot AI",
				patterns: [/moonshot|kimi/iu]
			},
			{
				icon: "minimax",
				brandName: "MiniMax",
				patterns: [/minimax/iu]
			},
			{
				icon: "zai",
				brandName: "Z.AI",
				patterns: [/z-?ai|bigmodel|glm|zhipu/iu]
			},
			{
				icon: "qwen",
				brandName: "Qwen",
				patterns: [/qwen|alibaba|aliyun|dashscope|token-plan/iu]
			},
			{
				icon: "xai",
				brandName: "xAI",
				patterns: [/^x-?ai$|grok|x\.ai/iu]
			},
			{
				icon: "xiaomi",
				brandName: "Xiaomi",
				patterns: [/xiaomi|mimo/iu]
			},
			{
				icon: "mistral",
				brandName: "Mistral",
				patterns: [/mistral/iu]
			},
			{
				icon: "nvidia",
				brandName: "NVIDIA",
				patterns: [/nvidia|nemotron/iu]
			},
			{
				icon: "together",
				brandName: "Together",
				patterns: [/together/iu]
			},
			{
				icon: "fireworks",
				brandName: "Fireworks",
				patterns: [/fireworks/iu]
			},
			{
				icon: "groq",
				brandName: "Groq",
				patterns: [/groq/iu]
			},
			{
				icon: "azure",
				brandName: "Azure OpenAI",
				patterns: [/azure/iu]
			},
			{
				icon: "bedrock",
				brandName: "Amazon Bedrock",
				patterns: [/bedrock|amazon/iu]
			},
			{
				icon: "cloudflare",
				brandName: "Cloudflare",
				patterns: [/cloudflare/iu]
			},
			{
				icon: "vercel",
				brandName: "Vercel",
				patterns: [/vercel/iu]
			},
			{
				icon: "baseten",
				brandName: "Baseten",
				patterns: [/baseten/iu]
			},
			{
				icon: "cerebras",
				brandName: "Cerebras",
				patterns: [/cerebras/iu]
			},
			{
				icon: "huggingface",
				brandName: "Hugging Face",
				patterns: [/huggingface|hf[-_]/iu]
			},
			{
				icon: "copilot",
				brandName: "GitHub Copilot",
				patterns: [/copilot/iu]
			},
			{
				icon: "opencode",
				brandName: "OpenCode",
				patterns: [/opencode/iu]
			},
			{
				icon: "antling",
				brandName: "Ant Ling",
				patterns: [/ant-?ling/iu]
			},
			{
				icon: "kimi",
				brandName: "Kimi",
				patterns: [/kimi/iu]
			},
			{
				icon: "stepfun",
				brandName: "StepFun",
				patterns: [/stepfun|step-/iu]
			},
			{
				icon: "tencent",
				brandName: "Tencent",
				patterns: [/tencent|hy[34]/iu]
			},
			{
				icon: "sensenova",
				brandName: "SenseNova",
				patterns: [/sensenova|sensecore/iu]
			},
			{
				icon: "scnet",
				brandName: "国家超算",
				patterns: [/scnet|超算/iu]
			},
			{
				icon: "generic",
				brandName: "",
				patterns: []
			}
		];
		/** Resolve the icon (and optional brand name) for a configured provider. */
		function providerMeta(providerId, profile) {
			const id = providerId.toLocaleLowerCase();
			const host = hostOf(profile?.baseURL);
			for (const rule of BRAND_RULES) {
				if (rule.patterns.length === 0) continue;
				if (rule.patterns.some((pattern) => pattern.test(id) || host !== "" && pattern.test(host))) return {
					icon: rule.icon,
					brandName: rule.brandName === "" ? void 0 : rule.brandName
				};
			}
			return { icon: "generic" };
		}
		function hostOf(value) {
			if (typeof value !== "string" || value.trim() === "") return "";
			try {
				return new URL(value).hostname;
			} catch {
				return value.toLocaleLowerCase();
			}
		}
		//#endregion
		//#region src/client/selection-compatibility.ts
		const SETTINGS_NAMESPACE = "llm-pi-ai";
		/** Whether a catalog choice may need DeepSeek replay compatibility on a custom route. */
		function mayNeedReasoningCompatibility(providerId, modelId, modelName) {
			if (providerId === "deepseek") return false;
			return `${modelId} ${modelName}`.toLocaleLowerCase().includes("deepseek");
		}
		/**
		* Repair the selected user-configured model before DSH switches to it.
		* Static or inherited routes remain untouched.
		*/
		async function ensureSelectionCompatibility(api, providerId, modelId) {
			const described = await api.settings.describe({});
			if (!described.result.ok) throw new Error(described.result.error.message);
			const namespace = described.result.value.namespaces.find((candidate) => candidate.ns === SETTINGS_NAMESPACE);
			if (namespace === void 0) return [];
			const profile = providerProfiles(namespace.user ?? namespace.value)[providerId];
			if (profile === void 0) return [];
			const repaired = repairProviderCompatibility(profile, modelId);
			if (!repaired.changed) return [];
			const mutation = await api.settings.mutate({
				ns: SETTINGS_NAMESPACE,
				ops: [{
					op: "set",
					path: ["providers", providerId],
					value: repaired.profile
				}],
				expectedRevision: namespace.revision
			});
			if (!mutation.result.ok) throw new Error(mutation.result.error.message);
			return repaired.repairedModels;
		}
		/**
		* Whether a wanted selection is identical to the live one. Every select()
		* appends a session event and rewrites the default-model config on the host,
		* which re-renders host panels — so identical selections must be skipped
		* by every select path (quick menu, list, effort). Pure for unit testing.
		*/
		function isSameSelection(live, wanted) {
			if (live === null || live === void 0) return false;
			if (live.provider !== wanted.provider || live.model !== wanted.model) return false;
			return (live.reasoningEffort ?? "") === (wanted.reasoningEffort ?? "");
		}
		/** Ensure a selected model exposes every DSH reasoning level before submitting that level. */
		async function ensureSelectionReasoning(api, providerId, modelId) {
			const described = await api.settings.describe({});
			if (!described.result.ok) throw new Error(described.result.error.message);
			const namespace = described.result.value.namespaces.find((candidate) => candidate.ns === SETTINGS_NAMESPACE);
			if (namespace === void 0) throw new Error("The llm-pi-ai settings namespace is not loaded");
			const userProfiles = providerProfiles(namespace.user);
			const effectiveProfiles = providerProfiles(namespace.value);
			const profile = userProfiles[providerId] ?? effectiveProfiles[providerId];
			if (profile === void 0) throw new Error(`Provider ${providerId} is not configurable through llm-pi-ai`);
			const updated = ensureModelReasoning(providerId, profile, modelId);
			if (!updated.changed) return false;
			const mutation = await api.settings.mutate({
				ns: SETTINGS_NAMESPACE,
				ops: [{
					op: "set",
					path: ["providers", providerId],
					value: updated.profile
				}],
				expectedRevision: namespace.revision
			});
			if (!mutation.result.ok) throw new Error(mutation.result.error.message);
			return true;
		}
		//#endregion
		//#region src/client/trigger-stability.ts
		/** True when no select/reload is in flight — displayed values are final. */
		function isSettledStatus(status) {
			return status === "ready" || status === "error";
		}
		/**
		* Hold the last good display value across transient directory states.
		*
		* - `resolved` — value derived from the current render (`undefined` = unresolvable now).
		* - `last` — last good value from a previous render (`null` = none yet).
		* - `settled` — snapshot status is final (see `isSettledStatus`).
		*/
		function holdLastGood(resolved, last, settled) {
			if (resolved !== void 0) return {
				value: resolved,
				last: resolved
			};
			if (!settled && last !== null) return {
				value: last,
				last
			};
			return {
				value: void 0,
				last: null
			};
		}
		//#endregion
		//#region src/client/ModelPalette.tsx
		const FAVORITES_KEY = "dsa-preset:favorites:v1";
		const RECENTS_KEY = "dsa-preset:recents:v1";
		/** Per-model effort memory: choiceKey -> reasoningEffort ('' = provider default). */
		const EFFORTS_KEY = "dsa-preset:efforts:v1";
		let badgeIndex = null;
		let badgePromise = null;
		function isRecordValue(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		function buildBadgeIndex(value) {
			const index = /* @__PURE__ */ new Map();
			if (!isRecordValue(value) || !Array.isArray(value.groups)) return index;
			for (const group of value.groups) {
				if (!isRecordValue(group) || typeof group.id !== "string" || !Array.isArray(group.models)) continue;
				const inner = /* @__PURE__ */ new Map();
				for (const model of group.models) {
					if (!isRecordValue(model) || typeof model.id !== "string" || model.id === "") continue;
					inner.set(model.id, {
						context: typeof model.contextWindow === "number" && Number.isFinite(model.contextWindow) ? model.contextWindow : void 0,
						output: typeof model.maxTokens === "number" && Number.isFinite(model.maxTokens) ? model.maxTokens : void 0,
						image: Array.isArray(model.input) && model.input.includes("image"),
						free: model.id.toLocaleLowerCase().endsWith(":free")
					});
				}
				index.set(group.id, inner);
			}
			return index;
		}
		function loadBadgeIndex(api) {
			if (badgeIndex !== null) return Promise.resolve(badgeIndex);
			if (badgePromise === null) badgePromise = api.llm.models({}).then((response) => {
				const index = response.result.ok ? buildBadgeIndex(response.result.value) : /* @__PURE__ */ new Map();
				badgeIndex = index;
				return index;
			}).catch(() => {
				badgePromise = null;
				return /* @__PURE__ */ new Map();
			});
			return badgePromise;
		}
		function readStoredList(key) {
			try {
				const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
				return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
			} catch (error) {
				console.warn(`[dsa-preset] ignored invalid ${key}`, error);
				return [];
			}
		}
		function writeStoredList(key, values) {
			try {
				localStorage.setItem(key, JSON.stringify(values));
			} catch (error) {
				console.warn(`[dsa-preset] failed to persist ${key}`, error);
			}
		}
		function useStoredList(key) {
			const [values, setValues] = (0, react.useState)(() => readStoredList(key));
			const update = (next) => {
				setValues(next);
				writeStoredList(key, next);
			};
			return [values, update];
		}
		function readStoredRecord(key) {
			try {
				const parsed = JSON.parse(localStorage.getItem(key) ?? "{}");
				if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
				return Object.fromEntries(Object.entries(parsed).filter((entry) => typeof entry[0] === "string" && typeof entry[1] === "string"));
			} catch (error) {
				console.warn(`[dsa-preset] ignored invalid ${key}`, error);
				return {};
			}
		}
		function writeStoredRecord(key, values) {
			try {
				localStorage.setItem(key, JSON.stringify(values));
			} catch (error) {
				console.warn(`[dsa-preset] failed to persist ${key}`, error);
			}
		}
		function useStoredRecord(key) {
			const [values, setValues] = (0, react.useState)(() => readStoredRecord(key));
			const update = (next) => {
				setValues(next);
				writeStoredRecord(key, next);
			};
			return [values, update];
		}
		function isTypingTarget(target) {
			return target instanceof HTMLElement && (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");
		}
		function messageOf(error) {
			return error instanceof Error ? error.message : String(error);
		}
		/**
		* Codex-style discrete reasoning-effort slider. Stops come from the current
		* model's declared efforts only, prefixed by the provider default.
		*/
		function EffortSelect({ value, options, defaultLabel, label, disabled, compact = false, onChange }) {
			const [menuOpen, setMenuOpen] = (0, react.useState)(false);
			const menuRef = (0, react.useRef)(null);
			const compactActiveName = value === "" ? defaultLabel : options.find((option) => option.id === value)?.name ?? value;
			const { innerRef: effortInnerRef, width: effortWidth } = useAnimatedWidth(compactActiveName, 20);
			(0, react.useEffect)(() => {
				if (!menuOpen) return;
				const onPointerDown = (event) => {
					if (menuRef.current !== null && !menuRef.current.contains(event.target)) setMenuOpen(false);
				};
				const onKeyDown = (event) => {
					if (event.key === "Escape") setMenuOpen(false);
				};
				document.addEventListener("pointerdown", onPointerDown);
				document.addEventListener("keydown", onKeyDown);
				return () => {
					document.removeEventListener("pointerdown", onPointerDown);
					document.removeEventListener("keydown", onKeyDown);
				};
			}, [menuOpen]);
			if (compact) {
				const activeName = compactActiveName;
				const items = [{
					id: "",
					name: defaultLabel
				}, ...options];
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					ref: menuRef,
					className: `dsa-effort-select is-compact${disabled ? " is-busy" : ""}${menuOpen ? " is-open" : ""}`,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dsa-effort-button",
						style: effortWidth === null ? void 0 : { width: effortWidth },
						disabled,
						"aria-label": label,
						"aria-haspopup": "listbox",
						"aria-expanded": menuOpen,
						title: `${label}: ${activeName}`,
						onClick: () => setMenuOpen((open) => !open),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dsa-effort-inner",
							ref: effortInnerRef,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsa-effort-bolt",
									"aria-hidden": "true",
									children: "⚡"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsa-effort-value",
									children: activeName
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsa-effort-caret",
									"aria-hidden": "true",
									children: "▾"
								})
							]
						})
					}), menuOpen && !disabled && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: "dsa-effort-menu",
						role: "listbox",
						"aria-label": label,
						children: items.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", {
							role: "option",
							"aria-selected": item.id === value,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `dsa-effort-item${item.id === value ? " is-active" : ""}`,
								onClick: () => {
									setMenuOpen(false);
									if (item.id !== value) onChange(item.id);
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsa-effort-item-name",
									children: item.name
								}), item.id === value && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsa-effort-check",
									"aria-hidden": "true",
									children: "✓"
								})]
							})
						}, item.id === "" ? "__default" : item.id))
					})]
				});
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: `dsa-effort-select${disabled ? " is-busy" : ""}`,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dsa-effort-select-label",
					children: label
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
					value,
					disabled,
					"aria-label": label,
					onChange: (event) => onChange(event.currentTarget.value),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
						value: "",
						children: defaultLabel
					}), options.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
						value: option.id,
						children: option.name
					}, option.id))]
				})]
			});
		}
		/**
		* Smooth pill-width animation for the composer seats.
		*
		* Mechanism it addresses: every model/effort switch changes the seat's
		* content width, and the instant width jump shifts the neighbouring host
		* composer elements (visible as flicker/jerk of the black buttons).
		* The pill stays content-sized — no reserved gap — but the width travels
		* to the new value over ~0.18s (see `transition: width` on the seats),
		* so neighbours glide instead of jumping.
		*
		* The inner content is measured with `scrollWidth` (immune to the
		* button's own explicit width); `contentKey` must change whenever the
		* visible content changes.
		*/
		function useAnimatedWidth(contentKey, horizontalPadding) {
			const innerRef = (0, react.useRef)(null);
			const [width, setWidth] = (0, react.useState)(null);
			(0, react.useLayoutEffect)(() => {
				const el = innerRef.current;
				if (el === null) return;
				const next = Math.ceil(el.scrollWidth) + horizontalPadding;
				setWidth((prev) => prev === next ? prev : next);
			}, [contentKey, horizontalPadding]);
			return {
				innerRef,
				width
			};
		}
		function ModelPalette({ locked, available, directory, load, select, api, isLoopback, t }) {
			const snapshot = (0, react.useSyncExternalStore)(directory.subscribe, directory.getSnapshot, directory.getSnapshot);
			const choices = (0, react.useMemo)(() => flattenChoices(snapshot.groups), [snapshot.groups]);
			const current = currentChoice(choices, snapshot.current);
			const [open, setOpen] = (0, react.useState)(false);
			const [quickOpen, setQuickOpen] = (0, react.useState)(false);
			const quickRef = (0, react.useRef)(null);
			const lastLabelRef = (0, react.useRef)(null);
			const lastProviderRef = (0, react.useRef)(null);
			const lastEffortRef = (0, react.useRef)(null);
			const [query, setQuery] = (0, react.useState)("");
			const [providerId, setProviderId] = (0, react.useState)(null);
			const [quickFilter, setQuickFilter] = (0, react.useState)("all");
			const [cursor, setCursor] = (0, react.useState)(0);
			const [favorites, setFavorites] = useStoredList(FAVORITES_KEY);
			const [recents, setRecents] = useStoredList(RECENTS_KEY);
			const [effortMap, setEffortMap] = useStoredRecord(EFFORTS_KEY);
			const [appliedKey, setAppliedKey] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [effortBusy, setEffortBusy] = (0, react.useState)(false);
			const searchRef = (0, react.useRef)(null);
			const rowRefs = (0, react.useRef)([]);
			const providers = (0, react.useMemo)(() => {
				const currentProvider = snapshot.current?.provider;
				return [...snapshot.groups].sort((left, right) => {
					if (left.id === currentProvider) return -1;
					if (right.id === currentProvider) return 1;
					return left.name.localeCompare(right.name);
				});
			}, [snapshot.groups, snapshot.current?.provider]);
			const results = (0, react.useMemo)(() => rankChoices(choices, {
				query,
				providerId,
				favorites,
				recents,
				current: snapshot.current,
				quickFilter
			}), [
				choices,
				query,
				providerId,
				favorites,
				recents,
				snapshot.current,
				quickFilter
			]);
			const favoriteChoices = (0, react.useMemo)(() => choices.filter((choice) => favorites.includes(choice.key)), [choices, favorites]);
			const quickChoices = (0, react.useMemo)(() => favoriteChoices.length > 0 ? favoriteChoices : choices.filter((choice) => recents.includes(choice.key)).slice(0, 6), [
				favoriteChoices,
				choices,
				recents
			]);
			(0, react.useEffect)(() => {
				if (!quickOpen) return;
				const onPointerDown = (event) => {
					if (quickRef.current !== null && !quickRef.current.contains(event.target)) setQuickOpen(false);
				};
				const onKeyDown = (event) => {
					if (event.key === "Escape") setQuickOpen(false);
				};
				document.addEventListener("pointerdown", onPointerDown);
				document.addEventListener("keydown", onKeyDown);
				return () => {
					document.removeEventListener("pointerdown", onPointerDown);
					document.removeEventListener("keydown", onKeyDown);
				};
			}, [quickOpen]);
			/** Build the selection for a choice, restoring the remembered per-model effort. */
			const selectionWithSavedEffort = (choice) => {
				const savedEffort = effortMap[choice.key];
				const fallbackEffort = choice.selection.reasoningEffort;
				const wantedEffort = savedEffort !== void 0 ? savedEffort : fallbackEffort ?? "";
				return {
					provider: choice.provider.id,
					model: choice.model.id,
					...wantedEffort === "" ? {} : { reasoningEffort: wantedEffort }
				};
			};
			/** Fast path for the quick preset menu: apply + close the small menu only. */
			const applyQuick = async (choice) => {
				setQuickOpen(false);
				const wanted = selectionWithSavedEffort(choice);
				if (isSameSelection$1(wanted)) {
					setRecents(pushRecent(recents, choice.key));
					return;
				}
				if (mayNeedReasoningCompatibility(choice.provider.id, choice.model.id, choice.model.name)) try {
					if ((await ensureSelectionCompatibility(api, choice.provider.id, choice.model.id)).length > 0) load();
				} catch (cause) {
					setError(t("palette.compatRepairFailed", { message: messageOf(cause) }));
					return;
				}
				const outcome = await select(wanted);
				if (outcome === void 0 || outcome.ok !== true) {
					const reason = outcome?.error?.message ?? "";
					setError(reason === "" ? t("palette.selectFailed") : t("palette.selectFailedReason", { message: reason }));
					return;
				}
				setRecents(pushRecent(recents, choice.key));
			};
			/**
			* No-op guard shared by every select path: an identical selection still
			* appends a session event and rewrites the default-model config on the
			* host, which re-renders host panels (visible blink) for zero effect.
			* Mirrors the native seat's same-model/same-effort early-out.
			* Logic lives in isSameSelection (unit-tested); this only binds live state.
			*/
			const isSameSelection$1 = (selection) => isSameSelection(snapshot.current, selection);
			const toggleQuick = () => {
				if (!available || locked) return;
				if (open) return;
				setError(null);
				if (snapshot.groups.length === 0) load();
				setQuickOpen((value) => !value);
			};
			const favoriteCount = (0, react.useMemo)(() => choices.filter((choice) => favorites.includes(choice.key)).length, [choices, favorites]);
			const recentCount = (0, react.useMemo)(() => choices.filter((choice) => recents.includes(choice.key)).length, [choices, recents]);
			const show = (0, react.useCallback)(() => {
				if (!available || locked) return false;
				setOpen(true);
				setQuery("");
				setProviderId(null);
				setQuickFilter("all");
				setCursor(0);
				setError(null);
				if (snapshot.groups.length === 0) load();
				return true;
			}, [
				available,
				load,
				locked,
				snapshot.groups.length
			]);
			const close = () => {
				setOpen(false);
				setError(null);
			};
			(0, react.useEffect)(() => {
				if (!open) return;
				const frame = requestAnimationFrame(() => searchRef.current?.focus());
				return () => cancelAnimationFrame(frame);
			}, [open]);
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					if (!open) return;
					if (event.key === "Escape") {
						event.preventDefault();
						close();
						return;
					}
					if (event.key === "ArrowDown") {
						event.preventDefault();
						setCursor((value) => Math.min(value + 1, Math.max(0, results.length - 1)));
						return;
					}
					if (event.key === "ArrowUp") {
						event.preventDefault();
						setCursor((value) => Math.max(0, value - 1));
						return;
					}
					if (event.key === "Enter" && results[cursor] !== void 0 && !isTypingTarget(event.target)) {
						event.preventDefault();
						choose(results[cursor]);
					}
				};
				window.addEventListener("keydown", onKeyDown);
				return () => window.removeEventListener("keydown", onKeyDown);
			}, [
				open,
				locked,
				available,
				results,
				cursor
			]);
			(0, react.useEffect)(() => {
				setCursor(0);
			}, [query, providerId]);
			(0, react.useEffect)(() => {
				setCursor((value) => Math.min(value, Math.max(0, results.length - 1)));
			}, [results.length]);
			(0, react.useEffect)(() => {
				rowRefs.current[cursor]?.scrollIntoView({ block: "nearest" });
			}, [cursor]);
			const choose = async (choice) => {
				const wanted = selectionWithSavedEffort(choice);
				if (isSameSelection$1(wanted)) {
					setRecents(pushRecent(recents, choice.key));
					setAppliedKey(choice.key);
					return;
				}
				if (mayNeedReasoningCompatibility(choice.provider.id, choice.model.id, choice.model.name)) try {
					if ((await ensureSelectionCompatibility(api, choice.provider.id, choice.model.id)).length > 0) load();
				} catch (cause) {
					setError(t("palette.compatRepairFailed", { message: messageOf(cause) }));
					return;
				}
				const outcome = await select(wanted);
				if (outcome === void 0 || outcome.ok !== true) {
					const reason = outcome?.error?.message ?? "";
					setError(reason === "" ? t("palette.selectFailed") : t("palette.selectFailedReason", { message: reason }));
					return;
				}
				setRecents(pushRecent(recents, choice.key));
				setAppliedKey(choice.key);
			};
			const chooseEffort = async (value) => {
				if (snapshot.current === null) return;
				if ((snapshot.current.reasoningEffort ?? "") === (value ?? "")) return;
				setEffortBusy(true);
				setError(null);
				try {
					const alreadyOffered = current?.model.reasoning?.efforts.some((effort) => effort.id === value) === true;
					if (value !== "" && !alreadyOffered) {
						if (await ensureSelectionReasoning(api, snapshot.current.provider, snapshot.current.model)) load();
					}
					const selection = {
						provider: snapshot.current.provider,
						model: snapshot.current.model,
						...value === "" ? {} : { reasoningEffort: value }
					};
					if (isSameSelection$1(selection)) {
						setEffortBusy(false);
						return;
					}
					const outcome = await select(selection);
					if (outcome === void 0 || outcome.ok !== true) {
						const reason = outcome?.error?.message ?? "";
						setError(reason === "" ? t("palette.selectFailed") : t("palette.selectFailedReason", { message: reason }));
						return;
					}
					const key = choiceKey(snapshot.current.provider, snapshot.current.model);
					setEffortMap({
						...effortMap,
						[key]: value
					});
				} catch (cause) {
					setError(t("palette.reasoningEnableFailed", { message: messageOf(cause) }));
				} finally {
					setEffortBusy(false);
				}
			};
			const settled = isSettledStatus(snapshot.status);
			const heldLabel = holdLastGood(current?.model.name, lastLabelRef.current, settled);
			lastLabelRef.current = heldLabel.last;
			const currentLabel = heldLabel.value ?? snapshot.current?.model ?? t("trigger.fallback");
			const heldProvider = holdLastGood(current?.provider.name, lastProviderRef.current, settled);
			lastProviderRef.current = heldProvider.last;
			const providerLabel = heldProvider.value ?? snapshot.current?.provider;
			const { innerRef: triggerInnerRef, width: triggerWidth } = useAnimatedWidth(`${currentLabel} | ${providerLabel ?? ""}`, 16);
			const currentReasoning = current?.model.reasoning;
			const currentKey = snapshot.current === null ? null : choiceKey(snapshot.current.provider, snapshot.current.model);
			const currentEffort = snapshot.current?.reasoningEffort ?? (currentKey === null ? void 0 : effortMap[currentKey]) ?? currentReasoning?.defaultEffort ?? "";
			const reasoningOptions = (() => {
				const base = (currentReasoning?.efforts ?? []).filter((effort) => effort.id !== "").slice().sort((left, right) => {
					const leftIndex = REASONING_LEVELS.indexOf(left.id);
					const rightIndex = REASONING_LEVELS.indexOf(right.id);
					return (leftIndex < 0 ? REASONING_LEVELS.length : leftIndex) - (rightIndex < 0 ? REASONING_LEVELS.length : rightIndex);
				});
				if (currentReasoning === void 0) return base;
				let next = base;
				if (!next.some((effort) => effort.id === "off")) next = [...next, {
					id: "off",
					name: t("palette.reasoningOff")
				}];
				return next;
			})();
			const heldEffort = holdLastGood(current === void 0 ? void 0 : {
				options: reasoningOptions,
				value: currentEffort
			}, lastEffortRef.current, settled);
			lastEffortRef.current = heldEffort.last;
			const displayOptions = heldEffort.value?.options ?? reasoningOptions;
			const displayEffort = heldEffort.value?.value ?? currentEffort;
			const hasEffortControl = snapshot.current !== null && displayOptions.length > 0;
			const [badges, setBadges] = (0, react.useState)(/* @__PURE__ */ new Map());
			(0, react.useEffect)(() => {
				if (badgeIndex !== null) {
					setBadges(badgeIndex);
					return;
				}
				let cancelled = false;
				loadBadgeIndex(api).then((index) => {
					if (!cancelled) setBadges(index);
				});
				return () => {
					cancelled = true;
				};
			}, [api]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsa-launcher",
				ref: quickRef,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dsa-trigger",
						style: triggerWidth === null ? void 0 : { width: triggerWidth },
						disabled: locked || !available,
						onClick: toggleQuick,
						onContextMenu: (event) => {
							event.preventDefault();
							setQuickOpen(false);
							show();
						},
						title: `${currentLabel}${providerLabel === void 0 ? "" : ` · ${providerLabel}`}`,
						"aria-label": t("trigger.aria"),
						"aria-haspopup": "menu",
						"aria-expanded": quickOpen,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dsa-trigger-inner",
							ref: triggerInnerRef,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsa-trigger-icon",
									"aria-hidden": "true",
									children: "⌘"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsa-trigger-model",
									children: currentLabel
								}),
								snapshot.current !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsa-trigger-provider",
									title: providerLabel,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
										id: providerMeta(snapshot.current.provider).icon,
										size: 12,
										colored: true
									})
								})
							]
						})
					}),
					quickOpen && !open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsa-quick",
						role: "menu",
						"aria-label": t("palette.quickPresets"),
						children: [
							quickChoices.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsa-quick-empty",
								children: t("palette.quickEmpty")
							}),
							quickChoices.map((choice) => {
								const isCurrent = snapshot.current?.provider === choice.provider.id && snapshot.current.model === choice.model.id;
								const saved = effortMap[choice.key];
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									role: "menuitem",
									className: `dsa-quick-item${isCurrent ? " is-active" : ""}`,
									onClick: () => void applyQuick(choice),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "dsa-quick-main",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsa-quick-name",
											children: choice.model.name
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "dsa-quick-sub",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsa-result-provider",
													title: choice.provider.name,
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
														id: providerMeta(choice.provider.id).icon,
														size: 12,
														colored: true
													})
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: choice.model.id }),
												saved !== void 0 && saved !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [" · ⚡", saved] })
											]
										})]
									}), isCurrent && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsa-quick-check",
										"aria-hidden": "true",
										children: "✓"
									})]
								}, choice.key);
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsa-quick-all",
								onClick: () => {
									setQuickOpen(false);
									show();
								},
								children: t("palette.quickAll")
							})
						]
					}),
					!locked && available && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsa-effort-slot",
						"aria-hidden": !hasEffortControl,
						style: hasEffortControl ? void 0 : {
							visibility: "hidden",
							pointerEvents: "none"
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EffortSelect, {
							compact: true,
							value: displayEffort,
							options: displayOptions,
							defaultLabel: t("palette.providerDefault"),
							label: t("palette.effort"),
							disabled: effortBusy || !hasEffortControl,
							onChange: (value) => void chooseEffort(value)
						})
					}),
					open && (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsa-overlay",
						role: "presentation",
						onMouseDown: (event) => {
							if (event.target === event.currentTarget) close();
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: "dsa-dialog",
							role: "dialog",
							"aria-modal": "true",
							"aria-label": t("palette.title"),
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
									className: "dsa-header",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t("palette.title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: `${choices.length} ${t("palette.models")}` })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "dsa-close",
										onClick: close,
										"aria-label": t("palette.close"),
										children: "×"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsa-search-wrap",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											"aria-hidden": "true",
											children: "⌕"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											ref: searchRef,
											value: query,
											onChange: (event) => setQuery(event.currentTarget.value),
											onKeyDown: (event) => {
												if (event.key === "Enter" && results[cursor] !== void 0) {
													event.preventDefault();
													choose(results[cursor]);
												}
											},
											placeholder: t("palette.search"),
											"aria-label": t("palette.search")
										}),
										query !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setQuery(""),
											"aria-label": t("palette.clear"),
											children: "×"
										})
									]
								}),
								(snapshot.error !== null || error !== null) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsa-error",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: error ?? snapshot.error }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: load,
										children: t("palette.retry")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsa-body",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("nav", {
										className: "dsa-providers",
										"aria-label": t("palette.providers"),
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dsa-provider-divider" }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												className: providerId === null && quickFilter === "all" ? "is-active" : "",
												onClick: () => {
													setProviderId(null);
													setQuickFilter("all");
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("palette.allModels") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: choices.length })]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												className: providerId === null && quickFilter === "favorites" ? "is-active" : "",
												onClick: () => {
													setProviderId(null);
													setQuickFilter("favorites");
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("palette.favorites") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: favoriteCount })]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												className: providerId === null && quickFilter === "recents" ? "is-active" : "",
												onClick: () => {
													setProviderId(null);
													setQuickFilter("recents");
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("palette.recents") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: recentCount })]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dsa-provider-divider" }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: "dsa-provider-group-label",
												children: t("palette.configuredProviders")
											}),
											providers.map((provider) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												className: providerId === provider.id ? "is-active" : "",
												onClick: () => {
													setProviderId(provider.id);
													setQuickFilter("all");
												},
												title: `${provider.name} · ${provider.id}`,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: "dsa-rail-icon",
														children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
															id: providerMeta(provider.id).icon,
															size: 14,
															colored: true
														})
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: provider.name }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: provider.models.length })
												]
											}, provider.id))
										]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("main", {
										className: "dsa-results",
										children: [
											snapshot.status === "loading" && results.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: "dsa-empty",
												children: t("palette.loading")
											}),
											snapshot.status !== "loading" && results.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: "dsa-empty",
												children: t("palette.empty")
											}),
											results.map((choice, index) => {
												const isCurrent = snapshot.current?.provider === choice.provider.id && snapshot.current.model === choice.model.id;
												const isFavorite = favorites.includes(choice.key);
												const isRecent = recents.includes(choice.key);
												return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: `dsa-result${index === cursor ? " is-cursor" : ""}${isCurrent ? " is-current" : ""}`,
													onMouseEnter: () => setCursor(index),
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
														ref: (node) => {
															rowRefs.current[index] = node;
														},
														type: "button",
														className: "dsa-result-select",
														onClick: () => void choose(choice),
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: "dsa-result-main",
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																	className: "dsa-result-title",
																	children: [
																		choice.model.name,
																		(() => {
																			const badge = badges.get(choice.provider.id)?.get(choice.model.id);
																			if (badge === void 0) return null;
																			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																				className: "dsa-result-badges",
																				children: [
																					badge.free && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", {
																						className: "is-free",
																						children: "free"
																					}),
																					badge.image && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", {
																						title: "vision",
																						children: "👁"
																					}),
																					badge.context !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: formatTokenCount(badge.context) }),
																					badge.output !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("em", { children: ["↩", formatTokenCount(badge.output)] })
																				]
																			});
																		})(),
																		isCurrent && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("palette.current") }),
																		isRecent && !isCurrent && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("palette.recent") }),
																		effortMap[choice.key] !== void 0 && effortMap[choice.key] !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("em", {
																			className: "is-effort",
																			title: effortMap[choice.key],
																			children: ["⚡", effortMap[choice.key]]
																		}),
																		appliedKey === choice.key && !isCurrent && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", {
																			className: "is-applied",
																			children: "✓"
																		})
																	]
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																	className: "dsa-result-meta",
																	children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																		className: "dsa-result-provider",
																		title: choice.provider.name,
																		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
																			id: providerMeta(choice.provider.id).icon,
																			size: 14,
																			colored: true
																		})
																	}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: choice.model.id })]
																}),
																choice.model.description !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	className: "dsa-result-description",
																	children: choice.model.description
																})
															]
														}), choice.model.reasoning !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "dsa-reasoning",
															children: "R"
														})]
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: `dsa-star${isFavorite ? " is-favorite" : ""}`,
														title: t(isFavorite ? "favorite.remove" : "favorite.add"),
														"aria-label": t(isFavorite ? "favorite.remove" : "favorite.add"),
														onClick: () => setFavorites(toggleFavorite(favorites, choice.key)),
														children: "★"
													})]
												}, choice.key);
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
									className: "dsa-footer",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsa-current",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("palette.current") }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: currentLabel }),
												snapshot.current?.provider !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
													id: providerMeta(snapshot.current.provider).icon,
													size: 14,
													colored: true
												}),
												providerLabel !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: providerLabel })
											]
										}),
										hasEffortControl && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EffortSelect, {
											value: displayEffort,
											options: displayOptions,
											defaultLabel: t("palette.providerDefault"),
											label: t("palette.effort"),
											disabled: effortBusy,
											onChange: (value) => void chooseEffort(value)
										}),
										snapshot.failures.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "dsa-failures",
											title: snapshot.failures.map((item) => `${item.name}: ${item.message}`).join("\n"),
											children: [
												t("palette.failures"),
												" (",
												snapshot.failures.length,
												")"
											]
										})
									]
								})
							]
						})
					}), document.body)
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const NS = "dsa-preset";
		const zh = {
			"trigger.fallback": "选择模型",
			"trigger.aria": "打开模型命令面板",
			"palette.close": "关闭模型命令面板",
			"palette.clear": "清空搜索",
			"palette.providers": "供应商",
			"palette.title": "模型命令面板",
			"palette.search": "搜索模型、模型 ID、供应商或供应商 ID…",
			"palette.allModels": "全部模型",
			"palette.configuredProviders": "已配置供应商",
			"palette.navCatalog": "添加供应商",
			"palette.favorites": "仅看收藏",
			"palette.recents": "最近使用",
			"palette.current": "当前",
			"palette.favorite": "收藏",
			"palette.recent": "最近",
			"palette.models": "个模型",
			"palette.empty": "没有匹配的模型",
			"palette.loading": "正在读取模型目录…",
			"palette.retry": "重试",
			"palette.failures": "部分供应商加载失败",
			"palette.shortcut": "Alt+M 随时打开",
			"palette.providerDefault": "供应商默认",
			"palette.quickPresets": "预设（收藏）",
			"palette.quickEmpty": "暂无收藏 — 先在完整列表中点 ★",
			"palette.quickAll": "全部模型…",
			"palette.effort": "推理档位",
			"palette.reasoningDefault": "默认（模型决定）",
			"palette.reasoningOff": "关闭",
			"palette.selectFailed": "切换模型失败",
			"palette.selectFailedReason": "切换模型失败：{message}",
			"palette.compatRepairFailed": "无法在切换前修复推理兼容配置：{message}",
			"palette.reasoningEnableFailed": "无法为该模型启用所选推理档位：{message}",
			"favorite.add": "加入收藏",
			"favorite.remove": "取消收藏",
			"config.nav": "模型配置",
			"config.title": "供应商与模型配置",
			"config.subtitle": "编辑线路、密钥、模型容量与兼容参数",
			"config.intro": "直接写入 DSH settings/credentials；模型预置可从 GitHub 在线刷新。",
			"config.reload": "重新读取",
			"config.addProvider": "新增供应商",
			"config.backToConfig": "返回模型配置",
			"config.addProviderClose": "收起新增目录",
			"config.providerSearch": "搜索已配置供应商…",
			"config.providerCount": "{count} 个供应商",
			"config.providerCardMeta": "{count} 个模型 · {protocol}",
			"config.providerSearchEmpty": "没有匹配的供应商",
			"config.freeBadge": "免费同步",
			"config.keyDotConfigured": "密钥已配置",
			"config.keyDotMissing": "密钥未配置",
			"config.keyDotNone": "未声明凭据（目录路由可空）",
			"config.editModel": "展开编辑参数",
			"config.showAllModels": "显示全部 {count} 条模型",
			"config.discardChanges": "放弃更改",
			"config.emptyTitle": "尚未配置任何供应商",
			"config.emptyHint": "从模板目录一键添加 60+ 内置供应商，或手动新建线路。",
			"config.retryFoldOn": "{retries} 次重试",
			"config.retryFoldOff": "未启用",
			"config.freeSyncOnShort": "已开启",
			"config.freeSyncOffShort": "未开启",
			"config.templateTitle": "从模板新增供应商",
			"config.templateSubtitle": "从模板目录选择",
			"config.templateHint": "选择一个模板自动填好端点、协议与密钥引用；OAuth 订阅需在 DSH 官方设置中添加。",
			"config.templateSearch": "搜索模板…",
			"config.templateCustom": "自定义",
			"config.templateSubscription": "订阅（OAuth）",
			"config.templateApiKey": "API 密钥",
			"config.templateOauth": "OAuth 登录 · 由 DSH 官方设置管理",
			"config.templateOauthOnly": "{name} 使用 OAuth 登录，请在 DSH 官方设置的模型页添加。",
			"config.templateModelCount": "{count} 个内置模型",
			"config.templateBlank": "空白供应商",
			"config.templateBlankHint": "手动填写全部配置",
			"config.templateReady": "已按「{name}」模板预填，检查后保存即可。",
			"config.freeSyncTitle": "OpenRouter 免费线路自动同步",
			"config.freeSyncDescription": "每次 DSH 启动与按间隔自动把该线路替换为当前可用的 :free 模型，只显示免费模型。",
			"config.freeSyncToggle": "自动同步",
			"config.freeSyncOn": "开启（启动 + 定时）",
			"config.freeSyncOff": "关闭",
			"config.freeSyncInterval": "同步间隔（小时）",
			"config.freeSyncEnabled": "已开启免费模型自动同步。",
			"config.freeSyncDisabled": "已关闭免费模型自动同步。",
			"config.freeSyncIntervalSaved": "同步间隔已保存为 {hours} 小时。",
			"config.freeSyncRun": "立即同步免费模型",
			"config.freeSyncRunning": "正在同步…",
			"config.freeSyncDone": "同步完成：共 {total} 个免费模型（新增 {added}，移除 {removed}）。",
			"config.freeSyncActive": "自动同步已开启：DSH 启动时与每个间隔自动更新。",
			"config.freeSyncIdle": "自动同步未开启。",
			"config.freeSyncStateOk": "上次同步 {time}：{total} 个模型（+{added} / -{removed}）",
			"config.freeSyncStateAt": "上次尝试 {time}",
			"config.presetContext": "上下文 {value}",
			"config.presetMaxTokens": "输出 {value}",
			"config.unsaved": "有未保存更改",
			"config.discardConfirm": "当前配置尚未保存，确定放弃这些更改吗？",
			"config.duplicateProvider": "复制供应商",
			"config.copyName": "{name} 副本",
			"config.copyReady": "已复制为新供应商草稿；凭据引用已自动分离，请检查后应用。",
			"config.cancelCreate": "取消新增",
			"config.deleteProvider": "删除供应商",
			"config.deleting": "正在删除…",
			"config.deleteConfirm": "确定从用户配置中删除供应商 {provider} 吗？凭据本身不会删除。",
			"config.deleted": "供应商已从用户配置中删除；关联凭据仍保留。",
			"config.done": "已完成",
			"config.namespaceMissing": "当前 DSH 没有加载 llm-pi-ai 配置命名空间。",
			"config.retryNamespaceMissing": "当前 DSH 没有加载模型选择插件的重试配置命名空间。",
			"config.providerTitle": "供应商设置",
			"config.providerDescription": "配置线路名称、端点、协议与凭据引用。",
			"config.providerId": "供应商 ID",
			"config.providerIdInvalid": "供应商 ID 只能使用小写字母、数字和连字符，并且必须以字母或数字开头。",
			"config.providerExists": "该供应商 ID 已存在，请换一个 ID。",
			"config.displayName": "显示名称",
			"config.baseUrl": "Base URL",
			"config.baseUrlRequired": "Base URL 不能为空。",
			"config.protocol": "协议类型",
			"config.protocolRequired": "请选择有效的协议类型。",
			"config.protocolNote": "OpenAI 兼容供应商默认优先 Responses；推理能力不等于 Responses 支持，插件会用真实请求检测并可拆分仅支持 Chat Completions 的模型。",
			"config.providerDefaultInput": "供应商默认输入",
			"config.inputDshDefault": "使用 DSH 默认（纯文本）",
			"config.credentialRef": "Credential ref",
			"config.credentialRefInvalid": "Credential ref 必须是合法的环境变量名称。",
			"config.apiKey": "API key",
			"config.keyConfigured": "已配置；留空保持不变",
			"config.keyNotConfigured": "输入新的 API key",
			"config.keyInvalid": "API key 只能包含无空格的可打印 ASCII 字符。",
			"config.show": "显示",
			"config.hide": "隐藏",
			"config.loadStoredKey": "读取已存 key",
			"config.revealLoopbackOnly": "查看已存 key 只允许在 127.0.0.1 / localhost 直接访问时使用。",
			"config.revealLocalReady": "本机直连：允许安全查看已存 key",
			"config.revealSuccess": "已从 DSH credentials 读取到输入框；离开或保存后会清空。",
			"config.credentialStatusConfigured": "凭据已配置（{source}）",
			"config.credentialStatusMissing": "凭据未配置",
			"config.probe": "检查连接",
			"config.probing": "正在检查…",
			"config.modelListRead": "读取模型列表",
			"config.modelListReadDone": "已读取 {count} 个模型，请勾选要导入的模型。",
			"config.modelImportTitle": "导入供应商模型列表",
			"config.modelImportSummary": "共 {count} 个 · 已选 {selected} 个",
			"config.modelImportSearch": "搜索模型名称或 ID",
			"config.modelImportHint": "默认不勾选；导入会自动补全容量、输入类型与精确预置。",
			"config.modelImportSelected": "导入选中（{count}）",
			"config.modelImportDone": "已导入 {count} 个模型（新增 {added}，补全 {enriched}，应用预置 {presets}）。",
			"config.templateCatalog": "API 密钥 · 内置目录",
			"config.templateReadyCatalog": "已按「{name}」创建内置目录线路：端点、协议与模型列表来自 DSH 内置目录，填好密钥即可使用。",
			"config.probeSuccess": "连接成功，供应商返回 {count} 个模型。",
			"config.probeSuccessApplied": "连接成功，发现 {count} 个模型；已自动新增 {added} 个、补全 {enriched} 个，并应用 {presets} 个能力预置。点击“应用配置”后生效。",
			"config.openRouterFreeScan": "检查免费模型",
			"config.openRouterFreeScanning": "正在检查免费模型…",
			"config.openRouterFreeScanned": "OpenRouter 实时目录有 {count} 个可用 :free 模型，其中 {unconfigured} 个尚未配置。请在目录中选择要导入的模型。",
			"config.openRouterFreePickerTitle": "OpenRouter 免费模型目录",
			"config.openRouterFreePickerSummary": "共 {count} 个 · 已选 {selected} 个 · 检查于 {checkedAt}",
			"config.openRouterFreeSearch": "搜索模型名称或 ID",
			"config.openRouterFreeSelectVisible": "全选当前结果",
			"config.openRouterFreeSelectNew": "只选未配置",
			"config.openRouterFreeClear": "清空选择",
			"config.openRouterFreeClose": "关闭",
			"config.openRouterFreeConfigured": "已配置",
			"config.openRouterFreeContext": "上下文 {value}",
			"config.openRouterFreeOutput": "最大输出 {value}",
			"config.openRouterFreeEmpty": "没有匹配的免费模型。",
			"config.openRouterFreeImportHint": "默认不勾选；导入只补全缺失能力，不覆盖手工字段，也不会删除未选模型。",
			"config.openRouterFreeImportSelected": "导入选中（{count}）",
			"config.openRouterFreeImported": "已处理 {selected} 个选中模型：新增 {added} 个、补全 {enriched} 个，并应用 {presets} 个能力预置。点击“应用配置”后生效。",
			"config.validateApiKey": "验证 API key",
			"config.apiKeyValidating": "正在验证…",
			"config.apiKeyValidationKeyRequired": "请先输入 API key，或确认当前 credential 已配置。",
			"config.apiKeyValidationConfirm": "将使用模型 {model} 按当前协议验证 DSH 运行时 key；如果输入框中有不同的新 key，也会同时验证。请求可能产生少量费用。继续吗？",
			"config.apiKeyValidationDone": "API key 验证完成，请查看下方状态。",
			"config.apiKeyValidationRuntimeTarget": "DSH 运行时凭据（{source}）",
			"config.apiKeyValidationDraftTarget": "输入框中的待保存 key",
			"config.apiKeyValidationDraftResult": "输入框待保存 key",
			"config.apiKeyValidationDraftOnly": "当前尚无 DSH 运行时凭据；只有点击“应用配置”后，对话才会使用这条 key。",
			"config.apiKeyValidationMismatch": "输入框 key 与 DSH 当前运行时凭据不同；对话仍使用运行时凭据。请点击“应用配置”后重新验证。",
			"config.apiKeyValidationScope": "此结果只证明最小流式请求成功；完整会话仍可能因请求体内容、体积、频率或 Cloudflare/WAF 规则被拦截。",
			"config.apiKeyValidationValid": "API key 可用",
			"config.apiKeyValidationInvalid": "API key 无效或未授权",
			"config.apiKeyValidationBlocked": "请求被供应商或网关拒绝",
			"config.apiKeyValidationUnavailable": "API key 可能已识别，但当前不可用",
			"config.apiKeyValidationUnknown": "暂时无法判断 API key",
			"config.apiKeyValidationMissing": "API key 未配置",
			"config.apiKeyBatch": "一键检查全部 API key",
			"config.apiKeyBatchRunning": "正在检查全部 key…",
			"config.apiKeyBatchConfirm": "将按每个供应商配置的真实模型和协议检查 {count} 个运行时凭据，可能产生少量 API 费用，并为避免限流而依次执行。继续吗？",
			"config.apiKeyBatchResults": "全部 API key 巡检结果",
			"config.apiKeyBatchAllValid": "所有可检查的运行时凭据均可用。",
			"config.apiKeyBatchProblems": "发现 {count} 个需要处理的供应商。",
			"config.apiKeyBatchClose": "收起结果",
			"config.apiKeyBatchEdit": "编辑此供应商",
			"config.apiKeyBatchNoBaseUrl": "未配置 Base URL，无法检查。",
			"config.apiKeyBatchInvalidBaseUrl": "Base URL 格式无效。",
			"config.apiKeyBatchInvalidProtocol": "协议配置无效。",
			"config.apiKeyBatchNoModel": "未配置可用于真实请求的模型 ID。",
			"config.protocolProbe": "测试实际协议",
			"config.protocolProbeModel": "测试模型",
			"config.protocolProbing": "正在测试协议…",
			"config.protocolProbeModelRequired": "请先添加至少一个带模型 ID 的模型，用于测试实际协议。",
			"config.protocolProbeConfirm": "将使用模型 {model} 分别发送一次最小 Completions 和 Responses 请求，可能产生少量 API 费用。继续吗？",
			"config.protocolProbeNone": "两个实际协议请求均未成功，请查看下方错误信息。",
			"config.protocolProbeAuthentication": "API Key 认证失败，因此无法判断协议支持。请先验证或更新凭据，再重新测试。",
			"config.protocolProbeBlocked": "供应商或网关拒绝了请求，因此无法判断协议支持。请先处理 403/WAF 阻断。",
			"config.protocolProbeTransient": "供应商暂时不可达、限流或连接失败，因此无法判断协议支持，请稍后重试。",
			"config.protocolProbeOne": "仅 {protocol} 通过实际请求测试，建议使用该协议。",
			"config.protocolProbeBoth": "Completions 和 Responses 均通过实际请求测试；优先使用 Responses。",
			"config.protocolAvailable": "可用",
			"config.protocolUnavailable": "不可用：{error}",
			"config.protocolApplyRecommended": "采用 {protocol}",
			"config.protocolApplied": "已将协议草稿切换为 {protocol}，点击“应用配置”后生效。",
			"config.protocolScan": "检查全部模型协议",
			"config.protocolScanning": "正在检查全部协议…",
			"config.protocolScanConfirm": "将对 {count} 个模型分别发送 Responses 和 Chat Completions 最小请求，最多 {requests} 次，可能产生少量费用。插件只分类，不会自动修改配置。继续吗？",
			"config.protocolScanDone": "已检查 {count} 个模型：{completionsOnly} 个仅支持 Chat Completions，{unsupported} 个暂时无法判断。",
			"config.protocolScanAuthentication": "模型协议批量检查遇到 API Key 认证失败；本次结果只能视为无法判断，不会自动切分或移动模型。",
			"config.protocolScanResults": "全部模型协议检查",
			"config.protocolScanSummary": "Responses 优先 {responses} 个 · 仅 Completions {completionsOnly} 个 · 无法判断 {unsupported} 个",
			"config.protocolScanResponses": "仅 Responses 可用，保留在主线路",
			"config.protocolScanCompletionsOnly": "仅 Chat Completions 可用，需要分支",
			"config.protocolScanBoth": "两个协议都可用，优先 Responses",
			"config.protocolScanUnsupported": "两个协议均未成功，不自动移动",
			"config.protocolSplit": "切分 Re/CC 协议",
			"config.protocolSplitting": "正在切分…",
			"config.protocolSplitPreview": "安全预览：{responses} 保持 Responses；新建 {completions}，只放入 {count} 个仅支持 Chat Completions 的模型。Base URL、credential ref、容量、输入、推理和重试设置会继承。",
			"config.protocolSplitConfirm": "将立即写入 DSH：新建供应商 {provider}，并移动 {count} 个仅支持 Chat Completions 的模型；原供应商改为 Responses。继续吗？",
			"config.protocolSplitDone": "已完成协议切分：{responses} 使用 Responses，{completions} 使用 Chat Completions，共移动 {count} 个模型。",
			"config.protocolSplitRetryWarning": "供应商已切分，但重试规则复制失败：{error}",
			"config.protocolCatalogMetadataFailed": "无法完整读取目录模型的容量与输入类型，已取消切分，避免创建错误分支：{error}",
			"config.protocolWholeCompletions": "整条线路改用 Completions",
			"config.protocolWholeCompletionsApplied": "所有已检查模型都仅支持 Chat Completions，已切换当前草稿并补齐兼容项；点击“应用配置”后生效。",
			"config.importDiscovery": "导入探测结果（{count}）",
			"config.discoveryApplied": "新增 {added} 个模型，补全 {enriched} 个模型。",
			"config.save": "应用配置",
			"config.saving": "正在应用…",
			"config.saved": "配置已实时写入 DSH。",
			"config.savedWithCompatibilityRepair": "配置已写入 DSH，并为 {count} 个 DeepSeek 推理模型补齐历史消息回传兼容项。",
			"config.settingsSavedKeyFailed": "供应商配置已保存，但 key 写入失败",
			"config.reasoningRepairTitle": "发现 DeepSeek 推理回传兼容项缺失",
			"config.reasoningRepairDescription": "共 {count} 个模型需要补齐 thinkingFormat、reasoning_content 回传与 system role 兼容：{models}",
			"config.reasoningRepairApply": "修复并应用",
			"config.reasoningProviderEnable": "全部模型启用推理档位",
			"config.reasoningProviderApplied": "已为 {count} 个模型补齐通用推理档位；保存后生效。",
			"config.reasoningModelApplied": "已为当前模型补齐全部推理档位和供应商感知的发送方式。",
			"config.reasoningTitle": "推理档位",
			"config.reasoningMode": "模型推理能力",
			"config.reasoningInherit": "继承在线目录",
			"config.reasoningDisabled": "明确禁用",
			"config.reasoningAll": "全部档位 / 自定义",
			"config.reasoningEnableAll": "一键启用全部档位",
			"config.reasoningDescription": "档位是否显示由 reasoningEfforts 决定；wire value 是实际发给供应商的值。插件会按 OpenAI、OpenRouter、DeepSeek、Qwen、GLM 等线路自动选择常见发送方式，仍可在高级兼容参数中修正。",
			"config.reasoningOffWire": "留空表示不发送推理参数",
			"config.reasoningWireValue": "{level} 的供应商 wire value",
			"config.modelsTitle": "模型参数",
			"config.modelsDescription": "上下文窗口、最大输出和输入类型会直接影响 DSH 的容量判断与附件适配。",
			"config.catalogModelsManaged": "当前显示的是 DSH 运行时目录模型；仅修改供应商字段会继续保留 modelOverrides。编辑、增删或批量修改模型时，插件会把完整目录安全转换为显式 models。",
			"config.retryTitle": "模型请求重试",
			"config.retryDescription": "只为当前供应商或指定模型接管瞬态失败；其他线路继续使用 DSH 原有策略。",
			"config.retryPreset50": "B.AI / BankOfAI 预置 50 次",
			"config.retryProviderMode": "供应商默认规则",
			"config.retryProviderInherit": "保持 DSH 原有策略",
			"config.retryProviderCustom": "使用插件重试规则",
			"config.retryProviderCount": "失败后重试次数",
			"config.retrySafetyTitle": "费用与等待时间提示",
			"config.retrySafetyDescription": "N 表示首次失败后的重试次数；当前最多会发送 {attempts} 次请求（{retries} 次重试）。仅网络、超时、429、5xx、空响应和明确 Cloudflare/WAF 403 会重试，401、余额不足、参数错误、模型不存在和上下文超限不会重试。",
			"config.retryCountInvalid": "重试次数必须是 0 到 {max} 的整数。",
			"config.retryModelMode": "模型重试覆盖",
			"config.retryModelInherit": "继承供应商 / DSH",
			"config.retryModelDisabled": "明确不重试",
			"config.retryModelCustom": "自定义次数",
			"config.retryModelCount": "模型失败后重试次数",
			"config.freeModelBadge": "实时免费",
			"config.refreshPresets": "刷新在线预置",
			"config.presetsLoading": "正在读取在线预置…",
			"config.presetsOnline": "在线预置 {date} · {count} 项",
			"config.presetsFallback": "在线失败，使用内置 {date} · {count} 项",
			"config.presetsBundled": "内置预置 {date} · {count} 项",
			"config.autoPreset": "自动补全缺失参数",
			"config.presetsApplied": "已为 {count} 个精确匹配的模型补全缺失参数。",
			"config.addModel": "新增模型",
			"config.noModels": "尚未配置模型。新增供应商至少需要一个模型。",
			"config.model": "模型",
			"config.modelId": "模型 ID",
			"config.modelIdRequired": "每个模型都必须填写模型 ID。",
			"config.modelIdDuplicate": "模型 ID 不能重复：{ids}",
			"config.modelName": "显示名称",
			"config.searchModels": "筛选当前供应商的模型…",
			"config.noMatchingModels": "当前供应商中没有匹配的模型。",
			"config.duplicateModel": "复制参数",
			"config.modelCopyReady": "已复制模型参数；请填写新模型 ID。",
			"config.optional": "可选",
			"config.contextWindow": "上下文窗口",
			"config.maxTokens": "最大输出",
			"config.inputTypes": "输入类型",
			"config.inputInherit": "继承供应商默认输入",
			"config.inputText": "纯文本",
			"config.inputTextImage": "文本 + 图片（视觉）",
			"config.inputImageOnly": "仅图片",
			"config.preset": "模型预置",
			"config.noPreset": "不使用预置 / 手工配置",
			"config.applyPreset": "应用预置",
			"config.presetReasoningLevels": "{count} 个推理档位",
			"config.compatibility": "高级兼容参数",
			"config.compatNone": "当前协议没有需要在这里设置的常用兼容参数。",
			"config.inherit": "继承 / 自动判断",
			"config.remove": "移除",
			"relay.nav": "中继配置",
			"relay.title": "供应商中继配置",
			"relay.subtitle": "查看内置中继并配置可复用的固定目标线路",
			"relay.intro": "当供应商官方域名因本地 DNS、TLS 或线路问题不可达时，让 DSH 通过本机插件后端连接指定的可达入口。",
			"relay.builtIn": "本机回环 · 固定目标",
			"relay.howTitle": "中继由 dsa-preset 提供",
			"relay.howDescription": "不是另一款插件，也不是 VPN。DSH 把原始 API 请求发送到本机中继，中继只访问同一个供应商；针对 B.AI 只切换连接策略，不切换 provider 或模型。",
			"relay.routeAria": "中继请求路径",
			"relay.routeDsh": "DSH provider",
			"relay.routeLocal": "本机插件中继",
			"relay.routeProvider": "供应商可达入口",
			"relay.security": "API key 仍由 DSH credentials 管理，只在请求转发时经过本机进程。中继拒绝非回环和带转发头的请求，不会变成局域网开放代理。",
			"relay.baiTitle": "内置 B.AI 中继",
			"relay.baiDescription": "只访问 B.AI，不切换 provider 或模型；失败时依次尝试不同的 B.AI 连接策略。",
			"relay.localBaseUrl": "Provider Base URL",
			"relay.upstream": "连接上游",
			"relay.hostHeader": "HTTP Host / 证书名称",
			"relay.allowedPath": "允许路径",
			"relay.strategyTitle": "B.AI 内部访问策略（不换 provider）",
			"relay.strategyAccelerator": "AWS Global Accelerator 的当前 DNS 地址，Host/SNI 仍指向 B.AI。",
			"relay.strategyNextAddress": "同一 B.AI 加速域名的下一个 DNS 地址，避开上一条坏线路。",
			"relay.strategyDirect": "最后尝试 api.b.ai 直连；仍然是同一个 B.AI provider 和模型。",
			"relay.statusHint": "返回 401 表示已经到达 B.AI，应检查 credential；503、502、504、Cloudflare 403 和 ECONNRESET 会切换到下一条 B.AI 策略，不会改用其他 provider。所有策略失败后才返回 503。",
			"relay.retryPolicy": "每次策略都会新建 HTTPS 连接；动态读取 DNS 地址并轮换，不写死 IP；不超过 16 MiB 的请求体可以在 B.AI 策略之间重放。",
			"relay.copy": "复制地址",
			"relay.copied": "已复制",
			"relay.copyProvider": "复制 B.AI provider 模板",
			"relay.openModelConfig": "打开模型配置",
			"relay.pluginConfigTitle": "B.AI 中继高级配置",
			"relay.pluginConfigDescription": "默认无需填写。只有供应商更换可达入口、Host 或超时要求时，才在 profile 补丁中覆盖。",
			"relay.copyPluginConfig": "复制 B.AI 中继配置",
			"relay.extendTitle": "扩展到其他供应商",
			"relay.extendDescription": "providerRelays 支持添加多个具名、固定目标、仅本机可用的 HTTPS 中继，无需修改插件源码。",
			"relay.extendStepOne": "先确认 key 有效，并找到可连接到同一供应商服务的替代 HTTPS 主机。",
			"relay.extendStepTwo": "在插件 providerRelays 中填写连接主机、原 API Host、TLS SNI、证书名称和允许的路径前缀。",
			"relay.extendStepThree": "重启 dsh web，再把供应商 Base URL 改为本机 /dsa-preset/api/relay/<id>/v1 地址，并用“检查连接”验证。",
			"relay.genericBaseUrl": "示例 Provider Base URL：",
			"relay.copyGenericBaseUrl": "复制示例 Base URL",
			"relay.copyGenericConfig": "复制通用中继模板",
			"relay.extendWarning": "不要把未知网站、动态 URL 或密钥写进中继配置。每个中继必须固定到你明确核验过的供应商入口；若替代主机并非同一 API 服务，Host/SNI 改写也无法安全解决。",
			"media.nav": "媒体工具",
			"media.title": "OpenRouter 媒体工具",
			"media.subtitle": "直接查看并使用图像与视频能力",
			"media.intro": "直接读取 OpenRouter 实时目录并调用插件后端，不发送对话。",
			"media.priceProtection": "免费优先 · 逐次确认",
			"media.catalog": "实时模型与价格目录",
			"media.catalogLoading": "正在直接读取 OpenRouter…",
			"media.imageCount": "个图像模型",
			"media.videoCount": "个视频模型",
			"media.refresh": "刷新目录",
			"media.noModels": "当前没有模型",
			"media.chooseModel": "请选择模型",
			"media.free": "免费",
			"media.paidAllowed": "可能付费·配置允许",
			"media.unverifiedFree": "未识别为免费·可手工尝试",
			"media.model": "模型（标注实时价格状态）",
			"media.modelRequired": "请先手工选择一个模型。",
			"media.manualPaidTitle": "我理解本次请求可能扣费，仍要尝试",
			"media.manualPaidDescription": "OpenRouter 的促销免费状态可能未写入价格接口；如果实际收费，费用仍由你的账户承担。本确认仅对下一次提交有效。",
			"media.manualPaidRequired": "该模型未被 OpenRouter 价格接口识别为免费，请先勾选本次可能扣费确认。",
			"media.manualPaidUsed": "已按你的单次确认提交；是否扣费以 OpenRouter 账单为准。",
			"media.imageTitle": "生成图像",
			"media.imageDescription": "直接生成并保存到配置的输出目录。",
			"media.videoTitle": "生成视频",
			"media.videoDescription": "直接提交异步视频任务。",
			"media.jobsTitle": "视频任务",
			"media.jobsDescription": "直接查询任务状态，完成后下载到配置的输出目录。",
			"media.prompt": "生成要求",
			"media.imagePromptPlaceholder": "例如：一只坐在窗边的橘猫，电影感光影",
			"media.videoPromptPlaceholder": "例如：海面日落的电影镜头，缓慢推进",
			"media.outputOptional": "输出名称（可选）",
			"media.durationOptional": "时长秒数（可选）",
			"media.jobId": "任务 ID",
			"media.generateImage": "直接生成图像",
			"media.generateVideo": "直接提交视频",
			"media.checkStatus": "查询状态",
			"media.downloadVideo": "下载视频",
			"media.running": "正在执行…",
			"media.promptRequired": "请先填写生成要求。",
			"media.durationInvalid": "视频时长必须是 1–60 的整数。",
			"media.jobRequired": "请先填写视频任务 ID。",
			"media.imageDone": "图像已保存",
			"media.videoSubmitted": "视频任务已提交",
			"media.statusDone": "视频任务状态",
			"media.downloadDone": "视频已下载"
		};
		const en = {
			"trigger.fallback": "Select model",
			"trigger.aria": "Open model command palette",
			"palette.close": "Close model command palette",
			"palette.clear": "Clear search",
			"palette.providers": "Providers",
			"palette.title": "Model command palette",
			"palette.search": "Search model, model ID, provider, or provider ID…",
			"palette.allModels": "All models",
			"palette.configuredProviders": "Configured providers",
			"palette.navCatalog": "Add provider",
			"palette.favorites": "Favorites only",
			"palette.recents": "Recent models",
			"palette.current": "Current",
			"palette.favorite": "Favorite",
			"palette.recent": "Recent",
			"palette.models": "models",
			"palette.empty": "No matching models",
			"palette.loading": "Loading model catalog…",
			"palette.retry": "Retry",
			"palette.failures": "Some providers failed to load",
			"palette.shortcut": "Alt+M to open anywhere",
			"palette.providerDefault": "Provider default",
			"palette.quickPresets": "Presets (favorites)",
			"palette.quickEmpty": "No favorites yet — star models in the full list",
			"palette.quickAll": "All models…",
			"palette.effort": "Reasoning effort",
			"palette.reasoningDefault": "Default (model decides)",
			"palette.reasoningOff": "Off",
			"palette.selectFailed": "Failed to switch model",
			"palette.selectFailedReason": "Failed to switch model: {message}",
			"palette.compatRepairFailed": "Could not repair reasoning compatibility before switching: {message}",
			"palette.reasoningEnableFailed": "Could not enable the selected reasoning effort for this model: {message}",
			"favorite.add": "Add favorite",
			"favorite.remove": "Remove favorite",
			"config.nav": "Model config",
			"config.title": "Provider and model configuration",
			"config.subtitle": "Edit routes, credentials, model capacity, and compatibility",
			"config.intro": "Writes through DSH settings and credentials; model presets can refresh from GitHub.",
			"config.reload": "Reload",
			"config.addProvider": "Add provider",
			"config.backToConfig": "Back to model config",
			"config.addProviderClose": "Close catalog",
			"config.providerSearch": "Search configured providers…",
			"config.providerCount": "{count} providers",
			"config.providerCardMeta": "{count} models · {protocol}",
			"config.providerSearchEmpty": "No matching providers",
			"config.freeBadge": "free sync",
			"config.keyDotConfigured": "Key configured",
			"config.keyDotMissing": "Key not configured",
			"config.keyDotNone": "No credential declared (catalog routes may be empty)",
			"config.editModel": "Edit parameters",
			"config.showAllModels": "Show all {count} models",
			"config.discardChanges": "Discard changes",
			"config.emptyTitle": "No providers configured yet",
			"config.emptyHint": "Add 60+ built-in providers from the template catalog, or create a route manually.",
			"config.retryFoldOn": "{retries} retries",
			"config.retryFoldOff": "off",
			"config.freeSyncOnShort": "on",
			"config.freeSyncOffShort": "off",
			"config.templateTitle": "Add provider from a template",
			"config.templateSubtitle": "Pick from the template catalog",
			"config.templateHint": "Pick a template to prefill the endpoint, protocol, and credential reference; OAuth subscriptions are managed in the official DSH settings.",
			"config.templateSearch": "Search templates…",
			"config.templateCustom": "Custom",
			"config.templateSubscription": "Subscription (OAuth)",
			"config.templateApiKey": "API key",
			"config.templateOauth": "OAuth login · managed by official DSH settings",
			"config.templateOauthOnly": "{name} uses OAuth login. Add it on the official DSH models settings page.",
			"config.templateModelCount": "{count} built-in models",
			"config.templateBlank": "Blank provider",
			"config.templateBlankHint": "Fill in every field manually",
			"config.templateReady": "Prefilled from the \"{name}\" template. Review and save.",
			"config.freeSyncTitle": "OpenRouter free-model auto sync",
			"config.freeSyncDescription": "On every DSH start and on an interval, this route is replaced with the currently available :free models — free models only.",
			"config.freeSyncToggle": "Auto sync",
			"config.freeSyncOn": "On (startup + interval)",
			"config.freeSyncOff": "Off",
			"config.freeSyncInterval": "Interval (hours)",
			"config.freeSyncEnabled": "Free-model auto sync enabled.",
			"config.freeSyncDisabled": "Free-model auto sync disabled.",
			"config.freeSyncIntervalSaved": "Sync interval saved: {hours} h.",
			"config.freeSyncRun": "Sync free models now",
			"config.freeSyncRunning": "Syncing…",
			"config.freeSyncDone": "Sync complete: {total} free models (+{added} / -{removed}).",
			"config.freeSyncActive": "Auto sync is on: DSH updates this route at startup and on each interval.",
			"config.freeSyncIdle": "Auto sync is off.",
			"config.freeSyncStateOk": "Last sync {time}: {total} models (+{added} / -{removed})",
			"config.freeSyncStateAt": "Last attempt {time}",
			"config.presetContext": "context {value}",
			"config.presetMaxTokens": "output {value}",
			"config.unsaved": "Unsaved changes",
			"config.discardConfirm": "This configuration has unsaved changes. Discard them?",
			"config.duplicateProvider": "Duplicate provider",
			"config.copyName": "{name} copy",
			"config.copyReady": "Created a provider draft with a separate credential reference. Review it before applying.",
			"config.cancelCreate": "Cancel new provider",
			"config.deleteProvider": "Delete provider",
			"config.deleting": "Deleting…",
			"config.deleteConfirm": "Remove provider {provider} from user settings? Its credential will be kept.",
			"config.deleted": "The provider was removed from user settings; its credential was kept.",
			"config.done": "Done",
			"config.namespaceMissing": "The llm-pi-ai settings namespace is not loaded.",
			"config.retryNamespaceMissing": "The model palette retry settings namespace is not loaded.",
			"config.providerTitle": "Provider settings",
			"config.providerDescription": "Configure the route name, endpoint, protocol, and credential reference.",
			"config.providerId": "Provider ID",
			"config.providerIdInvalid": "Provider ID must use lowercase letters, numbers, and hyphens and start with a letter or number.",
			"config.providerExists": "That provider ID already exists. Choose another ID.",
			"config.displayName": "Display name",
			"config.baseUrl": "Base URL",
			"config.baseUrlRequired": "Base URL is required.",
			"config.protocol": "Protocol",
			"config.protocolRequired": "Select a valid protocol.",
			"config.protocolNote": "OpenAI-compatible providers default to Responses. Reasoning capability does not prove Responses support; live checks can split Chat Completions-only models.",
			"config.providerDefaultInput": "Provider default input",
			"config.inputDshDefault": "Use DSH default (text only)",
			"config.credentialRef": "Credential ref",
			"config.credentialRefInvalid": "Credential ref must be a valid environment variable name.",
			"config.apiKey": "API key",
			"config.keyConfigured": "Configured; leave blank to keep it",
			"config.keyNotConfigured": "Enter a new API key",
			"config.keyInvalid": "API keys may contain printable non-space ASCII characters only.",
			"config.show": "Show",
			"config.hide": "Hide",
			"config.loadStoredKey": "Load stored key",
			"config.revealLoopbackOnly": "Stored keys can be revealed only through direct 127.0.0.1 or localhost access.",
			"config.revealLocalReady": "Direct localhost access: stored-key reveal is available",
			"config.revealSuccess": "Loaded from DSH credentials; the field is cleared after leaving or saving.",
			"config.credentialStatusConfigured": "Credential configured ({source})",
			"config.credentialStatusMissing": "Credential not configured",
			"config.probe": "Check connection",
			"config.probing": "Checking…",
			"config.modelListRead": "Read model list",
			"config.modelListReadDone": "Fetched {count} models. Select the ones to import.",
			"config.modelImportTitle": "Import provider model list",
			"config.modelImportSummary": "{count} total · {selected} selected",
			"config.modelImportSearch": "Search model name or ID",
			"config.modelImportHint": "Nothing selected by default; import auto-fills capacities, inputs, and exact presets.",
			"config.modelImportSelected": "Import selected ({count})",
			"config.modelImportDone": "Imported {count} models (added {added}, enriched {enriched}, presets {presets}).",
			"config.templateCatalog": "API key · built-in catalog",
			"config.templateReadyCatalog": "Created the \"{name}\" catalog-backed route: endpoint, protocol, and the model list come from the DSH built-in catalog. Add the key and it is ready.",
			"config.probeSuccess": "Connection succeeded and returned {count} models.",
			"config.probeSuccessApplied": "Connection succeeded with {count} models; added {added}, enriched {enriched}, and applied {presets} capability presets automatically. Apply configuration to save them.",
			"config.openRouterFreeScan": "Check free models",
			"config.openRouterFreeScanning": "Checking free models…",
			"config.openRouterFreeScanned": "The live OpenRouter catalog contains {count} usable :free models, including {unconfigured} that are not configured yet. Select the models to import.",
			"config.openRouterFreePickerTitle": "OpenRouter free model catalog",
			"config.openRouterFreePickerSummary": "{count} total · {selected} selected · checked {checkedAt}",
			"config.openRouterFreeSearch": "Search model name or ID",
			"config.openRouterFreeSelectVisible": "Select visible",
			"config.openRouterFreeSelectNew": "Select unconfigured",
			"config.openRouterFreeClear": "Clear selection",
			"config.openRouterFreeClose": "Close",
			"config.openRouterFreeConfigured": "Configured",
			"config.openRouterFreeContext": "Context {value}",
			"config.openRouterFreeOutput": "Max output {value}",
			"config.openRouterFreeEmpty": "No free models match this search.",
			"config.openRouterFreeImportHint": "Nothing is selected by default. Import fills missing capabilities only; it does not overwrite manual fields or remove unselected models.",
			"config.openRouterFreeImportSelected": "Import selected ({count})",
			"config.openRouterFreeImported": "Processed {selected} selected models: added {added}, enriched {enriched}, and applied {presets} capability presets. Apply configuration to save them.",
			"config.validateApiKey": "Validate API key",
			"config.apiKeyValidating": "Validating…",
			"config.apiKeyValidationKeyRequired": "Enter an API key or confirm that the current credential is configured.",
			"config.apiKeyValidationConfirm": "This validates the DSH runtime key with {model} over the selected protocol. If the input contains a different new key, it validates that key too. Requests may incur a small charge. Continue?",
			"config.apiKeyValidationDone": "API key validation completed; review the status below.",
			"config.apiKeyValidationRuntimeTarget": "DSH runtime credential ({source})",
			"config.apiKeyValidationDraftTarget": "Unsaved key in the input",
			"config.apiKeyValidationDraftResult": "Unsaved input key",
			"config.apiKeyValidationDraftOnly": "No DSH runtime credential is configured. Conversations use this key only after you apply the configuration.",
			"config.apiKeyValidationMismatch": "The input key differs from the DSH runtime credential. Conversations still use the runtime credential; apply the configuration and validate again.",
			"config.apiKeyValidationScope": "This proves only that a minimal streaming request succeeded. A full conversation may still be blocked because of its content, size, frequency, or Cloudflare/WAF rules.",
			"config.apiKeyValidationValid": "API key is usable",
			"config.apiKeyValidationInvalid": "API key is invalid or unauthorized",
			"config.apiKeyValidationBlocked": "Request was rejected by the provider or gateway",
			"config.apiKeyValidationUnavailable": "API key may be recognized but is currently unavailable",
			"config.apiKeyValidationUnknown": "API key could not be determined",
			"config.apiKeyValidationMissing": "API key is not configured",
			"config.apiKeyBatch": "Check all API keys",
			"config.apiKeyBatchRunning": "Checking all keys…",
			"config.apiKeyBatchConfirm": "This checks {count} runtime credentials through each provider’s configured model and protocol. It may incur a small charge and runs sequentially to reduce rate-limit pressure. Continue?",
			"config.apiKeyBatchResults": "All API key results",
			"config.apiKeyBatchAllValid": "Every checkable runtime credential is usable.",
			"config.apiKeyBatchProblems": "{count} providers need attention.",
			"config.apiKeyBatchClose": "Collapse results",
			"config.apiKeyBatchEdit": "Edit provider",
			"config.apiKeyBatchNoBaseUrl": "No Base URL is configured.",
			"config.apiKeyBatchInvalidBaseUrl": "The Base URL is invalid.",
			"config.apiKeyBatchInvalidProtocol": "The protocol configuration is invalid.",
			"config.apiKeyBatchNoModel": "No model ID is configured for a live request.",
			"config.protocolProbe": "Test live protocols",
			"config.protocolProbeModel": "Test model",
			"config.protocolProbing": "Testing protocols…",
			"config.protocolProbeModelRequired": "Add at least one model ID to test the live protocols.",
			"config.protocolProbeConfirm": "This sends one minimal Completions request and one minimal Responses request with {model}. It may incur a small API charge. Continue?",
			"config.protocolProbeNone": "Neither live protocol request succeeded. Review the errors below.",
			"config.protocolProbeAuthentication": "API key authentication failed, so protocol support cannot be determined. Validate or update the credential, then retry.",
			"config.protocolProbeBlocked": "The provider or gateway rejected the requests, so protocol support cannot be determined. Resolve the 403/WAF block first.",
			"config.protocolProbeTransient": "The provider was temporarily unavailable, rate-limited, or unreachable. Protocol support cannot be determined; retry later.",
			"config.protocolProbeOne": "Only {protocol} passed the live request test; use that protocol.",
			"config.protocolProbeBoth": "Both Completions and Responses passed the live request test; prefer Responses.",
			"config.protocolAvailable": "available",
			"config.protocolUnavailable": "unavailable: {error}",
			"config.protocolApplyRecommended": "Use {protocol}",
			"config.protocolApplied": "Changed the draft protocol to {protocol}. Apply configuration to save it.",
			"config.protocolScan": "Check every model protocol",
			"config.protocolScanning": "Checking every protocol…",
			"config.protocolScanConfirm": "This sends minimal Responses and Chat Completions requests for {count} models, up to {requests} requests total. It may incur a small charge. The plugin only classifies models until you confirm a change. Continue?",
			"config.protocolScanDone": "Checked {count} models: {completionsOnly} are Chat Completions-only and {unsupported} could not be determined.",
			"config.protocolScanAuthentication": "The all-model protocol check hit API key authentication failures. Treat these results as undetermined; no model will be split or moved automatically.",
			"config.protocolScanResults": "All-model protocol results",
			"config.protocolScanSummary": "Responses-first {responses} · Completions-only {completionsOnly} · undetermined {unsupported}",
			"config.protocolScanResponses": "Responses only; keep on the primary route",
			"config.protocolScanCompletionsOnly": "Chat Completions only; branch required",
			"config.protocolScanBoth": "Both protocols work; prefer Responses",
			"config.protocolScanUnsupported": "Neither protocol succeeded; do not move automatically",
			"config.protocolSplit": "Split Re/CC protocols",
			"config.protocolSplitting": "Splitting…",
			"config.protocolSplitPreview": "Safe preview: {responses} stays on Responses. A new {completions} route receives only the {count} Chat Completions-only models. Base URL, credential ref, capacities, inputs, reasoning, and retry settings are preserved.",
			"config.protocolSplitConfirm": "Write the split to DSH now? This creates {provider}, moves {count} Chat Completions-only models, and changes the original provider to Responses.",
			"config.protocolSplitDone": "Protocol split completed: {responses} uses Responses and {completions} uses Chat Completions; {count} models moved.",
			"config.protocolSplitRetryWarning": "The providers were split, but retry rules could not be copied: {error}",
			"config.protocolCatalogMetadataFailed": "Could not fully resolve catalog capacities and input modalities, so the split was cancelled instead of creating an inaccurate branch: {error}",
			"config.protocolWholeCompletions": "Use Completions for this route",
			"config.protocolWholeCompletionsApplied": "Every checked model is Chat Completions-only. The draft now uses Completions with compatibility defaults; apply configuration to save it.",
			"config.importDiscovery": "Import discovered models ({count})",
			"config.discoveryApplied": "Added {added} models and enriched {enriched} models.",
			"config.save": "Apply configuration",
			"config.saving": "Applying…",
			"config.saved": "Configuration was written live to DSH.",
			"config.savedWithCompatibilityRepair": "Configuration was written to DSH and repaired replay compatibility for {count} DeepSeek reasoning models.",
			"config.settingsSavedKeyFailed": "Provider settings were saved, but the key write failed",
			"config.reasoningRepairTitle": "Missing DeepSeek reasoning replay compatibility",
			"config.reasoningRepairDescription": "{count} models need thinkingFormat, reasoning_content replay, and system-role compatibility: {models}",
			"config.reasoningRepairApply": "Repair and apply",
			"config.reasoningProviderEnable": "Enable reasoning for all models",
			"config.reasoningProviderApplied": "Filled universal reasoning efforts for {count} models. Apply configuration to save them.",
			"config.reasoningModelApplied": "Filled every reasoning effort and a provider-aware dispatch format for this model.",
			"config.reasoningTitle": "Reasoning efforts",
			"config.reasoningMode": "Model reasoning capability",
			"config.reasoningInherit": "Inherit live catalog",
			"config.reasoningDisabled": "Explicitly disabled",
			"config.reasoningAll": "All efforts / custom",
			"config.reasoningEnableAll": "Enable every effort",
			"config.reasoningDescription": "reasoningEfforts controls which levels DSH offers; each wire value is sent to the provider. The plugin selects common dispatch formats for OpenAI, OpenRouter, DeepSeek, Qwen, GLM, and similar routes, while advanced compatibility remains editable.",
			"config.reasoningOffWire": "Blank omits the reasoning parameter",
			"config.reasoningWireValue": "Provider wire value for {level}",
			"config.modelsTitle": "Model parameters",
			"config.modelsDescription": "Context, maximum output, and inputs drive DSH capacity and attachment decisions.",
			"config.catalogModelsManaged": "These models come from the live DSH catalog. Provider-only edits preserve modelOverrides; editing, adding, removing, or bulk-changing a model safely materializes the complete catalog as explicit models.",
			"config.retryTitle": "Model request retries",
			"config.retryDescription": "Take over transient failures only for this provider or selected models; every other route keeps its existing DSH policy.",
			"config.retryPreset50": "B.AI / BankOfAI preset: 50",
			"config.retryProviderMode": "Provider default rule",
			"config.retryProviderInherit": "Keep the DSH policy",
			"config.retryProviderCustom": "Use plugin retry rules",
			"config.retryProviderCount": "Retries after failure",
			"config.retrySafetyTitle": "Cost and wait warning",
			"config.retrySafetyDescription": "N counts retries after the first failure, so this setting can send up to {attempts} requests ({retries} retries). Only network, timeout, 429, 5xx, empty-response, and explicit Cloudflare/WAF 403 failures retry; 401, quota, bad parameters, missing models, and context overflow do not.",
			"config.retryCountInvalid": "Retry count must be an integer from 0 to {max}.",
			"config.retryModelMode": "Model retry override",
			"config.retryModelInherit": "Inherit provider / DSH",
			"config.retryModelDisabled": "Never retry",
			"config.retryModelCustom": "Custom count",
			"config.retryModelCount": "Retries after this model fails",
			"config.freeModelBadge": "live free",
			"config.refreshPresets": "Refresh online presets",
			"config.presetsLoading": "Loading online presets…",
			"config.presetsOnline": "Online presets {date} · {count}",
			"config.presetsFallback": "Online failed; bundled {date} · {count}",
			"config.presetsBundled": "Bundled presets {date} · {count}",
			"config.autoPreset": "Fill missing parameters",
			"config.presetsApplied": "Filled missing parameters for {count} exact model matches.",
			"config.addModel": "Add model",
			"config.noModels": "No models are configured. A custom provider needs at least one model.",
			"config.model": "Model",
			"config.modelId": "Model ID",
			"config.modelIdRequired": "Every model needs an ID.",
			"config.modelIdDuplicate": "Model IDs must be unique: {ids}",
			"config.modelName": "Display name",
			"config.searchModels": "Filter this provider’s models…",
			"config.noMatchingModels": "No models in this provider match the filter.",
			"config.duplicateModel": "Copy parameters",
			"config.modelCopyReady": "Copied the model parameters. Enter the new model ID.",
			"config.optional": "Optional",
			"config.contextWindow": "Context window",
			"config.maxTokens": "Maximum output",
			"config.inputTypes": "Input types",
			"config.inputInherit": "Inherit provider default input",
			"config.inputText": "Text only",
			"config.inputTextImage": "Text + image (vision)",
			"config.inputImageOnly": "Image only",
			"config.preset": "Model preset",
			"config.noPreset": "No preset / manual configuration",
			"config.applyPreset": "Apply preset",
			"config.presetReasoningLevels": "{count} reasoning efforts",
			"config.compatibility": "Advanced compatibility",
			"config.compatNone": "This protocol has no common compatibility switches exposed here.",
			"config.inherit": "Inherit / auto detect",
			"config.remove": "Remove",
			"relay.nav": "Relay config",
			"relay.title": "Provider relay configuration",
			"relay.subtitle": "Inspect the built-in relay and configure reusable fixed routes",
			"relay.intro": "When a provider canonical domain is unreachable because of local DNS, TLS, or routing, let the DSH plugin backend connect through a verified reachable entry.",
			"relay.builtIn": "Loopback only · fixed target",
			"relay.howTitle": "The relay is provided by dsa-preset",
			"relay.howDescription": "It is not another plugin or a VPN. DSH sends the original API request to the local relay, which stays with the same provider; B.AI changes only the connection strategy, never the provider or model.",
			"relay.routeAria": "Relay request route",
			"relay.routeDsh": "DSH provider",
			"relay.routeLocal": "Local plugin relay",
			"relay.routeProvider": "Reachable provider entry",
			"relay.security": "The API key remains in DSH credentials and passes only through the local process during forwarding. The relay rejects non-loopback and forwarded requests, so it is not a LAN-accessible open proxy.",
			"relay.baiTitle": "Built-in B.AI relay",
			"relay.baiDescription": "It stays on B.AI and does not switch provider or model; transient failures move through alternate B.AI connection strategies.",
			"relay.localBaseUrl": "Provider Base URL",
			"relay.upstream": "Connection upstream",
			"relay.hostHeader": "HTTP Host / certificate name",
			"relay.allowedPath": "Allowed path",
			"relay.strategyTitle": "B.AI internal connection strategies (no provider switch)",
			"relay.strategyAccelerator": "The current DNS address for B.AI AWS Global Accelerator; Host and SNI remain B.AI.",
			"relay.strategyNextAddress": "The next DNS address for the same B.AI accelerator, avoiding the previous bad route.",
			"relay.strategyDirect": "A final direct api.b.ai attempt; it is still the same B.AI provider and model.",
			"relay.statusHint": "HTTP 401 means the request reached B.AI, so check the credential. 503, 502, 504, Cloudflare 403, and ECONNRESET move to the next B.AI strategy instead of another provider. The relay returns 503 only after all attempts fail.",
			"relay.retryPolicy": "Each strategy opens a fresh HTTPS connection, resolves and rotates DNS addresses dynamically, and never hardcodes an IP. Bodies up to 16 MiB can be replayed between B.AI strategies.",
			"relay.copy": "Copy URL",
			"relay.copied": "Copied",
			"relay.copyProvider": "Copy B.AI provider template",
			"relay.openModelConfig": "Open model config",
			"relay.pluginConfigTitle": "Advanced B.AI relay config",
			"relay.pluginConfigDescription": "The defaults normally need no override. Change them in a profile patch only when the provider changes its reachable entry, Host, or timeout requirements.",
			"relay.copyPluginConfig": "Copy B.AI relay config",
			"relay.extendTitle": "Extend to another provider",
			"relay.extendDescription": "providerRelays adds multiple named, fixed-destination, loopback-only HTTPS relays without changing plugin source.",
			"relay.extendStepOne": "Confirm the key is valid and find an alternate HTTPS host that reaches the same provider service.",
			"relay.extendStepTwo": "Configure the connection host, original API Host, TLS SNI, certificate name, and allowed path prefix under providerRelays.",
			"relay.extendStepThree": "Restart dsh web, change the provider Base URL to the local /dsa-preset/api/relay/<id>/v1 address, and run Check connection.",
			"relay.genericBaseUrl": "Example Provider Base URL:",
			"relay.copyGenericBaseUrl": "Copy example Base URL",
			"relay.copyGenericConfig": "Copy generic relay template",
			"relay.extendWarning": "Do not place unknown sites, dynamic URLs, or secrets in relay configuration. Every relay must stay fixed to a provider entry you verified; Host/SNI rewriting cannot safely turn an unrelated host into the provider API.",
			"media.nav": "Media tools",
			"media.title": "OpenRouter media tools",
			"media.subtitle": "Direct access to image and video capabilities",
			"media.intro": "Reads the live OpenRouter catalog and calls the plugin backend without sending a conversation message.",
			"media.priceProtection": "Free first · confirm each attempt",
			"media.catalog": "Live model and pricing catalog",
			"media.catalogLoading": "Reading OpenRouter directly…",
			"media.imageCount": "image models",
			"media.videoCount": "video models",
			"media.refresh": "Refresh catalog",
			"media.noModels": "No models are available",
			"media.chooseModel": "Select a model",
			"media.free": "free",
			"media.paidAllowed": "possibly paid · enabled by config",
			"media.unverifiedFree": "not reported free · manual attempt available",
			"media.model": "Model (live pricing status)",
			"media.modelRequired": "Select a model first.",
			"media.manualPaidTitle": "I understand this request may be charged and still want to try",
			"media.manualPaidDescription": "Promotional free access may not appear in OpenRouter pricing data. If the request is charged, your account remains responsible. This confirmation applies only to the next submission.",
			"media.manualPaidRequired": "OpenRouter does not report this model as free. Confirm the possible charge for this attempt first.",
			"media.manualPaidUsed": "Submitted with your one-time confirmation. Check OpenRouter billing for the final charge.",
			"media.imageTitle": "Generate image",
			"media.imageDescription": "Generates directly and saves into the configured output directory.",
			"media.videoTitle": "Generate video",
			"media.videoDescription": "Submits an asynchronous video job directly.",
			"media.jobsTitle": "Video jobs",
			"media.jobsDescription": "Checks job status directly and downloads completed videos.",
			"media.prompt": "Prompt",
			"media.imagePromptPlaceholder": "Example: an orange cat by a window, cinematic lighting",
			"media.videoPromptPlaceholder": "Example: a cinematic sunset over the ocean, slow push in",
			"media.outputOptional": "Output name (optional)",
			"media.durationOptional": "Duration in seconds (optional)",
			"media.jobId": "Job ID",
			"media.generateImage": "Generate image directly",
			"media.generateVideo": "Submit video directly",
			"media.checkStatus": "Check status",
			"media.downloadVideo": "Download video",
			"media.running": "Running…",
			"media.promptRequired": "Enter a prompt first.",
			"media.durationInvalid": "Video duration must be an integer from 1 to 60.",
			"media.jobRequired": "Enter a video job ID first.",
			"media.imageDone": "Image saved",
			"media.videoSubmitted": "Video job submitted",
			"media.statusDone": "Video job status",
			"media.downloadDone": "Video downloaded"
		};
		//#endregion
		//#region src/client/remote-compat.ts
		function jsonValue(value, location) {
			if (value === null || typeof value === "string" || typeof value === "boolean") return value;
			if (typeof value === "number") {
				if (!Number.isFinite(value)) throw new TypeError(`${location} must contain only finite JSON numbers`);
				return value;
			}
			if (Array.isArray(value)) return value.map((item, index) => jsonValue(item, `${location}[${index}]`));
			if (typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, jsonValue(item, `${location}.${key}`)]));
			throw new TypeError(`${location} must be JSON-compatible`);
		}
		function settingsPathOps(ops) {
			return ops.map((op, index) => op.op === "unset" ? {
				op: "unset",
				path: [...op.path]
			} : {
				op: "set",
				path: [...op.path],
				value: jsonValue(op.value, `settings operation ${index} value`)
			});
		}
		/** Adapt DSH alpha.3 positional Remote methods to the palette's request objects. */
		function paletteApi(remote) {
			return {
				settings: {
					describe: async () => ({ result: await remote.settings.describe() }),
					mutate: async (request) => ({ result: await remote.settings.mutate(request.ns, settingsPathOps(request.ops), request.expectedRevision) })
				},
				credentials: {
					describe: async (request) => {
						const result = await remote.credentials.describe(request.refs);
						return { result: result.ok ? {
							ok: true,
							value: { credentials: result.value }
						} : result };
					},
					set: async (request) => ({ result: await remote.credentials.set(request.ref, request.value) })
				},
				llm: {
					discoverModels: async ({ settingsNs, ...request }) => {
						const result = await remote.llm.discoverModels(settingsNs, request);
						return { result: result.ok ? {
							ok: true,
							value: { models: result.value }
						} : result };
					},
					models: async () => ({ result: await remote.session.modelCatalog() })
				}
			};
		}
		//#endregion
		//#region \0dsa-preset-css:src/client/style.css.mjs
		const css = ".dsa-launcher { position: relative; display: inline-flex; align-items: center; gap: 8px; min-width: 0; }\n.dsa-trigger { height: 28px; width: auto; max-width: 340px; display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: flex-start; padding: 0 8px; border: 0; border-radius: 16px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 13px; overflow: hidden; transition: width 0.18s ease; }\n.dsa-trigger-inner { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }\n.dsa-trigger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dsa-trigger:focus-visible { outline: 2px solid var(--dsw-alias-border-l2); outline-offset: 1px; }\n.dsa-trigger:disabled { color: var(--dsw-alias-label-dimmed); cursor: default; }\n.dsa-trigger-icon { color: var(--dsw-alias-brand-primary); font-weight: 700; }\n.dsa-trigger-model, .dsa-trigger-provider { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dsa-trigger-model { max-width: 150px; font-weight: 600; }\n.dsa-trigger-provider { display: inline-flex; flex: none; align-items: center; padding: 2px; border-radius: 5px; background: #fff; line-height: 0; }\n.dsa-trigger kbd { padding: 1px 5px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 5px; color: var(--dsw-alias-label-tertiary); font-size: 10px; font-family: inherit; }\n/* quick preset menu: left-click on the trigger — favorites as instant presets */\n.dsa-quick { position: absolute; left: 0; bottom: calc(100% + 8px); z-index: 60; min-width: 250px; max-width: 330px; max-height: 380px; overflow-y: auto; margin: 0; padding: 6px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); box-shadow: 0 12px 32px rgba(0, 0, 0, .45); }\n.dsa-quick-empty { padding: 10px 9px; color: var(--dsw-alias-label-tertiary); font-size: 12px; }\n.dsa-quick-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 9px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; text-align: left; cursor: pointer; }\n.dsa-quick-item:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dsa-quick-item.is-active { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); color: var(--dsw-alias-label-primary); }\n.dsa-quick-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }\n.dsa-quick-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; font-weight: 600; }\n.dsa-quick-sub { display: flex; align-items: center; gap: 5px; min-width: 0; overflow: hidden; font-size: 11px; color: var(--dsw-alias-label-tertiary); }\n.dsa-quick-sub > span:not(.dsa-result-provider) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dsa-quick-check { flex: none; color: var(--dsw-alias-brand-primary); font-weight: 700; }\n.dsa-quick-all { width: 100%; margin-top: 4px; padding: 7px 9px; border: 0; border-top: 1px solid var(--dsw-alias-border-inverted); border-radius: 0 0 8px 8px; background: transparent; color: var(--dsw-alias-brand-primary); font: inherit; font-size: 12px; font-weight: 600; text-align: left; cursor: pointer; }\n.dsa-quick-all:hover { background: var(--dsw-alias-interactive-bg-hover); }\n@media (prefers-reduced-motion: reduce) { .dsa-quick-item, .dsa-quick-all, .dsa-effort-item { transition: none; } }\n.dsa-overlay { position: fixed; inset: 0; z-index: 10020; display: grid; place-items: center; padding: 24px; background: color-mix(in srgb, var(--dsw-alias-bg-mask, #000) 46%, transparent); backdrop-filter: blur(8px); }\n.dsa-dialog { width: min(920px, calc(100vw - 32px)); height: min(720px, calc(100vh - 48px)); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 18px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); box-shadow: 0 24px 80px rgb(0 0 0 / 28%); }\n.dsa-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 22px 14px; }\n.dsa-header h2 { margin: 0; font-size: 18px; line-height: 24px; }\n.dsa-header p { margin: 3px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; }\n.dsa-close { width: 30px; height: 30px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 22px; }\n.dsa-close:hover { background: var(--dsw-alias-interactive-bg-hover); }\n.dsa-search-wrap { display: flex; align-items: center; gap: 9px; margin: 0 22px 12px; padding: 0 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 11px; background: var(--dsw-alias-bg-layer-1); }\n.dsa-search-wrap:focus-within { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent); }\n.dsa-search-wrap input { flex: 1; min-width: 0; height: 38px; border: 0; outline: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 14px; }\n.dsa-search-wrap input::placeholder { color: var(--dsw-alias-label-tertiary); }\n.dsa-search-wrap button { border: 0; background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; font-size: 18px; }\n.dsa-error { display: flex; align-items: center; gap: 12px; margin: 0 22px 10px; padding: 8px 10px; border-radius: 8px; background: var(--dsw-alias-state-error-secondary); color: var(--dsw-alias-state-error-primary); font-size: 12px; }\n.dsa-error button { margin-left: auto; border: 1px solid currentColor; border-radius: 12px; background: transparent; color: inherit; cursor: pointer; }\n.dsa-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 190px minmax(0, 1fr); border-top: 1px solid var(--dsw-alias-border-inverted); border-bottom: 1px solid var(--dsw-alias-border-inverted); }\n.dsa-providers { min-height: 0; overflow-y: auto; padding: 10px; border-right: 1px solid var(--dsw-alias-border-inverted); background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 72%, transparent); }\n.dsa-providers button { width: 100%; display: flex; align-items: center; gap: 8px; min-height: 34px; padding: 7px 9px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; text-align: left; font: inherit; font-size: 12.5px; }\n.dsa-providers button:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dsa-providers button.is-active { background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); }\n.dsa-providers button span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dsa-providers button small { color: var(--dsw-alias-label-tertiary); }\n.dsa-providers .dsa-media-nav { color: var(--dsw-alias-brand-primary); font-weight: 600; }\n.dsa-provider-divider { height: 1px; margin: 8px 4px; background: var(--dsw-alias-border-inverted); }\n.dsa-results { min-height: 0; overflow-y: auto; padding: 10px; }\n.dsa-result { width: 100%; display: flex; align-items: center; gap: 2px; border-radius: 10px; background: transparent; color: var(--dsw-alias-label-primary); }\n.dsa-result:hover, .dsa-result.is-cursor { background: var(--dsw-alias-interactive-bg-hover); }\n.dsa-result.is-current { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent); }\n.dsa-result-select { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 10px 5px 10px 11px; border: 0; background: transparent; color: inherit; cursor: pointer; text-align: left; font: inherit; }\n.dsa-result-select:focus-visible, .dsa-star:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }\n.dsa-result-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }\n.dsa-result-title { display: flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 600; }\n.dsa-result-title em { padding: 1px 6px; border-radius: 999px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 10px; font-style: normal; font-weight: 500; }\n.dsa-result-title em.is-effort { background: transparent; border: 1px solid var(--dsw-alias-border-inverted); color: var(--dsw-alias-label-secondary); }\n.dsa-result-title em.is-applied { background: transparent; color: var(--dsw-alias-brand-primary); }\n.dsa-result-meta { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--dsw-alias-label-tertiary); font-size: 11.5px; }\n.dsa-result-provider { display: inline-flex; flex: none; align-items: center; }\n.dsa-result-meta strong { color: var(--dsw-alias-label-secondary); font-weight: 500; }\n.dsa-result-meta span, .dsa-result-description { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dsa-result-description { color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dsa-reasoning { width: 21px; height: 21px; display: grid; place-items: center; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 6px; color: var(--dsw-alias-label-tertiary); font-size: 10px; font-weight: 700; }\n.dsa-star { margin-right: 7px; padding: 4px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-dimmed); cursor: pointer; font: inherit; font-size: 16px; }\n.dsa-star:hover, .dsa-star.is-favorite { color: var(--dsw-alias-state-warn-primary); background: var(--dsw-alias-interactive-bg-hover); }\n.dsa-empty { display: grid; min-height: 220px; place-items: center; color: var(--dsw-alias-label-tertiary); font-size: 13px; }\n.dsa-footer { min-height: 62px; display: flex; align-items: center; gap: 16px; padding: 10px 18px; }\n.dsa-current { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 7px; }\n.dsa-current span { color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dsa-current strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }\n.dsa-current small { color: var(--dsw-alias-label-tertiary); }\n.dsa-effort { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dsa-effort select { height: 30px; max-width: 170px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; }\n.dsa-failures { color: var(--dsw-alias-state-warn-primary); font-size: 11px; }\n.dsa-media { min-height: 0; overflow-y: auto; padding: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 32%, transparent); }\n.dsa-media-intro { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 10px; padding: 11px 13px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, var(--dsw-alias-border-inverted)); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }\n.dsa-media-intro div { display: flex; flex-direction: column; gap: 2px; }\n.dsa-media-intro strong { font-size: 13px; }\n.dsa-media-intro span { color: var(--dsw-alias-label-tertiary); font-size: 11.5px; line-height: 17px; }\n.dsa-media-intro .dsa-media-safety { flex: none; padding: 4px 8px; border-radius: 999px; background: color-mix(in srgb, #22a06b 15%, transparent); color: #22a06b; font-size: 10px; font-weight: 600; }\n.dsa-media-catalog { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; padding: 9px 11px; border-bottom: 1px solid var(--dsw-alias-border-inverted); }\n.dsa-media-catalog div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dsa-media-catalog strong { font-size: 12px; }\n.dsa-media-catalog span { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dsa-media-catalog button { flex: none; min-height: 29px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 10.5px; }\n.dsa-media-catalog button:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dsa-media-catalog button:disabled { opacity: .5; cursor: default; }\n.dsa-media-error { margin-bottom: 10px; padding: 8px 10px; border-radius: 8px; background: var(--dsw-alias-state-error-secondary); color: var(--dsw-alias-state-error-primary); font-size: 12px; }\n.dsa-media-feedback { margin-bottom: 10px; padding: 9px 10px; border-radius: 8px; background: color-mix(in srgb, #22a06b 11%, var(--dsw-alias-bg-layer-2)); color: var(--dsw-alias-label-primary); font-size: 11px; }\n.dsa-media-feedback strong { display: block; margin-bottom: 4px; color: #22a06b; }\n.dsa-media-feedback pre { max-height: 110px; margin: 0; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--dsw-alias-label-secondary); font: inherit; line-height: 16px; }\n.dsa-media-card { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 12px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }\n.dsa-media-card-heading { display: flex; align-items: flex-start; gap: 9px; }\n.dsa-media-card-heading div { min-width: 0; }\n.dsa-media-card-heading h3 { margin: 0; font-size: 13px; line-height: 18px; }\n.dsa-media-card-heading p { margin: 2px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dsa-media-icon { width: 25px; height: 25px; flex: none; display: grid; place-items: center; border-radius: 7px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 14px; font-weight: 700; }\n.dsa-media-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 10px; }\n.dsa-media-fields { display: grid; grid-template-columns: minmax(0, 1fr) 120px; gap: 8px; }\n.dsa-media-field { min-width: 0; display: flex; flex-direction: column; gap: 4px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dsa-media-field input, .dsa-media-field textarea, .dsa-media-field select { width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; outline: 0; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }\n.dsa-media-field input, .dsa-media-field select { height: 32px; padding: 0 9px; }\n.dsa-media-field textarea { min-height: 58px; resize: vertical; padding: 8px 9px; line-height: 17px; }\n.dsa-media-field input:focus, .dsa-media-field textarea:focus, .dsa-media-field select:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }\n.dsa-media-field input::placeholder, .dsa-media-field textarea::placeholder { color: var(--dsw-alias-label-dimmed); }\n.dsa-media-paid-confirm { display: flex; align-items: flex-start; gap: 8px; padding: 8px 9px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 46%, var(--dsw-alias-border-inverted)); border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 9%, transparent); color: var(--dsw-alias-label-secondary); cursor: pointer; }\n.dsa-media-paid-confirm input { width: 14px; height: 14px; flex: none; margin: 2px 0 0; accent-color: var(--dsw-alias-state-warn-primary, #d97706); }\n.dsa-media-paid-confirm span { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dsa-media-paid-confirm strong { color: var(--dsw-alias-state-warn-primary, #d97706); font-size: 10.5px; line-height: 15px; }\n.dsa-media-paid-confirm small { color: var(--dsw-alias-label-tertiary); font-size: 9.5px; line-height: 14px; }\n.dsa-media-actions { display: flex; flex-wrap: wrap; gap: 7px; }\n.dsa-media-actions button, .dsa-media-primary { min-height: 31px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 11px; }\n.dsa-media-actions button:hover:not(:disabled), .dsa-media-primary:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dsa-media-actions button.dsa-media-primary, .dsa-media-primary { align-self: flex-end; border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 50%, var(--dsw-alias-border-l2)); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); font-weight: 600; }\n.dsa-media-actions button.dsa-media-primary:hover:not(:disabled), .dsa-media-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 88%, #000); color: var(--dsw-alias-label-on-primary, #fff); }\n.dsa-media-actions button:disabled, .dsa-media-primary:disabled { opacity: .5; cursor: default; }\n.dsa-media-job-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; align-items: end; gap: 8px; }\n.dsa-media-job-actions { flex-wrap: nowrap; }\n.dsa-relay { min-height: 0; overflow-y: auto; padding: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 32%, transparent); }\n.dsa-relay-intro { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 10px; padding: 11px 13px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, var(--dsw-alias-border-inverted)); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }\n.dsa-relay-intro div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dsa-relay-intro strong { font-size: 13px; }\n.dsa-relay-intro span { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; }\n.dsa-relay-intro .dsa-relay-status { flex: none; padding: 4px 8px; border-radius: 999px; background: color-mix(in srgb, #22a06b 15%, transparent); color: #22a06b; font-size: 10px; font-weight: 600; }\n.dsa-relay-card { position: relative; display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px; padding: 12px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }\n.dsa-relay-card-heading { display: flex; align-items: flex-start; gap: 9px; }\n.dsa-relay-card-heading div { min-width: 0; }\n.dsa-relay-card-heading h3 { margin: 0; font-size: 13px; line-height: 18px; }\n.dsa-relay-card-heading p { margin: 2px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dsa-relay-icon { width: 25px; height: 25px; flex: none; display: grid; place-items: center; border-radius: 7px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 13px; font-weight: 700; }\n.dsa-relay-route { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 7px; }\n.dsa-relay-route span { min-width: 0; padding: 8px; border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); text-align: center; font-size: 10.5px; }\n.dsa-relay-route b { color: var(--dsw-alias-brand-primary); font-size: 12px; }\n.dsa-relay-note, .dsa-relay-warning, .dsa-relay-base-example { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dsa-relay-details { display: grid; gap: 1px; margin: 0; overflow: hidden; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 9px; background: var(--dsw-alias-border-inverted); }\n.dsa-relay-details > div { min-width: 0; display: grid; grid-template-columns: 145px minmax(0, 1fr); align-items: center; gap: 10px; padding: 8px 9px; background: var(--dsw-alias-bg-layer-1); }\n.dsa-relay-details dt { color: var(--dsw-alias-label-tertiary); font-size: 10px; }\n.dsa-relay-details dd { min-width: 0; display: flex; align-items: center; gap: 7px; margin: 0; color: var(--dsw-alias-label-secondary); font-size: 10.5px; }\n.dsa-relay-details code, .dsa-relay-base-example code { min-width: 0; overflow: hidden; color: var(--dsw-alias-label-primary); text-overflow: ellipsis; white-space: nowrap; }\n.dsa-relay-strategies { display: grid; gap: 7px; padding: 9px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 9px; background: var(--dsw-alias-bg-layer-1); }\n.dsa-relay-strategies strong { color: var(--dsw-alias-label-secondary); font-size: 10.5px; }\n.dsa-relay-strategies ol { display: grid; gap: 5px; margin: 0; padding-left: 20px; color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 15px; }\n.dsa-relay-strategies li { padding-left: 2px; }\n.dsa-relay-strategies li code { margin-right: 6px; color: var(--dsw-alias-brand-primary); }\n.dsa-relay-strategies li span { color: var(--dsw-alias-label-tertiary); }\n.dsa-relay-details button, .dsa-relay-actions button, .dsa-relay-copy-code { flex: none; min-height: 29px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 10.5px; }\n.dsa-relay-details button:hover, .dsa-relay-actions button:hover, .dsa-relay-copy-code:hover { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dsa-relay-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; }\n.dsa-relay-actions button.dsa-relay-primary { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); font-weight: 600; }\n.dsa-relay-code { max-height: 230px; margin: 0; overflow: auto; padding: 10px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 9px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 15px; white-space: pre; }\n.dsa-relay-copy-code { align-self: flex-end; }\n.dsa-relay-expand ol { margin: 0; padding-left: 21px; color: var(--dsw-alias-label-secondary); font-size: 10.5px; line-height: 16px; }\n.dsa-relay-warning { padding: 8px 9px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 44%, var(--dsw-alias-border-inverted)); border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 8%, transparent); color: var(--dsw-alias-state-warn-primary, #d97706); }\n.dsa-config { min-height: 0; overflow-y: auto; padding: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 32%, transparent); }\n.dsa-config-toolbar, .dsa-config-card-heading, .dsa-config-status-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }\n.dsa-config-toolbar { margin-bottom: 10px; padding: 10px 12px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, var(--dsw-alias-border-inverted)); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, transparent); }\n.dsa-config-toolbar > div:first-child { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dsa-config-toolbar strong { font-size: 13px; }\n.dsa-config-toolbar span, .dsa-config-card-heading p, .dsa-config-status-row, .dsa-config-heading-actions > span { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dsa-config-toolbar-actions, .dsa-config-heading-actions, .dsa-config-provider-actions, .dsa-config-status-row > div, .dsa-config-key-input, .dsa-config-preset, .dsa-config-model-top > div { display: flex; align-items: center; gap: 7px; }\n.dsa-config-dirty { padding: 3px 7px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 12%, transparent); color: var(--dsw-alias-state-warn-primary, #d97706) !important; font-size: 9.5px !important; font-weight: 600; }\n.dsa-config-compat-warning { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; padding: 10px 12px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 44%, var(--dsw-alias-border-inverted)); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 9%, var(--dsw-alias-bg-layer-2)); }\n.dsa-config-compat-warning > div { min-width: 0; display: flex; flex-direction: column; gap: 3px; }\n.dsa-config-compat-warning strong { color: var(--dsw-alias-state-warn-primary, #d97706); font-size: 11.5px; }\n.dsa-config-compat-warning span { color: var(--dsw-alias-label-secondary); font-size: 10.5px; line-height: 15px; overflow-wrap: anywhere; }\n.dsa-config-compat-warning button { flex: none; min-height: 31px; padding: 0 10px; border: 1px solid var(--dsw-alias-state-warn-primary, #d97706); border-radius: 8px; background: var(--dsw-alias-state-warn-primary, #d97706); color: #fff; cursor: pointer; font-size: 10.5px; font-weight: 600; }\n.dsa-config button, .dsa-config select { font: inherit; }\n.dsa-config-toolbar button, .dsa-config-card-heading button, .dsa-config-provider-actions button, .dsa-config-status-row button, .dsa-config-preset button, .dsa-config-model-top button { min-height: 29px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10.5px; }\n.dsa-config-toolbar button:hover:not(:disabled), .dsa-config-card-heading button:hover:not(:disabled), .dsa-config-provider-actions button:hover:not(:disabled), .dsa-config-status-row button:hover:not(:disabled), .dsa-config-preset button:hover:not(:disabled), .dsa-config-model-top button:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dsa-config button.dsa-danger { color: var(--dsw-alias-state-error-primary); }\n.dsa-config button.dsa-danger:hover:not(:disabled) { border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }\n.dsa-config button:disabled { opacity: .5; cursor: default; }\n.dsa-config-card { margin-bottom: 10px; padding: 12px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }\n.dsa-config-card-heading { align-items: flex-start; margin-bottom: 11px; }\n.dsa-config-card-heading h3 { margin: 0; font-size: 13px; line-height: 18px; }\n.dsa-config-card-heading p { margin: 2px 0 0; }\n.dsa-config-retry-preset { flex: none; padding: 4px 8px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); color: var(--dsw-alias-brand-primary); font-size: 10px; font-weight: 650; }\n.dsa-config-retry-note { display: flex; flex-direction: column; justify-content: center; gap: 2px; min-height: 54px; padding: 8px 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 38%, var(--dsw-alias-border-inverted)); border-radius: 9px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 7%, transparent); }\n.dsa-config-retry-note strong { color: var(--dsw-alias-state-warn-primary, #d97706); font-size: 10.5px; }\n.dsa-config-retry-note span { color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 14px; }\n.dsa-config-model-retry { display: flex; align-items: end; gap: 6px; }\n.dsa-config-model-retry > label { flex: 1; }\n.dsa-config-model-retry > input { width: 76px; height: 32px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; }\n.dsa-config-provider-actions { flex-wrap: wrap; justify-content: flex-end; }\n.dsa-config-provider-actions select { min-width: 190px; height: 31px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; }\n.dsa-config-provider-grid, .dsa-config-model-grid, .dsa-config-compat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 9px; }\n.dsa-config-span-2 { grid-column: span 2; }\n.dsa-config-protocol-note { grid-column: span 3; align-self: end; min-height: 32px; display: flex; align-items: center; padding: 0 9px; border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 14px; }\n.dsa-config-key-field { grid-column: span 3; }\n.dsa-config-key-input input { flex: 1; min-width: 0; }\n.dsa-config-key-input button { flex: none; min-height: 30px; padding: 0 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10px; }\n.dsa-config-status-row { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dsa-config-status-row > span.is-ok { color: #22a06b; }\n.dsa-config-status-row > div { margin-left: auto; }\n.dsa-config-protocol-model { display: flex; align-items: center; gap: 6px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dsa-config-protocol-model select { max-width: 190px; height: 29px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 7px; font: inherit; font-size: 10.5px; }\n.dsa-config-status-row button.dsa-media-primary { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); }\n.dsa-config-protocol-results { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--dsw-alias-border-inverted); font-size: 10.5px; }\n.dsa-config-protocol-results span { display: inline-flex; align-items: baseline; gap: 4px; color: var(--dsw-alias-label-secondary); }\n.dsa-config-protocol-results span.is-ok { color: #22a06b; }\n.dsa-config-protocol-results span.is-error { color: var(--dsw-alias-state-error-primary); }\n.dsa-config-protocol-results button { min-height: 27px; padding: 0 8px; border: 1px solid var(--dsw-alias-brand-primary); border-radius: 7px; background: transparent; color: var(--dsw-alias-brand-primary); cursor: pointer; font-size: 10px; }\n.dsa-config-protocol-scan { margin-top: 9px; padding: 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, var(--dsw-alias-border-inverted)); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, var(--dsw-alias-bg-layer-2)); }\n.dsa-config-protocol-scan-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }\n.dsa-config-protocol-scan-heading > div { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }\n.dsa-config-protocol-scan-heading > div:first-child { min-width: 0; flex-direction: column; align-items: flex-start; gap: 2px; }\n.dsa-config-protocol-scan-heading strong { font-size: 11.5px; }\n.dsa-config-protocol-scan-heading span, .dsa-config-protocol-scan > p { color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 14px; }\n.dsa-config-protocol-scan-heading button { min-height: 27px; padding: 0 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10px; }\n.dsa-config-protocol-scan-heading button.dsa-media-primary { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); }\n.dsa-config-protocol-scan > p { margin: 8px 0 0; padding: 7px 8px; border-radius: 7px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent); }\n.dsa-config-protocol-scan-list { display: flex; flex-direction: column; gap: 5px; max-height: 300px; overflow-y: auto; margin-top: 8px; }\n.dsa-config-protocol-scan-list article { padding: 7px 8px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); }\n.dsa-config-protocol-scan-list article > div { display: flex; align-items: center; justify-content: space-between; gap: 8px; }\n.dsa-config-protocol-scan-list article strong, .dsa-config-protocol-scan-list article span { font-size: 10px; }\n.dsa-config-protocol-scan-list article span { color: var(--dsw-alias-label-secondary); }\n.dsa-config-protocol-scan-list article small { display: block; margin-top: 3px; color: var(--dsw-alias-label-tertiary); font-size: 9px; line-height: 13px; overflow-wrap: anywhere; }\n.dsa-config-protocol-scan-list article.is-responses-preferred, .dsa-config-protocol-scan-list article.is-both { border-color: color-mix(in srgb, #22a06b 44%, var(--dsw-alias-border-inverted)); }\n.dsa-config-protocol-scan-list article.is-completions-only { border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 48%, var(--dsw-alias-border-inverted)); }\n.dsa-config-protocol-scan-list article.is-unsupported { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 42%, var(--dsw-alias-border-inverted)); }\n.dsa-config-catalog-note { margin: 0 0 10px; padding: 8px 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 24%, var(--dsw-alias-border-inverted)); border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, var(--dsw-alias-bg-layer-2)); color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dsa-config-key-validation { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--dsw-alias-border-inverted); font-size: 10.5px; }\n.dsa-config-key-validation strong { font-weight: 600; }\n.dsa-config-key-validation span { color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }\n.dsa-config-key-validation.is-valid strong { color: #22a06b; }\n.dsa-config-key-validation.is-invalid strong, .dsa-config-key-validation.is-blocked strong { color: var(--dsw-alias-state-error-primary); }\n.dsa-config-key-validation.is-unavailable strong { color: var(--dsw-alias-state-warn-primary, #d97706); }\n.dsa-config-key-validation.is-unknown strong { color: var(--dsw-alias-label-tertiary); }\n.dsa-config-batch-results { margin-bottom: 10px; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 11px; background: var(--dsw-alias-bg-layer-2); }\n.dsa-config-batch-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }\n.dsa-config-batch-heading > div { display: flex; flex-direction: column; gap: 2px; }\n.dsa-config-batch-heading strong { font-size: 12px; }\n.dsa-config-batch-heading span { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dsa-config-batch-heading button, .dsa-config-batch-list button, .dsa-config-reasoning-toolbar button { min-height: 27px; padding: 0 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10px; }\n.dsa-config-batch-list { display: flex; flex-direction: column; gap: 6px; }\n.dsa-config-batch-list article { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 9px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 8px; }\n.dsa-config-batch-list article > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dsa-config-batch-list article > div:last-child { align-items: flex-end; flex: none; }\n.dsa-config-batch-list article strong, .dsa-config-batch-list article > div:last-child > span { font-size: 10.5px; }\n.dsa-config-batch-list article span, .dsa-config-batch-list article small { color: var(--dsw-alias-label-tertiary); font-size: 9.5px; overflow-wrap: anywhere; }\n.dsa-config-batch-list article.is-valid { border-color: color-mix(in srgb, #22a06b 48%, var(--dsw-alias-border-inverted)); }\n.dsa-config-batch-list article.is-valid > div:last-child > span { color: #22a06b; }\n.dsa-config-batch-list article.is-invalid, .dsa-config-batch-list article.is-blocked, .dsa-config-batch-list article.is-missing { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 48%, var(--dsw-alias-border-inverted)); }\n.dsa-config-batch-list article.is-invalid > div:last-child > span, .dsa-config-batch-list article.is-blocked > div:last-child > span, .dsa-config-batch-list article.is-missing > div:last-child > span { color: var(--dsw-alias-state-error-primary); }\n.dsa-config-free-picker { margin-top: 10px; padding: 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 32%, var(--dsw-alias-border-inverted)); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, var(--dsw-alias-bg-layer-2)); }\n.dsa-config-free-picker-heading, .dsa-config-free-picker-toolbar, .dsa-config-free-picker-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }\n.dsa-config-free-picker-heading > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dsa-config-free-picker-heading strong { font-size: 12px; }\n.dsa-config-free-picker-heading span, .dsa-config-free-picker-footer span { color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 14px; }\n.dsa-config-free-picker button { min-height: 27px; padding: 0 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10px; }\n.dsa-config-free-picker button:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dsa-config-free-picker button:disabled { opacity: .5; cursor: default; }\n.dsa-config-free-picker-toolbar { justify-content: flex-start; flex-wrap: wrap; margin-top: 9px; }\n.dsa-config-free-picker-toolbar input { width: min(260px, 100%); height: 29px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; outline: 0; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; font: inherit; font-size: 10.5px; }\n.dsa-config-free-picker-toolbar input:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }\n.dsa-config-free-picker-list { display: flex; flex-direction: column; gap: 5px; max-height: 310px; overflow-y: auto; margin-top: 9px; padding-right: 2px; }\n.dsa-config-free-picker-list > label { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 7px 8px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); cursor: pointer; }\n.dsa-config-free-picker-list > label:hover { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 48%, var(--dsw-alias-border-inverted)); }\n.dsa-config-free-picker-list input { accent-color: var(--dsw-alias-brand-primary); }\n.dsa-config-free-picker-model, .dsa-config-free-picker-meta { display: flex; min-width: 0; }\n.dsa-config-free-picker-model { flex-direction: column; gap: 1px; }\n.dsa-config-free-picker-model strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10.5px; }\n.dsa-config-free-picker-model small, .dsa-config-free-picker-meta small { color: var(--dsw-alias-label-tertiary); font-size: 9px; }\n.dsa-config-free-picker-model small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dsa-config-free-picker-meta { align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 5px 8px; }\n.dsa-config-free-picker-meta em { padding: 1px 5px; border-radius: 999px; background: color-mix(in srgb, #22a06b 12%, transparent); color: #22a06b; font-size: 8.5px; font-style: normal; font-weight: 700; }\n.dsa-config-free-picker-footer { margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dsa-config-free-picker-footer button.dsa-media-primary { flex: none; border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); }\n.dsa-config-heading-actions { flex-wrap: wrap; justify-content: flex-end; }\n.dsa-config-model-search { width: 190px; height: 29px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; outline: 0; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 9px; font: inherit; font-size: 10.5px; }\n.dsa-config-model-search:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }\n.dsa-config-models { display: flex; flex-direction: column; gap: 9px; }\n.dsa-config-empty { min-height: 90px; display: grid; place-items: center; color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dsa-config-model { padding: 10px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 70%, transparent); }\n.dsa-config-model-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }\n.dsa-config-model-title { display: flex; align-items: center; gap: 7px; min-width: 0; }\n.dsa-config-model-title > strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }\n.dsa-config-model-title > small { flex: 0 0 auto; padding: 1px 6px; border: 1px solid color-mix(in srgb, #22a06b 38%, transparent); border-radius: 999px; background: color-mix(in srgb, #22a06b 12%, transparent); color: #22a06b; font-size: 9px; font-weight: 700; line-height: 15px; text-transform: uppercase; }\n.dsa-config-model-top button { min-height: 25px; color: var(--dsw-alias-state-error-primary); }\n.dsa-config-inputs { grid-column: span 2; min-width: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 9px; margin: 0; padding: 5px 8px 7px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; }\n.dsa-config-inputs legend { padding: 0 4px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dsa-config-inputs label { display: flex; align-items: center; gap: 4px; color: var(--dsw-alias-label-secondary); font-size: 10.5px; }\n.dsa-config-inputs input { accent-color: var(--dsw-alias-brand-primary); }\n.dsa-config-inputs small { color: var(--dsw-alias-label-dimmed); font-size: 9.5px; }\n.dsa-config-preset { grid-column: span 2; align-items: end; min-width: 0; }\n.dsa-config-preset .dsa-media-field { flex: 1; }\n.dsa-config-preset a { flex: none; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-brand-primary); font-size: 9.5px; text-decoration: none; }\n.dsa-config-preset > small { flex: none; max-width: 150px; color: var(--dsw-alias-label-tertiary); font-size: 9.5px; line-height: 13px; }\n.dsa-config-compat { margin-top: 8px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dsa-config-compat summary { padding-top: 8px; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10.5px; }\n.dsa-config-compat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); padding-top: 8px; }\n.dsa-config-compat p { margin: 8px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 10px; }\n.dsa-config-reasoning { margin-top: 8px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dsa-config-reasoning summary { padding-top: 8px; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10.5px; }\n.dsa-config-reasoning-toolbar { display: flex; align-items: end; gap: 8px; padding-top: 8px; }\n.dsa-config-reasoning-toolbar > label { width: 190px; flex: none; }\n.dsa-config-reasoning-toolbar small { color: var(--dsw-alias-label-tertiary); font-size: 9.5px; line-height: 14px; }\n.dsa-config-reasoning-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin-top: 8px; }\n.dsa-config-reasoning-grid > label { display: flex; flex-direction: column; gap: 4px; padding: 7px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 7px; }\n.dsa-config-reasoning-grid span { color: var(--dsw-alias-label-secondary); font-size: 10px; }\n.dsa-config-reasoning-grid input[type='text'], .dsa-config-reasoning-grid > label > input { width: 100%; min-width: 0; height: 27px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 7px; font: inherit; font-size: 10px; }\n@media (max-width: 680px) { .dsa-overlay { padding: 8px; } .dsa-dialog { width: 100%; height: min(680px, calc(100vh - 16px)); border-radius: 14px; } .dsa-body { grid-template-columns: 125px minmax(0, 1fr); } .dsa-providers { padding: 7px; } .dsa-result-description, .dsa-trigger kbd { display: none; } .dsa-footer { flex-wrap: wrap; } }\n@media (max-width: 760px) { .dsa-media-grid { grid-template-columns: 1fr; } .dsa-media-job-row { grid-template-columns: 1fr; } .dsa-media-job-actions { flex-wrap: wrap; } }\n@media (max-width: 760px) { .dsa-relay-route { grid-template-columns: 1fr; } .dsa-relay-route b { transform: rotate(90deg); text-align: center; } .dsa-relay-details > div { grid-template-columns: 1fr; gap: 4px; } .dsa-relay-details dd { align-items: stretch; flex-direction: column; } .dsa-relay-details code { white-space: normal; overflow-wrap: anywhere; } }\n@media (max-width: 820px) { .dsa-config-provider-grid, .dsa-config-model-grid, .dsa-config-compat-grid, .dsa-config-reasoning-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .dsa-config-span-2, .dsa-config-key-field, .dsa-config-protocol-note, .dsa-config-inputs, .dsa-config-preset { grid-column: span 2; } .dsa-config-toolbar, .dsa-config-card-heading, .dsa-config-status-row, .dsa-config-compat-warning, .dsa-config-batch-list article, .dsa-config-reasoning-toolbar, .dsa-config-free-picker-heading, .dsa-config-free-picker-footer, .dsa-config-protocol-scan-heading { align-items: stretch; flex-direction: column; } .dsa-config-toolbar-actions, .dsa-config-heading-actions, .dsa-config-provider-actions, .dsa-config-status-row > div, .dsa-config-protocol-scan-heading > div { justify-content: flex-start; margin-left: 0; flex-wrap: wrap; } .dsa-config-model-search, .dsa-config-reasoning-toolbar > label { width: min(100%, 260px); } .dsa-config-batch-list article > div:last-child { align-items: flex-start; } .dsa-config-free-picker-list > label { grid-template-columns: auto minmax(0, 1fr); } .dsa-config-free-picker-meta { grid-column: 2; justify-content: flex-start; } }\n\n/* ---- provider catalog cards + template gallery + free sync (v0.11) ---- */\n.dsa-config-provider-browser { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }\n.dsa-config-provider-browser-bar { display: flex; align-items: center; gap: 10px; }\n.dsa-config-provider-browser-bar input { flex: 1; min-width: 0; height: 32px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 9px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 10px; font: inherit; font-size: 12px; }\n.dsa-config-provider-browser-bar input:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -1px; }\n.dsa-config-provider-browser-bar span { flex: none; color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dsa-config-provider-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; max-height: 240px; overflow-y: auto; }\n.dsa-config-provider-card { display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 9px 11px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 11px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); cursor: pointer; text-align: left; font: inherit; }\n.dsa-config-provider-card:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-interactive-bg-hover); }\n.dsa-config-provider-card.is-active { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent); }\n.dsa-config-provider-card.is-blank { border-style: dashed; color: var(--dsw-alias-label-secondary); }\n.dsa-config-provider-card:disabled { opacity: 0.55; cursor: default; }\n.dsa-config-provider-card-icon { flex: none; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 9px; background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-brand-primary); font-size: 18px; font-weight: 700; }\n.dsa-config-provider-card-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }\n.dsa-config-provider-card-main strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }\n.dsa-config-provider-card-main small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dsa-config-provider-card-free { flex: none; padding: 1px 7px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-state-ok-primary, #2e9e5b) 16%, transparent); color: var(--dsw-alias-state-ok-primary, #2e9e5b); font-size: 9.5px; font-style: normal; font-weight: 600; }\n.dsa-config-template-dialog { width: min(880px, calc(100vw - 48px)); height: min(680px, calc(100vh - 64px)); }\n.dsa-config-template-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }\n.dsa-config-template-heading strong { font-size: 12.5px; }\n.dsa-config-template-heading span { display: block; margin-top: 2px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dsa-config-template-toolbar { display: flex; align-items: center; gap: 8px; }\n.dsa-config-template-toolbar input { width: min(240px, 100%); height: 30px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 9px; font: inherit; font-size: 11.5px; }\n.dsa-config-template-group h4 { margin: 2px 0 6px; color: var(--dsw-alias-label-secondary); font-size: 11px; font-weight: 600; }\n.dsa-config-template-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }\n.dsa-config-freesync-state { flex: none; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n@media (max-width: 820px) { .dsa-config-provider-cards, .dsa-config-template-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }\n\n/* ---- effort slider (Codex-style) + import picker polish (v0.12) ---- */\n.dsa-footer { flex-wrap: wrap; row-gap: 8px; }\n.dsa-effort-select { flex: 1 1 250px; min-width: 250px; max-width: 430px; display: flex; flex-direction: column; gap: 4px; padding: 6px 10px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 72%, transparent); }\n.dsa-effort-select-label { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dsa-effort-select select { width: 100%; height: 26px; padding: 0 28px 0 8px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 8px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font-size: 12px; cursor: pointer; appearance: none; -webkit-appearance: none; background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M3 4.5l3 3 3-3z'/%3E%3C/svg%3E\"); background-repeat: no-repeat; background-position: right 8px center; transition: border-color .12s ease, box-shadow .12s ease; }\n.dsa-effort-select select:focus-visible { outline: none; border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 25%, transparent); }\n.dsa-effort-select select:disabled { opacity: .5; cursor: default; }\n.dsa-effort-select.is-busy { opacity: .6; pointer-events: none; }\n.dsa-config-import-picker .dsa-config-free-picker-list { max-height: 300px; }\n.dsa-config-import-picker .dsa-config-free-picker-list label { cursor: pointer; transition: background .1s ease; }\n.dsa-config-import-picker .dsa-config-free-picker-list label:hover { background: var(--dsw-alias-interactive-bg-hover); }\n\n\n.dsa-config-template-dialog-body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; padding: 0 22px 20px; }\n.dsa-config-template-dialog .dsa-config-template-toolbar input { width: min(320px, 100%); height: 34px; }\n.dsa-config-template-dialog .dsa-config-template-group h4 { margin: 4px 0 6px; padding-top: 2px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dsa-config-template-dialog .dsa-config-provider-card { background: var(--dsw-alias-bg-layer-1); }\n\n\n.dsa-effort-select select option, .dsa-effort-select option { background-color: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); }\n/* seat: two independent pills — model trigger + effort switch (v0.16) */\n.dsa-launcher { display: inline-flex; align-items: center; gap: 8px; min-width: 0; background: transparent; border: 0; padding: 0; }\n.dsa-launcher .dsa-trigger { height: 28px; border: 1px solid transparent; border-radius: 14px; }\n.dsa-launcher .dsa-trigger:hover:not(:disabled) { border-color: var(--dsw-alias-border-inverted); }\n.dsa-effort-select.is-compact { position: relative; flex: 0 0 auto; min-width: 0; padding: 0; border: 0; border-radius: 14px; background: transparent; }\n.dsa-effort-button { display: inline-flex; align-items: center; height: 28px; max-width: 170px; padding: 0 10px; border: 1px solid transparent; border-radius: 14px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; overflow: hidden; transition: width 0.18s ease; }\n.dsa-effort-inner { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }\n.dsa-effort-button:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); border-color: var(--dsw-alias-border-inverted); color: var(--dsw-alias-label-primary); }\n.dsa-effort-button:focus-visible { outline: 2px solid var(--dsw-alias-border-l2); outline-offset: 1px; }\n.dsa-effort-button:disabled { opacity: .5; cursor: default; }\n.dsa-effort-bolt { flex: none; color: var(--dsw-alias-brand-primary); font-size: 11px; }\n.dsa-effort-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dsa-effort-caret { flex: none; color: var(--dsw-alias-label-tertiary); font-size: 10px; }\n.dsa-effort-select.is-open .dsa-effort-caret { color: var(--dsw-alias-brand-primary); }\n.dsa-effort-menu { position: absolute; right: 0; bottom: calc(100% + 8px); z-index: 60; min-width: 190px; max-height: 320px; overflow-y: auto; margin: 0; padding: 6px; list-style: none; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); box-shadow: 0 12px 32px rgba(0, 0, 0, .45); }\n.dsa-effort-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 9px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12.5px; text-align: left; cursor: pointer; }\n.dsa-effort-item:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dsa-effort-item.is-active { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent); color: var(--dsw-alias-label-primary); font-weight: 600; }\n.dsa-effort-check { margin-left: auto; color: var(--dsw-alias-brand-primary); font-weight: 700; }\n.dsa-effort-select.is-compact .dsa-effort-select-value { flex: none; max-width: 66px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-brand-primary); font-size: 11px; font-weight: 700; }\n.dsa-effort-select.is-compact select { width: auto; min-width: 0; max-width: 120px; height: 28px; padding: 0 18px 0 2px; border: 0; border-radius: 10px; background-color: transparent; background-position: right 2px center; font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-secondary); text-overflow: ellipsis; }\n.dsa-effort-select.is-compact:hover select { color: var(--dsw-alias-label-primary); }\n.dsa-effort-select.is-compact select:focus-visible { outline: 2px solid var(--dsw-alias-border-l2); outline-offset: 1px; border-color: transparent; box-shadow: none; }\n@media (prefers-reduced-motion: reduce) { .dsa-effort-select select { transition: none; } }\n.dsa-effort-select.is-compact.is-busy { opacity: .6; pointer-events: none; }\n.dsa-config-provider-card.is-add { border-style: dashed; border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, var(--dsw-alias-border-l2)); justify-content: center; }\n.dsa-config-provider-card.is-add:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); }\n.dsa-config-provider-card.is-add .dsa-config-provider-card-icon { background: transparent; color: var(--dsw-alias-brand-primary); font-size: 20px; font-weight: 700; }\n\n/* catalog page + provider group label (v0.12.2) */\n.dsa-provider-group-label { padding: 7px 8px 2px; color: var(--dsw-alias-label-tertiary); font-size: 10px; letter-spacing: .04em; }\n.dsa-config-catalog .dsa-config-template-toolbar { margin-bottom: 10px; }\n.dsa-config-catalog .dsa-config-template-toolbar input { width: min(360px, 100%); height: 36px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 11px; font: inherit; font-size: 12.5px; }\n.dsa-config-catalog .dsa-config-template-group h4 { margin: 4px 0 6px; padding-top: 8px; border-top: 1px solid var(--dsw-alias-border-inverted); color: var(--dsw-alias-label-secondary); font-size: 11.5px; }\n\n/* ---- v0.13.0 usability: folds, badges, save bar, welcome ---- */\n.dsa-key-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-alias-label-dimmed, #9aa3ad); }\n.dsa-key-dot.is-configured { background: #2e9e5b; }\n.dsa-key-dot.is-missing { background: #d64545; }\n.dsa-key-dot.is-unknown { background: var(--dsw-alias-label-dimmed, #9aa3ad); }\n.dsa-config-model-body > summary { display: inline-flex; align-items: center; cursor: pointer; list-style: none; padding: 2px 0; color: var(--dsw-alias-brand-primary); font-size: 10px; }\n.dsa-config-model-body > summary::before { content: '▸'; margin-right: 5px; transition: transform .12s ease; }\n.dsa-config-model-body[open] > summary::before { transform: rotate(90deg); }\n.dsa-config-model-body > summary::after { content: ''; }\n.dsa-config-model-badges { display: inline-flex; align-items: center; gap: 4px; margin-left: 6px; }\n.dsa-config-model-badges em { flex: none; padding: 0 5px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-tertiary); font-size: 8.5px; font-style: normal; line-height: 14px; }\n.dsa-config-model-badges em.is-free { border-color: transparent; background: color-mix(in srgb, #2e9e5b 16%, transparent); color: #2e9e5b; font-weight: 700; }\n.dsa-config-model-badges em.is-preset { color: var(--dsw-alias-brand-primary); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, transparent); }\n.dsa-config-model-top code { margin-left: 6px; overflow: hidden; max-width: 260px; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-tertiary); font-size: 9.5px; }\n.dsa-config-show-all { display: block; width: 100%; margin-top: 8px; padding: 7px; border: 1px dashed var(--dsw-alias-border-l2); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 11px; }\n.dsa-config-show-all:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dsa-config-savebar { position: sticky; bottom: 10px; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; padding: 9px 13px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, var(--dsw-alias-border-inverted)); border-radius: 11px; background: var(--dsw-alias-bg-layer-2); box-shadow: 0 8px 28px rgb(0 0 0 / 22%); }\n.dsa-config-savebar > span { color: var(--dsw-alias-state-warn-primary, #d99a2b); font-size: 11.5px; font-weight: 600; }\n.dsa-config-savebar > div { display: flex; gap: 8px; }\n.dsa-config-welcome { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; margin-bottom: 12px; padding: 18px; border: 1px dashed color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, var(--dsw-alias-border-inverted)); border-radius: 13px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, transparent); }\n.dsa-config-welcome strong { font-size: 14px; }\n.dsa-config-welcome span { color: var(--dsw-alias-label-secondary); font-size: 12px; }\n.dsa-config-fold > summary { display: flex; align-items: center; gap: 10px; cursor: pointer; list-style: none; padding: 2px 0; }\n.dsa-config-fold > summary::-webkit-details-marker { display: none; }\n.dsa-config-fold > summary::before { content: '▸'; color: var(--dsw-alias-label-tertiary); transition: transform .12s ease; }\n.dsa-config-fold[open] > summary::before { transform: rotate(90deg); }\n.dsa-config-fold-title { flex: 1; font-size: 13px; font-weight: 700; color: var(--dsw-alias-label-primary); }\n.dsa-config-fold-state { flex: none; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dsa-config-fold-hint { margin: 6px 0 8px; color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dsa-config-fold .dsa-config-provider-grid { padding-top: 4px; }\n.dsa-result-badges { display: inline-flex; align-items: center; gap: 3px; margin-left: 6px; }\n.dsa-result-badges em { flex: none; padding: 0 4px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-tertiary); font-size: 8px; font-style: normal; line-height: 12px; }\n.dsa-result-badges em.is-free { border-color: transparent; background: color-mix(in srgb, #2e9e5b 16%, transparent); color: #2e9e5b; font-weight: 700; }\n\n/* ---- v0.14.0 beautification: brand tiles, rail icons, scrollbars, motion ---- */\n.dsa-rail-icon { flex: none; display: inline-grid; place-items: center; width: 16px; }\n.dsa-providers button { transition: background .12s ease, color .12s ease; }\n.dsa-providers button.is-active { background: var(--dsw-alias-interactive-bg-hover); }\n.dsa-providers button.is-active span:first-of-type { color: var(--dsw-alias-label-primary); font-weight: 600; }\n.dsa-config-provider-card-icon { transition: transform .14s ease; }\n.dsa-config-provider-card:hover:not(:disabled) .dsa-config-provider-card-icon { transform: scale(1.06); }\n.dsa-config-provider-card { transition: border-color .12s ease, background .12s ease, transform .12s ease, box-shadow .12s ease; }\n.dsa-config-provider-card:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 16px rgb(0 0 0 / 10%); }\n.dsa-config-model-body > summary:hover { background: var(--dsw-alias-interactive-bg-hover); border-radius: 6px; padding: 2px 6px; margin: 0 -6px; }\n.dsa-dialog *:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; border-radius: 4px; }\n.dsa-dialog ::-webkit-scrollbar { width: 10px; height: 10px; }\n.dsa-dialog ::-webkit-scrollbar-track { background: transparent; }\n.dsa-dialog ::-webkit-scrollbar-thumb { border-radius: 6px; border: 3px solid transparent; background-clip: content-box; background-color: color-mix(in srgb, var(--dsw-alias-label-tertiary) 45%, transparent); }\n.dsa-dialog ::-webkit-scrollbar-thumb:hover { background-color: color-mix(in srgb, var(--dsw-alias-label-secondary) 65%, transparent); }\n.dsa-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 34px 16px; color: var(--dsw-alias-label-tertiary); text-align: center; }\n.dsa-empty::before { content: '⌕'; font-size: 30px; line-height: 1; opacity: .45; }\n.dsa-current { display: flex; align-items: center; gap: 6px; min-width: 0; }\n";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"dsa-preset/style.css\"]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsa-preset";
			tag.dataset.pluginCss = "dsa-preset/style.css";
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/index.tsx
		const inject = [
			"locale",
			"sessions",
			"slots",
			"modelDirectories",
			"connection",
			"remote",
			"remote.settings",
			"remote.credentials",
			"remote.llm",
			"remote.session"
		];
		function apply(ctx) {
			const connection = ctx.get("connection");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsa-preset: dictionaries");
			ctx.inject([
				"slots",
				"modelDirectories",
				"sessions"
			], (scope) => {
				scope.slots.inject("conversation.input.model", () => scope.slots.register({
					name: "conversation.input.model",
					locale: NS,
					priority: -2,
					registrant: "dsa-preset",
					inject: (sessionId) => {
						const directory = scope.modelDirectories.directoryFor(sessionId);
						const available = scope.sessions.subagentAddress(sessionId) === void 0;
						return {
							available,
							directory: directory.store,
							load: () => {
								if (available) directory.load().catch((error) => {
									console.error("[dsa-preset] model directory load failed", error);
								});
							},
							select: async (selection) => {
								if (!available) return void 0;
								try {
									return await directory.select(selection);
								} catch (error) {
									console.error("[dsa-preset] model selection failed", error);
									return;
								}
							},
							api: paletteApi(ctx.remote),
							isLoopback: connection.isLoopback
						};
					}
				}, ModelPalette), "dsa-preset: composer model seat");
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
