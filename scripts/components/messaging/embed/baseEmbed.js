import { LitElement, html, nothing } from "lit";

class BaseEmbed extends LitElement {
	static properties = {
		data: { attribute: false },
	}
	
	render() {
		// TODO: style
		return html`
				<section>
					${this._updateEmbed()}
				</section>
			`
	}

	_updateEmbed() {
		switch (this.data.type) {
			case "None":
			default:
				return nothing;

			case "Website":
				return html`
						<a href="${this.data.url}">
							<h3>${this.data.title}</h3>
							<p>${this.data.description}</p>
						</a>
					`;
			case "Image":
				return html`
						<img src="${this.data.url}"></img>
					`;

			case "Text":
				return html`
						<h3>${this.data.title}</h3>
						<div class="text-embed-content">
							<markdown-renderer content="${this.data.description}"></markdown-renderer>
						</div>
						${this.data.url && html`<a href="${this.data.url}"><button>Link</button></a>`}
					`;
			case "Video":
				return html`
						<video controls src="${this.data.url}" width=${this.data.width} height=${this.data.height}></video>
					`
		}
	}
}

export { BaseEmbed }
