import { getItem, } from 'common.js'

const settings = {
    mapRefreshInterval: 24 * 60 * 60 * 1000,
    keys: {
        serverMap: 'BB_SERVER_MAP',
    },
}
const scriptsToKill = [
    'mainHack.js',
    'spider.js',
    'grow.js',
    'hack.js',
    'weaken.js',
    'playerServers.js',
    'runHacking.js',
    'initHacking.js',
    'start.js',
    'find.js',
]

/** @param {NS} ns */
export async function main(ns) {
    ns.tprint(`Starting killAll.js`)
    const scriptToRunAfter = ns.args[0]
    
    let hostname = ns.getHostname()

    if (hostname !== 'home') {
        throw new Exception('Run the script from home')
    }

    const serverMap = getItem(settings.keys.serverMap)

    if (!serverMap || serverMap.lastUpdate < new Date().getTime() - settings.mapRefreshInterval) {
        ns.tprint(`Spawning spider.js`)
        ns.spawn('spider.js', 1, 'killAll.js')
        ns.exit()
        return
    }

    for (let i = 0; i < scriptsToKill.length; i++) {
        await ns.scriptKill(scriptsToKill[i], 'home')
    }

    const killAbleServers = Object.keys(serverMap.servers)
        .filter((hostname) => ns.serverExists(hostname))
        .filter((hostname) => hostname !== 'home')

    for (let i = 0; i < killAbleServers.length; i++) {
        await ns.killall(killAbleServers[i])
    }

    ns.tprint(`All processes killed`)

    if (scriptToRunAfter) {
        const targetName = ns.args[1] || ""
        //ns.tprint(`${targetName} in killAll`)
        ns.tprint(`Spawning ${scriptToRunAfter}`)
        ns.spawn(scriptToRunAfter, 1, targetName)
    } 
    // else {
    //     ns.tprint(`Spawning runHacking.js`)
    //     ns.spawn('runHacking.js', 1, targetName)
    // }
}
