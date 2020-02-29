function addParameterToURL(param) {
  let _url = location.href;
  _url += (_url.split('?')[1] ? '&':'?') + param;
  return _url;
}
var validator = {
  set: function(target, key, value) {
      console.log(`The property ${key} has been updated with ${value}`);
      console.log(target);
      if(target[key] === value){
        return false;
      } else {
        paramsStoredinStorage[key] = value;
        addNewParamstoDOM(paramsStoredinStorage);
      }
      return true;
  }
};
let paramsStoredinStorage = {};
var store = new Proxy(paramsStoredinStorage, validator);
chrome.storage.sync.get(["queryParams"], function(items) {
  paramsStoredinStorage = items.queryParams || {};

  if(Object.keys(paramsStoredinStorage).length>0) {
   addNewParamstoDOM(paramsStoredinStorage);
  }
});

function reloadPage(){
  if(chrome.storage == null || chrome.storage == 'undefined') {
    console.log('storage doesnt exist')
  }
  // chrome.storage.sync.get(["checkBoxValues"], function(items) {
    console.log(paramsStoredinStorage);
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentURL = tabs[0].url;
      let modifiedURLwithQueryString = currentURL;
      // if(currentURL.indexOf("?") !== -1) {
      //   const splitURL = currentURL.split("?");
      //   if(Array.isArray(splitURL) && splitURL.length) {
      //     modifiedURLwithQueryString = splitURL[0];
      //   }
      // }
      const queryParams = Object.entries(paramsStoredinStorage);
      for (let i = 0; i < queryParams.length; i++) {
        modifiedURLwithQueryString = addQueryStringsToURL(queryParams[i][0], queryParams[i][1] ,modifiedURLwithQueryString);
      }
      console.log(modifiedURLwithQueryString);
      chrome.tabs.update(tabs[0].id, {url: modifiedURLwithQueryString});
    });
  // });
}

/*This Function adds query params to the URL passed*/
function addQueryStringsToURL(param, value, URL) {
  let _url = URL;
  _url += (_url.split('?')[1] ? '&':'?') + param;
  return _url+"="+value;
}

function extensionLoaded() {
  chrome.storage.sync.get(["queryParams"], function(items) {
    console.log(items);
  });
}

/*Function which runs on opening of extension*/

document.addEventListener('DOMContentLoaded', function () {
  extensionLoaded();
  const reloadBtns = document.getElementsByClassName('reloadBtn');
  for (let i = 0; i < reloadBtns.length; i++) {
    reloadBtns[i].addEventListener('click', reloadPage)
  }
  const addNewButton = document.getElementById("addNewButton");
  addNewButton.addEventListener('click', addNewQueryParam);

  document.getElementById("paramList").addEventListener("click", function(e) {
    if(e.target && e.target.nodeName == "BUTTON") {
      reloadPage();
      }
  });
});

function addNewQueryParam() {
  const newQueryParamKey = document.getElementById("newQueryStringKey").value;
  const newQueryParamVal = document.getElementById("newQueryStringValue").value;
  if(newQueryParamKey !== "") {
    storeQueryParamsinStorage(newQueryParamKey,newQueryParamVal);
  }
}

/*Function which stores query params in Chrome Storage when user adds a new param */

function storeQueryParamsinStorage(key,val) {
  chrome.storage.sync.get(["queryParams"], (items) => {
    if(Object.keys(items).length > 0 && Object.keys(items.queryParams).length > 0 ) {
      const existingQueryParams = items.queryParams;
      existingQueryParams[key] = val ;
      chrome.storage.sync.set({ "queryParams": existingQueryParams}, function() {
        paramsStoredinStorage[key] = val;
        store[key] = val;
      });
    } else {
      chrome.storage.sync.set({ "queryParams": {[key]: val}}, function() {
        console.log("saving dataaaaa!");
        store[key] = val;
      });
    }
  })

}

function addNewParamstoDOM(queryParams) {
  let domContent = "";
    Object.keys(queryParams).forEach((key,index) => {
      domContent +=
      `<li class='inline-item border1'>
        <p class='line-item-text borderRight1'> ${key}</p>
        <p class="line-item-text borderRight1">${queryParams[key]}</p>
        <span class='line-item borderRight1'>
          <input class='checkbox' type='checkbox' value=${key}>
        </span>
        <span class='line-item'>
          <button class='reloadBtn'>Reload</button>
        </span>
      </li>`
    })
    document.getElementById("paramList").innerHTML = domContent;
}


