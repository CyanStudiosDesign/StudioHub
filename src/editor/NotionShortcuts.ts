import { Extension } from "@tiptap/core";

export const NotionShortcuts = Extension.create({
  name: "notionShortcuts",

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.insertContent("    "),
      Space: () => {
        const { selection } = this.editor.state;
        if (!selection.empty || !selection.$from.parent.isTextblock) return false;

        const { $from } = selection;
        const textBeforeCursor = $from.parent.textBetween(0, $from.parentOffset);

        if (textBeforeCursor === "[]") {
          return this.editor
            .chain()
            .deleteRange({ from: $from.pos - 2, to: $from.pos })
            .toggleTaskList()
            .run();
        }

        if (textBeforeCursor === ">") {
          return this.editor
            .chain()
            .deleteRange({ from: $from.pos - 1, to: $from.pos })
            .setDetails()
            .run();
        }

        if (textBeforeCursor === '"') {
          return this.editor
            .chain()
            .deleteRange({ from: $from.pos - 1, to: $from.pos })
            .toggleBlockquote()
            .run();
        }

        return false;
      },
      "Mod-Alt-0": () => this.editor.commands.setParagraph(),
      "Mod-Alt-1": () => this.editor.commands.toggleHeading({ level: 1 }),
      "Mod-Alt-2": () => this.editor.commands.toggleHeading({ level: 2 }),
      "Mod-Alt-3": () => this.editor.commands.toggleHeading({ level: 3 }),
      "Mod-Alt-4": () => this.editor.commands.toggleTaskList(),
      "Mod-Alt-5": () => this.editor.commands.toggleBulletList(),
      "Mod-Alt-6": () => this.editor.commands.toggleOrderedList(),
      "Mod-Alt-7": () => this.editor.commands.setDetails(),
      "Mod-Alt-8": () => this.editor.commands.toggleCodeBlock(),
    };
  },
});
