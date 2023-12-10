import {css, html, LitElement, unsafeCSS} from "lit";

class MDSymbols extends LitElement {

  static properties = {
    name: { type: String },
    fill: { type: Number },
    emphasis: { type: Number },
    opticalSize: { type: Number, attribute: "optical-size"},
    weight: { type: Number }
  }

  static styles = css`
    .material-symbols-outlined {
        font-variation-settings:
        'FILL' ${unsafeCSS(this.fill)},
        'wght' ${unsafeCSS(this.weight)},
        'GRAD' ${unsafeCSS(this.emphasis)},
        'opsz' ${unsafeCSS(this.opticalSize)}
      }
  `

  constructor() {
    super();

    this.name = "info"

    this.fill = 0;
    this.weight = 400;
    this.emphasis = 0;
    this.opticalSize = 24;
  }

  render() {
    return html`
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined">
      <span class="material-symbols-outlined">${this.name}</span>
    `
  }
}

export { MDSymbols };
