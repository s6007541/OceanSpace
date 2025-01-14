// TODO: fix this to the deployed URL
let protocol = window.location.protocol;
let hostname = window.location.hostname;
let ws_protocol = protocol === "https:" ? "wss:" : "ws:";

export const BACKEND_URL = `${protocol}//${hostname}/api`;
export const WEBSOCKET_URL = `${ws_protocol}//${hostname}/api`;
export const GOOGLE_CLIENT_ID =
  "241481830305-nccd24d43lpcuoovvmgdm51l2u7lqqm3.apps.googleusercontent.com";
export const STATIC_BASE = "./static";
