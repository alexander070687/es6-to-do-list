import Item from "./Item.js";
import Status from "./Status.js";
import List from "./List.js";
import Utils from "./Utils.js";
import App from "./App.js";
let app = new App();
/** To update localstorage with current app model */
function updateLocalStorage() {
    localStorage.setItem("appmodel", JSON.stringify(app));
}
/**
 * To check and invoke callback if it is defined
 * @param {function} callback - callback function
 */
function callbackHandler(callback) {
    if (typeof callback === "function") {
        return callback();
    }
}
/**
 * Event handler for `drop` event on list item
 * @param {object} event - Associated event
 */
function itemDropped(event, callback) {
    event.preventDefault();
    let itemJSON = JSON.parse(event.dataTransfer.getData("item"));
    let oldListId = JSON.parse(event.dataTransfer.getData("parentListId"));
    let newListId = Utils.getParents(event.target, ".list")[0].dataset.id;
    let item = app.getItemById(itemJSON.id);
    let oldList = app.getListById(oldListId);
    let newList = app.getListById(newListId);
    if (oldList && newList) { // can't move to and from past due date
        oldList.remove(item);
        newList.add(item);
        return callbackHandler(callback);
    }
}
/**
 * Event handler for `change` of list item status
 * @param {object} event - Associated event
 */
function statusChanged(event, callback) {
    let itemId = Utils.getParents(event.target, ".item")[0].dataset.id;
    let item = app.getItemById(itemId);
    item.status = (event.target.checked) ? Status.COMPLETE : Status.PENDING;
    return callbackHandler(callback);
}
/**
 * Event handler for `blur` event on list title
 * @param {object} event - Associated event
 */
function listTitleInput(event, callback) {
    let listId = Utils.getParents(event.target, ".list")[0].dataset.id;
    let list = app.getListById(listId);
    list.title = (event.target.textContent) ? event.target.textContent :
        "Enter titile";
    updateLocalStorage();
    return callbackHandler(callback);
}
/**
 * Event handler for `blur` event on list item title
 * @param {object} event - Associated event
 */
function itemTitleInput(event, callback) {
    let itemId = Utils.getParents(event.target, ".item")[0].dataset.id;
    let item = app.getItemById(itemId);
    item.title = (event.target.textContent) ? event.target.textContent :
        "Enter titile";
    return callbackHandler(callback);
}
/**
 * Event handler for `change` event on list item date
 * @param {object} event - Associated event
 */
function itemDateChanged(event, callback) {
    let itemId = Utils.getParents(event.target, ".item")[0].dataset.id;
    let item = app.getItemById(itemId);
    if (event.target.value) {
        let d = new Date();
        item.date = new Date(event.target.value + " " + d.getHours() + ":" + d.getMinutes() +
            ":" + d.getSeconds());
    } else {
        item.date = "";
        return callbackHandler(callback);
    }
    return callbackHandler(callback);
}
/**
 * Event handler for `dragstart` event on list item
 * @param {object} event - Associated event
 */
function itemDragStarted(event, callback) {
    let itemId = Utils.getParents(event.target, ".item")[0].dataset.id;
    let item = app.getItemById(itemId);
    let parentListId = Utils.getParents(event.target, ".list")[0].dataset.id;
    event.dataTransfer.setData("item", JSON.stringify(item));
    event.dataTransfer.setData("parentListId", JSON.stringify(parentListId));
    return callbackHandler(callback);
}
/** Prevents default action for dragover event on list items */
function allowdrop(event, callback) {
    event.preventDefault();
    return callbackHandler(callback);
}
/**
 * Event handler for clicks on elements with class .btn
 * @param {object} event - Event attached with click
 */
function buttonClicked(event, callback) {
    let action = event.target.dataset.action;
    switch (action) {
        case "add-list":
            {
                let list = new List("New List");
                app.add(list);
                break;
            }
        case "delete-list":
            {
                let listId = Utils.getParents(event.target, ".list")[0].dataset
                    .id;
                let list = app.getListById(listId);
                app.remove(list);
                break;
            }
        case "add-item":
            {
                let listId = Utils.getParents(event.target, ".list")[0].dataset
                    .id;
                let list = app.getListById(listId);
                let item = new Item("New Item");
                list.add(item);
                break;
            }
        case "delete-item":
            {
                let itemId = Utils.getParents(event.target, ".item")[0].dataset
                    .id;
                let item = app.getItemById(itemId);
                let listId = Utils.getParents(event.target, ".list")[0].dataset
                    .id;
                let list = app.getListById(listId);
                list.remove(item);
                break;
            }
        case "add-date":
            {
                let itemId = Utils.getParents(event.target, ".item")[0].dataset
                    .id;
                let listId = Utils.getParents(event.target, ".list")[0].dataset
                    .id;
                let list = app.getListById(listId);
                let item = list.getItemById(itemId);
                let currentDate = new Date();
                currentDate.setDate(currentDate.getDate() + 1);
                item.date = currentDate.toUTCString();
                break;
            }
        default:
            throw Error("Unhandled Event");
    }
    return callbackHandler(callback);
}
/** To paint the dom based on current state */
function drawDom() {
    // TO-DO: REFRACTOR
    updateLocalStorage();
    document.body.innerHTML = app.render();
    let buttons = document.getElementsByClassName("btn");
    let eventHandlers = {
        buttonClicked: function(event) {
            buttonClicked(event, drawDom);
        },
        statusChanged: function(event) {
            statusChanged(event, drawDom);
        },
        listTitleInput: function(event) {
            listTitleInput(event, drawDom);
        },
        itemTitleInput: function(event) {
            itemTitleInput(event, drawDom);
        },
        itemDateChanged: function(event) {
            itemDateChanged(event, drawDom);
        },
        itemDragStarted: function(event) {
            itemDragStarted(event);
        },
        itemDropped: function(event) {
            itemDropped(event, drawDom);
        }
    };
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", eventHandlers.buttonClicked);
    }
    let statusInputs = document.getElementsByClassName("status-input");
    for (let i = 0; i < statusInputs.length; i++) {
        statusInputs[i].addEventListener("change", eventHandlers.statusChanged);
    }
    let listTitles = document.getElementsByClassName("list-title");
    for (let i = 0; i < listTitles.length; i++) {
        if (listTitles[i].parentNode.dataset.iseditable === "true") {
            listTitles[i].setAttribute("contenteditable", true);
            listTitles[i].addEventListener("blur", eventHandlers.listTitleInput);
        }
    }
    let itemTitles = document.getElementsByClassName("item-title");
    for (let i = 0; i < itemTitles.length; i++) {
        itemTitles[i].setAttribute("contenteditable", true);
        itemTitles[i].addEventListener("blur", eventHandlers.itemTitleInput);
    }
    let itemDates = document.getElementsByClassName("item-date");
    for (let i = 0; i < itemDates.length; i++) {
        itemDates[i].addEventListener("change", eventHandlers.itemDateChanged);
    }
    let items = document.getElementsByClassName("item");
    for (let i = 0; i < items.length; i++) {
        let parentListIsEditable = Utils.getParents(items[i], ".list")[0].dataset
            .iseditable;
        if (parentListIsEditable === "true") {
            items[i].setAttribute("draggable", true);
            items[i].addEventListener("dragstart", eventHandlers.itemDragStarted);
        }
    }
    let lists = document.getElementsByClassName("list");
    for (let i = 0; i < lists.length; i++) {
        lists[i].addEventListener("dragover", allowdrop);
        lists[i].addEventListener("drop", eventHandlers.itemDropped);
    }
}
/** Retrives application state from localstorage */
function getAppFromModel() {
    if (localStorage.getItem("appmodel")) {
        let appModel = JSON.parse(localStorage.getItem("appmodel"));
        appModel.lists.forEach(function(list) {
            let items = [];
            list.items.forEach(function(item) {
                items.push(new Item(item.title, item.date, item
                    .status, item.id));
            });
            app.add(new List(list.title, items, list.isEditable, list.id));
        });
        app.pastDueList = new List("Past Due", app.getDueItems(), false);
    }
}
/** This function is called when DOM is ready. */
function ready() {
    getAppFromModel();
    drawDom();
}
document.addEventListener("DOMContentLoaded", ready, false);
