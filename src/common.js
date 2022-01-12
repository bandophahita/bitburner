export const baseUrl = 'https://raw.githubusercontent.com/bandophahita/bitburner/master/src/'
export const hackPrograms = ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe']
export const hackScripts = ['hack.js', 'grow.js', 'weaken.js']


/** @param {NS} ns */
export function getPlayerDetails(ns) {
    let portHacks = 0

    hackPrograms.forEach((hackProgram) => {
        if (ns.fileExists(hackProgram, 'home')) {
            portHacks += 1
        }
    })

    return {
        hackingLevel: ns.getHackingLevel(),
        portHacks,
    }
}

// ------------------------------------------------------------------------------------------------
export function settings() {
    return {
        minSecurityLevelOffset: 2,
        maxMoneyMultiplayer: 0.9,
        minSecurityWeight: 100,
        mapRefreshInterval: 24 * 60 * 60 * 1000,
        keys: {
            serverMap: 'BB_SERVER_MAP',
            hackTarget: 'BB_HACK_TARGET',
            action: 'BB_ACTION',
        },
    }
}

// ------------------------------------------------------------------------------------------------
export function getItem(key) {
    let item = localStorage.getItem(key)
    return item ? JSON.parse(item) : undefined
}

// ------------------------------------------------------------------------------------------------
export function setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

// ------------------------------------------------------------------------------------------------
/** @param {number} ms */
export function localeHHMMSS(ms = 0) {
    if (!ms) {
        ms = new Date().getTime()
    }
    return new Date(ms).toLocaleTimeString()
}

export function createUUID() {
    var dt = new Date().getTime()
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0
        dt = Math.floor(dt / 16)
        return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
    return uuid
}

// ------------------------------------------------------------------------------------------------
/** @param {NS} ns */
// export async function main(ns) {
//     ns.tprint("************* COMMON WAS CALLED!!!! ******************")
//     return {
//         settings,
//         getItem,
//         setItem,
//         localeHHMMSS,
//         createUUID,
//         getPlayerDetails,
//         hackScripts,
//         hackPrograms,
//         baseUrl,
//     }
// }
