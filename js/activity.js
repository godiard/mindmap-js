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

        require("filesaver");
        require("persistence");
        var cordobaIO = new persistence.CordobaIO();

        var options = {
            container:'jsmind_container',
            theme:'default',
            editable:true,
            default_event_handle:{
                enable_dblclick_handle:false
            },
            shortcut:{
                enable:false
            }
        }
        _jm = jsMind.show(options);
        _jm.update_node('root', _('RootNodeText'));

        function get_selected_nodeid(){
            var selected_node = _jm.get_selected_node();
            if(!!selected_node){
                return selected_node.id;
            }else{
                return null;
            }
        }

        // paleta de edicion de texto
        var textButton = document.getElementById("text-button");
        var tp = new textpalette.TextPalette(textButton, _('SetGlobeText'));

        // NOTE: this not work on IE see here for more info:
        // http://stackoverflow.com/questions/2823733/textarea-onchange-detection
        tp.editorElem.addEventListener('input', function() {
            _jm.update_node(get_selected_nodeid(), this.value);
        }, false);;

        var colorButtons = tp.colorButtons;
        for (var i = 0; i < colorButtons.length; i++) {
            colorButtons[i].addEventListener('click', function(e) {
                _jm.set_node_color(get_selected_nodeid(), null, this.value);
            });
        };

        //

        _jm.view.add_event(this,'dblclick',function(e) {
            var topic = _jm.get_node(get_selected_nodeid()).topic;
            tp.setText(topic);
            tp.popUp();
            tp.editorElem.focus();
        });

        _jm.view.add_event(this,'mousedown',function(e) {
            var topic = _jm.get_node(get_selected_nodeid()).topic;
            tp.setText(topic);
        });

        //

        var addNodeButton = document.getElementById("add-node");
        var addImageNodeButton = document.getElementById("add-image-node");

        // load images
        var imageChooser = document.getElementById('image-chooser');

        addNodeButton.addEventListener('click', function (e) {
            var selected_node = _jm.get_selected_node(); // as parent of new node
            if(!selected_node){
                //prompt_info('please select a node first.');
                return;
            }
            var nodeid = jsMind.util.uuid.newid();
            var topic = _('NodeText');
            var node = _jm.add_node(selected_node, nodeid, topic);
        });

        addImageNodeButton.addEventListener('click', function (e) {
            var selected_node = _jm.get_selected_node(); // as parent of new node
            if(!selected_node){
                //prompt_info('please select a node first.');
                return;
            }
            imageChooser.focus();
            imageChooser.click();
        });

        imageChooser.addEventListener('click', function (event) {
            this.value = null;
        });

        imageChooser.addEventListener('change', function (event) {
            var reader = new FileReader();
            reader.onloadend = (function () {
                var selected_node = _jm.get_selected_node();
                var nodeid = jsMind.util.uuid.newid();
                var topic = undefined;
                var topic = undefined;
                var data = {
                    "backgroundImage": reader.result,
                    "width": "100",
                    "height": "100"};
                var node = _jm.add_node(selected_node, nodeid, topic, data);
            });

            var file = imageChooser.files[0];
            if (file) {
                reader.readAsDataURL(file);
            };
        }, false);

        // load mindmap files
        var mindmapChooser = document.getElementById('mindmap-chooser');

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
                mindmapChooser.focus();
                mindmapChooser.click();
            };
        });

        mindmapChooser.addEventListener('click', function (event) {
            this.value = null;
        });

        mindmapChooser.addEventListener('change', function (event) {
            var file = mindmapChooser.files[0];
            if (file) {
                jsMind.util.file.read(file,function(jsmind_data, jsmind_name){
                    var mind = jsMind.util.json.string2json(jsmind_data);
                    if(!!mind){
                        _jm.show(mind);
                    }else{
                        prompt_info('can not open this file as mindmap');
                    }
                });
            };
        }, false);

        var saveButton = document.getElementById("doc-save");
        saveButton.addEventListener('click', function (e) {
            var mind_data = _jm.get_data();
            var mind_name = mind_data.meta.name;
            var mind_str = jsMind.util.json.json2string(mind_data);
            jsMind.util.file.save(mind_str,'text/jsmind',mind_name+'.jm');
        });

        var saveImageButton = document.getElementById("image-save");
        saveImageButton.addEventListener('click', function (e) {
            _jm.shoot();
        });

        var deleteButton = document.getElementById("delete-button");
        deleteButton.addEventListener('click', function (e) {
            var selected_id = get_selected_nodeid();
            if(!selected_id){
                //prompt_info('please select a node first.');
                return;
            }

            _jm.remove_node(selected_id);
        });


    });

});
