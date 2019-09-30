/**
 * Emojichat v1.2.3
 */
const socket = io();

/** get dom objects */

let number_of_messages = document.getElementById("message_number_label")
let number_of_users = document.getElementById("user_number_label")

let sendButton = document.getElementById("chat-send-btn")
let typeBox = document.getElementById("chat-type-box")

let chatbox_messgbox = document.getElementById("chatbox-messgbox-id")

/** custom global vars ---------------*/

/** for scroll */
let firstTime = true

/** user id */
let USER_ID = null
/** user name */
let USER_NAME = null

/** global vars end ----------------- */

/** custom functions start -----------*/

/**
 * Function returns UTC date time in yyyy-mm-dd hh:mm:ss
 */
const getUTCDateTime = () => {
    return new Date().toUTCString()
}

/** 
 * get local time from UTC time string in format 
 */
const convertToLocalTime = (utc_time_string) => {
    let new_time_inst = new Date(utc_time_string)
    let datetime = new_time_inst.getFullYear() +
        "-" + ('0' + (new_time_inst.getMonth() + 1)).slice(-2)
        + "-" + ('0' + new_time_inst.getDate()).slice(-2)
        + " " + ('0' + new_time_inst.getHours()).slice(-2)
        + ":" + ('0' + new_time_inst.getMinutes()).slice(-2)
        + ":" + ('0' + new_time_inst.getSeconds()).slice(-2)
    return datetime
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

/** send key on enter press */
typeBox.addEventListener("keyup", function (event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        sendButton.click();
    }
});

/** Loads Initial chat history */
const loadInitMessgs = () => {
    if (USER_ID) {
        socket.emit('chat-init', USER_ID, (data) => {
            console.log("Recvd:", data);
            if (data || data === false) {
                if (data['user_id']) {
                    /** assign the new user id (if)provided */
                    USER_ID = data['user_id']
                    /** save id to local storage */
                    localStorage.setItem('USER_ID', USER_ID)
                } else {
                    console.error('No ID recvd!')
                }
                if (data['user_name']) {
                    /** assign new user name if provided */
                    USER_NAME = data['user_name']
                    /** save username to local storage */
                    localStorage.setItem('USER_NAME', USER_NAME)
                } else {
                    console.error("No user name recvd")
                }
                if (data['old_messages']) {
                    data['old_messages'].forEach((messg, index) => {
                        createChatMessgItem(messg.name, convertToLocalTime(messg.timestamp), messg.value)
                    })
                    scrollToBottom(chatbox_messgbox)
                } else {
                    console.error("no old messges recvd!")
                }

                let stats = data['stats']
                if (stats && Object.keys(stats).length > 0) {
                    number_of_messages.innerText = stats.number_of_messages
                    number_of_users.innerText = stats.number_of_users
                } else {
                    console.error("stats invalid!")
                    number_of_messages.innerText = ""
                    number_of_users.innerText = ""
                }
            }

        });
    } else {
        socket.emit('chat-init', 'init', (data) => {
            console.log("Recvd:", data);
            if (data || data === false) {
                if (data['user_id']) {
                    /** if user id is not defined */
                    if (!USER_ID) {
                        USER_ID = data['user_id']
                        /** save id to local storage */
                        localStorage.setItem('USER_ID', USER_ID)
                    }
                } else {
                    console.error('No ID recvd!')
                }
                if (data['user_name']) {
                    /** if user name is not defined */
                    if (!USER_NAME) {
                        USER_NAME = data['user_name']
                        /** save username to local storage */
                        localStorage.setItem('USER_NAME', USER_NAME)
                    }
                } else {
                    console.error("User Name invalid!")
                }
                if (data['old_messages']) {
                    data['old_messages'].forEach((messg, index) => {
                        createChatMessgItem(messg.name, convertToLocalTime(messg.timestamp), messg.value)
                    })
                    scrollToBottom(chatbox_messgbox)
                } else {
                    console.error("no old messges recvd!")
                }

                let stats = data['stats']
                if (stats && Object.keys(stats).length > 0) {
                    number_of_messages.innerText = stats.number_of_messages
                    number_of_users.innerText = stats.number_of_users
                } else {
                    console.error("stats invalid!")
                    number_of_messages.innerText = ""
                    number_of_users.innerText = ""
                }
            }
        });
    }
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
    /** clear input type box */
    typeBox.value = ""

    /** get date time */
    let datetime = getUTCDateTime()

    let user = USER_ID

    let message = {
        id: user,
        name: USER_NAME,
        timestamp: datetime,
        value: message_text
    }

    console.log("Send:", message)

    socket.emit('chat', message, (data) => {
        console.log("Recvd:", data);
        if (data || data === false) {
            createChatMessgItem(data['name'], convertToLocalTime(data['timestamp']), data['value'])
            scrollToBottom(chatbox_messgbox)
        }
    });
}

/** custom functions end -----------*/

/** main exec */
const MAIN = () => {
    /** set event handler for send btn */
    sendButton.onclick = sendMessage

    /** get user details from local store */
    USER_ID = localStorage.getItem('USER_ID')
    USER_NAME = localStorage.getItem('USER_NAME')

    /** load init messgs */
    loadInitMessgs()

    /** listen for chats */
    socket.on('chat', (data) => {
        console.log("Recvd:", data)
        if (data || data === false) {
            createChatMessgItem(data['name'], convertToLocalTime(data['timestamp']), data['value'])
            scrollToBottom(chatbox_messgbox)
        }
    })
}

/** RUN MAIN ---------------------------------------------------------------- */
MAIN()
