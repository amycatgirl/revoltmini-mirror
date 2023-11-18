import {
  channels,
  emojis,
  members,
  messages,
  servers,
  users,
} from "./cache.js";
import { storage, token } from "./index.js";
import { deleteAllCookies, urlBase64ToUint8Array } from "./utils.js";

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
/** @type {HTMLButtonElement} */
const sendBTN = document.querySelector("form#compose button");

/** @type {HTMLElement} */
const MessageDisplay = document.querySelector("section#middle");

// Register Service Worker
navigator.serviceWorker.register("sw.js");

/** @type {number} */
let interval;

/** @type {string} */
let currentChannelID = "";
/** @type {string[]} */
let replies = [];
/** @type {string} */
let toSend = "";
/** @type {WebSocket} */
let socket;
/** @type {FileList | File[]} */
let toBeUploaded;
/** @type {string[]} */
let attachments;

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

async function GetVapid() {
  try {
    const response = await fetch("https://api.revolt.chat").then(
      async (res) => await res.json(),
    );

    if (!response) throw "Could not parse response from API";

    return response.vapid;
  } catch (e) {
    console.error("debug: Error trying to get VAPID", e.stack);
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
  Request Push Notification
*/
function requestPush() {
  Notification.requestPermission().then(async (v) => {
    if (v === "granted") {
      // subscribe to webPush
      const reg = await navigator.serviceWorker?.getRegistration();

      if (!reg) return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(await GetVapid()),
      });

      const json = sub.toJSON();

      if (json.keys) {
        await fetch("https://api.revolt.chat/push/subscribe", {
          method: "POST",
          body: JSON.stringify({
            endpoint: sub.endpoint,
            ...json.keys,
          }),
          headers: [["x-session-token", token]],
        });
      }
    }
  });
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

/**
  @async
  @param {FileList | Image[]} images
  @returns {Promise<string[]>}
*/
async function uploadAllImages(images) {
  let ids = [];
  try {
    for await (const image of images) {
      const form = new FormData();
      form.append("file", image, image.name);
      await fetch("https://autumn.revolt.chat/attachments", {
        method: "POST",
        body: form,
      })
        .then(async (res) => await res.json())
        .then((json) => ids.push(json.id));
    }

    if (ids) return ids;
    throw "oops :3";
  } catch (e) {
    console.error(e.message, e.stack);
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
    (await fetch(
      `https://api.revolt.chat/servers/${server}?include_channels=true`,
    ).then(async (res) => await res.json()));

  if (!info) throw "No information, somehow";

  console.log(info.channels);

  for await (const id of info.channels) {
    try {
      const channel =
        channels.get(id) ||
        (await fetch(`https://api.revolt.chat/channels/${id}`, {
          headers: [["x-session-token", token]],
        })
          .then(async (res) => await res.json())
          .then((res) => {
            channels.set(res._id, res);
          }));

      const option = document.createElement("option");

      option.value = id;
      option.innerText = `#${channel.name || "unknown"}`;

      channelNav.append(option);
    } catch {}
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
    const before = users.get(user);
    const obj = before ? Object.assign(user, before) : user;
    console.log("debug: cache", obj);
    users.set(user._id, obj);
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

    MessageDisplay.append(renderer);
  }
}

serverNav.addEventListener("change", async (ev) => {
  if (ev.currentTarget.value === "DEFAULT") return;

  await loadChannels(ev.target.value);
});

channelNav.addEventListener("change", async (ev) => {
  if (ev.currentTarget.value === "DEFAULT") return;

  currentChannelID = ev.target.value;
  // Something something load messages and display them
  loadMessagesFromChannel(ev.target.value);
});

attachInput.addEventListener("change", async (ev) => {
  const files = ev.target.files;
  toBeUploaded = files;
});

messageForm.addEventListener("submit", async (ev) => {
  toSend = messageBox.value;
  // dont you dare reload the page
  ev.preventDefault();

  if (toBeUploaded && toBeUploaded.length > 0) {
    attachments = await uploadAllImages(toBeUploaded);
  }

  const body =
    attachments && attachments.length > 0
      ? { content: toSend, attachments, replies }
      : {
          content: toSend,
          replies,
        };

  await fetch(`https://api.revolt.chat/channels/${currentChannelID}/messages`, {
    method: "POST",
    headers: [["x-session-token", token]],
    body: JSON.stringify(body),
  }).then(() => {
    toSend = "";
    messageBox.value = "";
    attachments = [];
    toBeUploaded = [];
    replies = [];
    const selected = document.querySelectorAll(
      "message-renderer[style^='border']",
    );
    for (const element of selected) {
      element.style.border = "";
    }
  });
});

messageBox.addEventListener("keydown", (ev) => {
  if (ev.code === "Enter" && !ev.shiftKey) {
    ev.preventDefault();
    sendBTN.click();
  }

  toSend = ev.target.value;
});

function setReplies(v) {
  replies = v;
}

export {
  togglePage,
  startSocket,
  closeConnectionAndLogOut,
  replies,
  setReplies,
  requestPush,
};
