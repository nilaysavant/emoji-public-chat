/**
 * Emoji chat v1.2.1
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
const emojiRegex = require('emoji-regex');

/** create new database obj */
let db = new database()

/** new emoji regex */
const regex = emojiRegex();

/** Server Port Variable */
const PORT = process.env.PORT || 3000

/** enable/disable server */
const ENABLE_SERVER = true

/** tag variable */
const TAG = process.env.TAG

/** a logger for express */
app.use(morgan('dev'))

/** Custom Variables START -----------------------------------------------------*/

/** DB sync interval */
const DB_SYNC_INTERVAL = 15000 /** In MS */
/** to reset and init DB */
const INIT_DB = false

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

/**
 * Get only emojis as string from text
 * @param {string} text string text input
 */
const getEmojiString = (text) => {
  let output = ""
  if (text) {
    while (match = regex.exec(text)) {
      const emoji = match[0];
      output = output + emoji + " "
    }
  }
  return output
}

/** CUSTOM FUNCTION END --------------------------------------------------------- */


/** MAIN FUNCTION STARTS ---------------------------------------------------------- */
const main = async function () {

  /** init database */
  if (INIT_DB) {
    console.log("Init DB...(RESET)")
    await db.initDatabase()
  }


  /** sync with db at regular intervals */
  await db.syncDB()
  setInterval(() => {
    /** notify users of sync */
    io.emit('chat', {
      name: 'Backup Bot 🤖️',
      timestamp: getUTCDateTime(),
      value: 'Backing up messages... please standby',
    })

    db.syncDB()
    console.log('sycing db -----')
  }, DB_SYNC_INTERVAL);

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
        let name = null
        let timestamp = messg.timestamp
        let value = messg.value

        /** strip messg value to only emojis after storing it in value */
        messg.value = getEmojiString(messg.value)

        let stats = db.data.stats

        if (id || id === 0) {
          /** check if user exists */
          if (db.userExists(id)) {
            /** get username for provided id */
            name = db.getUserName(id)

            if ((name || name === false) && timestamp && (value || value === false)) {

              /** check for tag */
              if (value.startsWith(TAG)) {
                let comm = value.split('!')[1]
                console.log('----- proces COMM ------:', comm)
                /** process comm */
                if (comm) {
                  let split_comm = comm.split(',')
                  let command = split_comm[0]
                  let param1 = split_comm[1]
                  let param2 = split_comm[2]

                  /** check if command is delete and param1 is valid number*/
                  if (command === 'delete' && !isNaN(param1) && !isNaN(param2)) {
                    let index_from_latest = parseInt(param1)
                    let count = parseInt(param2)
                    if (Number.isInteger(index_from_latest) && Number.isInteger(count)) {
                      db.deleteMessages(index_from_latest, count)
                    } else {
                      console.error("count/index not integer!")
                    }
                  } else if (command === 'namechange' && param1) {
                    let new_name = param1
                    db.setUserName(id, new_name)
                  } else if (command === 'adm' && param1) {
                    /** command for admin text messgs */
                    let text_messg = param1
                    /** set value of messg obj toext_messg */
                    messg.value = text_messg
                    if (messg.value) {
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
                      console.error("Messg contains no emoji, not sending")
                    }

                  } else {
                    console.error("command invalid/not found!")
                  }
                } else {
                  console.error("invalid comm")
                }
              } else {
                if (messg.value) {
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
                  console.error("Messg contains no emoji, not sending")
                }
              }
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

          // console.log('db.data.users', db.data.users)

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
            /** get user name for corresponding id from db */
            let user_name = db.getUserName(user_id)

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

            // console.log('db.data.users', db.data.users)

            /** send packet */
            send({
              user_id: user_id,
              user_name: user_name,
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

            // console.log('db.data.users', db.data.users)

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
if (ENABLE_SERVER) {
  main()
} else {
  console.error("ENABLE_SERVER is FALSE, exiting...")
  process.exit(1)
}