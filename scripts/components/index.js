import { Message } from "./message.js";
import { Modal } from "./modal.js";
import { Attachments } from "./attachments.js";

customElements.define("message-renderer", Message);
customElements.define("attachment-renderer", Attachments);
customElements.define("custom-modal", Modal, { extends: "dialog" });
