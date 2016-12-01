define(function (require) {

    persistence = {};

    function errorHandler(e) {
      var msg = '';

      switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
          msg = 'QUOTA_EXCEEDED_ERR';
          break;
        case FileError.NOT_FOUND_ERR:
          msg = 'NOT_FOUND_ERR';
          break;
        case FileError.SECURITY_ERR:
          msg = 'SECURITY_ERR';
          break;
        case FileError.INVALID_MODIFICATION_ERR:
          msg = 'INVALID_MODIFICATION_ERR';
          break;
        case FileError.INVALID_STATE_ERR:
          msg = 'INVALID_STATE_ERR';
          break;
        default:
          msg = 'Unknown Error';
          break;
      };

      console.log('Error: ' + msg);
    };


    function CordobaIO(parent) {

        var readAsType = {
            ARRAY_BUFFER: 0,
            BINARY_STRING: 1,
            DATA_URL: 2,
            TEXT: 3
        };

        this.save = function(content, fileName) {
            // save a file to disk

            function onDirResolved(dir) {
                dir.getFile(fileName, {create:true}, function(file) {
                    file.createWriter(function(fileWriter) {
                        fileWriter.write(content);
                        console.log('FILE SAVED ' + fileName);
                    }, errorHandler);
                });
            };

            function onFsResolved(fs) {
                window.resolveLocalFileSystemURL(
                    cordova.file.externalApplicationStorageDirectory,
                    onDirResolved, errorHandler);
            };

            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
                onFsResolved, errorHandler);
        };

        this.getFilesList = function(fileExtension, callback) {
            var fileList = [];

            function onDirResolved(dir) {
                var reader =dir.createReader();
                reader.readEntries(function(entries) {
                    for (var i=0; i<entries.length; i++) {
                        if (entries[i].name.indexOf(fileExtension) != -1) {
                            fileList.push(entries[i].fullPath);
                        };
                    };
                    console.log('fileList ' + fileList);
                    callback(fileList);
                }, errorHandler);
            };

            function onFsResolved(fs) {
                window.resolveLocalFileSystemURL(
                    cordova.file.externalApplicationStorageDirectory,
                    onDirResolved, errorHandler);
            };

            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
                onFsResolved, errorHandler);

            return fileList;
        };

        this.read = function(fileName, callback) {
            // read a file from disk and send to callback as a ArrayBuffer
            readAs(fileName, readAsType.ARRAY_BUFFER, callback)
        };

        this.readAsBinaryString = function(fileName, callback) {
            // read a file from disk and send to callback as text
            readAs(fileName, readAsType.BINARY_STRING, callback)
        };

        this.readAsText = function(fileName, callback) {
            // read a file from disk and send to callback as text
            readAs(fileName, readAsType.TEXT, callback)
        };

        this.readAsDataURL = function(fileName, callback) {
            // read a file from disk and send to callback as text
            readAs(fileName, readAsType.DATA_URL, callback)
        };

        readAs = function(fileName, readAs, callback) {
            // read a file from disk

            function onFileResolved(entry) {

                entry.file(function(file) {
                    var reader = new FileReader();
                    reader.onloadend = function(e) {
                        console.log("Read file: " + fileName);
                        callback(e.target.result);
                    };

                    switch (readAs) {
                    case readAsType.ARRAY_BUFFER:
                        reader.readAsArrayBuffer(file);
                        break;
                    case readAsType.BINARY_STRING:
                        reader.readAsBinaryString(file);
                        break;
                    case readAsType.DATA_URL:
                        reader.readAsDataURL(file);
                        break;
                    case readAsType.TEXT:
                        reader.readAsText(file);
                        break;
                    };

                });
            };

            function onFsResolved(fs) {
                window.resolveLocalFileSystemURL(
                    cordova.file.externalApplicationStorageDirectory + fileName,
                    onFileResolved, errorHandler);
            };

            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
                onFsResolved, errorHandler);
        };


    };

    persistence.CordobaIO = CordobaIO;

    return persistence;
});

