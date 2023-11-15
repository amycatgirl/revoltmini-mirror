import { messages, users } from "../cache.js";
import { token } from "../index.js";

class Message extends HTMLElement {
  static get observedAttributes() {
    return ["author", "message"];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });

    const authorContainer = document.createElement("div");
    const authorText = document.createElement("span");

    authorText.innerText = "loading...";
    authorContainer.classList.add("author");
    authorContainer.appendChild(authorText);

    const contentsBox = document.createElement("div");
    contentsBox.classList.add("content");

    contentsBox.innerText = "loading";

    const style = document.createElement("style");
    const prism = document.createElement("link");

    prism.href =
      "https://unpkg.com/prismjs@1.29.0/themes/prism-okaidia.min.css";
    prism.rel = "stylesheet";

    style.innerText = `
      p {
       font-size: initial;
      }
      a {
        color: var(--accent);
      }
      pre, code {
        background: #000;
        font-family: var(--font-mono);
      }
    `;

    shadow.appendChild(authorContainer);
    shadow.appendChild(contentsBox);
    shadow.appendChild(style);
    shadow.appendChild(prism);
  }

  async connectedCallback() {
    await UpdateContent(this);
  }
}

// Prism highlighting
const { markedHighlight } = globalThis.markedHighlight;
const { Marked } = globalThis.marked;

Prism.plugins.autoloader.languages_path =
  "https://cdn.jsdelivr.net/npm/prismjs/components/";
Prism.plugins.autoloader.loadLanguages([
  "js",
  "ts",
  "jsx",
  "tsx",
  "cobol",
  "applescript",
  "java",
  "kotlin",
  "csharp",
  "c",
  "cpp",
  "json",
]);
const markdownParser = new Marked(
  markedHighlight({
    lang_prefix: "language-",
    highlight(code, lang) {
      return Prism.highlight(code, Prism.languages[lang], lang);
    },
  }),
);

/** @param {HTMLElement} element */
async function UpdateContent(element) {
  const shadowDOM = element.shadowRoot;

  /** @type {HTMLSpanElement} */
  const authorElement = shadowDOM.querySelector("div.author span");
  /** @type {HTMLDivElement} */
  const messageContainer = shadowDOM.querySelector("div.content");

  const authorToFetch = element.getAttribute("author");
  const messageToFetch = element.getAttribute("message");

  // fetch author from either cache or by fetching them

  const author =
    users.get(authorToFetch) ??
    (await fetch(`https://api.revolt.chat/users/${authorToFetch}`, {
      headers: [["x-session-token", token]],
    }).then(async (res) => await res.json()));

  const message = messages.get(messageToFetch);

  authorElement.textContent = `@${author.username}#${author.discriminator}`;
  if (message.content)
    messageContainer.innerHTML = DOMPurify.sanitize(
      markdownParser.parse(message.content),
    );

  if (message.attachments) {
    const stringified = message.attachments
      .map((el) => JSON.stringify(el))
      .join("$");
    const attachmentDisplay = document.createElement("attachment-renderer");
    attachmentDisplay.setAttribute("elements", stringified);

    shadowDOM.append(attachmentDisplay);
  }
}

export { Message };
