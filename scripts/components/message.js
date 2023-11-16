import { messages, users } from "../cache.js";
import { token } from "../index.js";

class Message extends HTMLElement {
  static get observedAttributes() {
    return ["author", "message"];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });

    const replyContainer = document.createElement("div");
    replyContainer.id = "replies";

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
      div.author, div.content {
        margin: 0;
      }
        
      attachment-renderer {
        margin: 0 4px;
      }
        
      div.author span {
       font-weight: 600;
      }
      p {
       font-size: initial;
      }
      a {
        color: var(--accent);
      }
      pre, code {
        white-space: pre-wrap;
        white-space: -moz-pre-wrap;
        white-space: -pre-wrap;
        white-space: -o-pre-wrap;
        word-wrap: break-word;
        font-family: var(--font-mono);
      }

      p.blocked {
        color: red !important;
      }
    `;

    shadow.appendChild(replyContainer);
    shadow.appendChild(authorContainer);
    shadow.appendChild(contentsBox);
    shadow.appendChild(style);
  }

  async connectedCallback() {
    await UpdateContent(this);
  }
}

const { Marked } = globalThis.marked;

const markdownParser = new Marked({
  breaks: true,
});

/** @param {HTMLElement} element */
async function UpdateContent(element) {
  const shadowDOM = element.shadowRoot;

  /** @type {HTMLSpanElement} */
  const authorElement = shadowDOM.querySelector("div.author span");
  /** @type {HTMLDivElement} */
  const messageContainer = shadowDOM.querySelector("div.content");
  /** @type {HTMLDivElement} */
  const replyContainer = shadowDOM.querySelector("div#replies");

  const authorToFetch = element.getAttribute("author");
  const messageToFetch = element.getAttribute("message");

  // fetch author from either cache or by fetching them

  const author =
    users.get(authorToFetch) ??
    (await fetch(`https://api.revolt.chat/users/${authorToFetch}`, {
      headers: [["x-session-token", token]],
    }).then(async (res) => await res.json()));

  const message = messages.get(messageToFetch);

  if (message.replies) {
    for (const id of message.replies) {
      const replytxt = document.createElement("p");
      const reply = messages.get(id);
      if (!reply) {
        replytxt.innerText = "↱ unknown message";
        replytxt.class = "unknown";
      } else {
        const replyAuthor = users.get(reply.author);
        replytxt.innerText = `↱ ${replyAuthor?.username ?? "unknown"}: ${
          reply.content && reply.attachments > 0
            ? `${reply.attachments.length} attachments`
            : reply.content ?? "no content"
        }`;
      }

      replyContainer.appendChild(replytxt);
    }
  }

  console.log("debug: author", author);

  console.log("debug: relationship with", author.username, author.relationship);

  switch (author.relationship) {
    case "Blocked":
    case "BlockedOther":
      authorElement.remove();
      messageContainer.innerHTML = `<p class="blocked">Blocked Message</p>`;
      console.log("blocked :)");
      break;
    default:
      authorElement.textContent = `@${author.username}#${author.discriminator}`;
      if (message.content) {
        messageContainer.innerHTML = DOMPurify.sanitize(
          markdownParser.parse(message.content),
        );
      } else {
        messageContainer.replaceChildren();
      }

      if (message.attachments) {
        const stringified = message.attachments
          .map((el) => JSON.stringify(el))
          .join("$");
        const attachmentDisplay = document.createElement("attachment-renderer");
        attachmentDisplay.setAttribute("elements", stringified);

        shadowDOM.append(attachmentDisplay);
      }
  }
}

export { Message };
