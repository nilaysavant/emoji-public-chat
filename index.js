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
const database = require('./database')

/** create new database obj */
let db = new database()

/** Server Port Variable */
const PORT = process.env.PORT || 3000

/** a logger for express */
app.use(morgan('dev'))

/** Custom Variables START -----------------------------------------------------*/

/** Messages list Global Object*/
let MESSAGES_LIST = []
let MESSAGE_INDEX = 0
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

/** Database functions START--------------------------------------- */

/**
 * Initialise jsonstore DB to init values
 * @param {JSON Object} initDataObj Init value JSON object
 */
const databaseInit = async (initDataObj) => {
  /** make post req to set jsonstore db to provided init values */
  await axios.post(DB_URL, initDataObj)
  console.log('DB init complete...')
}

/** Database functions ENDs --------------------------------------- */


/** CUSTOM FUNCTION END --------------------------------------------------------- */


/** MAIN FUNCTION STARTS ---------------------------------------------------------- */
const main = async function () {

  /** init database */
  await db.initDatabase()

  // setInterval(() => {
  //   db.syncDB()
  // }, 6000);

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
        MESSAGE_INDEX += 1
        // MESSAGES_LIST.push({
        //   index: MESSAGE_INDEX,
        //   id: messg.id,
        //   name: messg.name,
        //   timestamp: messg.timestamp,
        //   message: messg.value
        // })

        db.appendMessages(messg, MESSAGE_INDEX)

        console.log("TCL: db.data", db.data)

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
        // /** generate new uuid */
        // let id = uuidv4()

        let new_user = db.createUser()

        let old_messages = []
        db.data.messages.forEach((mes, indx) => {
        console.log("TCL: mes", mes)
          old_messages.push({
            id: mes.id,
            name: mes.name,
            timestamp: mes.timestamp,
            value: mes.value
          })
        })

        /** send packet */
        send({
          user_id: new_user.id,
          user_name: new_user.name,
          old_messages: old_messages
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