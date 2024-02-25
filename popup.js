function make_list(args){// Sample data arra
// Sample data array (replace with your actual data)
const data = args

// Function to create list item elements
function createListItem(item) {
  const listItem = document.createElement("li");
  listItem.classList.add("object-item");

  const itemName = document.createElement("h3");
  itemName.textContent = item.name;
  listItem.appendChild(itemName);

  const itemDescription = document.createElement("p");
  itemDescription.textContent = item.description;
  listItem.appendChild(itemDescription);

  return listItem;
}

// Populate the list with items
const objectList = document.getElementById("object-list");
data.forEach(item => {
  const listItem = createListItem(item);
  objectList.appendChild(listItem);
});

// Set container size and add scrollbar
const objectContainer = document.getElementById("object-container");
objectContainer.style.width = "400px"; // Adjust width as needed
objectContainer.style.height = "300px"; // Adjust height as needed
objectContainer.style.overflowY = "auto";
}
var port = chrome.runtime.connect({name: "popup"});
port.onMessage.addListener(function (message) {
    if (message.type === "set_auth", message.auth){
        make_list([{name: "hello", description:"test"}])
    }
});

