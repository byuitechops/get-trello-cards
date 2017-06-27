
var Trello = require("node-trello");

// USED TO KEEP TRACK OF ASYNC PROGRESS - A NEW FAVORITE
var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var boardIds= ['mlDV9CQ8','UYFU40tt','MmDAQYPQ'];
var dsv = require('d3-dsv');
var authData = JSON.parse(fs.readFileSync("./auth.json"));
var t = new Trello(authData.key, authData.token);
// After the first two steps are done, this will
// trigger the final step, which is updating the
// Excel sheet with the data from the newly created
// CSV files.

// UNCOMMENT WHEN STEP 3 WRITTEN:
//var stepTwoDone = _.after(boardIds.length, stepThree);

/**********************************************************
** PART ONE ***********************************************
* For each board in the list, this will grab the name of
* the board, the cards in the board, the lists, and the
* members. After making the calls it will take all of that
* data, flatten the cards into a readable format, then
* output a CSV with all of the necessary information.
**********************************************************/
_.forEach(boardIds, function(boardId){
    var board = boardId;
    var cards = {}; 
    var lists = {};
    var members = {};
    var stepOneDone = _.after(4, stepTwo);
    
    
    t.get("/1/boards/" + boardId + "/name" , function(err, data) {
      if (err) throw err;
       board = data._value;
        stepOneDone();
        //fs.writeFile("boards/board_" + 0 + "_listcards.json", JSON.stringify(data), function(err){if (err) throw err})
    });    

    t.get("/1/boards/" + boardId + "/cards?fields=name,url,idMembers,idList,closed" , function(err, data) {
      if (err) throw err;
       cards = data;
        stepOneDone();
        //fs.writeFile("boards/board_" + 0 + "_listcards.json", JSON.stringify(data), function(err){if (err) throw err})
    });


    t.get("/1/boards/" + boardId + "/lists?fields=id,name" , function(err, data) {
      if (err) throw err;
       lists = data;
        stepOneDone();
        //fs.writeFile("boards/board_" + 0 + "_listcards.json", JSON.stringify(data), function(err){if (err) throw err})
    });

    // SAVE MEMBER IDS/NAMES TO JSON
    t.get("/1/boards/" + boardId + "/members" , function(err, data) {
      if (err) throw err;
       members = data;
        stepOneDone();
        //fs.writeFile("boards/board_" + 0 + "_members.json", JSON.stringify(data), function(err){if (err) throw err})
});


/**********************************************************
** PART TWO ***********************************************
**********************************************************/
function stepTwo(){
    // CORRECT LIST IDs WITH LIST NAMES
    cards.forEach(function(card){
        lists.forEach(function(list){
            if (list.id === card.idList){
                card.idList = list.name;
            }
        })
        //console.log(card.idList); // DEBUG
    })
 
    // CORRECT MEMBER IDs WITH MEMBER NAMES
    cards.forEach(function(card){
        members.forEach(function(member){
            
            for (var i = 0; i < card.idMembers.length; i++){
                if (member.id === card.idMembers[i]){
                    card.idMembers[i] = member.fullName;
                }
            }
        })
        //console.log(card.idMembers); // DEBUG
    })    
    //CSV OUTPUT
    cardFile = (dsv.csvFormat(cards, ['id', 'name', 'idList', 'closed', 'url', 'idMembers']));
    fs.writeFileSync('./boards/'+board+'.csv', cardFile);
//END  STEP TWO
} 

});


/**********************************************************
** PART THREE *********************************************
**********************************************************/

// EXCEL sheet manipulation read the file or open it to edit

// decide which columns will be updated

// update columns based on cardID or "trello" column



