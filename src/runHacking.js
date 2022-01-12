// RUN THIS SCRIPT 
// This is the primary script that should be run when kicking off the script after having already downloaded everything.
// It's primary purpose is to run mainHack but also determines if the HOME has enough ram (32 gb)
// to start running playerServers.js too.



// ------------------------------------------------------------------------------------------------
/** @param {NS} ns */
export async function main(ns) {
    async function runOnce(file){
        if (!ns.isRunning(file)){
            ns.tprint(`Spawning ${file}`)
            await ns.run(file, 1)
        }
    }
    ns.tprint(`Starting runHacking.js`)
    let targetName = ns.args[0] || ""
    let hostname = ns.getHostname()

    if (hostname !== 'home') {
        throw new Exception('Run the script from home')
    }

    const homeRam = ns.getServerMaxRam('home')

    if (homeRam >= 32) {
        await runOnce('reminders.js')
        await runOnce('hacknet_buyer.js')
        
        ns.tprint(`Spawning spider.js`)
        await ns.run('spider.js', 1, 'mainHack.js', targetName)
        await ns.sleep(3000)
        ns.tprint(`Spawning playerServers.js`)
        ns.spawn('playerServers.js', 1)
    } else {
        await runOnce('reminders.js')
        ns.tprint(`Spawning spider.js`)
        ns.spawn('spider.js', 1, 'mainHack.js', targetName)
    }
}
