import { localeHHMMSS, getItem, setItem, getPlayerDetails, hackPrograms, hackScripts, createUUID } from 'common.js'

const settings = {
    homeRamReserved: 40,
    homeRamReservedBase: 40,
    homeRamExtraRamReserved: 64,
    homeRamBigMode: 64,
    minSecurityLevelOffset: 1,
    maxMoneyMultiplayer: 0.9,
    minSecurityWeight: 100,
    mapRefreshInterval: 24 * 60 * 60 * 1000, // every 24 hours?
    maxWeakenTime: 30 * 60 * 1000,
    keys: {
        serverMap: 'BB_SERVER_MAP',
    },
    changes: {
        hack: 0.002,
        grow: 0.004,
        weaken: 0.05,
    },
}

const RAM_HACK = 1.7;
const RAM_GROW = 1.75;
const RAM_WEAK = 1.75;  


// ------------------------------------------------------------------------------------------------
/** @param {number} ms */
function convertMSToHHMMSS(ms = 0) {
    if (ms <= 0) {
        return '00:00:00'
    }

    if (!ms) {
        ms = new Date().getTime()
    }

    return new Date(ms).toISOString().substr(11, 8)
}

// ------------------------------------------------------------------------------------------------
/** @param {number} x */
function numberWithCommas(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')
}


// ------------------------------------------------------------------------------------------------
/** 
 * @param {number} growCycles
 * @returns {number}
*/
function weakenCyclesForGrow(growCycles) {
    return Math.max(0, Math.ceil(growCycles * (settings.changes.grow / settings.changes.weaken)))
}

// ------------------------------------------------------------------------------------------------
/** @param {number} hackCycles */
function weakenCyclesForHack(hackCycles) {
    return Math.max(0, Math.ceil(hackCycles * (settings.changes.hack / settings.changes.weaken)))
}

// ------------------------------------------------------------------------------------------------
/**
 * @param {NS} ns 
 * @param {Object} servers
 * @returns {Array<string>}
 */
async function getHackableServers(ns, servers) {
    const playerDetails = getPlayerDetails(ns)

    const hackableServers = Object.keys(servers)
        .filter((hostname) => ns.serverExists(hostname))
        .filter((hostname) => servers[hostname].ports <= playerDetails.portHacks || ns.hasRootAccess(hostname))
        .filter((hostname) => servers[hostname].ram >= 2)

    for (const hostname of hackableServers) {
        if (hostname === 'home') continue;
        if (!ns.hasRootAccess(hostname)) {
            hackPrograms.forEach((hackProgram) => {
                if (ns.fileExists(hackProgram, 'home')) {
                    ns[hackProgram.split('.').shift().toLocaleLowerCase()](hostname)
                }
            })
            ns.nuke(hostname)
        }
        await ns.scp(hackScripts, hostname)
    }
    hackableServers.sort((a, b) => servers[a].ram - servers[b].ram)
    return hackableServers
}

// ------------------------------------------------------------------------------------------------
/** 
 * @param {NS} ns 
 * @param {Array<string>} serversList
 * @param {Object} servers
 * @param {Object} serverExtraData
 * @returns {Array<string>}
 */
function findTargetServer(ns, serversList, servers, serverExtraData) {
    const playerDetails = getPlayerDetails(ns)

    serversList = serversList
        .filter((hostname) => servers[hostname].hackingLevel <= playerDetails.hackingLevel)
        .filter((hostname) => servers[hostname].maxMoney)
        .filter((hostname) => hostname !== 'home')
        .filter((hostname) => ns.getWeakenTime(hostname) < settings.maxWeakenTime)

    let weightedServers = serversList.map((hostname) => {
        const fullHackCycles = Math.ceil(100 / Math.max(0.00000001, ns.hackAnalyze(hostname)))
        const host = servers[hostname]
        serverExtraData[hostname] = {
            fullHackCycles,
        }
        const serverValue = host.maxMoney * (settings.minSecurityWeight / (host.minSecurityLevel + ns.getServerSecurityLevel(hostname)))

        return {
            hostname,
            serverValue,
            minSecurityLevel: host.minSecurityLevel,
            securityLevel: ns.getServerSecurityLevel(hostname),
            maxMoney: host.maxMoney,
        }
    })

    weightedServers.sort((a, b) => b.serverValue - a.serverValue)
    // SHOW the Array of dictionaries 
    //ns.print(JSON.stringify(weightedServers, null, 2)) 
    return weightedServers.map((server) => server.hostname)
}



// ------------------------------------------------------------------------------------------------
/** @param {NS} ns */
export async function main(ns) {
    ns.print(" ####################### START OF SCRIPT ############################### ")
    ns.disableLog("disableLog")
    ns.disableLog("exec");
    ns.disableLog("getServerSecurityLevel");
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("getHackingLevel");
    ns.disableLog("scp");
    ns.disableLog("sleep");

    ns.tprint(`Starting mainHack.js`)
    let hostname = ns.getHostname()
    let targetNameManual = ns.args[0] 
    let targetName

    if (hostname !== 'home') {
        throw new Exception('Run the script from home')
    }

    while (true) {
        ns.print("-".repeat(80))
        ns.tprint("-".repeat(80))

        const serverExtraData = {}
        const serverMap = getItem(settings.keys.serverMap)
        
        // DEBUG 
        //ns.print(JSON.stringify(serverMap, undefined, 2))

        // TODO: detect if home ram was upgraded. 
        if (serverMap.servers.home.ram >= settings.homeRamBigMode) {
            settings.homeRamReserved = settings.homeRamReservedBase + settings.homeRamExtraRamReserved
        }

        if (!serverMap || serverMap.lastUpdate < new Date().getTime() - settings.mapRefreshInterval) {
            ns.tprint(`Spawning spider.js`)
            ns.spawn('spider.js', 1, 'mainHack.js')
            ns.exit()
            return
        }
        serverMap.servers.home.ram = Math.max(0, serverMap.servers.home.ram - settings.homeRamReserved)

        const hackableServers = await getHackableServers(ns, serverMap.servers)
        const targetServers = findTargetServer(ns, hackableServers, serverMap.servers, serverExtraData)
        ns.print(JSON.stringify(targetServers))

        if (!targetNameManual) {
            targetName = targetServers[0]
        } else {
            targetName = targetNameManual
        }
        
        const hackTime = ns.getHackTime(targetName)
        const growTime = ns.getGrowTime(targetName)
        const weakenTime = ns.getWeakenTime(targetName)
        const growDelay = Math.max(0, weakenTime - growTime - 15 * 1000)
        const hackDelay = Math.max(0, growTime + growDelay - hackTime - 15 * 1000)
        const securityLevel = ns.getServerSecurityLevel(targetName)
        const money = ns.getServerMoneyAvailable(targetName)
        const target = serverMap.servers[targetName]

        let action = 'weaken'
        if (securityLevel > target.minSecurityLevel + settings.minSecurityLevelOffset) {
            action = 'weaken'
        } else if (money < target.maxMoney * settings.maxMoneyMultiplayer) {
            action = 'grow'
        } else {
            action = 'hack'
        }

        let hackCycles = 0
        let growCycles = 0
        let weakenCycles = 0

        for (let i = 0; i < hackableServers.length; i++) {
            const server = serverMap.servers[hackableServers[i]]
            hackCycles += Math.floor(server.ram / RAM_HACK)
            growCycles += Math.floor(server.ram / RAM_GROW)
        }
        weakenCycles = growCycles

        // ns.print("-------------------------- START ---------------------------------")
        // ns.print(`Cycles ratio: GROW: ${growCycles} WEAKEN: ${weakenCycles} HACK: ${hackCycles}`)
        // ns.print(Object.keys(serverMap))
        // ns.print(JSON.stringify(serverMap, undefined, 2))
        // ns.print(target)
        // ns.print(`Stock: baseSecurity: ${target.baseSecurityLevel}; minSecurity: ${target.minSecurityLevel}; maxMoney: $${ns.nFormat(target.maxMoney, "0,0")}`)
        // ns.print(`Current: SECURITY: ${Math.floor(securityLevel * 1000) / 1000}; MONEY: $${ns.nFormat(money, "0,0")}`)
        // ns.print("-------------------------- END ---------------------------------")

        ns.tprint(`TARGET: ${targetName}  ACTION: ${action}  WAKE: ${localeHHMMSS(new Date().getTime() + weakenTime + 300)} (${convertMSToHHMMSS(weakenTime + 300)})`)
        ns.tprint(`Stock: baseSecurity: ${target.baseSecurityLevel}; minSecurity: ${target.minSecurityLevel}; maxMoney: $${ns.nFormat(target.maxMoney, "0,0")}`)
        ns.tprint(`Current: SECURITY: ${Math.floor(securityLevel * 1000) / 1000}; MONEY: $${ns.nFormat(money, "0,0")}`)
        ns.tprint(`TimeTo: HACK: ${convertMSToHHMMSS(hackTime)} GROW: ${convertMSToHHMMSS(growTime)} WEAKEN: ${convertMSToHHMMSS(weakenTime)}`)
        ns.tprint(`Delays: HACK: ${convertMSToHHMMSS(hackDelay)} GROW: ${convertMSToHHMMSS(growDelay)}`)

        if (action === 'weaken') { //WEAKEN
            if (settings.changes.weaken * weakenCycles > securityLevel - target.minSecurityLevel) {
                weakenCycles = Math.ceil((securityLevel - target.minSecurityLevel) / settings.changes.weaken)
                growCycles -= weakenCycles
                growCycles = Math.max(0, growCycles)
                weakenCycles += weakenCyclesForGrow(growCycles)
                growCycles -= weakenCyclesForGrow(growCycles)
                growCycles = Math.max(0, growCycles)
            } else {
                growCycles = 0
            }

            ns.tprint(`Cycles ratio: GROW: ${growCycles} WEAKEN: ${weakenCycles}  expected security reduction: ${Math.floor(settings.changes.weaken * weakenCycles * 1000) / 1000}`)
            //ns.print(`Cycles ratio: GROW: ${growCycles} WEAKEN: ${weakenCycles}  expected security reduction: ${Math.floor(settings.changes.weaken * weakenCycles * 1000) / 1000}`)
            for (let i = 0; i < hackableServers.length; i++) {
                const server = serverMap.servers[hackableServers[i]]
                let cyclesFittable = Math.max(0, Math.floor(server.ram / RAM_WEAK))
                const cyclesToRun = Math.max(0, Math.min(cyclesFittable, growCycles))

                if (growCycles) {
                    await ns.exec('grow.js', server.host, cyclesToRun, targetName, cyclesToRun, growDelay, createUUID())
                    growCycles -= cyclesToRun
                    cyclesFittable -= cyclesToRun
                }

                if (cyclesFittable) {
                    await ns.exec('weaken.js', server.host, cyclesFittable, targetName, cyclesFittable, 0, createUUID())
                    weakenCycles -= cyclesFittable
                }
            }
        } else if (action === 'grow') { // GROW
            weakenCycles = weakenCyclesForGrow(growCycles)
            growCycles -= weakenCycles

            ns.tprint(`Cycles ratio: GROW: ${growCycles} WEAKEN: ${weakenCycles}`)

            for (let i = 0; i < hackableServers.length; i++) {
                const server = serverMap.servers[hackableServers[i]]
                let cyclesFittable = Math.max(0, Math.floor(server.ram / RAM_GROW))
                const cyclesToRun = Math.max(0, Math.min(cyclesFittable, growCycles))

                if (growCycles) {
                    await ns.exec('grow.js', server.host, cyclesToRun, targetName, cyclesToRun, growDelay, createUUID())
                    growCycles -= cyclesToRun
                    cyclesFittable -= cyclesToRun
                }

                if (cyclesFittable) {
                    await ns.exec('weaken.js', server.host, cyclesFittable, targetName, cyclesFittable, 0, createUUID())
                    weakenCycles -= cyclesFittable
                }
            }
        } else { //HACK
            if (hackCycles > serverExtraData[targetName].fullHackCycles) {
                hackCycles = serverExtraData[targetName].fullHackCycles

                if (hackCycles * 100 < growCycles) {
                    hackCycles *= 10
                }

                growCycles = Math.max(0, growCycles - Math.ceil((hackCycles * RAM_HACK) / RAM_GROW))

                weakenCycles = weakenCyclesForGrow(growCycles) + weakenCyclesForHack(hackCycles)
                growCycles -= weakenCycles
                hackCycles -= Math.ceil((weakenCyclesForHack(hackCycles) * RAM_WEAK) / RAM_HACK)

                growCycles = Math.max(0, growCycles)
            } else {
                growCycles = 0
                weakenCycles = weakenCyclesForHack(hackCycles)
                hackCycles -= Math.ceil((weakenCycles * RAM_WEAK) / RAM_HACK)
            }

            ns.tprint(`Cycles ratio: GROW: ${growCycles} WEAKEN: ${weakenCycles} HACK: ${hackCycles}`)
            //ns.print(`Cycles ratio: GROW: ${growCycles} WEAKEN: ${weakenCycles} HACK: ${hackCycles}`)
            for (let i = 0; i < hackableServers.length; i++) {
                const server = serverMap.servers[hackableServers[i]]
                let cyclesFittable = Math.max(0, Math.floor(server.ram / RAM_HACK))
                const cyclesToRun = Math.max(0, Math.min(cyclesFittable, hackCycles))

                if (hackCycles) {
                    await ns.exec('hack.js', server.host, cyclesToRun, targetName, cyclesToRun, hackDelay, createUUID())
                    hackCycles -= cyclesToRun
                    cyclesFittable -= cyclesToRun
                }

                const freeRam = server.ram - cyclesToRun * RAM_HACK
                cyclesFittable = Math.max(0, Math.floor(freeRam / 1.75))

                if (cyclesFittable && growCycles) {
                    const growCyclesToRun = Math.min(growCycles, cyclesFittable)

                    await ns.exec('grow.js', server.host, growCyclesToRun, targetName, growCyclesToRun, growDelay, createUUID())
                    growCycles -= growCyclesToRun
                    cyclesFittable -= growCyclesToRun
                }

                if (cyclesFittable) {
                    await ns.exec('weaken.js', server.host, cyclesFittable, targetName, cyclesFittable, 0, createUUID())
                    weakenCycles -= cyclesFittable
                }
            }
        }

        await ns.sleep(weakenTime + 300)
    }


}
