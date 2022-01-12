import { localeHHMMSS, getItem, setItem, getPlayerDetails, hackPrograms, hackScripts, createUUID } from 'common.js'

const WAKE_TIMER = 1000 * 20;  // 10 seconds
const TOAST_TIMER = 1000 * 10; // 10 seconds

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("sleep");

    let hostname = ns.getHostname()
    if (hostname !== 'home') {
        throw new Exception('Run the script from home')
    }

    while (true) {
        await checkDarkWeb(ns);
        await ns.sleep(WAKE_TIMER)
    }
}

function remind(ns, msg) {
        let m = `[REMINDER] ${msg}`
        ns.tprintf(`ERROR ${m}`)
        ns.toast(m, "error", TOAST_TIMER)
    }

/** @param {NS} ns */
async function checkDarkWeb(ns) {
    let me = ns.getPlayer()

    // BUY TOR ROUTER (gives access to DARKWEB)
    if (!me.tor) {
        if (me.money > 200000) {
            remind(ns, `Buy Tor Router`)
        }
    } else {
        // DID WE FULLY HACK DARKWEB? 
        // PROGRAMS TO BUY ON DARKWEB 
        let cost = {
            'BruteSSH.exe': 500000,
            'FTPCrack.exe': 1500000,
            'relaySMTP.exe': 5000000,
            'HTTPWorm.exe': 30000000,
            'SQLInject.exe': 250000000,
            'Formulas.exe': 5000000000,
        }
        function checkHaveProgram(file) {
            if (!ns.fileExists(file, 'home')) {
                if (me.money > cost[file]) {
                    remind(ns, `Buy ${file} @ $${ns.nFormat(cost[file], '0.0a')}`)
                }
            }
        }
        for (let program of Object.keys(cost)) {
            checkHaveProgram(program)
        }
    }
    /* 
    ServerProfiler.exe - $500.000k - Displays detailed information about a server.
    DeepscanV1.exe - $500.000k - Enables 'scan-analyze' with a depth up to 5.
    DeepscanV2.exe - $25.000m - Enables 'scan-analyze' with a depth up to 10.
    AutoLink.exe - $1.000m - Enables direct connect via 'scan-analyze'.
    */

    // upgrade RAM
    // upgrade CPU
}

async function checkFactions(ns){
    // need to check each requirement to join factions
    
}
