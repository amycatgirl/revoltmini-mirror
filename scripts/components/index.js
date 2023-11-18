import { Message } from "./message.js";
import { Modal } from "./modal.js";
import { Attachments } from "./attachments.js";
import { MDSymbols } from "./mdsymbols.js";

customElements.define("message-renderer", Message);
customElements.define("attachment-renderer", Attachments);
customElements.define("material-symbols", MDSymbols);
customElements.define("custom-modal", Modal, { extends: "dialog" });
