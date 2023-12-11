import { html, css, LitElement } from "lit";
import { classMap } from "lit/directives/class-map.js";

class Indicator extends LitElement {
  static properties = {
    loaderType: { type: String, attribute: "spinner-type" },
    variant: { type: String, attribute: "variant" },
    hidden: { type: Boolean, attribute: "hidden", reflect: true},

    classes: {}
  }

  constructor() {
    super();

    this.loaderType = "dot";
    this.variant = "info";

    this.classes = {
      warning: false,
      error: false,
      info: true,
      indicator: true
    };
  }

  static styles = css`
        .warning {
          background-color: #e4d500;
        }
        
        .error {
          background-color: var(--accent);
        }

        .warning ::slotted(*),
        .error ::slotted(*) {
          color: black !important;
          font-weight: 600;
        }

        .warning span.dot,
        .error span.dot {
          background-color: black !important;
        }
        
        .info {
          background-color: var(--bg);
        }

        :host([hidden="true"]) {
          display: none !important;
        }

        :host {
          display: flex;
          
          width: 100%;
        }

        :host div.indicator {
          display: flex;
          width: 100%;
          gap: 1rem;

          height: fit-content;
          padding: 10px;
        }

        :host .spinner {
          display: flex;
          align-items: center;

          gap: .1rem;
        }
        
        :host .spinner span.dot {
          display: block;
          border-radius: 100%;
          width: 10px;
          height: 10px;
          background-color: var(--fg);
        }
        
        :host .spinner span.dot:nth-child(1) {
          animation: fade 1s ease-in-out infinite alternate;
        }
        
        :host .spinner span.dot:nth-child(2) {
          animation: fade 1s ease-in-out infinite alternate;
          animation-delay: 333ms;
        }
        
        :host .spinner span.dot:nth-child(3) {
          animation: fade 1s ease-in-out infinite alternate;
          animation-delay: 666ms;
        }
    
        :host .information {
          color: var(--fg);
        }
    
         @keyframes fade {
          from {
            opacity: 100%;
          }
        
          to {
            opacity: 35%;
          }
        
        }        
    `

  render() {
    return html`
          <div class=${classMap(this.classes)}>
            <div class="spinner">
                ${this.renderLoader()}
            </div>
            <div class="information">
                <slot></slot>
            </div>
          </div>
        `
  }

  renderLoader() {
    switch (this.loaderType) {
      default:
      case "dot":
        return html`
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                `;
      case "ring":
        return html`
                    <span class="ring"></span>
                `;
    }
  }

  useVariant() {
    switch (this.variant) {
      default:
      case "info":
        this.classes.info = true;
        this.classes.warning = false;
        this.classes.error = false;
        break;
      case "warning":
        this.classes.info = false;
        this.classes.warning = true;
        this.classes.error = false;
        break;
      case "error":
        this.classes.info = false;
        this.classes.warning = false;
        this.classes.error = true;
        break;
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.useVariant();
  }
}

export { Indicator };