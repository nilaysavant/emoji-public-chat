/**
 * Socket.IO test code
 * 
 */

const path = require('path')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const axios = require("axios")
const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const randName = require('random-name')

/** load env vars */
require("dotenv").config()

/** get jsonstore.io(DB) link from .env */
const DB = process.env.DB
if (DB || DB === false) {
  /** check if var is valid */
  /** https://stackoverflow.com/questions/5515310/is-there-a-standard-function-to-check-for-null-undefined-or-blank-variables-in?rq=1 */
  console.log("DB link read suceess!")
} else {
  console.error("DB link invalid! ", DB)
}

/** Server Port Variable */
const PORT = process.env.PORT || 3000

/** a logger for express */
app.use(morgan('dev'))

/** Custom Variables START -----------------------------------------------------*/

/** Messages list Global Object*/
let MESSAGES_LIST = []

/** Custom Variables END -----------------------------------------------------*/

/** to parse the body of post requests -> bodyParser : */
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

/** Set public folder */
app.use(express.static(path.join(__dirname, 'public')))

/** handle exceptions and errors */
app.use(logErrors)
app.use(clientErrorHandler)
app.use(errorHandler)


/** EXCEPTION HANDLING FUNCTIONS START ------------------------------------------ */

function logErrors(err, req, res, next) {
  console.error(err.stack)
  next(err)
}

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(500).json({ error: 'Something failed!' })
  } else {
    next(err)
  }
}

function errorHandler(err, req, res, next) {
  res.status(500).json({ error: 'Something failed!' })
}

/** EXCEPTION HANDLING FUNCTIONS END -------------------------------------------- */


/** CUSTOM FUNCTION START ------------------------------------------------------- */

/**
 * Function returns UTC date time in yyyy-mm-dd hh:mm:ss
 */
const getUTCDateTime = () => {
  return new Date().toISOString().replace('T', ' ').substr(0, 19)
}

/**
 * Initialise jsonstore DB to init values
 * @param {JSON Object} initDataObj Init value JSON object
 */
const databaseInit = async (initDataObj) => {
  /** make post req to set jsonstore db to provided init values */
  await axios.post(DB, initDataObj)
  console.log('DB init complete...')
}

/** UUDI (unique id genrator) */
/** ref:https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript */
function uuidv4() {
  return 'xxyxxxyxyy'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
}

/** CUSTOM FUNCTION END --------------------------------------------------------- */


/** MAIN FUNCTION STARTS ---------------------------------------------------------- */
const main = async function () {

  // databaseInit({
  //   date: getUTCDateTime(),
  //   count: 0
  // })

  /**
   * "/endpt" : POST
   * BODY: {}
   * 
   * echoes the req body
   */
  app.post('/endpt', (req, res) => {
    console.log("TCL: req", req.body)
    res.json({ sent: req.body })
  })

  /**
   * check for connection
   */
  io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('chat', (messg, send) => {
      console.log({ Recvd: messg })
      if (messg !== undefined && messg !== null) {
        MESSAGES_LIST.push(messg)
        // send(messg)
        /** broadcast to everyone in chat */
        io.emit('chat', messg)
      } else {
        console.error("Invalid Messg recvd !")
      }
    });

    socket.on('chat-init', (messg, send) => {
      console.log({ Recvd: messg })
      if (messg !== undefined && messg !== null && messg === 'init') {
        /** generate new uuid */
        let id = uuidv4()

        /** send packet */
        send({
          user_id: id,
          user_name: `${randName.first()} ${randName.last()}`,
          old_messages: MESSAGES_LIST
        })
      } else {
        console.error("Invalid Messg recvd !")
      }
    });

    /** ref: https://stackoverflow.com/questions/9230647/socket-io-setinterval-way */
    // let i = 0
    // setInterval(()=> {
    //   i += 1
    //   socket.emit('chat', 'lorem ipsum tets mesg: '+ i)
    // }, 1000)
  });


  /**
   * Listen for requests on port
   */
  http.listen(PORT, () => {
    console.log('Serving on port:', PORT)
  })

}
/** MAIN FUNCTION ENDS ----------------------------------------------------------- */


/** MAIN EXECUTION (Do not remove!) ----------------------------------------------- */
main()