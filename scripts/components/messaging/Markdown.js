import {css, html, LitElement} from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js"
import {Marked} from "marked";
import DOMPurify from "dompurify";

class Markdown extends LitElement {
    _parser;

    static properties = {
        content: {type: String}
    }

    constructor() {
        super();

        this._parser = new Marked();
        this.content = "";
    }

    render() {
        const parsed = DOMPurify.sanitize(
            this._parser.parse(
                this.content
            )
        )

        return unsafeHTML(parsed);
    }
}

export {Markdown};