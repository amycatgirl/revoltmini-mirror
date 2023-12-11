// @refresh reload
import {
  channels,
  emojis,
  members,
  messages,
  servers,
  users,
  roles
} from "./cache.js";
import { storage, token } from "./index.js";
import { deleteAllCookies, urlBase64ToUint8Array } from "./utils.js";
import {USE_NEW_RENDERER} from "./globals";
import {updateIndicatorValues} from "./indicator";

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

/** @type {HTMLButtonElement} */
const logoutBtn = document.querySelector("button#logout");
/** @type {HTMLButtonElement} */
const requestBtn = document.querySelector("button#push");

const typingIndicator = document.querySelector("snackbar-indicator#typing")


// Register Service Worker if browser supports it
navigator.serviceWorker?.register("sw.js");

/** @type {number} */
let interval;

/** @type {boolean} */
let isReconnectionNeeded = true;

/** @type {string[]} */
let typing = [];

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
// TODO: Refactor both functions into one
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
  isReconnectionNeeded = true;

  socket.onopen = () => {
    console.log("debug: Opened connection with Bonfire");
    console.log("debug: attempting authentication");
    socket.send(JSON.stringify({ type: "Authenticate", token }));

    console.log("debug: registering interval to about disconnection");
    interval = setInterval(() => {
      socket.send(JSON.stringify({ type: "Ping", data: Date.now() }));
    }, 20000);
  };

  socket.onmessage = async (ev) => {
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

        switch (USE_NEW_RENDERER) {
            case true:
                const newRenderer = document.createElement("lit-message-renderer");
                newRenderer.setAttribute("message-id", strippedResponse._id);

                MessageDisplay.appendChild(newRenderer);
              break;
            case false:
              const renderer = document.createElement("message-renderer");
              renderer.setAttribute("author", strippedResponse.author);
              renderer.setAttribute("message", strippedResponse._id);

              MessageDisplay.appendChild(renderer);
              break;
        }
        break;

        case "ChannelStartTyping":
          if (currentChannelID !== response.id) break;
          if (typing.includes(response.user)) break;
          typing.push(response.user);
          
          typingIndicator.innerText = typing.length > 1 ? `${typing.length} users are typing` : `${typing.length} user is typing`; 
          typingIndicator.setAttribute("hidden", false);

          console.log(typing);
          break;

          case "ChannelStopTyping":
            if (currentChannelID !== response.id) break;
            typing = typing.filter((el) => el !== response.user);
            if (typing.length === 0) {
              typingIndicator.setAttribute("hidden", true);
            } else {
              typingIndicator.innerText = typing.length > 1 ? `${typing.length} users are typing` : `${typing.length} user is typing`; 
            }
        console.log(typing)
        break;
    }
  };

  socket.onerror = () => {
    console.error(
      "debug: Something went wrong, we don't know what went wrong but something surely went wrong",
    );
  };

  socket.onclose = () => {
    isReconnectionNeeded = attemptReconnection();
    if (!isReconnectionNeeded) {
      console.error("debug/ws: failed to connect");
    }
  };
}

function stopPinging() {
  clearInterval(interval);
}

/**
  Recursive Function, only alows 10 tries
  @async
  @param {number} tries
  @returns {Promise<boolean>}
*/
async function attemptReconnection(tries = 0) {
  const delay = 2 ** tries * 300;

  console.log("debug/ws: attempt", tries);
  console.log("debug/ws: delay of", delay);

  try {
    await startSocket();
    return true;
  } catch {
    if (tries > 10 || socket.readyState === 1) {
      // Failed to reconnect or socket is already connected
      return false;
    }
    let newTry = tries + 1;

    setTimeout(async () => {
      await attemptReconnection(newTry);
    }, delay);
    
  }
  
  
}

/**
  Request Push Notification
*/
function requestPush() {
  Notification.requestPermission().then(async (state) => {
     switch(state) {
       case "granted":
        const reg = await navigator.serviceWorker?.getRegistration();
        
        // This means that the browser probably doesn't support serviceWorkers.
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
        
        break;
      default:
        break;
    }
  });
}

/**
  @async
  Destroy the session
*/
async function closeConnectionAndLogOut() {
  isReconnectionNeeded = false;
  socket.close();
  stopPinging();

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
  const defaultOption = document.createElement("option");
  defaultOption.value = "DEFAULT";
  defaultOption.innerText = "Select a server";

  const elements = [defaultOption];

  // Load from cache
  for (const [id, server] of servers.entries()) {
    const option = document.createElement("option");

    option.value = id;
    option.innerText = server.name;

    elements.push(option);
  }

  console.log(elements);  

  serverNav.replaceChildren(...elements);
}

/**
  @param {string} server - ID of the server to fetch
  @returns {void}
*/
async function cacheMembersFromServer(server) {
  try {
    const response = await fetch(
      `https://api.revolt.chat/servers/${server}/members`,
      {
        headers: [["x-session-token", token]]
      }
    )
    .then(async res => await res.json());
    
    if (response.members && response.users) {
      const oldMemberCache = members.get(server);
      if (oldMemberCache) return;
      
      const memberArr = [];
      members.set(server, []);

      const memberCache = members.get(server);
      for (const member of response.members) {        
        // Don't add the same member to the cache, thats dumb
        if (memberCache.find(m => m._id.user === member._id.user)) continue;
        
        memberArr.push(member);
        
        console.log("debug: cache values", members.values());
      }

      members.set(server, memberArr);
      
      console.log("debug: done caching members", members);
    }
    window.membersDebug = members;
  } catch (e) {
    console.error(`Failed to cache members\n${e.message}\n${e.stack}`);
  }
}

async function cacheRolesFromServer(server) {
  const info =
    await fetch(
      `https://api.revolt.chat/servers/${server}`, {headers: [["x-session-token", token]]}
    ).then(async (res) => await res.json());

  if (!info) throw "No information, somehow";

  console.log(info.roles)

  let currentServerRoles = roles.get(server);

  if (!currentServerRoles || currentServerRoles === undefined) {
    // Ensure there is an array to push elements to
    roles.set(server, []);
    currentServerRoles = roles.get(server);
  }

  // While we are there, cache all roles :)
  for (const [key, value] of Object.entries(info.roles)) {
    const foundRole = currentServerRoles.find(r => r.name === value.name);

    if (foundRole) continue;
    
    currentServerRoles.push({ id: key, ...value});
  }

  roles.set(server, [...currentServerRoles])

  console.log("debug: cached roles:", roles.get(server));  
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
      `https://api.revolt.chat/servers/${server}?include_channels=true`, { header: [["x-session-token", token]]},
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
    // TODO: Cache users another way
    const before = users.get(user);
    const obj = before ? Object.assign(user, before) : user;
    console.log("debug: cache", obj);
    users.set(user._id, obj);
  }

  for (const message of response.messages.reverse()) {
    messages.set(message._id, message);

    // Wouldn't it be better if i use webcomponents for this
    // no, it wasnt

    switch (USE_NEW_RENDERER) {
        case true:
          const newRenderer = document.createElement("lit-message-renderer");
          newRenderer.setAttribute("message-id", message._id);

          MessageDisplay.appendChild(newRenderer);
          break;
        case false:
          const renderer = document.createElement("message-renderer");
          renderer.setAttribute("author", message.author);
          renderer.setAttribute("message", message._id);

          MessageDisplay.append(renderer);
          break;
    }

  }
}

serverNav.addEventListener("change", async (ev) => {
  if (ev.currentTarget.value === "DEFAULT") {
    const intro = document.querySelector("template#intro");
    MessageDisplay.replaceChildren(intro.content.cloneNode(true));

    channelNav.replaceChildren();
    return;
  };
    
  await cacheMembersFromServer(ev.target.value);
  await cacheRolesFromServer(ev.target.value);
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
  
  sendBTN.disabled = true;

  try {
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
        "message-renderer[style^='box-shadow']",
      );
      for (const element of selected) {
        element.style.boxShadow = "";
      }
    });
  } catch (e) {
    window.alert("Error whilst sending message", e.message);
    console.error("debug: error whilst sending message", e.message, e.stack);
  } finally {
    sendBTN.disabled = false;
  }

});

messageBox.addEventListener("keydown", (ev) => {
  if (ev.code === "Enter" && !ev.shiftKey) {
    ev.preventDefault();
    sendBTN.click();
  }

  toSend = ev.target.value;
});

requestBtn.addEventListener("click", async () => await requestPush());
logoutBtn.addEventListener("click", async () => await closeConnectionAndLogOut());

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
