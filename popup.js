( async () => {
    function make_list(args){// Sample data arra
    // Sample data array (replace with your actual data)
    const data = args

    // Function to create list item elements
    function createListItem(item) {
        const listItem = document.createElement("li");
        listItem.classList.add("object-item");

        const itemName = document.createElement("h2");
        itemName.textContent = item.name;
        listItem.appendChild(itemName);

        const itemDescription = document.createElement("p");
        itemDescription.textContent = item.description;
        listItem.appendChild(itemDescription);

        const deleteButton = document.createElement("button")
        deleteButton.id = "delete"
        deleteButton.innerHTML = "<img src='resorces/delete.svg'> "
        listItem.appendChild(deleteButton)

        deleteButton.onclick = () => {
            objectList.removeChild(listItem)
            item["deleteFunc"]()
        }

        return listItem;
    }

    // Populate the list with items
    const objectList = document.getElementById("object-list");
    data.forEach(item => {
        const listItem = createListItem(item);
        listItem.id = "list-item"
        objectList.appendChild(listItem);
    });

    // Set container size and add scrollbar
    const objectContainer = document.getElementById("object-container");
    objectContainer.style.width = "400px"; // Adjust width as needed
    objectContainer.style.height = "300px"; // Adjust height as needed
    objectContainer.style.overflowY = "auto";
}

var port = chrome.runtime.connect({name: "popup"});

const selection = document.getElementById("channel-selection")

async function set_channel_id(){
    const objectList = document.getElementById("object-list");
    objectList.innerHTML = ""
    const storage = await chrome.storage.local.get()
    const channel_id = selection.value
    const messages = storage[channel_id]["Messages"]
    Object.keys(messages).forEach((message_id) => 
        {
            make_list([{name:messages[message_id]["message"] , description: message_id, deleteFunc: () => {
            delete storage[channel_id]["Messages"][message_id];
            chrome.storage.local.set(storage);
        }
}])
        }
    )
}

function add_channel_id_opt(channel_id){
    const option = document.createElement("option")
    option.innerText = channel_id
    selection.appendChild(option)
}

port.onMessage.addListener( async function (message) {
    if (message.type === "add_message"){
        make_list({name:message.name , description: message.message,         })
    }
});


document.getElementById('object-container').style.visibility = "visible"
const storage = await chrome.storage.local.get();
add_channel_id_opt("select a channel-id")
console.log(selection.value)
Object.keys(storage).forEach((item) => 
    {
        add_channel_id_opt(item)

    }
)

selection.onchange = set_channel_id
})();
