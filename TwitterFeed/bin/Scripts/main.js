$(document).ready(function () {
    // Initialize parse
    Parse.initialize("gAyspTr9rHu70rWccCn3VLulVPoOHC1UfRjHLEwv", "QhwV529z16xqxF7IwVfelrtWKLj7fwBydyFVBQ4K");

    var tweets = {}; // Holds the tweets
    var newTweets = new Array();
    var newTweetsQueue = new Array();
    var tweetheight = new Array();
    var oldestTweet = 1;
    var newestTweetID = 0;
    var bearerToken; // Auth object
    var scrollInterval, settingsInterval, updateInterval; //Update intervals
    var currentlyInsertingTweet;

    var totaltweets = 0;
    var currenttweet = 1; // Start at 1
    var lasttweet = totaltweets;
    var totalheight = 0;
    var sliderheight = parseInt($('.tweets-container').css('height'));
    var heightDiff = 0;

    var initialLoad = true; // Flag for start loading

    var explicit, filterExp = new RegExp("", "g"); // Filtering expression

    // KO model
    var tweetViewModel = {
        tweets: ko.observableArray([
            // { tweetBody: "", handle: "", name: "", imageURL: "" } << Format
        ])
    };

    tweetViewModel.updateSize = function (element, index, data) {
        console.log(data);
        // On the first one get the height diff/calc
        var id = parseInt(data.id.substring(1));

        var newHeight = parseInt($('#' + data.id).css('height')) + parseInt($('#' + data.id).css('padding-top')) + parseInt($('#' + data.id).css('padding-bottom'));

        console.log("From height: " + tweetheight[id] + " to height: " + newHeight);

        tweetheight[id] = newHeight;
        //Get the old height
        var oldHeight = tweetheight[id];
        // Calculate the difference
        heightDiff = newHeight - oldHeight;

        // Add the height difference to the total
        totalheight += heightDiff;
        console.log("The new calculated total height is: " + totalheight);
     


        // Set the new tweet locations
        //var tweetLoc = parseInt($('#' + data.id).css('top'));
        //$('#' + data.id).css('top', tweetLoc + heightDiff);

        
    };

    //ko.bindingHandlers.tweetElement = {
    //    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            
    //        var idStr =  bindingContext.$data.id;
    //        var id = parseInt(idStr.substring(1));

    //        //Get the new height
    //        var newHeight = parseInt($('#' + idStr).css('height')) + parseInt($('#' + idStr).css('padding-top')) + parseInt($('#' + idStr).css('padding-bottom'));

            
    //        if (!initialLoad) {
    //            console.log("From height: " + tweetheight[id] + " to height: " + newHeight);

    //            tweetheight[id] = newHeight;
    //            //Get the old height
    //            var oldHeight = tweetheight[id];
    //            // Calculate the difference
    //            heightDiff = newHeight - oldHeight;

    //            // Add the height difference to the total
    //            totalheight += heightDiff;
    //            console.log("The new calculated total height is: " + totalheight);
    //        }
    //    }
    //};

    // Object containing all settings
    // Defaults have been added
    var settingsObj = {
        slidetime: 2000,
        pausetime: 5000,
        tweetshift: 1,
        slideinitial: false,
        filterExp: '',
        maxTweets: 15,
        includeRTs: false,
        tweetQuery: '@edILLINOIS'
    }

    // Gets the OAuth token
    function getToken() {
        // Get Bearer Token from endpoint
        $.ajax({
            url: '/Twitter/GetBearerToken',
            type: 'GET',
            async: false,
            success: function (results) {
                bearerToken = results;
            },
            error: function (error) {
                alert(error.status + " and " + error.statusText);
            }
        });
    }

    // Grabs the newest tweets
    // uses the sinceID in twitter's API when neccessary
    function getTweets() {
        // Encode the query
        var fullQuery = "?q=" + encodeURIComponent(settingsObj.tweetQuery);

        // If we don't want retweets att "-RT to the query
        if (!settingsObj.includeRTs) {
            fullQuery += ' -RT';
        }

        // If we have gotten tweets dont do anything else, but if we have make sure there's a sinceID query value as to not get dupes.
        if (tweetViewModel.tweets().length > 0) {
            //console.log(tweetViewModel.tweets().length);
            fullQuery += "&since_id=" + newestTweetID;

            //console.log("Searching since ID: " + newestTweetID);
            //console.log("Query: " + fullQuery);
        }

        // Search for Tweets if we have a token
        if (bearerToken) {
            $.ajax({
                url: '/Twitter/GetSearchJson',
                type: 'GET',
                async: false,
                data: { bearerToken: bearerToken, parameters: fullQuery },
                dataType: "JSON",
                success: function (results) {
                    // Newest Tweet ID is recorded
                    newestTweetID = results.search_metadata.max_id_str;

                    // Save a local copy either to the initial tweets or the temp newTweets
                    if (tweetViewModel.tweets().length == 0) {
                        tweets = results.statuses;
                        // Format the tweets now.
                        formatTweets();
                    }
                    else {
                        newTweets = results.statuses;
                        updateTweets();
                    }
                },
                error: function (error) {
                    alert(error.status + " and " + error.statusText);
                }
            });
        }
        else {
            // Retry and get new token if token ends up being too old.
            getToken();
            getTweets();
        }
    }

    function getHeights() {       

        if (settingsObj.slideinitial === false) {
            sliderheight = 0;
        }

        // 't' values, so go between 1-15
        for (var i = 1; i <= totaltweets; i++) {
            // Height of the current tweet
            tweetheight[i] = parseInt($('#t' + i).css('height')) + parseInt($('#t' + i).css('padding-top')) + parseInt($('#t' + i).css('padding-bottom'));

            // If your at the first one...
            if (i == 1) {
                $('#t' + i).css('top', sliderheight);
                $('#t' + i).animate({
                    'top': 0
                }, settingsObj.slidetime);
                totalheight = tweetheight[i];
            } else {
                $('#t' + i).css('top', totalheight + sliderheight);
                $('#t' + i).animate({
                    'top': totalheight
                }, settingsObj.slidetime);
                totalheight += tweetheight[i];
            }
        }
        //totalheight += tweetheight[totaltweets];

        // Start the scroll loop the first time you get tweets.
        if (initialLoad) {
            initialLoad = false;

            scrollInterval = setInterval(scrolltweets, settingsObj.pausetime);
            updateInterval = setInterval(getTweets, 10000);
            settingsInterval = setInterval(getSettings, 20000);
        }
    }

    // Explicit language filter
    function languageFilter(tweetText) {
        // get rid of bad words.
        var result = explicit.test(tweetText);
        if (!result) {
            console.log("Filtered Tweet:");
            console.log(tweetText);
        }
        return result;
    }

    // Places the tweet from the json object
    // into the knockout observable.
    // initial Formatting.
    function formatTweets() {
        //console.log("Start format");

        //oldestTweet = tweets.length - 1;
        totaltweets = tweets.length;

        lasttweet = totaltweets;

        // Format the JSON data into the KO observable start at the oldest Tweets and work forward pushing on the top of the ko
        for (var i = tweets.length - 1; i >= 0 ; i--) {

            // If we don't already have the tweet && make a filter check
            if (languageFilter(tweets[i].text)) {

                var mediaURL = "";

                // If the tweet contains a picture show it.
                if (tweets[i].entities.media && tweets[i].entities.media[0].type == "photo") {
                    console.log(tweets[i].entities);
                        mediaURL = tweets[i].entities.media[0].media_url;
                }

                // Format the tweet
                var tempTweet = {
                    tweetBody: tweets[i].text,
                    handle: "@" + tweets[i].user.screen_name,
                    name: tweets[i].user.name,
                    imageURL: tweets[i].user.profile_image_url,
                    mediaURL: mediaURL,
                    sinceID: tweets[i].id,
                    id: "t" + (i + 1)
                };

                // Add the tweet to the feed
                tweetViewModel.tweets.unshift(tempTweet);

                //console.log(tweetViewModel.tweets());

                // If keep the feed at a limit of 'maxTweets' tweets.
                while (tweetViewModel.tweets().length > settingsObj.maxTweets) {
                    tweetViewModel.tweets.pop();
                }
            }
        }

        // Get heights for the scrolling action
        getHeights();
    }

    // Animation Function
    function scrolltweets() {
        // Replace the oldest tweet     
        insertNewTweet();

        var currentheight = 0;
        for (var i = 0; i < settingsObj.tweetshift; i++) {
            var nexttweet = currenttweet + i;
            if (nexttweet > totaltweets) {
                nexttweet -= totaltweets;
            }
            //console.log(nexttweet + " " + currenttweet);
            currentheight += tweetheight[nexttweet];
        }

        // Animate all the tweets.
        for (var i = 1; i <= totaltweets; i++) {
            $('#t' + i).animate({
                'top': (parseInt($('#t' + i).css('top')) - currentheight)
            }, settingsObj.slidetime, function () {

                var animatedid = parseInt($(this).attr('id').substr(1, 2));

                if (animatedid === totaltweets) {
                    for (j = 1; j <= totaltweets; j++) {
                        if (parseInt($('#t' + j).css('top')) < -50) {
                            var toppos = parseInt($('#t' + lasttweet).css('top')) + tweetheight[lasttweet];
                            $('#t' + j).css('top', toppos);
                            lasttweet = j;

                            if (currenttweet >= totaltweets) {
                                var newcurrent = currenttweet - totaltweets + 1;
                                currenttweet = newcurrent;
                            } else {
                                currenttweet++;
                            }
                        }
                    }
                }
            });
        }
    }

    // Retreive settings from parse.
    function getSettings() {
        var Settings = Parse.Object.extend("Feed");
        var query = new Parse.Query(Settings);
        query.get("EJlZOI6Lhu", {
            success: function (settings) {
                // The object was retrieved successfully.
                totaltweets = settings.get("maxTweets");
                //console.log(settings.get("maxTweets"));
                settingsObj.includeRTs = settings.get("includeRT");

                if (settingsObj.tweetQuery != settings.get("query")) {
                    newestTweetID = 0;
                }

                settingsObj.tweetQuery = settings.get("query");

                var filterArr = settings.get("filter");
                filterExp = "\\b(";
                for (var i = 0; i < filterArr.length; i++) {
                    filterExp += "|";
                    filterExp += filterArr[i];
                }
                filterExp += ")\\b";
                explicit = new RegExp(filterExp, "g");
                // Then get the tweets

                getTweets();
            },
            error: function (object, error) {
                // The object was not retrieved successfully.
                // error is a Parse.Error with an error code and message.
                getSettings();
            }
        });
    }

    function updateTweets() {
        newFormattedTweets = {};
        for (var i = newTweets.length - 1; i >= 0 ; i--) {
            //console.log("Updating");
            // If we don't already have the tweet... & make a filter check
            if (languageFilter(newTweets[i].text)) {
                var mediaURL = '';

                // If the tweet contains a picture show it.
                if (newTweets[i].entities.media) {
                    // Only allow 1 photo.
                    for (var j = 0; j < 1; j++) {
                        if (newTweets[i].entities.media[j].type == "photo") {
                            mediaURL = newTweets[i].entities.media[j].media_url;
                        }
                    }
                }

                // Format the tweet
                var tempTweet = {
                    tweetBody: newTweets[i].text,
                    handle: "@" + newTweets[i].user.screen_name,
                    name: newTweets[i].user.name,
                    imageURL: newTweets[i].user.profile_image_url,
                    mediaURL: mediaURL,
                    sinceID: newTweets[i].id,
                    id: "t"
                };

                console.log(tempTweet);
                // Push the new tweets to the "queue"
                // They will be added in as they can
                // Need to add the ID before it gets added.
                newTweetsQueue.push(tempTweet);
            }
        }
        newTweets = [];
    }

    function insertNewTweet() {
        var aboveCheck = parseInt($('#t' + oldestTweet).css('top')) < -51;
        var belowCheck = parseInt($('#t' + oldestTweet).css('top')) > parseInt($('.tweets-container').css('height'));

        //console.log("aboveCheck: ", aboveCheck);
        //console.log("belowCheck: ", belowCheck);

        // Check if new tweets are avaliable && the oldest tweet is out of the viewport
        if (newTweetsQueue.length > 0 && (aboveCheck || belowCheck)) {
            
            var tweetInsertLoc = parseInt($('#t' + oldestTweet).css('top'));

            // Format the tweet fully
            var tempTweet = newTweetsQueue.shift();
            tempTweet.id += oldestTweet;
            currentlyInsertingTweet = oldestTweet;

            console.log("Add tweet from " + tempTweet.name + " to the feed.")

           

            // Splice Tweet into feed, it is removed from the front of the queue
            tweetViewModel.tweets.splice(oldestTweet - 1, 1, tempTweet);
            $('#t' + oldestTweet).css('top', tweetInsertLoc);

            
            // Calculate the "new" oldest tweet
            if (oldestTweet == tweetViewModel.tweets().length - 1) {
                oldestTweet = 1;
            } else {
                oldestTweet++;
            }
        }
    }

    // Apply knockout bindings
    ko.applyBindings(tweetViewModel);
    // Start the process of getting and animating tweets  
    // Get the settings from Parse before doing anything
    getSettings();
});

