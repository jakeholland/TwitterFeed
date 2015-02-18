using System.Web;
using System.Web.Optimization;

namespace TwitterFeed
{
    public class BundleConfig
    {
        // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new StyleBundle("~/Content/css").Include("~/Content/site.css", "~/Content/bootstrap.css"));

            bundles.Add(new ScriptBundle("~/Scripts/js").Include("~/Scripts/jquery-2.1.1.min.js", "~/Scripts/bootstrap.js", "~/Scripts/knockout-3.2.0.js", "~/Scripts/sammy-0.7.5.js", "~/Scripts/main.js"));
        }
    }
}