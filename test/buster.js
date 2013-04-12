
var config = module.exports;

config["slickgrid-bootstrap"] = {
    rootPath: "..",
    environment: "browser",
    libs: [
        "components/jquery/jquery.js"
    ],
    sources: [
        "plugins/slick.rowmovemanager.js"
    ],
    tests: [
        "test/slick.rowmovemanager-test.js"
    ]
};
