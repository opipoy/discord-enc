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

const enc_message_code = "-".repeat(20) + "discord-enc" + "-".repeat(20) + "\\n"

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
            port = chrome.runtime.connect({ name: "content" });
            port_is_open = true
        }
        let button_div = document.querySelector("[class*='inner_'][class*='sansAttachButton']").querySelector("[class*='buttons_']")
        let enc_button = document.createElement("button");
        let enc_pic = document.createElement("img");
        enc_pic.src = chrome.runtime.getURL('enc-icon.svg');

        enc_button.onclick = async () => {
            //send to send only the encrypted message (needed pubkey from storage)
            const message_str = document.querySelector('[class*="markup"][class*="editor"]').querySelector("span span span").textContent
            port.postMessage({ type: "b_click", channel_id: get_channel_id(), message: message_str})

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

var send_message = (message, channel_id, auth) => {
    if (!auth){
        console.error("bad auth")
        return 0
    }

    const fetchOptions = {
        "body": `{"content":"` + message.normalize() + `","tts":false}`,
        "method": "POST",
        "headers": {
            "Accept": "*/*",
            "Accept-Language": "en-US",
            "Authorization": auth,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9015 Chrome/108.0.5359.215 Electron/22.3.12 Safari/537.36",
            "X-Super-Properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfdmVyc2lvbiI6IjEuMC45MDE1Iiwib3NfdmVyc2lvbiI6IjEwLjAuMjI2MjEiLCJvc19hcmNoIjoieDY0Iiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV09XNjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIGRpc2NvcmQvMS4wLjkwMTUgQ2hyb21lLzEwOC4wLjUzNTkuMjE1IEVsZWN0cm9uLzIyLjMuMTIgU2FmYXJpLzUzNy4zNiIsImJyb3dzZXJfdmVyc2lvbiI6IjIyLjMuMTIiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjoyMTYzODUsIm5hdGl2ZV9idWlsZF9udW1iZXIiOjM0ODk4LCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
            "Content-Type": "application/json"
        }

    };
    fetch(`https://discord.com/api/v9/channels/${channel_id}/messages`, fetchOptions)
}

var authHeader = ''


var port = chrome.runtime.connect({ name: "content" });
var port_is_open = true;

let currentPage = location.href;

setInterval(function () {

    if (currentPage != location.href && location.href.includes("channels")) {

        currentPage = location.href;
        create_discord_button();
        let a = document.querySelectorAll("[id*=message-content]");
        let discord_message;

        for (let i = 0; i < a.length; i++) {
            discord_message = a[i];
            text = discord_message.innerText;
            let rel_enc_message_code = enc_message_code.replace("\\n", "\n")
            if (text.includes(rel_enc_message_code)) {
                let encrypted_text = text.replace(rel_enc_message_code, "")
                port.postMessage({type: "dec-message", message: encrypted_text, message_id: a[i].id.replace("message-content-", ""), channel_id:get_channel_id()})
            }
        }
    }
}, 500);



port.onMessage.addListener(async function (message) {
    if (message.type === "send-message" && authHeader != '') {

        send_message(message.message, get_channel_id(), authHeader)

    }
    if (message.type === "header") {

        const headers = message.request.requestHeaders;

        for (const header of headers) {
            if (header.name === "Authorization" && authHeader == '') {
                alert(`[discord-enc]: auth token found!`);
                authHeader = header.value;
                port.postMessage({ type: "got-auth", auth: true });
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
            console.warn(await export_key(keys.publicKey))
            port.postMessage({

                type: "key-set",

                channel_id: message.channel_id,

                public: await export_key(keys.publicKey),

                private: await export_key(keys.privateKey)
            });
        }
    }
    if (message.type === "set-message"){
        discord_message = document.getElementById("message-content-" + message.message_id)
        discord_message.innerHTML = message.message
    }
});

port.onDisconnect.addListener(function () {
    alert("disconnected");
    port_is_open = false;
})