import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

export const RequiredTitle = Extension.create({
  name: "requiredTitle",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (_transactions, _oldState, newState) => {
          const heading = newState.schema.nodes.heading;
          const firstNode = newState.doc.firstChild;

          if (firstNode?.type === heading && firstNode.attrs.level === 1) {
            return null;
          }

          const transaction = newState.tr;
          if (firstNode?.type === heading) {
            transaction.setNodeMarkup(0, heading, {
              ...firstNode.attrs,
              level: 1,
            });
          } else {
            transaction.insert(0, heading.create({ level: 1 }));
          }

          return transaction;
        },
      }),
    ];
  },
});
