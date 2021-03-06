/**
 * @author Vivekanandan Sakthivelu
 * @version 1.0.0 
 */
var moment = require('moment');
var lockfile = require('lockfile');
var fs = require('fs');
var __select = require('./store/select');
var __delete = require('./store/delete');
var __insert = require('./store/insert');
var __update = require('./store/update');

// 2 bytes for new line
// 4 bytes for deliminator 
const SINGLE_TRANSACTION = 16416 + 2 + 4;
const DBSIZE = 2 * 1024 * 1024 * 1024;
// So , there can be ~130816 packets store
const MAX_OPERATIONS = DBSIZE / SINGLE_TRANSACTION;
var NUM_OPERATIONS = 0;
const ERROR = {
    'EEXIST': 'Some other process is using the file',
    '102': 'Key already exists, cannot insert supplied value',
    '103': 'Key doesnt exists to update',
    '104': 'Key supplied cannot be more than 32 Char',
    '105': 'Value supplied cannot be more than 16KB',
    '106': 'Store has reached it maximum limit',
    '107': 'Key Expired',
    '108': 'Unexpected Error',
    '109': 'DB Size exceeded'
}
var MEM_CACHE = {};
var MEM_SIZE = 0;


function store(path) {
    if (!(this instanceof store))
        return new store(path);
    if (!this.FILE_PATH)
        this.FILE_PATH = path;
    this.FILE_PATH = this.FILE_PATH || process.cwd() + '/' + moment().unix();
    try {
        if (!fs.existsSync(this.FILE_PATH))
            fs.createWriteStream(this.FILE_PATH);
        lockfile.lockSync(this.FILE_PATH + '.lock', {});
        NUM_OPERATIONS = parseInt(fs.fstatSync(this.FILE_PATH).size / SINGLE_TRANSACTION);
    } catch (error) {
        this.FILE_PATH = null;
        errorHandler(('code' in error) ? error['code'] : error);
    }

    process.on('SIGTERM', () => {
        lockfile.unlockSync(this.FILE_PATH + '.lock', {})
    });

    return this;
}

store.prototype.insert = async function (key, value, expiresIn) {
    try {
        // Check DB Size , if get close to maximum number of operations
        if (NUM_OPERATIONS >= MAX_OPERATIONS && (fs.statSync(this.FILE_PATH).size >= DBSIZE))
            throw '109';
        await __insert(this.FILE_PATH, key, value, expiresIn);
        console.log('INSERT 1');
        NUM_OPERATIONS = NUM_OPERATIONS + 1;
        return true;
    } catch (error) {
        errorHandler(error)
    }
    return false;
}

store.prototype.update = async function (key, value, expiresIn) {
    try {
        // Check DB Size , if get close to maximum number of operations
        if (NUM_OPERATIONS >= MAX_OPERATIONS && (fs.statSync(this.FILE_PATH).size >= DBSIZE))
            throw '109';

        await __update(this.FILE_PATH, key, value, expiresIn)
        return true;
    } catch (error) {
        errorHandler(error);
    }
    return false;
}

store.prototype.select = async function (key) {
    try {
        var value = await __select(this.FILE_PATH, key)
        return value;
    } catch (error) {
        errorHandler(error);
    }
    return null;
}


store.prototype.delete = async function (key) {
    try {
        var result = await __delete(this.FILE_PATH, key);
        console.log('DELETE ' + (result ? 1 : 0));
        NUM_OPERATIONS = NUM_OPERATIONS - 1;
        return result;
    } catch (error) {
        errorHandler(error);
    }
    return false;
}




function errorHandler(error) {
    if (error in ERROR)
        return console.log(ERROR[error])
    console.log(error)
}

process.on('uncaughtException', function (error) {
    console.log('uncaughtException', error)

});

process.on('unhandledRejection', function (error) {
    console.log('unhandledRejection', error)
});

module.exports = store;