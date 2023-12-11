import {Message} from "./message";
import {Modal} from "./modal";
import {Attachments} from "./attachments";
import {MDSymbols} from "./mdsymbols";
import {ColouredText} from "./messaging/ColouredText";
import {LitMessageRenderer} from "./messaging/MessageRenderer";
import {Markdown} from "./messaging/Markdown";
import {Indicator} from "./ui/indicator";

customElements.define("message-renderer", Message);
customElements.define("markdown-renderer", Markdown);
customElements.define("lit-message-renderer", LitMessageRenderer);
customElements.define("snackbar-indicator", Indicator);
customElements.define("attachment-renderer", Attachments);
customElements.define("material-symbols", MDSymbols);
customElements.define("coloured-text", ColouredText);
customElements.define("custom-modal", Modal, {extends: "dialog"});
