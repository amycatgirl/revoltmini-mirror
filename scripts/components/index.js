import { Message } from "./message.js";
import { Modal } from "./modal.js";

customElements.define("message-renderer", Message);
customElements.define("custom-modal", Modal, { extends: "dialog" });
