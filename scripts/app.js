import {
  channels,
  emojis,
  members,
  messages,
  servers,
  users,
} from "./cache.js";
import { storage, token } from "./index.js";
import { deleteAllCookies } from "./utils.js";

const app = document.querySelector("main#app");
const loginPage = document.querySelector("main#login");

/** @type {HTMLSelectElement} */
const serverNav = document.querySelector("select#server");
/** @type {HTMLSelectElement} */
const channelNav = document.querySelector("select#channel");
/** @type {HTMLTextAreaElement} */
const messageBox = document.querySelector("form#compose textarea#content");
/** @type {HTMLInputElement} */
const attachInput = document.querySelector("form#compose input#attach");
/** @type {HTMLTextAreaElement} */
const messageForm = document.querySelector("form#compose");

/** @type {HTMLElement} */
const MessageDisplay = document.querySelector("section#middle");

/** @type {number} */
let interval;

/** @type {string} */
let currentChannelID = "";
/** @type {string} */
let currentServerID = "";
/** @type {string} */
let toSend = "";
/** @type {WebSocket} */
let socket;

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
  socket = new WebSocket((await GetWSLocation()) + "?format=json");

  socket.addEventListener("open", () => {
    console.log("debug: Opened connection with Bonfire");
    console.log("debug: attempting authentication");
    socket.send(JSON.stringify({ type: "Authenticate", token }));

    console.log("debug: registering interval to about disconnection");
    interval = setInterval(() => {
      socket.send(JSON.stringify({ type: "Ping", data: Date.now() }));
    }, 20000);
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
      case "Message":
        // Ugly ass workarround to cache the message
        const { type, ...strippedResponse } = response;
        messages.set(strippedResponse._id, strippedResponse);

        if (strippedResponse.channel !== currentChannelID) break;
        /** @type {string} */
        const renderer = document.createElement("message-renderer");
        renderer.setAttribute("author", strippedResponse.author);
        renderer.setAttribute("message", strippedResponse._id);

        MessageDisplay.append(renderer);
        break;
    }
  });

  socket.addEventListener("error", () => {
    console.error(
      "debug: Something went wrong, we don't know what went wrong but something surely went wrong",
    );
  });

  socket.addEventListener("close", () => {
    // please
    stopPinging();
  });
}

function stopPinging() {
  clearInterval(interval);
}

/**
  @async
  Destroy the session
*/
async function closeConnectionAndLogOut() {
  socket.close();

  try {
    await fetch(
      `https://api.revolt.chat/auth/session/${storage.getItem("rvlt:session")}`,
      { method: "DELETE", headers: [["x-session-token", token]] },
    );

    console.log("debug: killed session :)");

    deleteAllCookies();
    storage.clear();

    togglePage();

    const modal = document.createElement("dialog", { is: "custom-modal" });
    modal.setAttribute("title", "Logged out!");
    modal.setAttribute(
      "description",
      "You have successfuly logged out of your previous session. Feel free to close the tab :)",
    );

    document.body.append(modal);
  } catch (e) {
    console.error("Could not kill session, oh no", e.stack);
    const modal = document.createElement("dialog", { is: "custom-modal" });
    modal.setAttribute("title", "Oops! Could not log out");
    modal.setAttribute(
      "description",
      "Revolt could not destroy your session, either you are already logged out or your session doesn't exist for some reason",
    );

    document.body.append(modal);
  }
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
  channelNav.replaceChildren();

  const defaultOption = document.createElement("option");

  defaultOption.value = "DEFAULT";
  defaultOption.innerText = "Select a channel";

  channelNav.add(defaultOption);

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

/**
  @param {string} channel - Channel ID
*/
async function loadMessagesFromChannel(channel) {
  MessageDisplay.replaceChildren();

  const response = await fetch(
    `https://api.revolt.chat/channels/${channel}/messages?limit=100&include_users=true`,
    { headers: [["x-session-token", token]] },
  ).then(async (res) => await res.json());

  // Response is divided as follows
  // { messages: Message[], users: User[], members: Member[] }

  for (const user of response.users) {
    users.set(user._id, user);
  }

  for (const member of response.members) {
    members.set(member._id, member);
  }

  for (const message of response.messages.reverse()) {
    messages.set(message._id, message);

    // Wouldn't it be better if i use webcomponents for this
    // not it wasnt

    const renderer = document.createElement("message-renderer");
    renderer.setAttribute("author", message.author);
    renderer.setAttribute("message", message._id);

    console.log("debug: appending renderer", renderer);

    MessageDisplay.append(renderer);
  }
}

serverNav.addEventListener("change", async (ev) => {
  if (ev.currentTarget.value === "DEFAULT") return;

  currentServerID = ev.target.value;

  await loadChannels(ev.target.value);
});

channelNav.addEventListener("change", async (ev) => {
  if (ev.currentTarget.value === "DEFAULT") return;

  currentChannelID = ev.target.value;
  // Something something load messages and display them
  loadMessagesFromChannel(ev.target.value);
});

messageForm.addEventListener("submit", async (ev) => {
  // dont you dare reload the page
  ev.preventDefault();
  await fetch(`https://api.revolt.chat/channels/${currentChannelID}/messages`, {
    method: "POST",
    headers: [["x-session-token", token]],
    body: JSON.stringify({
      content: toSend,
    }),
  }).then(() => {
    toSend = "";
    messageBox.value = "";
  });
});

messageBox.addEventListener("change", (ev) => (toSend = ev.target.value));

export { togglePage, startSocket, closeConnectionAndLogOut };
