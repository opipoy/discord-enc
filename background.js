var auth = false;
var ports = {}
;
const enc_message_code = "-".repeat(20) + "discord-enc" + "-".repeat(20) + "\\n"
//local storage
var local_storage = {}

chrome.storage.local.onChanged.addListener(async () => {
    local_storage = await chrome.storage.local.get();
}
)


async function encrypt(text, publicKey) {
    try {

        const encryptedData = await crypto.subtle.encrypt(
            { name: "RSA-OAEP" }
            ,
            publicKey,
            new TextEncoder().encode(text)
        );
        return btoa(String.fromCharCode(...new Uint8Array(encryptedData))); // Base64 encode
    }
    catch (error) {
        console.error("Encryption error:", error);
        throw error;
    }

}


async function decrypt(encryptedData64, privateKey) {
    try {
        const encryptedData = new Uint8Array(atob(encryptedData64).split("").map((c) => c.charCodeAt(0)));
        const decryptedData = await crypto.subtle.decrypt(
            { name: "RSA-OAEP" }
            ,
            privateKey,
            encryptedData
        );
        console.warn(decryptedData)
        return new TextDecoder().decode(decryptedData);
    }
    catch (error) {
        console.error("Decryption error:", error);
        throw error;
    }

}



var send_to_port = function (port_id, message) {
    return ports[port_id].postMessage(message);
}


// NOTE: mabe structuring it as a dict that looks like this: {"request-for-msg": function}
//and then my code will look a lot more structured and can probebly could solve some bugs. 

    async function headers_connected() {
        local_storage = await chrome.storage.local.get()
        ports["content"].onMessage.addListener(async function (message) {

            if (message.type === "got-auth" && message.auth) {
                auth = true
                return 
            }


            if (message.type === "b_click") {

                if (message.channel_id in local_storage && "privateKey" in local_storage[message.channel_id]) {
                    // TODO: handle error here if key hasnt been set.
                        //get key
                    if (message.channel_is in local_storage){send_to_port("content", {type: "create-key", channel_id: message.channel_id}); return 0}
                    let pub_key = local_storage[message.channel_id]["publicKey"]
                    const imported_pub_key = await crypto.subtle.importKey(
                        "jwk",
                        pub_key,
                        { name: "RSA-OAEP", hash: "SHA-256" }
                        ,
                        false, // Encrypt-only
                        ["encrypt"]
                    )

                    encrypted_mesage = await encrypt(message.message, imported_pub_key)
                    send_to_port("content", { type: "send-message", message: enc_message_code + encrypted_mesage, real_msg : message.message }
                    )

                }
                else {
                    send_to_port("content", { type: "create-key", channel_id: message.channel_id }
                    )
                }


            }


            if (message.type === "key-set") {
                let stored_on_channel = (await chrome.storage.local.get())[message.channel_id]
                stored_on_channel = {}
                ;
                stored_on_channel["ownedPublicKey"] = message.public;
                stored_on_channel["privateKey"] = message.private;
                stored_on_channel["Messages"] = {}
                ;
                local_storage[message.channel_id] = stored_on_channel;
                chrome.storage.local.set(local_storage);
            }


            if (message.type === "pub-set"){
                if (!(message.channel_id in local_storage)){
                    send_to_port("content", {type: "create-key", channel_id:message.channel_id})
                    return 
                }

                let stored_on_channel = (await chrome.storage.local.get())[message.channel_id]
                stored_on_channel["publicKey"] = message.key;
                local_storage[message.channel_id] = stored_on_channel
                chrome.storage.local.set(local_storage);
            }


            if (message.type === "dec-message") {

                if (message.channel_id in local_storage && !("privateKey" in local_storage[message.channel_id])){
                    send_to_port("content", { type: "set-message", message_id: message.message_id, message: "permission error", error: true }
                    )
                    return 1
                }

                if (message.channel_id in local_storage) {
                    const private_key = local_storage[message.channel_id]["privateKey"]
                    try {
                        const imported_private_key = await crypto.subtle.importKey(
                            "jwk",
                            private_key,
                            { name: "RSA-OAEP", hash: "SHA-256" }
                            ,
                            true,
                            ["decrypt"]
                        )
                        const decrypted_message = await decrypt(message.message, imported_private_key)
                        send_to_port("content", { type: "set-message", message_id: message.message_id, message: decrypted_message, error: false }
                        )
                    }
                    catch (error) {
                        send_to_port("content", { type: "set-message", message_id: message.message_id, message: "decryption error", error: true }
                        )
                        return 1
                    }


                }


            }

            if (message.type === "save_message"){
                local_storage[message.name]["Messages"][message.id] = {message: message.message, name: message.name}

                chrome.storage.local.set(local_storage)
            }

            if (message.type === "msg-load") {
                // TODO: make the messages stored encrypted

                if (message.channel_id in local_storage){

                    let messages_list = local_storage[message.channel_id]["Messages"][message.id]

                    if (typeof messages_list === "undefined"){
                        send_to_port("content", { type: "set-message", message_id:message.id, message: "ERR: not found message, mabe is texting to another user or key has been forgotten", error: true}
                        )
                        return 
                    }

                    send_to_port("content", {type:"set-message", message_id: message.id, message: messages_list["message"]}
                    )
                }

            }

        }
        )
    }



        function listen_for_auth(){
            chrome.webRequest.onSendHeaders.addListener(
                (details) => {
                    if (!auth) {
                        send_to_port("content", { type: "header", request: details }
                        );
                    }
                    else {
                        auth = true;
                    }

                }
                ,
                { urls: ["<all_urls>"] }
                ,
                ["requestHeaders"]
            );
        }


        function popup_connected() {
            if (auth) {
                console.log("sending authheader")
                send_to_port("popup", { type: "set_auth"}
                );
            }

            ports["popup"].onMessage.addListener(function (message) {
                // message listening on popup port
            }
            )
        }



        chrome.runtime.onConnect.addListener(function (port) {

            if (port.name === "content") {
                ports["content"] = port;
                console.log("content connected")
                listen_for_auth();
                headers_connected();

            }
            else if (port.name === "popup") {
                ports["popup"] = port;
                popup_connected();
            }

            port.onDisconnect.addListener(function () {
                if (port.name in ports) {
                    delete ports[port.name];
                }

            }
            );

        }
        );
