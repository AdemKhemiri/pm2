const os = require("node:os")

function getUserInfo() {
    const {username} = os.userInfo();
    const hostname = os.hostname()
    const cpuModel = os.cpus()[0].model

    return { username, hostname, cpuModel }
}

module.exports = getUserInfo
