requirejs.config({
    baseUrl: "lib",
    paths: {
        activity: "../js",
        preload: "../lib/preloadjs-0.6.1.min",
        textpalette: "../js/textpalette",
        localizationData: "../js/localization_data",
        filesaver: "../lib/FileSaver.min",
        canvasToBlob: "../lib/canvas-toBlob",
        persistence: "../js/persistence",
    }
});

requirejs(["activity/activity"]);
