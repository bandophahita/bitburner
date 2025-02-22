/*
[shares, avgPx, sharesShort, avgPxShort] 
    Returns an array of four elements that represents the player’s position in a stock.
    The first element is the returned array is the number of shares the player owns of the stock in the Long position. 
    The second element in the array is the average price of the player’s shares in the Long position.
    The third element in the array is the number of shares the player owns of the stock in the Short position. 
    The fourth element in the array is the average price of the player’s Short position.
*/

const WARN = 'warning';
const ERROR = 'error';
const GOOD = 'success';
const INFO = 'info';
const BUY = INFO;
const SELL = WARN;
const ttime = 20000;
var totalMoneyAllocation = 0.2 // 20%

/** @param {NS} ns */
// function determinemPctKeep(ns, ){
//     switch (totalGross) {
//         case 1000000: // 1m : 50%
//             rt = 0.5;
//             break;
//         case 100000000: // 100m 
//             break;
//         case 1000000000: // 1b
//             break;
//         case 100000000000: // 100b
//             break;
//         case 1000000000000: // 1t
//     }
//     return
// }

function money(ns){
    return ns.getPlayer().money
}


/** @param {NS} ns */
export async function main(ns) {
    //*********PARAMS FOR SCRIPT ************//
    var maxSharePer = 0.45                   // maximum percent of a symbol's total stock to buy
    var stockBuyPer = 0.6                    // percent probablity to buy symbol
    var stockVolPer = .03                    // percent stock will move to buy
    var moneyKeep = Math.max(money(ns) * 0.97, 1000000000) // min money to keep on hand 1000000000 = 1b
    var minBuy = 10000000;                   // min buy amount - default 10000000 = 10m
    var minSharePer = 5                      // min shares to buy
    var orderMax = 1000000000000             // max money to spend on a single order 1,000,000,000,000 = 1t
    var profPer = 0.05                       // min profit percentage to sell
    var panicPer = 0.15                      // percentage loss to panic sell at
    //******************************//
    ns.disableLog('disableLog');
    ns.disableLog('sleep');
    ns.disableLog('getServerMoneyAvailable');

    let mode_sell_only = ns.args[0]
    var possibleMoneyKeep
    while (true) {
        if (mode_sell_only){
            ns.print("------ SELL ONLY MODE -------");
        } else {
            ns.print("-----------------------------");
        }
        
        possibleMoneyKeep = money(ns) * (1-totalMoneyAllocation)
        if (possibleMoneyKeep > moneyKeep){
            moneyKeep = possibleMoneyKeep
            ns.print(`Increased moneyKeep`)
        }
        
        var stocks = ns.stock.getSymbols();
        var ownedStocks = new Set()
        for (const stock of stocks) {
            var [nShares, avgPx, sharesShort, avgPxShort] = ns.stock.getPosition(stock);
            //var forecast = ns.stock.getForecast(stock);
            if (nShares) {
                if (!sellPositions(stock)) {
                    ownedStocks.add(stock)
                }
            }
            if (!mode_sell_only){
                if (buyPositions(stock)) {
                    ownedStocks.add(stock)
                }
            }
        }

        if (mode_sell_only && !ownedStocks.length) {
            ns.print("no more owned stocks.")
            ns.exit()
        }

        var totalProfit = 0
        var totalGross = 0
        for (const stock of ownedStocks) {
            let [nShares, profit, gross] = calcPosition(stock)
            totalProfit += profit
            totalGross += gross
        }
        let fmt_total_profit = ns.nFormat(totalProfit, "0.00a")
        let fmt_total_gross = ns.nFormat(totalGross, "0.00a")
        ns.print(`Total Gross: $${fmt_total_gross.padEnd(7, " ")}      Total Profit: $${fmt_total_profit}`)
        ns.print(`Keeping at least ${ns.nFormat(moneyKeep, "0.000a")}  playerMoney ${ns.nFormat(money(ns), "0.000a")}`)
        await ns.sleep(6000);
    }

    // ***************************** //
    /** @param {string} stock */
    function sellPositions(stock) {
        //sell if only 40% chance increase
        let forecast = ns.stock.getForecast(stock);
        if (forecast < 0.4) {
            let current_price = ns.stock.sell(stock, nShares);
            let current_total = nShares * current_price;
            let fmt_price = ns.nFormat(current_price, '0.0a');
            let fmt_total = ns.nFormat(current_total, '0.0a');
            let amtsold = Math.round(ns.stock.getSaleGain(stock, nShares, "Long") - (nShares * avgPx))
            let fmt_amtsold = ns.nFormat(amtsold, '0.0a')
            let msg = `SOLD ${stock} for $${fmt_total} : $${fmt_amtsold} profit!  `
            
            ns.toast(msg, SELL, ttime);
            //ns.tprint(msg)
            ns.print(msg)
            return true
        }
        return false
    }
    /** @param {string} stock */
    function buyPositions(stock) {
        var maxShares = (ns.stock.getMaxShares(stock) * maxSharePer) - nShares;
        var askPrice = ns.stock.getAskPrice(stock);
        var forecast = ns.stock.getForecast(stock);
        var volPer = ns.stock.getVolatility(stock);
        var playerMoney = money(ns)
        
        //if the stock will move positive by stockbuyper or more and it will grow stockvolper or more
        if (forecast >= stockBuyPer && volPer <= stockVolPer) {
            //check money for one share
            // playerMoney - moneyKeep
            if (playerMoney - moneyKeep > ns.stock.getPurchaseCost(stock, minSharePer, "Long")) {
                var shares = Math.round(Math.min((playerMoney - moneyKeep - 100000) / askPrice, orderMax / askPrice));
                if (shares * askPrice > minBuy) {
                    let nBuyShares = Math.min(shares, maxShares);
                    if (nBuyShares > 0) {
                        let current_price = ns.stock.buy(stock, nBuyShares);
                        let current_total = nBuyShares * current_price;
                        //let fmt_price = ns.nFormat(current_price, '0.0a');
                        let fmt_total = ns.nFormat(current_total, '0.0a');
                        let msg = `BOUGHT ${stock} for $${fmt_total}`
                        ns.toast(msg, BUY, ttime);
                        //ns.tprint(msg);
                        ns.print(msg);
                        return true
                    }

                }
            }
        }
        return false
    }

    /** @param {string} stock */
    function calcPosition(stock) {
        var [nShares, avgPx, sharesShort, avgPxShort] = ns.stock.getPosition(stock);
        var forecast = ns.stock.getForecast(stock);
        let profit = 0
        let gross = 0
        if (nShares) {
            //let bar = (nShares * avgPx); // money we have tied up in our shares
            gross = ns.stock.getSaleGain(stock, nShares, "Long"); // money we'll get for selling
            profit = Math.round(gross - (nShares * avgPx)); // amount money gained 
            let fmt_profit = ns.nFormat(profit, '0.0a')
            let pct_profit = ns.nFormat(gross / (nShares * avgPx), "0%");
            let fmt_nshares = ns.nFormat(nShares, '0.0a');
            ns.print(`Position: ${stock.padEnd(4, " ")}  Shares: ${fmt_nshares.padEnd(7, " ")}  Profit: $${fmt_profit.padEnd(7, " ")} :: ${pct_profit}`)
        }
        return [nShares, profit, gross]
    }

}
