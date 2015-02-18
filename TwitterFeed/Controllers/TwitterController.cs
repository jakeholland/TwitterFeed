using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.Mvc;
using System.Configuration;
using Newtonsoft.Json.Linq;

namespace TwitterFeed.Controllers
{
    public class TwitterController : Controller
    {
        //Oauth Keys, should hide in release.
        string oauthtoken = "2900646069-UVc42zB3etsgNi1g0HqSlBPWglDxmKmcaxPS3UE";
        string oauthtokensecret = "i3C6bQeKyrBi3ooHNEFo0zoYJiILbDOpDGFJbMSEiUcMq"; // Need to hide these eventually !!!!!!!

        private const string ApiBaseUrl = "https://api.twitter.com";
        #region Authentication

        /// <summary>
        /// Gets bearer token for application-only authentication from Twitter API 1.1, obtaining key and secret from web.config/app.config.
        /// * NOTE: This token should be cached by the application -- for up to 15 mins.
        /// * Dependant on web.config appSettings params twitterConsumerKey and twitterConsumerSecret.
        /// * Twitter API client oAuth settings: https://dev.twitter.com/app
        /// * Application-only authentication: https://dev.twitter.com/docs/auth/application-only-auth
        /// * API endpoint oauth2/token: https://dev.twitter.com/docs/api/1.1/post/oauth2/token
        /// </summary>
        /// <returns>oAuth bearer token for Twitter API authentication.</returns>
        public string GetBearerToken()
        {
            JToken token = JObject.Parse(
                GetBearerTokenJson(
                    ConfigurationManager.ConnectionStrings["twitterConsumerKey"].ConnectionString,
                    ConfigurationManager.ConnectionStrings["twitterConsumerSecret"].ConnectionString));

            return token.SelectToken("access_token").Value<string>();
        }

        /// <summary>
        /// Gets bearer token for application-only authentication from Twitter API 1.1.
        /// * NOTE: This token should be cached by the application -- for up to 15 mins.
        /// * Twitter API client oAuth settings: https://dev.twitter.com/app
        /// * Application-only authentication: https://dev.twitter.com/docs/auth/application-only-auth
        /// * API endpoint oauth2/token: https://dev.twitter.com/docs/api/1.1/post/oauth2/token
        /// </summary>
        /// <param name="consumerKey">Token obtained from authentication.</param>
        /// <param name="consumerSecret">Token obtained from authentication.</param>
        /// <returns>oAuth bearer token for Twitter API authentication.</returns>
        private string GetBearerToken(string consumerKey, string consumerSecret)
        {
            JToken token = JObject.Parse(
                GetBearerTokenJson(consumerKey, consumerSecret));

            return token.SelectToken("access_token").Value<string>();
        }

        private static string GetBearerTokenJson(string consumerKey, string consumerSecret)
        {
            var webrequest = CreateRequest("/oauth2/token");

            webrequest.Headers.Add("Authorization", "Basic " + GetBasicAuthToken(consumerKey, consumerSecret));

            WriteRequest(webrequest, "grant_type=client_credentials");

            return ReadResponse(webrequest);
        }

        #endregion

        #region UserTimeline

        /// <summary>
        /// Gets a user timeline.
        /// * API endpoint user_timeline: https://dev.twitter.com/docs/api/1.1/get/statuses/user_timeline
        /// </summary>
        /// <param name="bearerToken">Token obtained from authentication.</param>
        /// <param name="screenName">username of user whose timeline will be returned.</param>
        /// <param name="count">Number of tweets to return</param>
        /// <param name="excludeReplies">Whether to exclude replies. False is reccomended because API removed replies after obtaining requested number of tweets, leading to unpredictable result counts.</param>
        /// <param name="includeRTs">Whether to include retweets. True is reccomended because API removes retweets after obtaining requested number of tweets, leading to unpredictable result counts.(</param>
        /// <returns>Raw JSON response from API.</returns>
        public string GetUserTimelineJson(string bearerToken, string screenName, int count = 10, bool excludeReplies = false, bool includeRTs = false)
        {
            var webrequest = CreateRequest(
                "/1.1/statuses/user_timeline.json"
                + "?screen_name=" + screenName + "&count=" + count + "&exclude_replies=" + excludeReplies.ToString().ToLower() + "&include_rts=" + includeRTs.ToString().ToLower());

            webrequest.Headers.Add("Authorization", "Bearer " + bearerToken);

            webrequest.Method = WebRequestMethods.Http.Get;

            return ReadResponse(webrequest);
        }

        #endregion

        #region Search

        /// <summary>
        /// Gets a user timeline.
        /// * API endpoint search: https://dev.twitter.com/docs/api/1.1/get/search/tweets
        /// </summary>
        /// <param name="bearerToken">Token obtained from authentication.</param>
        /// <param name="parameters">Search parameters in raw query string format, e.g. "q=from:BritishVogue, e.g. "q=#FNO".</param>
        /// <returns>Raw JSON response from API.</returns>
        public string GetSearchJson(string bearerToken, string parameters)
        {
            var webrequest = CreateRequest("/1.1/search/tweets.json" + parameters);

            webrequest.Headers.Add("Authorization", "Bearer " + bearerToken);

            webrequest.Method = WebRequestMethods.Http.Get;

            return ReadResponse(webrequest);
        }

        #endregion

        #region Helper methods

        private static WebRequest CreateRequest(string url)
        {
            var webrequest = WebRequest.Create(ApiBaseUrl + url);
            ((HttpWebRequest)webrequest).UserAgent = "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)";
            return webrequest;
        }

        private static string GetBasicAuthToken(string consumerKey, string consumerSecret)
        {
            return Base64Encode(consumerKey + ":" + consumerSecret);
        }

        private static void WriteRequest(WebRequest webrequest, string postData)
        {
            webrequest.Method = WebRequestMethods.Http.Post;
            webrequest.ContentType = "application/x-www-form-urlencoded";

            byte[] postDataBytes = Encoding.UTF8.GetBytes(postData);

            webrequest.ContentLength = postDataBytes.Length;

            using (var requestStream = webrequest.GetRequestStream())
            {
                requestStream.Write(postDataBytes, 0, postDataBytes.Length);
                requestStream.Close();
            }
        }

        private static string ReadResponse(WebRequest webrequest)
        {
            using (var responseStream = webrequest.GetResponse().GetResponseStream())
            {
                if (responseStream != null)
                {
                    using (var responseReader = new StreamReader(responseStream))
                    {
                        return responseReader.ReadToEnd();
                    }
                }
            }

            return null;
        }

        private static string Base64Encode(string s)
        {
            byte[] bytes = Encoding.ASCII.GetBytes(s);
            return Convert.ToBase64String(bytes);
        }

        private static string Base64Decode(string s)
        {
            byte[] bytes = Convert.FromBase64String(s);
            return Encoding.ASCII.GetString(bytes);
        }

        #endregion
    }
}