/**
 * Javascript for the menu.
 */

// See background.js
let URL_INDICATOR = "dynbookmark";

// Construct a path for a bookmark, including the directory names
async function bookmarkpath(bookmark) {
    // Title for bookmark and all containing directories up to root
    let stack = [bookmark.title];
    while ("parentId" in bookmark) {
        bookmark = (await browser.bookmarks.get(bookmark.parentId))[0]
        stack.push(bookmark.title);
    }
    stack.reverse();
    // Remove first two elements: Root and toolbar
    stack.splice(0,2);
    return stack.join("/");
}

// Change a bookmark. Mark as used by this addon or not.
function changeBookmark(bookmark, active) {
    let newurl = bookmark.url;
    if (bookmark.url.startsWith(URL_INDICATOR)) {
        if ( ! active ) {
            newurl = bookmark.url.slice(URL_INDICATOR.length);
        }
    } else {
        if (active) {
            newurl = URL_INDICATOR + bookmark.url;
        }
    }
    browser.bookmarks.update(bookmark.id, {url: newurl});
}

// Construct a line that is used for one bookmark in the popup. Consists of a
// list item with a checkbox and the name of the bookmark. The checkbox
// indicates whether this bookmark is updated by this addon, and changeing the
// checkbox updates the bookmark.
async function makeSettingLine(bookmark, active) {
    let name = await bookmarkpath(bookmark);
    let item = document.createElement("li");
    let checkbox = document.createElement("input");
    let text = document.createTextNode(name);
    checkbox.setAttribute("type", "checkbox");
    if (active) {
        checkbox.setAttribute("checked", true);
    }
    checkbox.addEventListener("change", (e) => {
        changeBookmark(bookmark, e.target.checked);
    });
    item.appendChild(checkbox);
    item.appendChild(text);
    return item;
}

// Get all bookmarks to this tab, active or not, and put them in the menu.
browser.tabs.query({active:true, currentWindow:true}).then((tabs) => {
    let url = tabs[0].url;
    browser.bookmarks.search({url: url}).then((bookmarks) => {
        for (bookmark of bookmarks) {
            makeSettingLine(bookmark, false).then((item) => {
                document.querySelector(".bookmarklist").appendChild(item);
            });
        }
    });
    browser.bookmarks.search({url: URL_INDICATOR+url}).then((bookmarks) => {
        for (bookmark of bookmarks) {
            makeSettingLine(bookmark, true).then((item) => {
                document.querySelector(".bookmarklist").appendChild(item);
            });
        }
    });
});
