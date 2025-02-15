import { ReactiveController, ReactiveControllerHost } from "lit";

export class WebsocketController extends ReactiveController {
  /** @type {ReactiveControllerHost} */
  host;

  /** @type {WebSocket}*/
  socket;

  /** @type {EventTarget}*/
  target;

  constructor(host) {
    (this.host = host).addController(this);
  }


  /**
    Get revolt WS URI through the api
    @returns {Promise<string>}
  */
  async _getWSLocation() {
    try {
      const response = await fetch("https://api.revolt.chat").then(
        async (res) => await res.json(),
      );

      if (!response) throw "Could parse response from API";

      return response.ws;
    } catch (e) {
      console.error("Error whilst getting WS URI", e);
      throw e;
    }
  }

  hostConnected() {
    this.target = new EventTarget();
    this.target.addEventListener("start", async () => {
      this.socket = new WebSocket(await this._getWsLocation() + "?format=json&version=1")

      this.socket.onopen = () => {
        console.log("debug: Opened connection with Bonfire");
        console.log("debug: attempting authentication");
        socket.send(JSON.stringify({ type: "Authenticate", token }));

        console.log("debug: registering interval to about disconnection");
        interval = setInterval(() => {
          socket.send(JSON.stringify({ type: "Ping", data: Date.now() }));
        }, 20000);
      };

      this.socket.onmessage = (ev) => {
        const { type, ...response } = JSON.parse(ev.data);

        console.log(type, response);
      }

    })
  }
}
