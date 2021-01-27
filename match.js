let req = require("request");
let ch = require("cheerio");
let path = require("path");
let xlsx = require("xlsx");
const fs = require("fs");
function processMatch(url) {
    req(url, cb);

}

function cb(error, response, data) {
    if (response.statusCode == 404) {
        console.log("Page not found");
    } else if (response.statusCode == 200) {
        parseHTML(data);
    } else {
        console.log(err);
    }
}

function parseHTML(data) {
    let fTool = ch.load(data);
    let elems = fTool(".Collapsible");
    for (let i = 0; i < elems.length; i++) {
        let InningElement = ch(elems[i]);
        let teamName = InningElement.find("h5").text();
        let stringArr = teamName.split("INNINGS")
        teamName = stringArr[0].trim();
        console.log("TeamName: ", teamName);
        let playerRows = InningElement.find(".table.batsman tbody tr");
        for (let j = 0; j < playerRows.length; j++) {
            let cols = ch(playerRows[j]).find("td");
            let isAllowed = ch(cols[0]).hasClass("batsman-cell");
            if (isAllowed) {
                let playerName = ch(cols[0]).text().trim();
                let runs = ch(cols[2]).text().trim();
                let balls = ch(cols[3]).text().trim();
                let fours = ch(cols[5]).text().trim();
                let sixes = ch(cols[6]).text().trim();
                let sr = ch(cols[7]).text().trim();
                console.log(`${playerName} played for ${teamName} and scored ${runs} runs in ${balls} balls with SR : ${sr}`)
                processPlayer(playerName, runs, balls, sixes, fours, sr, teamName);
            }
        }
    }
}
function processPlayer(playerName, runs, balls, sixes, fours, sr, teamName) {
    let playerObject = {
        playerName: playerName,
        runs: runs,
        balls: balls, sixes,
        fours: fours,
        sr: sr, teamName
    }
    let dirExist = checkExistence(teamName);
    if (dirExist) {

    } else {
        createFolder(teamName);
    }

    let playerFileName = path.join(__dirname, teamName, playerName + ".xlsx");
    let fileExist = checkExistence(playerFileName);
    let playerEntries = [];
    if (fileExist) {
        let JSONdata = excelReader(playerFileName, playerName)
        playerEntries = JSONdata;
        playerEntries.push(playerObject);
        excelWriter(playerFileName, playerEntries, playerName);
    } else {
        playerEntries.push(playerObject);
        excelWriter(playerFileName, playerEntries, playerName);
    }
}
function checkExistence(teamName) {
    return fs.existsSync(teamName);
}
function createFolder(teamName) {
    fs.mkdirSync(teamName);
}

function excelReader(filePath, name) {
    if (!fs.existsSync(filePath)) {
        return null;
    } else {
        let wt = xlsx.readFile(filePath);
        let excelData = wt.Sheets[name];
        let ans = xlsx.utils.sheet_to_json(excelData);
        return ans;
    }
}

function excelWriter(filePath, json, name) {
    let newWB = xlsx.utils.book_new();
    let newWS = xlsx.utils.json_to_sheet(json);
    xlsx.utils.book_append_sheet(newWB, newWS, name); 
    xlsx.writeFile(newWB, filePath);
}

module.exports = {
    pm: processMatch
}
