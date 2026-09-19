import { CustomEditor, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { createAssistantMessageEventStream, type AssistantMessage } from "@earendil-works/pi-ai";
import { Editor, matchesKey } from "@earendil-works/pi-tui";

const REPLY = "Great, go ahead and make it!";
const PROVIDER = "duck";

const DUCK = [
	"    __",
	"___( o)>",
	"\\ <_. )",
	" `---'",
];

const blank = { render: () => [], invalidate: () => {} };

export default function (pi: ExtensionAPI) {
	let active = false;
	// Undefined when pi was started with DUCK_MODE=1, so there is no normal mode to return to.
	let saved: { model: any; thinking: any; tools: string[]; editor: any } | undefined;

	const registerDuckProvider = () =>
		pi.registerProvider(PROVIDER, {
			baseUrl: "http://duck.invalid",
			apiKey: "duck",
			api: "duck-api",
			models: [
				{
					id: "duck",
					name: "duck",
					reasoning: false,
					input: ["text"],
					cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
					contextWindow: 1000,
					maxTokens: 1000,
				},
			],
			streamSimple: (model) => {
				const stream = createAssistantMessageEventStream();
				const output: AssistantMessage = {
					role: "assistant",
					content: [],
					api: model.api,
					provider: model.provider,
					model: model.id,
					usage: {
						input: 0,
						output: 0,
						cacheRead: 0,
						cacheWrite: 0,
						totalTokens: 0,
						cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
					},
					stopReason: "pending",
					timestamp: Date.now(),
				};
				stream.push({ type: "start", partial: output });
				output.content.push({ type: "text", text: "" });
				stream.push({ type: "text_start", contentIndex: 0, partial: output });
				output.content[0] = { type: "text", text: REPLY };
				stream.push({ type: "text_delta", contentIndex: 0, delta: REPLY, partial: output });
				stream.push({ type: "text_end", contentIndex: 0, content: REPLY, partial: output });
				output.stopReason = "stop";
				stream.push({ type: "done", reason: "stop", message: output });
				stream.end();
				return stream;
			},
		});

	// The footer is only blanked in a ./duck session. In a toggled session another extension may own it, and pi cannot hand it back.
	const applyUi = (ctx: ExtensionContext) => {
		ctx.ui.setHeader((_tui, theme) => ({
			render: () => ["", ...DUCK.map((line) => "  " + theme.fg("warning", line)), ""],
			invalidate: () => {},
		}));
		if (process.env.DUCK_MODE === "1") ctx.ui.setFooter(() => blank);

		ctx.ui.setEditorComponent((tui, theme, keybindings) => {
			const editor = new CustomEditor(tui, theme, keybindings);

			// Pi assigns its own onSubmit (built-in commands, agent prompt). Ignore it.
			Object.defineProperty(editor, "onSubmit", {
				set: () => {},
				get: () => (text: string) => {
					const user = text.trim();
					if (!user) return;
					editor.setText("");
					if (user === "/exit" || user === "/quit") {
						ctx.shutdown();
						return;
					}
					if (user === "/duck") {
						void toggle(ctx);
						return;
					}
					pi.sendUserMessage(user);
				},
			});

			// No slash-command suggestions.
			editor.setAutocompleteProvider = () => {};

			// Skip the app keybinding layer (model, thinking, tree, ...). Keep plain text editing.
			editor.handleInput = (data: string) => {
				if (matchesKey(data, "ctrl+c") || matchesKey(data, "ctrl+d")) {
					ctx.shutdown();
					return;
				}
				Editor.prototype.handleInput.call(editor, data);
			};

			return editor;
		});
	};

	const enable = async (ctx: ExtensionContext) => {
		saved = {
			model: ctx.model,
			thinking: pi.getThinkingLevel(),
			tools: pi.getActiveTools(),
			editor: ctx.ui.getEditorComponent(),
		};
		registerDuckProvider();
		const model = ctx.modelRegistry.find(PROVIDER, PROVIDER);
		if (!model) throw new Error("duck model missing after registration");
		if (!(await pi.setModel(model))) throw new Error("duck model rejected by pi");
		pi.setActiveTools([]);
		applyUi(ctx);
		active = true;
	};

	const disable = async (ctx: ExtensionContext) => {
		if (!saved) {
			ctx.ui.notify("This session started in duck mode. Use /quit to leave.", "warning");
			return;
		}
		const { model, thinking, tools, editor } = saved;
		if (model && !(await pi.setModel(model))) throw new Error("could not restore the previous model");
		pi.setThinkingLevel(thinking);
		pi.setActiveTools(tools);
		ctx.ui.setHeader(undefined);
		ctx.ui.setEditorComponent(editor);
		pi.unregisterProvider(PROVIDER);
		saved = undefined;
		active = false;
	};

	const toggle = (ctx: ExtensionContext) => (active ? disable(ctx) : enable(ctx));

	pi.registerCommand("duck", {
		description: "Toggle duck mode",
		handler: async (_args, ctx) => {
			await toggle(ctx);
		},
	});

	if (process.env.DUCK_MODE === "1") registerDuckProvider();

	pi.on("session_start", async (_event, ctx) => {
		if (process.env.DUCK_MODE === "1" && !active) {
			pi.setActiveTools([]);
			applyUi(ctx);
			active = true;
		} else if (active) {
			applyUi(ctx);
		}
	});
}
