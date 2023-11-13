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

    style.innerText = `
      p {
       font-size: initial;
      }
    `;

    shadow.appendChild(authorContainer);
    shadow.appendChild(contentsBox);
    shadow.appendChild(style);
  }

  async connectedCallback() {
    await UpdateContent(this);
  }
}

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
      marked.parse(message.content),
    );
}

export { Message };
