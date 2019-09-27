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
  // await db.initDatabase()

  /** sync with db at regular intervals */
  await db.syncDB()
  setInterval(() => {
    db.syncDB()
    console.log('sycing db -----')
  }, 6000);

  /**
   * "/endpt" : POST
   * BODY: {}
   * 
   * echoes the req body
   */
  app.post('/endpt', (req, res) => {
    // console.log("TCL: req", req.body)
    res.json({ sent: req.body })
  })

  /**
   * check for connection
   */
  io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('chat', (messg, send) => {
      // console.log({ Recvd: messg })
      if (messg && Object.keys(messg).length > 0) {

        let id = messg.id
        let name = messg.name
        let timestamp = messg.timestamp
        let value = messg.value
        let stats = db.data.stats

        if (id || id === 0) {
          /** check if user exists */
          if (db.userExists(id)) {
            if ((name || name === false) && timestamp && (value || value === false)) {
              /** append message to db */
              db.appendMessages(messg)
              // send(messg)
              /** broadcast to everyone in chat */
              io.emit('chat', {
                name: messg.name,
                timestamp: messg.timestamp,
                value: messg.value,
                stats: db.data.stats
              })
            } else {
              console.error("received message is invalid!")
            }
          } else {

          }
        } else {
          console.error("id is invalid!")
        }

      } else {
        console.error("Invalid Messg recvd !")
      }
    });

    socket.on('chat-init', (messg, send) => {
      // console.log({ Recvd: messg })
      if (messg || messg === false) {
        /** if new user (messg === init) */
        if (messg === 'init') {
          /** gen new user */
          let new_user = db.createUser()

          let old_messages = []
          db.data.messages.forEach((mes, indx) => {
            // console.log("TCL: mes", mes)
            old_messages.push({
              id: mes.id,
              name: mes.name,
              timestamp: mes.timestamp,
              value: mes.value
            })
          })

          console.log('db.data.users', db.data.users)

          /** send packet */
          send({
            user_id: new_user.id,
            user_name: new_user.name,
            old_messages: old_messages,
            stats: db.data.stats,
          })
        } else { /** if messg !== 'init' */

          /** check if user exists */
          let user_id = messg /** for exitsing users: user id is sent as messg */
          /** check if user exists */
          if (db.userExists(user_id)) {
            let old_messages = []
            db.data.messages.forEach((mes, indx) => {
              // console.log("TCL: mes", mes)
              old_messages.push({
                id: mes.id,
                name: mes.name,
                timestamp: mes.timestamp,
                value: mes.value
              })
            })

            console.log('db.data.users', db.data.users)

            /** send packet */
            send({
              old_messages: old_messages,
              stats: db.data.stats,
            })
          } else { /** user does not exist, so create new user */
            console.error("user does not exist, creating new")
            /** gen new user */
            let new_user = db.createUser()

            let old_messages = []
            db.data.messages.forEach((mes, indx) => {
              // console.log("TCL: mes", mes)
              old_messages.push({
                id: mes.id,
                name: mes.name,
                timestamp: mes.timestamp,
                value: mes.value
              })
            })

            console.log('db.data.users', db.data.users)

            /** send packet */
            send({
              user_id: new_user.id,
              user_name: new_user.name,
              old_messages: old_messages,
              stats: db.data.stats,
            })
          }
        }
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