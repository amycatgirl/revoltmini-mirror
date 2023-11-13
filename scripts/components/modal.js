import { handleMFA } from "../login.js";

class Modal extends HTMLDialogElement {
  static get observedAttributes() {
    return ["title", "description", "isMFA", "ticket"];
  }

  _inputValue;

  constructor() {
    super();
  }

  connectedCallback() {
    const header = document.createElement("h1");
    const information = document.createElement("p");
    const closeButton = document.createElement("button");

    header.innerText = this.getAttribute("title");
    information.innerText = this.getAttribute("description");

    closeButton.addEventListener("click", () => {
      this.close();
      this.remove();
    });

    closeButton.innerText = "Close";

    this.appendChild(header);
    this.appendChild(information);

    if (this.getAttribute("isMFA") === "yes") {
      const input = document.createElement("input");
      input.addEventListener("change", (ev) => {
        this._inputValue = ev.target.value;
      });

      const submit = document.createElement("button");
      submit.addEventListener("click", async () => {
        await handleMFA(this._inputValue, this.getAttribute("ticket")).then(
          () => {
            this.close();
            this.remove();
          },
        );
      });

      submit.innerText = "Login";

      this.appendChild(input);
      this.appendChild(submit);
      this.appendChild(closeButton);
    } else {
      this.appendChild(closeButton);
    }

    this.showModal();
  }
}

export { Modal };
