import {LitElement, html, css, nothing} from "lit";
import {Marked} from "marked";
import DOMPurify from "dompurify";
import {messages, users} from "../../cache";
import {replies, setReplies} from "../../app";
import { getRoleColour } from "../../utils";

class LitMessageRenderer extends LitElement {
    
    static styles = css`
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
    
      .noselect {
        user-select: none;
        -webkit-user-select: none;
      }
    `
    
    static properties = {
        messageID: {type: String, attribute: "message-id"},
        _message: {},
        _author: {},
        _roleColour: {}
    }

    _holdTimer;
    _parser;

    constructor() {
        super();

        this._message = {};
        this._author = {};
        this._roleColour = css`var(--fg)`;

        this._parser = new Marked();
    }

    render() {
        return html`
            ${this.getReplies()}
            <div class="author">
                <coloured-text .colour=${this._roleColour || "var(--fg)"} text=${this._author.username}></coloured-text>
            </div>
            <div class="content">
                <markdown-renderer content=${this._message.content}></markdown-renderer>
            </div>
            <div class="embedlist">
                ${this.getEmbededContent()}
            </div>
        `
    }

    connectedCallback() {
        super.connectedCallback();

        this._message = messages.get(this.messageID);
        this._author = this._message.masquerade ? this._message.masquerade.name : users.get(this._message.author);

        this._roleColour = getRoleColour(this.messageID);

        console.log(this._message);
        console.log(this._roleColour);

        this.addEventListener(
            "touchstart",
            (ev) => {
                this._holdTimer = setTimeout(() => {
                    console.log("reply!", replies);
                    if (replies.length >= 5) {
                        console.log("debug: owo i am owerflowowing ");
                    } else if (
                        Array.from(replies.values()).find((el) => el.id === this.messageID)
                    ) {
                        console.log("debug: removing");
                        this.style.boxShadow = "";
                        // find Element
                        setReplies(replies.filter((el) => el.id !== this.messageID));
                        console.log(replies);
                    } else {
                        console.log("debug: adding");
                        this.style.boxShadow = "0 0 0 2px var(--accent)";
                        replies.push({id: this.messageID, mention: false});
                    }
                }, 1500);
                console.log("debug: start");
            },
            {passive: true},
        );

        this.addEventListener("touchmove", () => {
            clearTimeout(this._holdTimer);
            console.log("debug: moved");
        });

        this.addEventListener("touchend", () => {
            clearTimeout(this._holdTimer);
            console.log("debug: end");
        });

        this.addEventListener("contextmenu", (ev) => ev.preventDefault());
    }

    getReplies() {
        if (this._message.replies) {
            return html`
                <div class="replies">
                    ${this._message.replies.map((id) => {
                        const reply = messages.get(id);
                        if (!reply) return html`
                            <p>↱ unknown message</p>
                        `;

                        const author = users.get(reply.author);

                        return html`<p>↱ ${author?.username ?? "Unknown"}:
                            ${reply.content ? reply.content : reply.attachments > 0 ? `${reply.attachments.length} attachments` : "Empty Message"}</p>`
                    })}
                </div>
            `
        } else {
            return nothing
        }
    }

    getEmbededContent() {
        if (this._message.embeds) {
            return html`${this._message.embeds.map((embed) => {
                // Embed is not used yet.
                return html`<embeded-content .data=${embed}></embeded-content>`
            })}`
        }
    }
}

export {LitMessageRenderer};
