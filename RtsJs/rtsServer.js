/*!
* RtsJs - rtsServer
* Copyright(c) 2012 Stephan Ryer <stephanryer@hotmail.com>
* MIT Licensed
*/
var createEmptyTurnData = function () {
    return {
        systemCommands: [],
        gameCommands: []
    };
};
exports.createServer = function (server) {
    return {
        init: function () {
            var nowjs = require("now");

            var everyone = nowjs.initialize(server);

            // Lets the user join a group with a specified groupId.
            // When the group is full (the user count in the group equals the callers value of 'totalUserCount'),
            // The users in the group are all started and an interval function is started, collecting all datas sent from the clients in a buffer,
            // and with specified intervals, sending the data buffer to the clients for the clients to all execute the datas synchroniously.
            everyone.now.serverJoinGroup = function (username, groupId, totalUserCount) {
                // Check if already in a group
                var currentGroupId = this.now.currentGroupId;
                if (currentGroupId !== undefined) {
                    console.log("User already in group " + currentGroupId);
                    return;
                }

                // Check if the game has already been started
                var group = nowjs.getGroup(groupId);
                if (group.started === true) {
                    console.log("user tried to join group " + groupId + ", but group already started.");
                    return;
                }

                console.log("User " + username + " joined group " + groupId + " with total user count " + totalUserCount);

                // Add user to group
                this.now.currentGroupId = groupId;
                this.now.username = username;
                group.addUser(this.user.clientId);
                if (group.usernames === undefined)
                    group.usernames = {};
                group.usernames[username] = username;

                // Add action controller if user first in group.
                if (group.turnDataCollector === undefined)
                    group.turnDataCollector = createTurnDataCollector();
                // Add user to the action controller
                group.turnDataCollector.addUser(this.now.username);

                // Start game if group full
                group.count(function (count) {
                    if (count > totalUserCount) {
                        // This could happen if not al users specify the same totalUserCount
                        console.log("For some odd reason, the total count of group " + count + " exceeds the desired totalUserCount of " + totalUserCount);
                        return;
                    } else if (count === totalUserCount) {
                        // START SYNCHRONIZING GROUP
                        group.started = true;
                        console.log("Starting group " + groupId);

                        // Called by server when all clients are connected and the game is about to start
                        group.now.clientStart(group.usernames);

                        // Tells the server to add the specified data to the next data array sent by the server to all clients.
                        group.now.serverAddTurnData = function (turn, turnData) {
                            var mergedTurnData = group.turnDataCollector.addTurnData(this.now.username, turn, turnData);
                            if (mergedTurnData !== null) {
                                group.now.clientAddTurnData(turn, mergedTurnData);
                            }
                        };
                    } else {
                        // CONSOLE LOG INFO ABOUT NEW GROUP
                        console.log("Group now has " + count + "/" + totalUserCount + " users");
                    }
                });
            };
        }
    };
};

// A helper class which allows the user to add actions for different usernames and returns single,
// concatenated arrays of action when adding an action array from a user results in having actions for all users.
var createTurnDataCollector = function () {
    var self = {};
    self.usersTurnData = {}; //Username, Object as dictionary of key: turn, value: Array of actions
    return {
        addUser: function (username) {
            if (self.usersTurnData[username] !== undefined)
                throw "username '" + username + "' already exists.";
            self.usersTurnData[username] = {};
        },
        removeUser: function (username) {
            if (self.usersTurnData[username] === undefined)
                throw "username '" + username + "' does not exist.";
            delete self.usersTurnData[username];
        },
        // Adds actions for a user and a specific turn.
        // If all users have added actions for the specific turn, a single array is returned containing all users actions for the given turn.
        // Elseway, null is returned.
        addTurnData: function (username, turn, turnData) {
            var userBuffer = self.usersTurnData[username];
            // Param validations
            if (userBuffer === undefined)
                throw "username '" + username + "' does not exist.";
            if (userBuffer[turn] !== undefined) {
                throw "user '" + username + "' has already added an action array for turnnumber " + turn + ". Value: " + userBuffer[turn];
            }

            // Add turn array
            userBuffer[turn] = turnData;

            // Check if all users have added an action array for the current turn. If so, return a single array of all actions by all players fir the given turn
            var allTurnDatasCurrentTurn = createEmptyTurnData();
            for (username in self.usersTurnData) {
                var currentUserBuffer = self.usersTurnData[username][turn];
                if (currentUserBuffer === undefined)
                    return null; // Found a user that has not yet added a turn array for the given turn number
                // Add all actions in actions array to the array to be returned
                for (var i = 0; i < currentUserBuffer.systemCommands.length; i++) {
                    allTurnDatasCurrentTurn.systemCommands.push(currentUserBuffer.systemCommands[i]);
                }
                for (var i = 0; i < currentUserBuffer.gameCommands.length; i++) {
                    allTurnDatasCurrentTurn.gameCommands.push(currentUserBuffer.gameCommands[i]);
                }
            }
            return allTurnDatasCurrentTurn;
        }
    };
};