import { channels, emojis, servers, users } from "./cache.js";
import { token } from "./index.js";

const app = document.querySelector("main#app");
const loginPage = document.querySelector("main#login");

function togglePage() {
  app.classList.toggle("hidden");
  loginPage.classList.toggle("hidden");

  console.log("Toggled opened page");
}

/**
  Get revolt WS URI through the api
  @returns {Promise<string>}
*/
async function GetWSLocation() {
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

async function startSocket() {
  const socket = new WebSocket((await GetWSLocation()) + "?format=json");

  socket.addEventListener("open", () => {
    console.log("debug: Opened connection with Bonfire");
    console.log("debug: attempting authentication");
    socket.send(JSON.stringify({ type: "Authenticate", token }));
  });

  socket.addEventListener("message", async (ev) => {
    const response = JSON.parse(ev.data);

    switch (response.type) {
      case "Authenticated":
        console.log("debug: Logged in!");
        break;
      case "Ready":
        console.log("debug: Got ready event from API");
        console.log(`debug: Hi!`);
        // Add everything into cache :)

        for (const server of response.servers) {
          servers.set(server._id, server);
        }

        console.log("debug/cache: Servers cached.", servers);

        for (const channel of response.channels) {
          channels.set(channel._id, channel);
        }

        console.log("debug/cache: Channels cached.", channels);

        for (const user of response.users) {
          users.set(user._id, user);
        }

        console.log("debug/cache: Users cached.", users);

        for (const emoji of response.emojis) {
          emojis.set(emoji._id, emoji);
        }

        console.log("debug/cache: Emojis cached", emojis);
        console.log("debug/cache: Everything is in cache!");
        break;
    }

    // idk why i do this but eh, it's funny
    return socket;
  });

  socket.addEventListener("error", () => {
    console.error(
      "debug: Something went wrong, we don't know what went wrong but something surely went wrong",
    );
  });
}

// Once we have a token and we have logged in, then we can start loading
// Channels, servers, etc...

export { togglePage, startSocket };
