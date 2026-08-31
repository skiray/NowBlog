/**
 * Rehype plugin: turn ```mermaid fenced blocks into <div class="mermaid">.
 *
 * This plugin runs after Shiki, which rewrites the fence into
 *   <pre class="astro-code" data-language="mermaid"><code><span>…</span></code></pre>
 * — note the language lives on the <pre> and the <code> carries no
 * `language-*` class. The raw fence form
 *   <pre><code class="language-mermaid">…</code></pre>
 * is still detected in case plugin order ever changes.
 *
 * Collecting text nodes recursively pulls the source back out of either shape.
 *
 * The container is marked `data-pagefind-ignore` so diagram source
 * ("PMS", "FLINK", "subgraph"…) does not pollute the search index.
 */

const MERMAID_LANG = "language-mermaid";

/** Recursively concatenate every text node under `node`. */
function textOf(node) {
  if (!node) return "";
  if (node.type === "text") return node.value;
  if (!Array.isArray(node.children)) return "";
  return node.children.map(textOf).join("");
}

/** hast stores `class` as a `className` array (or a bare string). */
function classesOf(node) {
  const raw = node?.properties?.className;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

/** True when this <pre> came from a ```mermaid fence. */
function isMermaidBlock(node) {
  const props = node.properties ?? {};
  // Shiki puts the language on the <pre>; hast exposes it as `dataLanguage`,
  // but be lenient and accept the dashed key too.
  const lang = props.dataLanguage ?? props["data-language"];
  if (typeof lang === "string" && lang.toLowerCase() === "mermaid") {
    return true;
  }

  const code = node.children?.find(
    (c) => c.type === "element" && c.tagName === "code"
  );
  return classesOf(code).includes(MERMAID_LANG);
}

export default function rehypeMermaid() {
  return function transformer(tree) {
    const walk = (node) => {
      if (!Array.isArray(node?.children)) return;

      node.children = node.children.map((child) => {
        if (child.type !== "element" || child.tagName !== "pre") {
          walk(child);
          return child;
        }

        const code = child.children?.find(
          (c) => c.type === "element" && c.tagName === "code"
        );
        if (!code || !isMermaidBlock(child)) {
          walk(child);
          return child;
        }

        return {
          type: "element",
          tagName: "div",
          properties: {
            className: ["mermaid"],
            "data-pagefind-ignore": "all",
          },
          children: [{ type: "text", value: textOf(code) }],
        };
      });
    };

    walk(tree);
    return tree;
  };
}
