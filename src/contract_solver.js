// THiS IS MY VERSION OF THE CONTRACT SOLVER
import { printPathToServer, } from 'find.js'
import { getItem, } from 'common.js'

/** @param {NS} ns **/
export async function main(ns) {
    function log(msg) {
        ns.tprintf(`${msg}`);
        ns.print(msg);
    }
    ns.disableLog("disableLog")
    let serverMap = getItem('BB_SERVER_MAP')
    let servers = getEveryServer(ns);
    
    for (let server of servers) {
        let files = ns.ls(server, ".cct");
        if (!files.length) { continue }

        log(`${server} - ${files} found`)

        for (let file of files) {
            let data = ns.codingcontract.getData(file, server);
            let type = ns.codingcontract.getContractType(file, server);
            let answer;
            let found = true;
            switch (type) {
                case "Algorithmic Stock Trader I":
                    if (data.length > 1) {
                        answer = await solverStockTrader(ns, [1, data]);
                    } else {
                        answer = 0;
                    }
                    break;
                case "Algorithmic Stock Trader II":
                    if (data.length > 1) {
                        answer = await solverStockTrader(ns, [Math.floor(data.length / 2), data]);
                    } else {
                        answer = 0;
                    }
                    break;
                case "Algorithmic Stock Trader III":
                    if (data.length > 1) {
                        answer = await solverStockTrader(ns, [2, data]);
                    } else {
                        answer = 0;
                    }
                    break;
                case "Algorithmic Stock Trader IV":
                    answer = await solverStockTrader(ns, data)
                    break;
                case "Minimum Path Sum in a Triangle":
                    answer = await solverTrianglePath(ns, data);
                    break;
                case "Unique Paths in a Grid I":
                    answer = await solverUniquePaths(ns, data)
                    break;
                case "Unique Paths in a Grid II":
                    answer = await solverUniquePathsII(ns, data);
                    break;
                case "Generate IP Addresses":
                    answer = await solverGenerateIPs(ns, data);
                    break;
                case "Find Largest Prime Factor":
                    answer = await solverLargestPrime(ns, data);
                    break;
                case "Spiralize Matrix":
                    answer = await solverSpiralizeMatrix(ns, data);
                    break;
                case "Merge Overlapping Intervals":
                    answer = await solverMergeRanges(ns, data);
                    break;
                case "Find All Valid Math Expressions":
                    answer = await solverWaysToExpress(ns, data);
                    break;
                case "Subarray with Maximum Sum":
                    answer = await solverLargestSubset(ns, data);
                    break;
                case "Array Jumping Game":
                    answer = solverArrayJumpingGame(ns, data)
                    break;
                default:
                    log(`ERROR Unhandled contract: ${type}`)
                    found = false
                    log(`${printPathToServer(serverMap.servers, server)}`)
                    break;
            }
            if (found) {
                ns.print(`INFO ${answer}`)
                let output = ns.codingcontract.attempt(answer, file, server, { returnReward: true })
                let result = output.length ? "PASSED!" : "FAILED!"
                let loglvl = output.length ? "INFO" : "ERROR"
                log(`${loglvl} ${server} - ${file} - ${type} - ${result} ${output}`)
            }
        }
    } 

}


/** @param {NS} ns */
function getEveryServer(ns, rootHost = 'home') {
    ns.disableLog('sleep');
    ns.disableLog('scan')
    let pendingScan = [rootHost]
    const servers = []
    while (pendingScan.length) {
        const hostname = pendingScan.shift()
        servers.push(hostname)
        pendingScan.push(...ns.scan(hostname))
        pendingScan = pendingScan.filter(host => !servers.includes(host))
    }
    return [...servers]
}

function arraysEqual(a, b) {
    if (a === b) return true; if (a == null || b == null) return false; if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; ++i) { if (a[i] !== b[i]) return false; }
    return true;
}


// --------------------------------------------------------------------------
async function solverArrayJumpingGame(ns, arrayData) {
    await ns.sleep(50);
    ns.print("solverArrayJumpingGame()");
    let arrayJump = [1];

    for (let n = 0; n < arrayData.length; n++) {
        if (arrayJump[n]) {
            for (let p = n; p <= Math.min(n + arrayData[n], arrayData.length - 1); p++) { // fixed off-by-one error
                arrayJump[p] = 1;
            }
        }
    }

    return 0 + Boolean(arrayJump[arrayData.length - 1]); // thanks /u/Kalumniatoris
}

async function solverGenerateIPs(ns, arrayData) {
    ns.print("solverGenerateIPs()");
    await ns.sleep(50);
    let i, j, k, l;

    let arrayDigits = [];
    let arrayDelim = [];
    for (i = 0; i < arrayData.length; i++) {
        arrayDigits[i] = arrayData.substring(i, i + 1);
        arrayDelim[i] = "";
    }

    let validCandidates = [];

    for (i = 0; i < arrayData.length - 3; i++) {
        for (j = i + 1; j < arrayData.length - 2; j++) {
            for (k = j + 1; k < arrayData.length - 1; k++) {
                let arrayDelimScratch = JSON.parse(JSON.stringify(arrayDelim));
                arrayDelimScratch[i] = ".";
                arrayDelimScratch[j] = ".";
                arrayDelimScratch[k] = ".";

                let candidateAddress = "";
                for (l = 0; l < arrayData.length; l++) {
                    candidateAddress = candidateAddress + arrayDigits[l] + arrayDelimScratch[l];
                }

                let isValid = 1;
                for (l = 0; l < 4; l++) {
                    let tempOctet = candidateAddress.split(".")[l];
                    if (tempOctet.slice(0, 1) === "0") { isValid = 0; }
                    if (parseInt(tempOctet) > 255) { isValid = 0; }
                }
                if (isValid) {
                    validCandidates[validCandidates.length] = candidateAddress;
                }
            }
        }
    }

    let tempStr = JSON.stringify(validCandidates);
    return tempStr.replace(/\"/g, '');
}

async function solverLargestPrime(ns, arrayData) {
    ns.print("solverLargestPrime()");
    await ns.sleep(50);
    let primeFound = 0;

    while (!primeFound) {
        primeFound = 1;
        for (let i = 2; i < Math.sqrt(arrayData); i++) {
            if (!Boolean((arrayData / i) - Math.floor(arrayData / i))) {
                arrayData = arrayData / i;
                primeFound = 0;
            }
        }
    }

    return arrayData;
}

async function solverLargestSubset(ns, arrayData) {
    ns.print("solverLargestSubset()");
    await ns.sleep(50);
    let highestSubset = arrayData[0];

    for (let i = 0; i < arrayData.length; i++) {

        for (let j = i; j < arrayData.length; j++) {
            let tempSubset = 0;
            for (let k = i; k <= j; k++) {
                tempSubset += arrayData[k];
            }

            if (highestSubset < tempSubset) {
                highestSubset = tempSubset;
            }
        }
    }

    return highestSubset;
}

async function solverMergeRanges(ns, arrayData) {
    ns.print("solverMergeRanges()");
    await ns.sleep(50);

    let i, j, k;
    let rangeMax = 0;
    let rangeMin = 999;
    let outputRanges = [];

    for (i = 0; i < arrayData.length; i++) {
        rangeMin = Math.min(rangeMin, arrayData[i][0]);
        rangeMax = Math.max(rangeMax, arrayData[i][1]);
    }

    let activeRange = 0;
    let startRange, inRange;

    for (i = rangeMin; i <= rangeMax + 1; i++) {
        inRange = 0;

        for (j = 0; j < arrayData.length; j++) {
            if (i >= arrayData[j][0] && i < arrayData[j][1]) {
                inRange = 1;

                if (activeRange === 0) {
                    activeRange = 1;
                    startRange = i;
                }
            }
        }

        if (activeRange === 1 && inRange === 0) {
            activeRange = 0;
            outputRanges[outputRanges.length] = [startRange, i];
        }
    }

    return JSON.stringify(outputRanges);
}

async function solverSpiralizeMatrix(ns, arrayData) {
    ns.print("solverSpiralizeMatrix()");
    await ns.sleep(50);
    let i, j;

    let arrayY = arrayData.length;
    let arrayX = arrayData[0].length;

    let loopCount = Math.ceil(arrayX / 2) + 1;
    let marginData = [0, 1, 1, 0];

    let resultData = [];

    let lastWaypoint = [0, 0];

    resultData[0] = arrayData[0][0];

    for (i = 0; i < loopCount; i++) {
        if (marginData[0] + marginData[2] <= arrayY && marginData[1] + marginData[3] <= arrayX) {
            for (j = lastWaypoint[1] + 1; j <= arrayX - marginData[1]; j++) {
                resultData[resultData.length] = arrayData[lastWaypoint[0]][j];
            }

            lastWaypoint = [0 + marginData[0], arrayX - marginData[1]];
            marginData[0] += 1;
        }
        if (marginData[0] + marginData[2] <= arrayY && marginData[1] + marginData[3] <= arrayX) {
            for (j = lastWaypoint[0] + 1; j <= arrayY - marginData[2]; j++) {
                resultData[resultData.length] = arrayData[j][lastWaypoint[1]];
            }

            lastWaypoint = [arrayY - marginData[2], arrayX - marginData[1]];
            marginData[1] += 1;
        }
        if (marginData[0] + marginData[2] <= arrayY && marginData[1] + marginData[3] <= arrayX) {
            for (j = lastWaypoint[1] - 1; j >= 0 + marginData[3]; j--) {
                resultData[resultData.length] = arrayData[lastWaypoint[0]][j];
            }

            lastWaypoint = [arrayY - marginData[2], 0 + marginData[3]];
            marginData[2] += 1;
        }
        if (marginData[0] + marginData[2] <= arrayY && marginData[1] + marginData[3] <= arrayX) {
            for (j = lastWaypoint[0] - 1; j >= 0 + marginData[0]; j--) {
                resultData[resultData.length] = arrayData[j][lastWaypoint[1]];
            }

            lastWaypoint = [0 + marginData[0], 0 + marginData[3]];
            marginData[3] += 1;
        }
    }

    return JSON.stringify(resultData);


}

async function solverStockTrader(ns, arrayData) {
    ns.print("solverStockTrader()");
    await ns.sleep(50);

    let i, j, k;

    let tempStr = "[0";
    for (i = 0; i < arrayData[1].length; i++) {
        tempStr += ",0";
    }
    tempStr += "]";
    let tempArr = "[" + tempStr;
    for (i = 0; i < arrayData[0] - 1; i++) {
        tempArr += "," + tempStr;
    }
    tempArr += "]";
    ns.print(tempArr)
    let highestProfit = JSON.parse(tempArr);

    for (i = 0; i < arrayData[0]; i++) {
        for (j = 0; j < arrayData[1].length; j++) { // Buy / Start
            for (k = j; k < arrayData[1].length; k++) { // Sell / End
                if (i > 0 && j > 0 && k > 0) {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i][k - 1], highestProfit[i - 1][j - 1] + arrayData[1][k] - arrayData[1][j]);
                } else if (i > 0 && j > 0) {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i - 1][j - 1] + arrayData[1][k] - arrayData[1][j]);
                } else if (i > 0 && k > 0) {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i][k - 1], arrayData[1][k] - arrayData[1][j]);
                } else if (j > 0 && k > 0) {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i][k - 1], arrayData[1][k] - arrayData[1][j]);
                } else {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], arrayData[1][k] - arrayData[1][j]);
                }
            }
        }
    }
    return highestProfit[arrayData[0] - 1][arrayData[1].length - 1];
}

async function solverTrianglePath(ns, arrayData) {
    ns.print("solverTrianglePath()");
    await ns.sleep(50);
    let i, j;

    for (i = 1; i < arrayData.length; i++) {
        for (j = 0; j < arrayData[i].length; j++) {
            arrayData[i][j] += Math.min(arrayData[i - 1][Math.max(0, j - 1)], arrayData[i - 1][Math.min(j, arrayData[i - 1].length - 1)]);
        }
    }

    let finalRow = arrayData[arrayData.length - 1];
    let finalMinimum = 999;
    for (i = 0; i < finalRow.length; i++) {
        finalMinimum = Math.min(finalMinimum, finalRow[i]);
    }

    return finalMinimum;
}

async function solverUniquePaths(ns, arrayData) {
    ns.print("solverUniquePaths()");
    await ns.sleep(50);
    //let precalcFactorial = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800, 87178291200, 1307674368000, 20922789888000, 355687428096000, 6402373705728000, 121645100408832000, 2432902008176640000];

    //if (arrayData === undefined || arrayData === null) {
    //    return 1;
    //}

    //let factN = precalcFactorial[arrayData[0] + arrayData[1] - 2];
    //let factK = precalcFactorial[arrayData[0] - 1];
    //let factNK = precalcFactorial[arrayData[1] - 1];
    //

    let k = arrayData[0] - 1; // k
    let ak = arrayData[1] - 1; // n-k
    let n = k + ak; // n = k + (n-k);

    // n choose k = n!/[(k)!(n-k)!] = n! / k! / (n-k)!

    let i;
    let factN = 1,
        factAK = 1;

    for (i = n; i > k; i--) { // n!/k! = n * n-1 * n-2 ... k+1
        factN = factN * i;
    }
    for (i = ak; i > 1; i--) {
        factAK = factAK * i;
    }

    return (factN / factAK);
}

async function solverUniquePathsII(ns, arrayData) {
    ns.print("solverUniquePathsII()");
    await ns.sleep(50);
    let i, j, k;
    let pathsTo = [];
    for (i = 0; i < arrayData.length; i++) {
        pathsTo[i] = [];
        for (j = 0; j < arrayData[0].length; j++) {
            pathsTo[i][j] = 0;
        }
    }
    pathsTo[0][0] = 1;

    for (i = 0; i < arrayData.length; i++) {
        for (j = 0; j < arrayData[0].length; j++) {
            if (i > 0 && j > 0 && !arrayData[i][j]) {
                pathsTo[i][j] = pathsTo[i][j - 1] + pathsTo[i - 1][j];
            } else if (i > 0 && !arrayData[i][j]) {
                pathsTo[i][j] = pathsTo[i - 1][j];
            } else if (j > 0 && !arrayData[i][j]) {
                pathsTo[i][j] = pathsTo[i][j - 1];
            } else if (i === 0 && j === 0 && !arrayData[i][j]) {
                pathsTo[0][0] = 1;
            } else {
                pathsTo[i][j] = 0;
            }
        }
    }

    return pathsTo[pathsTo.length - 1][pathsTo[0].length - 1];
}

async function solverWaysToExpress(ns, arrayData) {
    ns.print("solverWaysToExpress()");
    await ns.sleep(50);
    let i, j, k;

    let operatorList = ["", "+", "-", "*"];
    let validExpressions = [];

    let tempPermutations = Math.pow(4, (arrayData[0].length - 1));

    for (i = 0; i < tempPermutations; i++) {

        if (!Boolean(i % 100000)) {
            ns.tprint(i + "/" + tempPermutations + ", " + validExpressions.length + " found.");
            await ns.sleep(100);
        }

        let arraySummands = [];
        let candidateExpression = arrayData[0].substr(0, 1);
        arraySummands[0] = parseInt(arrayData[0].substr(0, 1));

        for (j = 1; j < arrayData[0].length; j++) {
            candidateExpression += operatorList[(i >> ((j - 1) * 2)) % 4] + arrayData[0].substr(j, 1);

            let rollingOperator = operatorList[(i >> ((j - 1) * 2)) % 4];
            let rollingOperand = parseInt(arrayData[0].substr(j, 1));

            switch (rollingOperator) {
                case "":
                    rollingOperand = rollingOperand * (arraySummands[arraySummands.length - 1] / Math.abs(arraySummands[arraySummands.length - 1]));
                    arraySummands[arraySummands.length - 1] = arraySummands[arraySummands.length - 1] * 10 + rollingOperand;
                    break;
                case "+":
                    arraySummands[arraySummands.length] = rollingOperand;
                    break;
                case "-":
                    arraySummands[arraySummands.length] = 0 - rollingOperand;
                    break;
                case "*":
                    while (j < arrayData[0].length - 1 && ((i >> (j * 2)) % 4) === 0) {
                        j += 1;
                        candidateExpression += arrayData[0].substr(j, 1);
                        rollingOperand = rollingOperand * 10 + parseInt(arrayData[0].substr(j, 1));
                    }
                    arraySummands[arraySummands.length - 1] = arraySummands[arraySummands.length - 1] * rollingOperand;
                    break;
            }
        }

        let rollingTotal = arraySummands.reduce(function (a, b) { return a + b; });

        //if(arrayData[1] == eval(candidateExpression)){
        if (arrayData[1] === rollingTotal) {
            validExpressions[validExpressions.length] = candidateExpression;
        }
    }

    return JSON.stringify(validExpressions);
}

async function solverWaysToSum(ns, arrayData) {
    ns.print("solverWaysToSum()");
    await ns.sleep(50);
    let precalcPartitions = [0, 0, 1, 2, 4, 6, 10, 14, 21, 29, 41, 55, 76, 100, 134, 175, 230, 296, 384, 489, 626, 791, 1001, 1254, 1574, 1957, 2435, 3009, 3717, 4564, 5603, 6841, 8348, 10142, 12309, 14882, 17976, 21636, 26014, 31184, 37337, 44582, 53173, 63260, 75174, 89133, 105557, 124753, 147272, 173524, 204225, 239942, 281588, 329930, 386154, 451275, 526822, 614153, 715219, 831819, 966466, 1121504, 1300155, 1505498, 1741629, 2012557, 2323519, 2679688, 3087734, 3554344, 4087967, 4697204, 5392782, 6185688, 7089499, 8118263, 9289090, 10619862, 12132163, 13848649, 15796475, 18004326, 20506254, 23338468, 26543659, 30167356, 34262961, 38887672, 44108108, 49995924, 56634172, 64112358, 72533806, 82010176, 92669719, 104651418, 118114303, 133230929, 150198135, 169229874, 190569291, 214481125, 241265378, 271248949, 304801364, 342325708, 384276335, 431149388, 483502843, 541946239, 607163745, 679903202, 761002155, 851376627, 952050664, 1064144450, 1188908247, 1327710075, 1482074142, 1653668664, 1844349559, 2056148050, 2291320911, 2552338240, 2841940499, 3163127351, 3519222691, 3913864294, 4351078599, 4835271869, 5371315399, 5964539503, 6620830888, 7346629511, 8149040694, 9035836075, 10015581679, 11097645015, 12292341830, 13610949894, 15065878134, 16670689207, 18440293319, 20390982756, 22540654444, 24908858008, 27517052598, 30388671977, 33549419496, 37027355199];

    return precalcPartitions[arrayData];
}
