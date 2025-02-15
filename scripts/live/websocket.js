import { LiveData } from "../helpers/LiveData";

export class LiveSocket {
  #status = "offline";
  /** @type {LiveData} */
  #channel;
  /** @type {WebSocket} */
  #socket;
  /** @type {string} */
  #token;
  /** @type {number} */
  #p_timeout_id;


  constructor(token) {
    if (LiveSocket._instance) {
      return LiveSocket._instance;
    }

    LiveSocket._instance = this;
    this.#channel = new LiveData();
    this.#token = token;
  }

  listen(type, callback) {
    const stopListening = this.#channel.observe(v => {
      const { type: msg_type, ...value } = v;
      if (msg_type === type) callback(value);
    })

    return stopListening;
  }

  async #reconnect(attempts = 0) {
    // TODO)) Hook this up with the snackbar controller.
    const delay = 2 ** attempts * 300;

    console.log("debug/ws: attempt", attempts);
    console.log("debug/ws: delay of", delay);

    try {
      await this.start(this.#token);
      return true;
    } catch {
      if (attempts > 10 || this.#status === "connected") {
        // Failed to reconnect or socket is already connected
        return false;
      }
      let newTry = attempts + 1;

      setTimeout(async () => {
        await this.#reconnect(newTry);
      }, delay);
    }
  }

  #startPinging() {
    this.#p_timeout_id = setInterval(() => {
      this.#socket.send(
        JSON.stringify({
          type: "Ping",
          data: Date.now()
        })
      )
    }, 20 * 1000)
  }

  async start() {
    if (this.#status !== "offline") { throw new Error("Socket needs to be offline to start!") }
    this.#socket = new WebSocket("wss://ws.revolt.chat?format=json&version=1")

    this.#socket.addEventListener("open", () => {
      this.#status = "connected"
      this.#socket.send(
        JSON.stringify({
          type: "Authenticate",
          token: this.#token
        })
      )

      const stopfn = this.listen("Ready", () => {
        this.#status = "ready"
        this.#startPinging();
        stopfn();
      });
    })

    this.#socket.addEventListener("message", (ev) => {
      const data = JSON.parse(ev.data);
      this.#channel.post(data);
    })

    this.#socket.addEventListener("close", async () => {
      clearInterval(this.#p_timeout_id);
      this.#status = "offline";
      if (!(await this.#reconnect())) {
        console.error("debug/ws: Failed to reconnect to revolt.")
      }
    })
  }
}
