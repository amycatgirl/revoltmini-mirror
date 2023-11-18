class MDSymbols extends HTMLElement {
  static get observedAttributes() {
    return ["name", "fill", "weight", "emphasis", "optical-size"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const shadowDOM = this.shadowRoot;
    const name = this.getAttribute("name");
    if (!name) return;

    const fill = this.getAttribute("fill") | 0;
    const weight = this.getAttribute("weight") | 400;
    const emphasis = this.getAttribute("emphasis") | 0;
    const opticalSize = this.getAttribute("optical-size") | 24;

    const style = document.createElement("style");
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined";
    link.rel = "stylesheet";

    style.innerText = `
      .material-symbols-outlined {
        font-variation-settings:
        'FILL' ${fill},
        'wght' ${weight},
        'GRAD' ${emphasis},
        'opsz' ${opticalSize}
      }
    `;

    const icon = document.createElement("span");
    icon.classList.add("material-symbols-outlined");
    icon.innerText = name;

    shadowDOM.appendChild(icon);
    shadowDOM.appendChild(style);
    shadowDOM.appendChild(link);
  }
}

export { MDSymbols };
