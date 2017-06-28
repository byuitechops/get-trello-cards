// Packages
var Trello = require("node-trello");
var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var dsv = require('d3-dsv');
var xlsx = require('xlsx');
/**********************************************************
 * READ THE BOARD IDs AND AUTHENTICATION DATA FROM SOURCE
 * XLS FILE "SETTINGS" TAB
 **********************************************************/
var workbook = xlsx.readFile("./source.xlsx");
var settings = workbook.Sheets['settings'];
settings = xlsx.utils.sheet_to_json(settings);

// FIRST ROW OF SETTINGS: KEY, SECOND ROW: TOKEN
var authData = {
        "key": settings[0].data,
        "token": settings[1].data
    }
    // FILL BOARDIDS WITH THE REST OF THE SETTINGS
var boardIds = [];
for (var i = 2; i < settings.length; i++) {
    boardIds.push(settings[i].data);
}
// Set up trello interface
var t = new Trello(authData.key, authData.token);
// Trigger "step 3" when finished gathering card data
var stepTwoDone = _.after(boardIds.length, stepThree);
var allcards = [];
/**********************************************************
 ** PART ONE ***********************************************
 * For each board in the list, this will grab the name of
 * the board, the cards in the board, the lists, and the
 * members. After making the calls it will take all of that
 * data, flatten the cards into a readable format, then
 * output a CSV with all of the necessary information.
 **********************************************************/
console.log("Grabbing trello cards from these boards: " + boardIds);
_.forEach(boardIds, function (boardId) {
    var board = boardId; //used to get the board name for a readable export - may be unnecessary?
    var cards = {};
    var lists = {};
    var members = {};
    // After gathering data, call "stepTwo" to flatten cards
    var stepOneDone = _.after(4, stepTwo);

    t.get("/1/boards/" + boardId + "/name", function (err, data) {
        if (err) throw err;
        board = data._value;
        stepOneDone();
    });
    t.get("/1/boards/" + boardId + "/cards?fields=name,url,idMembers,idList,closed,idBoard", function (err, data) {
        if (err) throw err;
        cards = data;
        stepOneDone();
    });
    t.get("/1/boards/" + boardId + "/lists?fields=id,name", function (err, data) {
        if (err) throw err;
        lists = data;
        stepOneDone();
    });
    // SAVE MEMBER IDS/NAMES TO JSON
    t.get("/1/boards/" + boardId + "/members", function (err, data) {
        if (err) throw err;
        members = data;
        stepOneDone();
    });


    /**********************************************************
     ** PART TWO ***********************************************
     **********************************************************/
    function stepTwo() {

        cards.forEach(function (card) {
            // CORRECT LIST IDs WITH LIST NAMES
            lists.forEach(function (list) {
                    if (list.id === card.idList) {
                        card.idList = list.name;
                    }
                })
                // CORRECT MEMBER IDs WITH MEMBER NAMES
            for (var i = 0; i < card.idMembers.length; i++) {
                //console.log(card.idMembers[i]);
                members.forEach(function (member) {

                    if (member.id == card.idMembers[i]) {
                        card.idMembers[i] = member.fullName;
                    }
                })
            }
            // CONVERT MEMBER ARRAY TO STRING (XLSX NEEDS IT TO BE)
            card.idMembers = card.idMembers.join(", ");
            // ADD BOARD NAME TO CARD FOR GOOD MEASURE
            card.idBoard = board;
            // ADD TO "ALLCARDS" LIST
            allcards.push(card);
        })


        //CSV OUTPUT
        //cardFile = (dsv.csvFormat(cards, ['id', 'name', 'idList', 'closed', 'url', 'idMembers','idBoard']));
        //fs.writeFileSync('./boards/'+board+'.csv', cardFile);

        //END  STEP TWO
        stepTwoDone();
    }
});


/**********************************************************
 ** PART THREE *********************************************
 **********************************************************/
function stepThree() {
    // IF YOU WANT A CSV OF ALL THE CARDS, HERE'S HOW TO GET IT
    //allcards = (dsv.csvFormat(allcards, ['id', 'name', 'idList', 'closed', 'url', 'idMembers']));
    //fs.writeFileSync('./boards/allcards.csv', allcards);
    
    // SET FILE OUTPUT TO THE ALL CARDS JSON
    var output = xlsx.utils.json_to_sheet(allcards);
    // console.log(output); // DOUBLE CHECK IF DESIRED
    // ASSIGN THE OUTPUT TO SPECIFIED SHEET"
    workbook.Sheets['TrelloData'] = output;
    // WRITE THE WORKBOOK BACK TO THE FILE
    xlsx.writeFile(workbook, "./source.xlsx");
    //LET THE USER KNOW THAT EVERYTHING WORKED
    console.log("Workbook updated.");
}
