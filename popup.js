var button = document.getElementById("button");
var input = document.getElementById("message_input");
var extention = document.getElementById("extention");
chrome.storage.session.get(["popup_visibility"]).then((r) =>{
if (Object.keys(r).length === 0){
    extention.style.visibility = "hidden"
} else {
    extention.style.visibility = "visible"
}
})
var port = chrome.runtime.connect({name: "popup"});
port.onMessage.addListener(function (message) {
    if (message.type === "set_auth", message.auth){
        extention.style.visibility = "visible"
        chrome.storage.session.set({popup_visibility: true})
    }
});

button.onclick = () => {
    if (extention.style.visibility === "visible"){
        port.postMessage({message: input.value});
    }
}