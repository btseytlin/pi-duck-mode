import { CustomEditor, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Box, Editor, Text } from "@earendil-works/pi-tui";

const REPLY = "Great, go ahead and make it!";
const ENTRY_TYPE = "duck";

type DuckEntry = { user: string; reply: string };

export default function (pi: ExtensionAPI) {
	pi.registerEntryRenderer(ENTRY_TYPE, (entry, _options, theme) => {
		const { user, reply } = entry.data as DuckEntry;
		const box = new Box(1, 1, (text) => theme.bg("customMessageBg", text));
		box.addChild(new Text(`${theme.fg("dim", "you")}  ${user}`));
		box.addChild(new Text(`${theme.fg("accent", "duck")} ${reply}`));
		return box;
	});

	// Safety net. The editor below already swallows every submit.
	pi.on("input", async () => ({ action: "handled" }));

	pi.on("session_start", (_event, ctx) => {
		pi.setActiveTools([]);

		ctx.ui.setEditorComponent((tui, theme, keybindings) => {
			const editor = new CustomEditor(tui, theme, keybindings);

			// Pi assigns its own onSubmit (built-in commands, agent prompt). Ignore it.
			Object.defineProperty(editor, "onSubmit", {
				set: () => {},
				get: () => (text: string) => {
					const user = text.trim();
					if (!user) return;
					editor.setText("");
					pi.appendEntry(ENTRY_TYPE, { user, reply: REPLY } satisfies DuckEntry);
				},
			});

			// No slash-command suggestions.
			editor.setAutocompleteProvider = () => {};

			// Skip the app keybinding layer (model, thinking, tree, ...). Keep plain text editing.
			editor.handleInput = (data: string) => {
				if (data === "\x03" || data === "\x04") {
					ctx.shutdown();
					return;
				}
				Editor.prototype.handleInput.call(editor, data);
			};

			return editor;
		});
	});
}
