$(document).ready(function () {
// Initialize parse
Parse.initialize("gAyspTr9rHu70rWccCn3VLulVPoOHC1UfRjHLEwv", "QhwV529z16xqxF7IwVfelrtWKLj7fwBydyFVBQ4K");

var tweetIDs = [];
var tweets; // Holds the tweets
var bearerToken; // Auth object
var scrollInterval;
// ------------ Twitter Carousel Variables	------------
var slideinitial = false;
var slidetime = 2000;
var pausetime = 5000;
var tweetshift = 1;
var totaltweets;
var currenttweet = 1; // Start at 1
var lasttweet = totaltweets;
var tweetheight = new Array();
var totalheight = 0;
var maxTweets;
var sliderheight = parseInt($('.tweets-container').css('height'));
//alert(sliderheight);
var includeRTs;
var tweetQuery;
var filterExp;
var initialLoad = true;
var tweetViewModel = {
    tweets: ko.observableArray([
        // { tweetBody: "", handle: "", name: "", imageURL: "" } << Format
    ])
};

var explicit = new RegExp("", "g");

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
    tweets = {}; // empty tweets out
    
    
    // Encode the query
    var fullQuery = "?q=" + encodeURIComponent(tweetQuery);

    if (!includeRTs) {
        fullQuery += ' -RT';
    }

    //console.log(fullQuery);

    // If we have gotten tweets dont do anything else, but if we have make sure there's a sinceID query value as to not get dupes.
    if (tweetViewModel.tweets().length > 0) {
        fullQuery += "&since_id=" + tweetViewModel.tweets()[0].sinceID;
        console.log("Searching since ID: " + tweetViewModel.tweets()[0].sinceID);
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
                tweets = results.statuses;

                formatTweets();
                
            },
            error: function (error) {
                alert(error.status + " and " + error.statusText);
            }
        });
    }
    else {
        getToken();
        getTweets();
    }
    
}

function getHeights() {
    console.log("Start height");
    for (var i = 1; i <= totaltweets; i++) {
        tweetheight[i] = parseInt($('#t' + i).css('height')) + parseInt($('#t' + i).css('padding-top')) + parseInt($('#t' + i).css('padding-bottom'));
        if (slideinitial === false) {
            sliderheight = 0;
        }
        if (i > 1) {

            $('#t' + i).css('top', tweetheight[i - 1] + totalheight + sliderheight);
            $('#t' + i).animate({
                'top': tweetheight[i - 1] + totalheight
            }, slidetime);
            totalheight += tweetheight[i - 1];
        } else {
            $('#t' + i).css('top', sliderheight);
            $('#t' + i).animate({
                'top': 0
            }, slidetime);
        }
    }
    totalheight += tweetheight[totaltweets];
    
    
    console.log("End height");
    // Scrolls the tweets wait to scroll once the 
    if (initialLoad) {
        initialLoad = false;
        scrollInterval = setInterval(scrolltweets, pausetime);
    }
    
}

// Explicit language filter
function languageFilter(tweetText) {
    // get rid of bad words.
    var result = explicit.test(tweetText);
    console.log(tweetText);
    console.log(result);
    return result;
}

// Places the tweet from the json object
// into the knockout observable.
function formatTweets() {
    console.log("Start format");
    totaltweets = tweets.length;
    lasttweet = totaltweets;

    // Format the JSON data into the KO observable start at the oldest Tweets and work forward pushing on the top of the ko
    for (var i = tweets.length - 1; i >= 0 ; i--) {

        // If we don't already have the tweet... && ?make a filter check?
        if (tweetIDs.indexOf(tweets[i].id) < 0 && languageFilter(tweets[i].text)) {
            // Keep track of tweets so we don't get dupes!
            tweetIDs.push(tweets[i].id);

            var mediaURL = '';

            // If the tweet contains a picture show it.
            if (tweets[i].entities.media) {
                // Only allow 1 photo.
                for (var j = 0; j < 1; j++) {
                    if (tweets[i].entities.media[j].type == "photo") {
                        mediaURL = tweets[i].entities.media[j].media_url;
                    }
                }
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

            //console.log(tempTweet);

            tweetViewModel.tweets.unshift(tempTweet); //add the tweet to the feed

            // If keep the feed at a limit of 'maxTweets' tweets.
            while (tweetViewModel.tweets().length > maxTweets) {
                tweetViewModel.tweets.pop();
            }
        }
    }
    
    // Get heights for the scrolling action
    getHeights();
}

// Animation Function
function scrolltweets() {
    console.log("Go!!!!");
    var currentheight = 0;
    //totalheight = 0;
    for (var i = 0; i < tweetshift; i++) {
        var nexttweet = currenttweet + i;
        if (nexttweet > totaltweets) {
            nexttweet -= totaltweets;
        }
        console.log(nexttweet + " " + currenttweet);
        currentheight += tweetheight[nexttweet];
    }

    for (var i = 1; i <= totaltweets; i++) {
        console.log(i);
        $('#t' + i).animate({
            'top': (parseInt($('#t' + i).css('top')) - currentheight)
        }, slidetime, function () {

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
    console.log("Start settings");
    var Settings = Parse.Object.extend("Feed");
    var query = new Parse.Query(Settings);
    query.get("EJlZOI6Lhu", {
        success: function (settings) {
            // The object was retrieved successfully.
            totaltweets = settings.get("maxTweets");
            includeRTs = settings.get("includeRT");
            tweetQuery = settings.get("query");

            var filterArr = settings.get("filter");
            filterExp = "\\b(";     
            for(var i = 0; i < filterArr.length; i++){
                filterExp+= "|";
                filterExp+= filterArr[i];
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
    console.log("End settings");
}

$("#goScroll").click(function () {
    
});


// Apply knockout bindings
ko.applyBindings(tweetViewModel);

// Start the process of getting and animating tweets  
// Get the settings from Parse before doing anything
getSettings();

});


// Additional functions..
/*
ko.bindingHandlers.updateHeights = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {

        lasttweet = totaltweets;
        for (var i = 1; i <= totaltweets; i++) {

            tweetheight[i - 1] = parseInt($('#t' + i).css('height')) + parseInt($('#t' + i).css('padding-top')) + parseInt($('#t' + i).css('padding-bottom'));

            if (slideinitial === false) {
                sliderheight = 0;
            }
            // All cases
            if (i > 1) {

                $('#t' + i).css('top', tweetheight[i - 1] + totalheight + sliderheight);
                $('#t' + i).animate({
                    'top': tweetheight[i - 1] + totalheight
                }, slidetime);
                totalheight += tweetheight[i - 1];
            }
                // First case only...
            else {
                $('#t' + i).css('top', sliderheight);
                $('#t' + i).animate({
                    'top': 0
                }, slidetime);
            }
            console.log((i - 1) + " height: " + tweetheight[i - 1]);
        }
        totalheight += tweetheight[totaltweets];
        console.log(totalheight);
    }
};
*/

