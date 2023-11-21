/** @type {Map<string, Object>} */
const messages = new Map();
/** @type {Map<string, Object>} */
const channels = new Map();
/** @type {Map<string, Object>} */
const servers = new Map();
/** @type {Map<string, Object>} */
const users = new Map();

/**
  @type {Map<string, Object>}
  Cache for members is layed out as follows
  User_id => Map<server_id, member_object>
*/
const members = new Map();
/** @type {Map<string, Object>} */
const emojis = new Map();

export { messages, channels, servers, users, emojis, members };
