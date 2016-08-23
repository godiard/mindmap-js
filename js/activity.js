define(function (require) {
    var activity = require("sugar-web/activity/activity");
    var datastore = require("sugar-web/datastore");
    var textpalette = require("textpalette");
    //var menupalette = require("sugar-web/graphics/menupalette");

    // initialize canvas size
    var onAndroid = /Android/i.test(navigator.userAgent);
    if (window.location.search.indexOf('onAndroid') > -1) {
        onAndroid = true;
    };

    var loadTestData = false;
    if (window.location.search.indexOf('loadTestData') > -1) {
        loadTestData = true;
    };

    var onXo = ((window.innerWidth == 1200) && (window.innerHeight >= 900));
    var sugarCellSize = 75;
    var sugarSubCellSize = 15;
    if (!onXo && !onAndroid) {
        sugarCellSize = 55;
        sugarSubCellSize = 11;
    };

    var localizationData = require("localizationData");
    var lang = navigator.language.substr(0, 2);
    console.log('LANG ' + lang);

    function _(text) {
        // this function add a fallback for the case of translation not found
        // can be removed when we find how to read the localization.ini
        // file in the case of local html file opened in the browser
        translation = localizationData[lang][text];
        if (translation == '') {
            translation = text;
        };
        return translation;
    };

    // Manipulate the DOM only when it is ready.
    require(['domReady!'], function (doc) {

        // Initialize the activity.
        activity.setup();

        if (onAndroid) {
            // hide activity and close buttons on android
            var activityButton = document.getElementById("activity-button");
            var stopButton = document.getElementById("stop-button");
            var firstSeparator = document.getElementById("first-separator");
            activityButton.style.display = 'none';
            stopButton.style.display = 'none';
            firstSeparator.style.display = 'none';
        };

        // HERE GO YOUR CODE

        var initialData =  {"version": "1", "boxs": [{'globes':[]}]};


        if (loadTestData) {
            initialData = testData;
        };

        require("filesaver");
        require("persistence");
        var cordobaIO = new persistence.CordobaIO();

        var options = {
            container:'jsmind_container',
            theme:'greensea',
            editable:true
        }
        _jm = jsMind.show(options);

        /*
        var mainCanvas = document.getElementById("mainCanvas");
        var sortCanvas = document.getElementById("sortCanvas");
        // remove 5 more to be sure no scrollbars are visible
        mainCanvas.height = window.innerHeight - sugarCellSize - 5;
        mainCanvas.width = mainCanvas.height * 4 / 3;
        mainCanvas.style.left = ((window.innerWidth - mainCanvas.width) / 2) + "px";
        */

        var textButton = document.getElementById("text-button");
        var tp = new textpalette.TextPalette(textButton, _('SetGlobeText'));


        var editMode = true;

        // load images
        var imageChooser = document.getElementById('image-chooser');

        /*
        var addButton = document.getElementById("add-button");
        addButton.addEventListener('click', function (e) {
            imageChooser.focus();
            imageChooser.click();
        });
        */
        imageChooser.addEventListener('click', function (event) {
            this.value = null;
        });

        imageChooser.addEventListener('change', function (event) {
            // Read file here.
            var reader = new FileReader();
            reader.onloadend = (function () {
                 // toonModel.addImage(reader.result);
            });

            var file = imageChooser.files[0];
            if (file) {
                reader.readAsDataURL(file);
            };

        }, false);

        // load mindmap files
        var toonChooser = document.getElementById('mindmap-chooser');

        // this part is a fake file selector to use in android
        var fileSelector = document.getElementById('file-selector');

        function selectFile(fileName) {
            fileName = fileName + '.fototoon';
            toonModel.showWait();
            cordobaIO.read(fileName, function(content) {
                closeSelector();
                var zip = new JSZip(content);
                readFototoonFile(zip);
                toonModel.hideWait();
            });
        };

        function closeSelector() {
            fileSelector.style.display = 'none';
            mainCanvas.style.display = 'block';
            pageCounter.style.display = 'block';
        };

        function startFileSelection(fileList) {
            if (fileList.length == 0) {
                activity.showAlert(_('FileNotFound'), '', null, null);
                return;
            };
            mainCanvas.style.display = 'none';
            sortCanvas.style.display = 'none';
            pageCounter.style.display = 'none';

            // create file list entries
            var content = '';
            for (var i = 0; i < fileList.length; i++) {
                var filePath = fileList[i];
                var fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
                fileName = fileName.substring(0, fileName.indexOf('.fototoon'));
                content = content + '<button id="' + fileName + '">' +
                    fileName + '</button><br/>';
            };

            // add a button to close the file selector
            content = content + '<button id="exit-file-selector">' +
                '<img src="./icons/dialog-cancel-black.svg">'
                '</button>';

            fileSelector.style.left = ((window.innerWidth - 500) / 2) + "px";

            fileSelector.style.display = 'block';
            fileSelector.innerHTML = content;
            var buttons = fileSelector.querySelectorAll('button');
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].id != 'exit-file-selector') {
                    buttons[i].addEventListener('click', function(e) {
                        selectFile(e.target.id);
                    });
                } else {
                    buttons[i].addEventListener('click', function(e) {
                        closeSelector();
                    });
                };
            };
        };

        var openButton = document.getElementById("doc-open");
        openButton.addEventListener('click', function (e) {
            if (onAndroid) {
                cordobaIO.getFilesList(startFileSelection);
            } else {
                toonChooser.focus();
                toonChooser.click();
            };
        });

        toonChooser.addEventListener('click', function (event) {
            this.value = null;
        });

        toonChooser.addEventListener('change', function (event) {
            // Read file here.
            var reader = new FileReader();
            reader.onload = (function(theFile) {
                return function(e) {
                    try {
                        // read the content of the file with JSZip
                        var zip = new JSZip(e.target.result);
                        readFototoonFile(zip);
                    } catch(e) {
                        console.log('Exception ' + e.message);
                        console.log('Reading file ' + theFile.name);
                    };
                };
            })(file);
            var file = toonChooser.files[0];
            if (file) {
                reader.readAsArrayBuffer(file);
            };
        }, false);

        function dataURItoString(dataURI) {
            // from http://stackoverflow.com/questions/4998908/
            // convert-data-uri-to-file-then-append-to-formdata/5100158#5100158
            // convert base64/URLEncoded data component to raw binary data held in a string
            var byteString;
            if (dataURI.split(',')[0].indexOf('base64') >= 0)
                byteString = atob(dataURI.split(',')[1]);
            else
                byteString = unescape(dataURI.split(',')[1]);

            return byteString;
        };

        var saveButton = document.getElementById("doc-save");
        saveButton.addEventListener('click', function (e) {
            toonModel.showWait();
            zip = new JSZip();
            // this line is enough to read the file on the js version
            // because the images data is stored as data uris.
            // but the objective is have  file format compatible
            // with the python version

            // zip.file("data.json", JSON.stringify(toonModel.getData()));

            if (!editMode) {
                toonModel.finishSort();
                toonModel.init();
                editMode = true;
            };

            // clone the data to remove the images
            var dataWithoutImages = {}
            dataWithoutImages['version'] = toonModel.getData()['version'];
            dataWithoutImages['boxs'] = toonModel.getData()['boxs'];
            zip.file("data.json", JSON.stringify(dataWithoutImages));

            for(var key in toonModel.getData()['images']) {
                var imageName = key;
                console.log('saving image ' + imageName);
                zip.file(imageName,
                         dataURItoString(toonModel.getData()['images'][imageName]),
                         {'binary': true});
            };

            var blob = zip.generate({type:"blob"});
            if (onAndroid) {
                cordobaIO.save(blob, toonModel.getTitle() + ".fototoon");
                activity.showAlert(_('ToonSaved'),
                    _('FileSavedSuccessfully'), null, null);
            } else {
                saveAs(blob, toonModel.getTitle() + ".fototoon");
            };
            toonModel.hideWait();
        });

        var saveImageButton = document.getElementById("image-save");
        /*
        var saveImageMenuData = [{'id': '0', 'label': _('OneRow')},
                                 {'id': '1', 'label': _('OneColumn')},
                                 {'id': '2', 'label': _('TwoColumns')}];
        var simp = new menupalette.MenuPalette(saveImageButton,
            _("SaveAsImage"), saveImageMenuData);

        for (var i = 0; i < simp.buttons.length; i++) {
            simp.buttons[i].addEventListener('click', function(e) {
                if (onAndroid) {
                    toonModel.saveAsImage(this.id, null);
                    activity.showAlert(_('ImageSaved'),
                        _('TheImageIsSavedInYourGallery'), null, null);
                } else {
                    toonModel.saveAsImage(this.id, function(blob) {
                        saveAs(blob, "fototoon.png");
                    });
                };
            });
        };
        */

        /*
        var cleanAllButton = document.getElementById("clean-all-button");

        cleanAllButton.addEventListener('click', function (e) {

            activity.showConfirmationAlert(_('ATENTION'),
                _('RemoveAllConfirmMessage'),
                _('Yes'), _('No'), function(result) {
                    if (result) {
                        toonModel.setData(initialData);
                        if (!editMode) {
                            toonModel.changeToEditMode();
                            editMode = true;
                        };
                    };
                });
        });
        */
    });

});
