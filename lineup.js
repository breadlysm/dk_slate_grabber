// ==UserScript==
// @name         DK Lineup Grabber
// @namespace    http://tampermonkey.net/
// @version      0.14
// @description  When you go to the lineup upload page on Draftkings, this script will grab all available lineups, name them appropriately and allow download as zip. 
// @author       breadlysm
// @include      https://www.draftkings.com/lineup/upload
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip-utils/0.1.0/jszip-utils.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// ==/UserScript==

function getGroupIDs() {
    var slateList = document.querySelectorAll("div.lineup-upload-left > div > ul li");
    var groups = []
    var contestType = document.querySelector("div.lineup-upload-left > div > div:nth-child(4) > a").textContent
    for (var i = 0; i < slateList.length; i++) {
        var gametime = slateList[i].textContent.split(" (",1)[0]
        var game_desc = slateList[i].textContent.split(") ",2)[1].trim()
        var filename = contestType
        var groupId = slateList[i].children[0].getAttribute("data-draft-group-id")
        if (contestType == "SHOWDOWN CAPTAIN MODE") {
            filename = filename + " - " + game_desc
            filename = filename + " " + gametime
        } else if (contestType == "CLASSIC") {
            if (game_desc) {
                filename = filename + " - " + game_desc
            } else {
                filename = filename + " - All Games"
            }
        }

        groups.push({
            filename: filename,
            groupId: groupId,
            type: "csv",
            url: getURL(groupId)
        })
    }
    return groups
}

function getURL(groupId) {
    var url = new URL("https://www.draftkings.com/lineup/getavailableplayerscsv")
    url.searchParams.append("draftGroupId",groupId)
    return url
}


function downloadAllButton() {
    //will need to change href all_button.href = "http://google.com"
    var div = document.querySelector("div.lineup-upload-left > div")
    var button = div.children[6]
    var all_button = button.cloneNode(true)
    all_button.innerText = " Download All" 
    all_button.appendChild(button.children[0].cloneNode(true))
    all_button.setAttribute("style", "margin-right: 5px;");
    all_button.href = "javascript:void(0)"
    all_button.onclick = createZip()
    div.insertBefore(all_button,div.children[7])
}

function createZip() {
    // button.onclick = function() {
    var count = 0;
    var zip = new JSZip();
    var urls = getGroupIDs()
    urls.forEach(function(entry) {
        // TODO: Normalize filenames
        var filename = entry.filename;
        var url = entry.url;
        JSZipUtils.getBinaryContent(url, function (err, data) {
            if (err)
                throw err;
            zip.file(filename + "." + entry.type, data, { binary: true });
            count++;
            if (count == urls.length) {
                zip.generateAsync({ type: 'blob' }).then(function(content) {
                    saveAs(content, "DKLineups.zip");
                });
            }
        });
    });
   // };

}
downloadAllButton()