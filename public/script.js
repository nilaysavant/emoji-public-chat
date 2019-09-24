const socket = io();




let count_box = document.getElementById("count_id")

const countUp = () => {
    console.log("count up clicked")
    socket.emit('event', 'up', (data) => {
        console.log("count:", data);
        if(data || data === false){
            count_box.innerHTML = parseInt(data)
        }
    });
}