import {css, html, LitElement} from "lit";
import {messages} from "../cache";

class Attachments extends LitElement {

  static properties = {
    message: { type: String, attribute: "message-id" },
    _attachments: {}
  }

  static styles = css`
    #imagecontainer {
        margin: 0 4px;
        display: flex;
        flex-flow: wrap column;
      }
      img, video {
        border-radius: 10px;
        max-width: 100%;
        max-height: 100%;
      }
  `

  constructor() {
      super();
      this._attachments = [];
  }

  render() {
    return html`
      <div id="imagecontainer">
        ${this._attachments.map((attachment) => {
          if (attachment.content_type.includes("image")) {
                return html`
                  <img id=${attachment._id} src=${'https://autumn.revolt.chat/attachments/' + attachment._id + "/" + attachment.filename} />
                `
          } else if (attachment.content_type.includes("video")) {
            return html`
              <video controls src=${'https://autumn.revolt.chat/attachments/' + attachment._id + "/" + attachment.filename} id=${attachment._id}/>
            `
          }
        })}
      </div>
    `
  }

  connectedCallback() {
      super.connectedCallback();
      const message = messages.get(this.message);
      this._attachments = message.attachments;
  }
}

export { Attachments };
