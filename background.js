var auth = false;
var ports = {};

async function encrypt(text, publicKey) {
  try {
    const encryptedData = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      new TextEncoder().encode(text)
    );
    return btoa(String.fromCharCode(...new Uint8Array(encryptedData))); // Base64 encode
  } catch (error) {
    console.error("Encryption error:", error);
    throw error;
  }
}

async function encrypt(text, publicKey) {
  try {
    const encryptedData = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      new TextEncoder().encode(text)
    );
    return btoa(String.fromCharCode(...new Uint8Array(encryptedData))); // Base64 encode
  } catch (error) {
    console.error("Encryption error:", error);
    throw error;
  }
}


var send_to_port = function (port_id, message) {
  ports[port_id].postMessage(message);
}

function headers_connected() {
  ports["content"].onMessage.addListener(async function (message) {

    if (message.type === "got-auth" && message.auth) {
      auth = true
    }

    if (message.type === "b_click") {

      let local_storage = await chrome.storage.local.get()

      if (message.channel_id in local_storage) {

        let pub_key = local_storage[message.channel_id]["publicKey"]
        let imported_pub_key = await crypto.subtle.importKey("jwk", pub_key, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"])
        let encoded_message = new TextEncoder().encode(message.message)
        crypto.subtle.encrypt('RSA-OAEP', imported_pub_key, encoded_message).then(async (encryptedData) => {

          send_to_port("content", {type: "send-message" , message: "-".repeat(20) + "discord enc" + "-".repeat(20) + "\\n" + btoa(String.fromCharCode(...new Uint8Array(encryptedData)))})
        
        })
      } else {
        send_to_port("content", { type: "create-key", channel_id: message.channel_id })

      }

    }

    if (message.type === "key-set") {
      chrome.storage.local.set({ [message.channel_id]: { "publicKey": message.public, "privateKey": message.private } });
    }
    
    if (message.type === "dec-message") {
      let local_storage = await chrome.storage.local.get()

    }
  });
  chrome.webRequest.onSendHeaders.addListener(
    (details) => {
      if (!auth) {
        send_to_port("content", { type: "header", request: details });
      }
    },
    { urls: ["<all_urls>"] },
    ["requestHeaders"]
  );
}

function popup_connected() {
  ports["popup"].onMessage.addListener(function (message) {
    if ("message" in message) {// && "channel_id" in message) {
      send_to_port("content", { type: "message", message: message.message, channel_id: "1152252579389120554" })
    }

  });
  if (auth) {
    send_to_port("popup", { type: "set_auth", auth: true });
  }
}



chrome.runtime.onConnect.addListener(function (port) {
  console.log("connected to port: " + port.name)

  if (port.name === "content") {
    ports["content"] = port;
    console.log("content connected")
    headers_connected();

  } else if (port.name === "popup") {
    ports["popup"] = port;
    popup_connected();
  }
  port.onDisconnect.addListener(function () {
    if (port.name in ports) {
      delete ports[port.name];
    }
  });
});








