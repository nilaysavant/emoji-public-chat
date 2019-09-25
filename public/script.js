const socket = io();

/** get dom objects */
let sendButton = document.getElementById("chat-send-btn")
let typeBox = document.getElementById("chat-type-box")

let chatbox_messgbox = document.getElementById("chatbox-messgbox-id")

/** custom global vars ---------------*/

/** for scroll */
let firstTime = true

/** user id */
let USER_ID = null

/** global vars end ----------------- */

/** custom functions start -----------*/

/**
 * Function returns UTC date time in yyyy-mm-dd hh:mm:ss
 */
const getUTCDateTime = () => {
    return new Date().toISOString().replace('T', ' ').substr(0, 19)
  }

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

/** Loads Initial chat history */
const loadInitMessgs = () => {
    socket.emit('chat-init', 'init', (data) => {
        console.log("Recvd:", data);
        if (data || data === false) {
            if (data['new_user']) {
                USER_ID = data['new_user']
            } else {
                console.error('No ID recvd!')
            }
            if(data['old_messages']){
                data['old_messages'].forEach((messg, index)=> {
                    createChatMessgItem(messg.user_id, messg.datetime, messg.text)
                })
                scrollToBottom(chatbox_messgbox)
            } else {
                console.error("no old messges recvd!")
            }
        }
    });
}

/** chat scroll to bottm */
/** REF: https://stackoverflow.com/questions/25505778/automatically-scroll-down-chat-div */
const scrollToBottom = (container) => {
    // console.table({
    //     scrollTop: container.scrollTop,
    //     clientHeight: container.clientHeight,
    //     sum: container.scrollTop + container.clientHeight,
    //     scrollHeight: container.scrollHeight
    // })
    if (firstTime) {
        container.scrollTop = container.scrollHeight;
        firstTime = false;
    } else if ((container.scrollHeight - container.scrollTop + container.clientHeight) < 1060) {
        container.scrollTop = container.scrollHeight;
    }
}

/** send messg via sockets */
const sendMessage = () => {
    let message_text = typeBox.value

    /** get date time */
    let datetime = getUTCDateTime()

    let user = USER_ID

    let message = {
        user_id: user,
        datetime: datetime,
        text: message_text
    }
    
    console.log("Send:", message)

    socket.emit('chat', message, (data) => {
        console.log("Recvd:", data);
        if (data || data === false) {
            createChatMessgItem(data['user_id'], data['datetime'], data['text'])
            scrollToBottom(chatbox_messgbox)
        }
    });
}

/** custom functions end -----------*/

/** main exec */

sendButton.onclick = sendMessage

/** load init messgs */
loadInitMessgs()

/** listen for chats */
socket.on('chat', (data) => {
    console.log("Recvd:", data)
    if (data || data === false) {
        createChatMessgItem(data['user_id'], data['datetime'], data['text'])        
        scrollToBottom(chatbox_messgbox)
    }
})
