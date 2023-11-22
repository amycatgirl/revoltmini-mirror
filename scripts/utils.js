import { messages, members, channels, roles } from "./cache.js";

/**
  Get a cookie from this document's cookies
  @link https://www.w3schools.com/js/js_cookies.asp

  @param {string} name
  @returns {string | undefined}
*/
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

/**
  Delete all cookies
*/
function deleteAllCookies() {
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

/**
  Convert urlBase64 string into a Uint8Array
  @param {string} base64String - urlBase64 string
*/
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/**
  Get role colour from message
  @param {string} message
  @returns {string}
*/
function getRoleColour(message) {
  const found = messages.get(message);
  const author = found.author;
  const channel = channels.get(found.channel);

  const membersInServer = members.get(channel.server);
  const member = membersInServer.find(m => m._id.user === author);
  
  if (!member.roles) return "var(--fg)";
  
  const firstRole = member.roles[0];
  console.log(firstRole);

  const rolesInServer = roles.get(channel.server);
  const role = rolesInServer.find(r => r.id === firstRole);

  if (!role) return "var(--fg)";

  return role.colour;
}

export { getCookie, deleteAllCookies, urlBase64ToUint8Array, getRoleColour };
