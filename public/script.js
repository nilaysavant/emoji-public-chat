const socket = io();

/** get dom objects */
let sendButton = document.getElementById("chat-send-btn")
let typeBox = document.getElementById("chat-type-box")


/** creates the html for messg item */
const createChatMessgItem = (sender_name, date_time, messg) => {
    let chatbox_messgbox = document.getElementById("chatbox-messgbox-id")

    let messg_item = document.createElement('div')
    messg_item.className = 'chatbox__messg-item'

    let messg_item_sender = document.createElement('div')
    messg_item_sender.className = 'chatbox__messg-item-sender'
    messg_item_sender.innerText = sender_name

    let messg_item_date = document.createElement('div')
    messg_item_date.className = 'chatbox__messg-item-date'
    messg_item_date.innerText = date_time

    let messg_item_messg = document.createElement('div')
    messg_item_messg.className = 'chatbox__messg-item-messg'
    messg_item_messg.innerText = messg

    messg_item.appendChild(messg_item_sender)
    messg_item_sender.appendChild(messg_item_date)
    messg_item.appendChild(messg_item_messg)
    chatbox_messgbox.appendChild(messg_item)

}



/** custom functions start -----------*/
const sendMessage = () => {
    let message = typeBox.value
    console.log("Sent:", message)

    socket.emit('chat', message, (data) => {
        console.log("Recvd:", data);
        if (data || data === false) {
            createChatMessgItem('Someya Walva', '20/09/2019 15:35', data)
        }
    });
}

const countUp = () => {
    console.log("count up clicked")
    socket.emit('chat', 'up', (data) => {
        console.log("count:", data);
        if (data || data === false) {
            count_box.innerHTML = parseInt(data)
        }
    });
}
/** custom functions end -----------*/


sendButton.onclick = sendMessage