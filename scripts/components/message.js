import { messages, users } from "../cache.js";
import { token } from "../index.js";
import { replies, setReplies } from "../app.js";
import { getRoleColour } from "../utils.js";

class Message extends HTMLElement {
  /** @type {number} */
  holdTimer;

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
        user-select: none;
        -webkit-user-select: none;
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

      pre {
        box-shadow: 0 0px 0px 2px color-mix(in srgb, var(--secondary-bg) 50%, black 20%);
        width: 50%;
      }

      pre, code {
        padding: .4rem;
        border-radius: 5px;
        background-color: var(--secondary-bg);
        white-space: pre-wrap; 
        word-wrap: break-word;
        line-height: 2;
        font-family: var(--font-mono);
      }

      p.blocked {
        color: red !important;
      }

      .noselect {
        user-select: none;
        -webkit-user-select: none;
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
  /** @type {string} */
  const messageID = element.getAttribute("message");

  element.addEventListener(
    "touchstart",
    (ev) => {
      element.holdTimer = setTimeout(() => {
        console.log("reply!", replies);
        if (replies.length >= 5) {
          console.log("debug: owo i am owerflowowing ");
        } else if (
          Array.from(replies.values()).find((el) => el.id === messageID)
        ) {
          console.log("debug: removing");
          element.style.boxShadow = "";
          // find element
          setReplies(replies.filter((el) => el.id !== messageID));
          console.log(replies);
        } else {
          console.log("debug: adding");
          element.style.boxShadow = "0 0 0 2px var(--accent)";
          replies.push({ id: messageID, mention: false });
        }
      }, 1500);
      console.log("debug: start");
    },
    { passive: true },
  );

  element.addEventListener("touchmove", () => {
    clearTimeout(element.holdTimer);
    console.log("debug: moved");
  });

  element.addEventListener("touchend", () => {
    clearTimeout(element.holdTimer);
    console.log("debug: end");
  });

  element.addEventListener("contextmenu", (ev) => ev.preventDefault());

  const authorToFetch = element.getAttribute("author");
  const messageToFetch = messageID;

  // fetch author from either cache or by fetching them

  const message = messages.get(messageToFetch);
  
  const author = message.masquerade ?
    message.masquerade.name :
    users.get(authorToFetch) ??
    (await fetch(`https://api.revolt.chat/users/${authorToFetch}`, {
      headers: [["x-session-token", token]],
    }).then(async (res) => await res.json()));

  const roleColour = getRoleColour(messageToFetch);

  if (roleColour) {
    const style = shadowDOM.querySelector("style");

    style.innerText = style.innerText + `
        \n
        div.author span {
          background: ${roleColour};
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }
      `
  }

  if (message.replies) {
    for (const id of message.replies.reverse()) {
      const replytxt = document.createElement("p");
      replytxt.classList.add("noselect");
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
      if (message.masquerade) {
        authorElement.textContent = `@${author} (masquerade)`;
      } else {
        authorElement.textContent = `@${author.username}#${author.discriminator}`;
      }
      
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
