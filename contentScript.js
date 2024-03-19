(async () => {
    const src = chrome.runtime.getURL("./resorces/api.js")
    
    const contentMain = await import(src);

    // const discord_api = await require(src);
    api = contentMain.api;
    // testing api

    var curr_usr;

    async function create_keys() {
        let keys = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            }, true, ["encrypt", "decrypt"]);

        return keys;


    }

    function exported_to_message(key) {
        return key_message_code + key.n
    }

    function message_to_exported(message) {
        const rel_key_message_code = key_message_code.replace("\\n", "\n")
        n = message.replace(rel_key_message_code, "")
        obj = {
            "alg": "RSA-OAEP-256",
            "e": "AQAB",
            "ext": true,
            "key_ops": [
                "encrypt"
            ],
            "kty": "RSA",
            "n": n
        }
        return obj
    }

    const enc_message_code = "-".repeat(20) + "discord-enc" + "-".repeat(20) + "\\n"
    const key_message_code = "-".repeat(20) + "discord-key" + "-".repeat(20) + "\n"

    async function listen_for_messages() {
        bg_port.onMessage.addListener(async function (message, sender, sendResponce) {
            if (message.type === "send-message" && api.getConfig().authHeader != '') {

                const output_message = await api.sendMessage(get_channel_id(), message.message)
                bg_port.postMessage({type:"save_message", id:output_message.id, name:output_message.channel_id, message:message.real_msg})

            }
            if (message.type === "header") {

                const headers = message.request.requestHeaders;

                for (const header of headers) {
                    if (header.name === "Authorization" && authHeader == '') {
                        alert(`[discord-enc]: auth token found!`);
                        api.setConfigAuthHeader(header.value);
                        bg_port.postMessage({ type: "got-auth", auth: true });
                        curr_usr = await api.getCurrentUser();
                        break;
                    }
                }
            }
            if (message.type === "create-key") {
                if (await ask_key_popup()) {
                    let export_key = async function (key) {
                        return await window.crypto.subtle.exportKey('jwk', key)
                    }
                    let keys = await create_keys();
                    bg_port.postMessage({

                        type: "key-set",

                        channel_id: message.channel_id,

                        public: await export_key(keys.publicKey),

                        private: await export_key(keys.privateKey)
                    });
                    const exported_key = await export_key(keys.publicKey)
                    api.sendMessage(get_channel_id(), exported_to_message(exported_key))



                }
            }
            if (message.type === "set-message") {
                discord_message = document.getElementById("message-content-" + message.message_id)
                if (!message.error) {
                    discord_message.innerText = message.message
                } else {
                    discord_message.style.color = "red";
                    discord_message.style.fontWeight = "bold";
                    discord_message.style.fontSize = "23px";
                    discord_message.innerText = message.message;
                }
            }
        });
    }

    async function ask_key_popup(buttons) {
        return new Promise(async (resolve) => {
            var div = document.createElement("div");

            div.style.backgroundColor = "rgba(150, 150, 150, 0.5)";
            div.style.height = "100vh";
            div.style.position = "relative"
            div.style.display = "flex";
            div.style.justfyContent = "center";
            div.style.alignItems = "center";
            div.style.zIndex = 1000;
            document.body.appendChild(div);

            html_content = await fetch(chrome.runtime.getURL('enc_popup.html'))
                .then((response) => response.text())
                .then(data => {
                    return data;
                })

            div.innerHTML = html_content;

            let create_key_b = document.getElementById("create_enc_key");
            let exit_b = document.getElementById("exit_enc_popup");

            create_key_b.onclick = () => {
                div.remove();
                resolve(true);
            }


            exit_b.onclick = () => {
                div.remove();
                resolve(false);
            }

            div.onclick = (event) => {
                if (div.checkVisibility() && event.target === div) {
                    document.body.removeChild(div);
                    resolve(false);
                }
            }
        });
    }

    var get_channel_id = () => {
        let url = window.location.href;
        return url.substring(url.lastIndexOf('/') + 1);
    }

    function create_discord_button() {
        try {
            if (!port_is_open) {
                alert("reconnecting...")
                bg_port = chrome.runtime.connect({ name: "content" });
                listen_for_messages()
                port_is_open = true
            }
            let button_div = document.querySelector("[class*='inner_'][class*='sansAttachButton']").querySelector("[class*='buttons_']")
            let enc_button = document.createElement("button");
            let enc_pic = document.createElement("img");
            enc_pic.src = chrome.runtime.getURL('enc-icon.svg');

            enc_button.onclick = async () => {
                //send to send only the encrypted message (needed pubkey from storage)
                const message_str = document.querySelector('[class*="markup"][class*="editor"]').querySelector("span span span").textContent
                bg_port.postMessage({ type: "b_click", channel_id: get_channel_id(), message: message_str })

            }

            enc_button.id = "enc_button";
            enc_button.ariaExpanded = false;
            enc_button.ariaHasPopup = "dialog";
            enc_button.style.backgroundColor = "rgba(0,0,0,0)";
            enc_button.appendChild(enc_pic);
            button_div.appendChild(enc_button);

        } catch (err) {
            console.warn(err.message);

        }
    }

//    var api.sendMessage = (message, channel_id, auth) => {
//        if (!auth) {
//            console.error("bad auth")
//            return 0
//        }
//
//        const fetchOptions = {
//            "body": `{"content":"` + message.normalize() + `","tts":false}`,
//            "method": "POST",
//            "headers": {
//                "Accept": "*/*",
//                "Accept-Language": "en-US",
//                "Authorization": auth,
//                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9015 Chrome/108.0.5359.215 Electron/22.3.12 Safari/537.36",
//                "X-Super-Properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfdmVyc2lvbiI6IjEuMC45MDE1Iiwib3NfdmVyc2lvbiI6IjEwLjAuMjI2MjEiLCJvc19hcmNoIjoieDY0Iiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV09XNjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIGRpc2NvcmQvMS4wLjkwMTUgQ2hyb21lLzEwOC4wLjUzNTkuMjE1IEVsZWN0cm9uLzIyLjMuMTIgU2FmYXJpLzUzNy4zNiIsImJyb3dzZXJfdmVyc2lvbiI6IjIyLjMuMTIiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjoyMTYzODUsIm5hdGl2ZV9idWlsZF9udW1iZXIiOjM0ODk4LCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
//                "Content-Type": "application/json"
//            }
//
//        };
//        fetch(`https://discord.com/api/v9/channels/${channel_id}/messages`, fetchOptions)
//    }

    var authHeader = ''


    var bg_port = chrome.runtime.connect({ name: "content" });
    var port_is_open = true;

    let currentPage = location.href;

    function create_button_on_message(message, text, func, bg_color = "#7CB342") {

        let b_decrypt = document.createElement("button")
        b_decrypt.name = text
        b_decrypt.textContent = text
        b_decrypt.style.backgroundColor = bg_color
        b_decrypt.style.border = "solid"
        b_decrypt.style.borderWidth = "3px"
        discord_message = message;

        b_decrypt.onclick = func

        message.appendChild(b_decrypt);
    }

    async function reload() {

        create_discord_button();
        let text;
        const rel_enc_message_code = enc_message_code.replace("\\n", "\n")
        if (location.href.includes("channels")) {
            let messages = await api.getMessages(get_channel_id(), 50)
            messages.forEach(function (discord_message) {
                if (discord_message.author.id === curr_usr.id){
                    bg_port.postMessage({type:"msg-load",id:discord_message.id})
                    return
                }


                //discord_message = a[i];
                text = discord_message.content //discord_message.innerText;
                let message_element = document.getElementById("message-content-" + discord_message.id)


                if (text.includes(rel_enc_message_code.replace("\\n", "\n")) && messages) {

                    const encrypted_text = text.replace(rel_enc_message_code, "")

                    let button_func = () => {
                        bg_port.postMessage({ type: "dec-message", message: encrypted_text, message_id: discord_message.id, channel_id: discord_message.channel_id })
                    }


                    create_button_on_message(message_element, "decrypt", button_func)
                    delete button_func

                } else if (text.includes(key_message_code.replace("\\n", "\n")) && messages) {
                    let t = text

                    let button_func = () => bg_port.postMessage({ type: "pub-set", key: message_to_exported(t), channel_id: get_channel_id() })

                    create_button_on_message(message_element, "set key", button_func, "#AD52CA")

                    delete button_func
                }
            })
        }
    }


    setInterval(function () {
        if (currentPage != location.href) {
            currentPage = location.href;
            reload()
        }
    }, 50);

    listen_for_messages()

    bg_port.onDisconnect.addListener(function () {
        alert("disconnected");
        port_is_open = false;
    })
})();
