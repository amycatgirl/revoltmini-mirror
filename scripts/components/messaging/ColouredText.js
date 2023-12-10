import {LitElement, html, css} from 'lit';

class ColouredText extends LitElement {

    static  properties = {
        color: {type: String},
        text: {type: String},
    }

    static styles =
        css`
            :host {
                color: var(--text-color);
                background: var(--background-color);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
        `;

    render() {
        return html`${this.text}`;
    }

    updated(changedProps) {
        if (changedProps.has('color')) {
            this.style.setProperty('--text-color', this.color);
            this.style.setProperty('--background-color', this.color);
        }
    }
}

export {ColouredText}