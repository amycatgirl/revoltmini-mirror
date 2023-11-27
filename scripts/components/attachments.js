class Attachments extends HTMLElement {
  static get observedAttributes() {
    return ["elements"];
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    const container = document.createElement("div");
    const style = document.createElement("style");

    container.id = "imagecontainer";

    style.innerText = `
      #imagecontainer {
        margin: 0 4px;
        display: flex;
        flex-flow: wrap column;
      }
      img, video {
        border-radius: 10px;
        max-width: 100%;
        max-height: 100%;
      }
    `;

    shadow.append(container, style);
  }

  connectedCallback() {
    const shadow = this.shadowRoot;
    const container = shadow.getElementById("imagecontainer");
    const ATTACHMENTS = this.getAttribute("elements")
      .split("$")
      .map((el) => JSON.parse(el));

    for (const attachment of ATTACHMENTS) {
      if (attachment.content_type.includes("image")) {
        const imageAttachment = document.createElement("img");
        imageAttachment.loading = "lazy";
        imageAttachment.alt =
          "Attachment alt text has not been implemented in Delta/Autumn";
        imageAttachment.id = attachment._id;
        imageAttachment.src =
          "https://autumn.revolt.chat/attachments/" +
          attachment._id +
          "/" +
          attachment.filename;
        imageAttachment.width = attachment.metadata.width;
        imageAttachment.height = attachment.metadata.height;

        container.append(imageAttachment);
      } else if (attachment.content_type.includes("video")) {
        const videoAttachment = document.createElement("video");
        videoAttachment.controls = true;
        videoAttachment.alt =
          "Attachment alt text has not been implemented in Delta/Autumn";
        videoAttachment.id = attachment._id;
        videoAttachment.src =
          "https://autumn.revolt.chat/attachments/" +
          attachment._id +
          "/" +
          attachment.filename;
        container.append(videoAttachment);
      }
    }
  }
}

export { Attachments };
