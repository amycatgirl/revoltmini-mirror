import { html, css, LitElement, nothing } from "lit";
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

        .warning span,
        .error span  {
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

        .ring {
          animation: rotate 2s linear infinite;
          width: 20px;
          height: 20px;
          stroke: #fff;
        }

        .path {
          stroke: hsl(210, 70, 75);
          stroke-linecap: round;
          animation: dash 1.5s ease-in-out infinite
        }

        @keyframes rotate {
          100% {
            transform: rotate(360deg)
          }
        }

        @keyframes dash {
          0% {
            stroke-dasharray: 1, 150;
            stroke-dashoffset: 0
          }

          50% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -35
          }

          100% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -124
          }
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
                <span><slot></slot></span>
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
                    <svg class="ring" viewBox="0 0 50 50"> <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle></svg>
                `;
      case "none":
        return nothing;
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