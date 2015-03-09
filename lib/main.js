var buttons = require('sdk/ui/button/action');
var pageMod = require("sdk/page-mod");

console.log("Running content script");
pageMod.PageMod({
    include: ["*","https://*"],
    contentScriptFile: ["./jquery.js", "./content-script.js"]
});
