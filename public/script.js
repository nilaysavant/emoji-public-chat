const socket = io();

/** get dom objects */
let sendButton = document.getElementById("chat-send-btn")
let typeBox = document.getElementById("chat-type-box")

let chatbox_messgbox = document.getElementById("chatbox-messgbox-id")



/** custom functions start -----------*/

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

let firstTime = true
/** chat scroll to bottm */
const scrollToBottom = (container) => {
    console.table({
        scrollTop: container.scrollTop,
        clientHeight: container.clientHeight,
        sum: container.scrollTop + container.clientHeight,
        scrollHeight: container.scrollHeight
    })
    if (firstTime) {
        container.scrollTop = container.scrollHeight;
        firstTime = false;
    } else if ((container.scrollHeight - container.scrollTop + container.clientHeight) < 1060) {
        container.scrollTop = container.scrollHeight;
    }
}

/** send messg via sockets */
const sendMessage = () => {
    let message = typeBox.value
    console.log("Sent:", message)

    socket.emit('chat', message, (data) => {
        console.log("Recvd:", data);
        if (data || data === false) {
            createChatMessgItem('Someya Walva', '20/09/2019 15:35', data)
            scrollToBottom(chatbox_messgbox)
        }
    });
}

/** custom functions end -----------*/

/** main exec */

sendButton.onclick = sendMessage

/** listen for chats */
socket.on('chat', (data) => {
    console.log("Recvd:", data)
    if (data || data === false) {
        createChatMessgItem('Someya Walva', '20/09/2019 15:35', data)
        scrollToBottom(chatbox_messgbox)
    }
})
