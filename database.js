const axios = require("axios")
const randName = require('random-name')


/** load env vars */
require("dotenv").config()

/** get jsonstore.io(DB) link from .env */
const DB_URL = process.env.DB_URL
if (DB_URL) {
    /** check if var is valid */
    /** https://stackoverflow.com/questions/5515310/is-there-a-standard-function-to-check-for-null-undefined-or-blank-variables-in?rq=1 */
    console.log("DB link read suceess!")
} else {
    console.error("DB link invalid! ")
    /** exit app server */
    process.exit(1)
}

const ADMIN_ID = process.env.ADMIN_ID
if (ADMIN_ID) {
    console.log("Admin ID initialised")
} else {
    console.error("admin id not initialised!")
    /** exit app server */
    process.exit(1)
}

/** dependency functions start -----------------*/

/**
 * Function returns UTC date time in yyyy-mm-dd hh:mm:ss
 */
const getUTCDateTime = () => {
    return new Date().toISOString().replace('T', ' ').substr(0, 19)
}

/** UUDI (unique id genrator) */
/** ref:https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript */
function uuidv4() {
    return 'xxyxxxyxyy'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/** dependency functions end -------------------*/



/** DB struct example*/
let db_struct = {
    users: [
        {
            id: ADMIN_ID,
            name: 'Nilay Savant',
            created: '2050/02/18 11:40'
        },
    ],
    messages: [
        {
            index: 0,
            id: ADMIN_ID,
            name: 'Nilay Savant',
            timestamp: '2050/03/04 13:54',
            value: "Hello? Anybody here? Anyways 😬️, welcome to my chat app! 🤗️ Be kind and have fun! 😜️"
        },
    ],
    stats: {
        number_of_messages: 1,
        number_of_users: 1,
    },
    config: {
        max_messages: 2000,
        message_backup_interval: 30
    }
}
// console.log(JSON.stringify(db_struct))

/**
 * Database Class: contains all api to work with db
 */
class database {
    constructor() {
        this.data = {
            users: [
                {
                    id: ADMIN_ID,
                    name: 'Nilay Savant',
                    created: '2050/02/18 11:40'
                },
            ],
            messages: [],
            stats: {},
            config: {
                max_messages: 2000,
                message_backup_interval: 30
            }
        }
        // this.resetDataObj()

        /** delete messg index list (to delete messgs with these index values) */
        this.delete_messg_index_list = []
        /** delete the listed users with user ids */
        this.delete_user_id_list = []
    }

    /**
     * Reset Data obj to init state
     * (Only clears object, Does NOT clear DB)
     */
    resetDataObj() {
        /** db model */
        // this.data = {
        //     users: [],
        //     messages: [],
        //     config: {}
        // }
        this.data = db_struct
    }

    /**
     * Init Database
     * Deletes evrything in DB!
     * Use with Caution
     */
    async initDatabase() {
        this.resetDataObj()
        let status = await this.pushData()
        if (status) {
            return true
        } else {
            console.error("db init error!")
        }
        return false
    }

    /**
     * Get data from DB
     */
    async getData() {
        let resp = await axios.get(DB_URL)
        let temp_db = resp.data.result
        /** check if db contains data already */
        if (temp_db) {
            if (Object.keys(temp_db).length > 0) {
                let old_users = temp_db.users
                let old_messages = temp_db.messages
                let old_config = temp_db.config

                /** create a copy of new data */
                let new_users = this.data.users
                let new_messgs = this.data.messages
                let new_config = this.data.config

                if (old_users) {
                    old_users.slice().reverse().forEach((old_user) => {
                        /** check if user is deleted */
                        let deleted = this.delete_user_id_list.findIndex((del_id) => {
                            return del_id === old_user.id
                        })
                        /** if not found deleted */
                        if (deleted === -1) {
                            let index = new_users.findIndex((user) => {
                                return user.id === old_user.id
                            })
                            /** for new user ie. no existing index */
                            if (index === -1) {
                                new_users.unshift(old_user)
                            }
                        }
                    })
                    /** reset delete user list */
                    this.delete_user_id_list = []
                }

                if (old_messages) {
                    old_messages.slice().reverse().forEach((old_messg) => {
                        /** check if user is deleted */
                        let deleted = this.delete_messg_index_list.findIndex((del_indx) => {
                            return del_indx === old_messg.index
                        })
                        /** if not found deleted */
                        if (deleted === -1) {
                            let index = new_messgs.findIndex((messg) => {
                                return messg.index === old_messg.index
                            })
                            /** for new user ie. no existing index */
                            if (index === -1) {
                                new_messgs.unshift(old_messg)
                            }
                        }
                    })
                    /** reset delete messg index list */
                    this.delete_messg_index_list = []
                }

                /** assign new data to existing data */
                this.data.users = new_users
                this.data.messages = new_messgs
                this.data.config = new_config

                /** set number of users and messages */
                this.data.stats.number_of_messages = this.data.messages.length
                this.data.stats.number_of_users = this.data.users.length
            }
            return true
        } else {
            console.error("DB empty!")
        }
        return false
    }


    /**
     * Push data to DB
     */
    async pushData() {
        // console.log("TCL: database -> pushData -> this.data", this.data)
        let status = await axios.post(DB_URL, this.data)
        if (status) {
            return true
        } else {
            console.error("push to db failed!")
        }
        return false
    }

    /**
     * Create new user
     */
    createUser() {
        let dateObj = new Date()
        let timeseconds = dateObj.getTime()
        /** generate new id for user */
        let id = uuidv4() + timeseconds
        /** gen new name */
        let name = `${randName.first()} ${randName.last()}`
        /** created timestamp(UTC) */
        let timestamp = getUTCDateTime()

        // console.log('new id:', id)

        let user = {
            id: id,
            name: name,
            created: timestamp,
        }

        /** Push to the users list in data */
        this.data.users.push(user)
        // console.log("TCL: database -> createUser -> this.data", this.data)

        return user
    }

    /**
     * Append messages to db
     */
    appendMessages(messg) {

        if (messg) {
            /** push message to data message list */
            this.data.messages.push({
                index: this.data.messages[this.data.messages.length - 1].index + 1,
                id: messg.id,
                name: messg.name,
                timestamp: messg.timestamp,
                value: messg.value
            })
        } else {
            console.error("Invalid messages")
        }

    }

    /**
     * Delete messges from latest
     * @param {*} index_from_latest default 0 for latest message, 1 for previous 
     * @param {*} delete_count number of mesages upwards from index(included) to delete
     */
    async deleteMessages(index_from_latest = 0, delete_count = 1) {
        if ((index_from_latest || index_from_latest === 0) && delete_count) {
            let length = this.data.messages.length
            // 20 - 1 - 1 = 18 
            
            /** get start index and end index for loop */
            let start_index = length - 1 - index_from_latest
            let end_index = start_index + delete_count
            let to_be_deleted = this.data.messages.slice(start_index, end_index)
            /** push the deleted messg index to the delete list */
            to_be_deleted.forEach((messg) => {
                this.delete_messg_index_list.push(messg.index)
            })

            /** delete from list */
            let spliced = this.data.messages.splice(start_index, delete_count)
            
            /** sync with database */
            await this.syncDB()

            console.log("delete sucesss")

        } else {
            console.error("Invalid index/count")
        }
    }

    /**
     * Sync DB with data Obj
     */
    async syncDB() {
        /** get from db first */
        let status = await this.getData()

        if (status) {
            let status = await this.pushData()
            if (status) {
                return true
            }
        } else {
            console.error("Could not getData from db")
        }
        return false
    }

    /**
     * Check if user (user id) exists
     */
    userExists(id) {
        /** find index of user with that id */
        let index = this.data.users.findIndex((user) => {
            return user.id === id
        })
        /** check if index is valid */
        if (index > -1) {
            return true
        } else {
            return false
        }
    }

    /**
    * get user name for provided user id
    * @param id provide userid
    */
    getUserName(id) {
        /** find index of user with that id */
        let index = this.data.users.findIndex((user) => {
            return user.id === id
        })
        /** check if index is valid */
        if (index > -1) {
            return this.data.users[index].name
        } else {
            return false
        }
    }

    /**
     * Set new user name for particular id provided
     */
    setUserName(id, new_name) {
        if (typeof new_name === 'string' || new_name instanceof String) {
            /** find index for particular id */
            let index = this.data.users.findIndex((user) => {
                return user.id === id
            })
            if (index > -1) {
                this.data.users[index].name = new_name
                console.log("username change success")
            } else {
                console.error("id not found!")
            }
        } else {
            console.error("please provide valid new name")
        }
    }


}

module.exports = database
