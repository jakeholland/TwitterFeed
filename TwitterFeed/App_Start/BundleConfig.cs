using System.Web;
using System.Web.Optimization;

namespace TwitterFeed
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new StyleBundle("~/Content/css").Include("~/Content/bootstrap.css","~/Content/site.css"));

            bundles.Add(new ScriptBundle("~/Scripts/js").Include("~/Scripts/jquery-2.1.1.min.js", "~/Scripts/bootstrap.min.js", "~/Scripts/knockout-3.3.0.js", "~/Scripts/sammy-0.7.5.min.js", "~/Scripts/main.js"));
        }
    }
}