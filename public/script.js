const socket = io();

/** get dom objects */
let sendButton = document.getElementById("chat-send-btn")
let typeBox = document.getElementById("chat-type-box")

/** custom functions start -----------*/
const sendMessage = () => {
    let message = typeBox.value
    console.log("Sent:", message)

    socket.emit('chat', message, (data) => {
        console.log("Recvd:", data);
        if(data || data === false){
            //
        }
    });
}

const countUp = () => {
    console.log("count up clicked")
    socket.emit('chat', 'up', (data) => {
        console.log("count:", data);
        if(data || data === false){
            count_box.innerHTML = parseInt(data)
        }
    });
}
/** custom functions end -----------*/


sendButton.onclick = sendMessage