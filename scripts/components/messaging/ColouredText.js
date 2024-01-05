import {LitElement, html, css, unsafeCSS} from 'lit';
import {styleMap} from 'lit/directives/style-map.js'

class ColouredText extends LitElement {

    static properties = {
        colour: {type: String},
        text: {type: String},
        _styles: {}
    }

    constructor() {
        super();

        this.colour = "var(--fg)";

        this._styles = {
            background: unsafeCSS(this.colour),
            "background-clip": "text",
            "-webkit-background-clip": "text",
            "-moz-text-fill-color": "transparent",
            "-webkit-text-fill-color": "transparent",
            "font-weight": 600
        }

        this.text = "";
    }

    connectedCallback() {
        super.connectedCallback();

        this._styles.background = unsafeCSS(this.colour);
    }

    render() {
        console.log(this.colour);
        return html`<span style=${styleMap(this._styles)}>${this.text}</span>`;
    }
}

export {ColouredText}
