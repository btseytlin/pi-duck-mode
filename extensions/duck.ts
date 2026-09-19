import { CustomEditor, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createAssistantMessageEventStream, type AssistantMessage } from "@earendil-works/pi-ai";
import { Editor, matchesKey } from "@earendil-works/pi-tui";

const REPLY = "Great, go ahead and make it!";
const PROVIDER = "duck";

const blank = { render: () => [], invalidate: () => {} };

export default function (pi: ExtensionAPI) {
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

	pi.on("session_start", (_event, ctx) => {
		pi.setActiveTools([]);
		ctx.ui.setHeader(() => blank);
		ctx.ui.setFooter(() => blank);

		ctx.ui.setEditorComponent((tui, theme, keybindings) => {
			const editor = new CustomEditor(tui, theme, keybindings);

			// Pi assigns its own onSubmit (built-in commands, agent prompt). Ignore it.
			Object.defineProperty(editor, "onSubmit", {
				set: () => {},
				get: () => (text: string) => {
					const user = text.trim();
					if (!user) return;
					editor.setText("");
					if (user === "/exit") {
						ctx.shutdown();
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
	});
}
