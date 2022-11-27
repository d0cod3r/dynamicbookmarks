/**
 * See the README.md file.
 */

// The indicator at the start of a bookmark URL that indicates this bookmark
// should be updated.
let URL_INDICATOR = "dynbookmark";

// List of tabs to dynamically update. For each tab ID as a key, a list of
// bookmark IDs is saved.
let activeTabs = {};

function onBeforeNavigate(details) {
    // If the user navigates to a new URL, check whether this is a bookmark with
    // the indicator.
    if (details.url.startsWith(URL_INDICATOR)) {
        let tabId = details.tabId;
        // Change the URL to the useful part.
        let newurl = details.url.slice(URL_INDICATOR.length);
        browser.tabs.update(tabId, {"url": newurl});
        // Find the bookmark (or bookmarks) that save this URL and mark the
        // current tab to update them.
        browser.bookmarks.search({url : details.url}).then((bookmarks) => {
            if (bookmarks.length < 1) {
                throw "Found no bookmark despite indicator."
            }
            for (bookmark of bookmarks) {
                if ( ! (tabId in activeTabs)) {
                     activeTabs[tabId] = [];
                }
                activeTabs[tabId].push(bookmark.id);
            }
        });
    }
}

function onTabUpdated(tabid, changeinfo, tab) {
    // When a tab changes, check whether it is one of the tabs that update a
    // bookmark (or several). In that case, update the bookmark(s).
    if (tabid in activeTabs) {
        for (bookmark of activeTabs[tabid]) {
            let newurl = URL_INDICATOR + tab.url;
            browser.bookmarks.update(bookmark, {"url": newurl});
        }
    }
}

browser.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate);
browser.tabs.onUpdated.addListener(onTabUpdated);
