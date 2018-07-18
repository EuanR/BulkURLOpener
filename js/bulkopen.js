/**
 * @todo Convert old settings
 * @todo Convert old link lists
 * @todo Settings tooltips
 */

$(document).ready(function () {
    outputAllLists();
    getCurrentVersion();
    chrome.windows.getCurrent( function(window) {
        chrome.tabs.getAllInWindow(window.id, function(tabs){
            if (!tabs.length) return;

            const listTextArea = document.getElementById("list");

            for (let i = 0; i < tabs.length; ++i) {
                listTextArea.value += tabs[i].url + "\n";
            }
            listTextArea.select();
        });
    });
    for (let i = 0; i < localStorage.length; i++){
        const tempStorageArray = loadList(localStorage.key(i));
        try {
            const parsedList = JSON.parse(tempStorageArray);
            if(parsedList.object_description === "list_storage") {
                $('#savedLists').append('<option id="' + parsedList.list_id +'">'+ parsedList.list_name +'</option>');
            }
        } catch (e) {

        }
    }
    $('#openButton').click(function () {
        openTextAreaList();
    });
    $('#copyCurrentOpen').click(function () {
        getCurrentTabs();
    });
    $('#clearList').click(function () {
        clearLinksList();
    });
    $('#createNewList').click(function () {
        openSaveNewListDialog();
    });
    $('#openList').click(function () {
        openSelectedList();
    });
    $('#editList').click(function () {
        editSelectedList();
    });
    $('#deleteList').click(function () {
        deleteList();
    });
    $('#openSettings').click(function () {
        openSettingsDialog();
    });
    $('#openHelp').click(function () {
        openHelpDialog();
    });
    $('#openImport').click(function () {
        openImportDialog();
    });
    $('#openExport').click(function () {
        openExportDialog();
    });
    $(document).on('change', '#savedLists', function() {
       if(getSetting('auto_open_lists') === 1) {
           openSelectedList();
           openTextAreaList();
       }
    });
    $('#version').text("- Version " + getCurrentVersion());
});

function openTextAreaList() {
    openList(document.getElementById("list").value);
}

function getCurrentTabs() {    
    chrome.windows.getCurrent( function(window) {
        chrome.tabs.getAllInWindow(window.id, function(tabs){
            if (!tabs.length) {
                return;
            }
            const listTextArea = document.getElementById("list");
            listTextArea.value = "";
            for (let i=0; i<tabs.length; ++i) {
                listTextArea.value += tabs[i].url + "\n";
            }
            listTextArea.select();
        });
    });
}

function clearLinksList() {
    const listTextArea = document.getElementById("list");
    listTextArea.value = "";
}

String.prototype.trim = function() { 
	return this.replace(/^\s+|\s+$/g, ''); 
};

function isProbablyUrl(string) {
    let substr = string.substring(0, 4).toLowerCase();
    if (substr === 'ftp:' || substr === 'www.') {
        return true;
    }

    substr = string.substring(0, 5).toLowerCase();
    if (substr === 'http:') {
        return true;
    }

    substr = string.substring(0, 6).toLowerCase();
    if (substr === 'https:') {
        return true;
    }

    substr = string.substring(0, 7).toLowerCase();
    if (substr === 'chrome:') {
        return true;
    }

	return false;
}


/**
 * linksToOpen should use JSON?
 * @param list
 */
function openList(list) {
    const strings = list.split(/\r\n|\r|\n/);
    //Removed, pending better solution. Caused issue for users using browsers other than chrome.
    //if(strings.length > 10) {
    //    if(!(confirm("Are you sure you wish to open " + strings.length + " URLs?"))) {
    //        return;
    //    }
    //}
    let tabCreationDelay = getSetting("tab_creation_delay");
    if(!(tabCreationDelay > 0) || !(strings.length > 1)) {
        for (let i = 0; i<strings.length; i++) {
            if (strings[i].trim() === '') {
                strings.splice(i, 1);
                i--;
            }
        }
        tabCreationDelay = tabCreationDelay * 1000;
        linksIterator(0, strings, tabCreationDelay);
    } else {
        strings.unshift("linksToOpen");
        localStorage.setItem("linksToOpen", strings);
        chrome.tabs.create({'url': chrome.extension.getURL('openingtabs.html')});
    }    
}

function linksIterator(i, strings, tabCreationDelay) {    
    strings[i] = strings[i].trim();
    if (strings[i] == '') {
        return;
    }
    var url = strings[i];
    if (!isProbablyUrl(url)) {
        url = 'http://www.google.com/search?q=' + encodeURI(url);
    }
    chrome.tabs.create({'url':url,'selected':false});
    i++;
    if(i < strings.length){
        setTimeout(linksIterator, tabCreationDelay, i, strings, tabCreationDelay);
    }
}

function openSaveNewListDialog() {
    var arrayOfLines = new Array();
    var lines = $('#list').val().split('\n');
    arrayOfLines.push("temp");
    for(var i = 0;i < lines.length;i++) {
        if(!(lines[i]) == "\n") {
            arrayOfLines.push(lines[i]);
        }
        
    }
    localStorage.setItem("temp", arrayOfLines);
    chrome.tabs.create({'url': chrome.extension.getURL('newlist.html')});
}

function openSelectedList() {
    if(getSelectedListID() === "-1") {
        alert("You need to select a list");
        return;
    }
    for (let i = 0; i < localStorage.length; i++){
        const tempArray = loadList(localStorage.key(i));
        try {
            const parsedList = JSON.parse(tempArray);
            if (parsedList.list_id === parseInt(getSelectedListID())) {
                const listTextArea = document.getElementById("list");
                $('#list').val('');
                for(const link of parsedList.list_links) {
                    listTextArea.value += link + "\n";
                }
                listTextArea.select();
            }
        } catch (e) {

        }
    }
}

function openSettingsDialog() {
    chrome.tabs.create({'url': chrome.extension.getURL('settings.html')});
}

function openHelpDialog() {
    chrome.tabs.create({'url': chrome.extension.getURL('help.html')});
}

function openImportDialog() {
    chrome.tabs.create({'url': chrome.extension.getURL('import.html')});
}

function openExportDialog() {
    chrome.tabs.create({'url': chrome.extension.getURL('export.html')});
}

function deleteList() {
    if(getSelectedListID() === "-1") {
        alert("You need to select a list");
        return;
    }
    if(confirm("Are you sure you wish to delete the list: " + getSelectedList())) {
        removeList(getSelectedListID());
    }    
}

function editSelectedList() {
    if(getSelectedListID() === "-1") {
        alert("You need to select a list");
        return;
    }
    chrome.tabs.create({'url': chrome.extension.getURL('editlist.html?id=' + getSelectedListID() + "&name=" + getSelectedList())});
}

function getSelectedList() {
    return $("#savedLists option:selected").html();    
}

function getSelectedListID() {
    return $('select[id="savedLists"] option:selected').attr('id');
}

function getSetting(setting) {
    const settingSelected = setting.toLowerCase();
    for (let i = 0; i < localStorage.length; i++){
        const tempArray = loadList(localStorage.key(i));
        if(localStorage.key(i) === "settings") {
            const userSettings = JSON.parse(tempArray);
            switch(settingSelected) {
                case "tab_creation_delay":
                    return userSettings.tab_creation_delay;
                    break;
                case "auto_open_lists":
                    return userSettings.auto_open_lists;
                    break;
                default:
                    break;
            }
        }
    }
}

function getCurrentVersion() {
    const manifestData = chrome.runtime.getManifest();
    return(manifestData.version);
}

function upgradeToJSONFormatting() {

}

/**
 * Automatically converted lists from pre 1.1.0 into the new list format. Now for all versions 1.1.4 > lists are stored using json, so this list has been deprecated
 * @deprecated
 */
function convertOldURLLists() {
    for (let i = 0; i < localStorage.length; i++){
        const tempArray = loadList(localStorage.key(i));
        const newListStorageArray = [];
        if(tempArray[0] === localStorage.key(i) && !(localStorage.key(i) === "settings") && !(localStorage.key(i) === "maxID")) {
            console.log("Need to convert: " + tempArray);
            localStorage.removeItem(localStorage.key(i));
            newListStorageArray.push("listStorage");
            newListStorageArray.push(getNextAvailableID());
            for(let x = 1; x < tempArray.length; x++) {
                newListStorageArray.push(tempArray[x]);
            }
            const listID = getNextAvailableID();
            localStorage.setItem(listID, newListStorageArray);          
        }        
    }
}