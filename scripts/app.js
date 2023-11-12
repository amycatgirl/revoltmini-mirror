import { channels, emojis, servers, users } from "./cache.js";
import { token } from "./index.js";

const app = document.querySelector("main#app");
const loginPage = document.querySelector("main#login");

/** @type {HTMLSelectElement} */
const serverNav = document.querySelector("select#server");
/** @type {HTMLSelectElement} */
const channelNav = document.querySelector("select#channel");
/** @type {number} */
let interval;

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

    console.log("debug: registering interval to about disconnection");
    interval = setInterval(() => {
      socket.send(JSON.stringify({ type: "Ping", data: Date.now() }));
    });
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

        console.log("debug: Loading servers into navigation");
        loadServers();
        break;
    }
  });

  socket.addEventListener("error", () => {
    console.error(
      "debug: Something went wrong, we don't know what went wrong but something surely went wrong",
    );
  });
}

function stopPinging() {
  clearInterval(interval);
}

// Once we have a token and we have logged in, then we can start loading
// Channels, servers, etc...

function loadServers() {
  // Load from cache
  for (const [id, server] of servers.entries()) {
    const option = document.createElement("option");

    option.value = id;
    option.innerText = server.name;

    serverNav.append(option);
  }
}

async function loadChannels(server) {
  channelNav.append("<option value='DEFAULT'>Select a channel</option>");

  const info =
    servers.get(server) ||
    (await fetch(`https://api.revolt.chat/servers/${server}`).then(
      async (res) => await res.json(),
    ));

  if (!info) throw "No information, somehow";

  for (const id of info.channels) {
    // TODO: Add fallback
    const channel = channels.get(id);

    if (channel.channel_type !== "TextChannel") return;

    const option = document.createElement("option");

    option.value = id;
    option.innerText = `#${channel.name}`;

    channelNav.append(option);
  }
}

serverNav.addEventListener("change", async (ev) => {
  if (ev.currentTarget.value === "DEFAULT") return;

  await loadChannels(ev.target.value);
});
export { togglePage, startSocket };
