function addParameterToURL(param) {
  let _url = location.href;
  _url += (_url.split('?')[1] ? '&':'?') + param;
  return _url;
}
const validator = {
  set: function(target, key, value) {
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
const store = new Proxy(paramsStoredinStorage, validator);
chrome.storage.sync.get(["queryParams"], function(items) {
  paramsStoredinStorage = items.queryParams || {};

  if(Object.keys(paramsStoredinStorage).length>0) {
   addNewParamstoDOM(paramsStoredinStorage);
  }
});

/** This Function picks the query params from the Chrome Storage, appends them in the current URL and reloads the page
**/
function reloadPage(){
  if(chrome.storage == null || chrome.storage == 'undefined') {
    console.log('storage doesnt exist')
  }
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentURL = tabs[0].url;
    let modifiedURLwithQueryString = currentURL;
    const queryParams = Object.entries(paramsStoredinStorage);
    for (let i = 0; i < queryParams.length; i++) {
      if(modifiedURLwithQueryString.includes(`${queryParams[i][0]}=${queryParams[i][1].value}`)){
        if(!queryParams[i][1].checked) {
          modifiedURLwithQueryString = removeURLParameter(modifiedURLwithQueryString , queryParams[i][0]);
        }
        continue;
      } else if (!queryParams[i][1].checked) {
        continue;
      }
      modifiedURLwithQueryString = addQueryStringsToURL(queryParams[i][0], queryParams[i][1].value ,modifiedURLwithQueryString);
    }
    if(modifiedURLwithQueryString.slice(-1) === "?") {
      modifiedURLwithQueryString = modifiedURLwithQueryString.replace(/\?$/, '');
    }
    if(modifiedURLwithQueryString !== currentURL) {
      chrome.tabs.update(tabs[0].id, {url: modifiedURLwithQueryString});
    }
  });
}

/*This Function adds query params to the URL passed*/
function addQueryStringsToURL(param, value, URL) {
  let _url = URL;
  _url += (_url.split('?')[1] ? '&':'?') + param;
  return _url+"="+value;
}

/*Function which runs on opening of extension*/

document.addEventListener('DOMContentLoaded', function () {
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
    if(e.target.type === "checkbox" && e.target.nodeName == "INPUT"){
      handleCheckboxSelection(e.target);
    }
  });
});

function addNewQueryParam() {
  const newQueryParamKey = document.getElementById("newQueryStringKey").value;
  const newQueryParamVal = document.getElementById("newQueryStringValue").value;
  if(newQueryParamKey !== "" && newQueryParamVal !== "") {
    storeQueryParamsinStorage(newQueryParamKey,newQueryParamVal, true);
  }
}

/*Function which stores query params in Chrome Storage when user adds a new param */

function storeQueryParamsinStorage(key,val,checked) {
  chrome.storage.sync.get(["queryParams"], (items) => {
    if(Object.keys(items).length > 0 && Object.keys(items.queryParams).length > 0 ) {
      const existingQueryParams = items.queryParams;
      existingQueryParams[key] = {value:val, checked:checked};
      chrome.storage.sync.set({ "queryParams": existingQueryParams}, function() {
        paramsStoredinStorage[key] = {value:val, checked:checked};
        store[key] = {value:val, checked:checked};
      });
    } else {
      chrome.storage.sync.set({ "queryParams": {[key]: {value:val, checked:checked}}}, function() {
        store[key] = {value:val, checked:checked};
      });
    }
  })

}

function addNewParamstoDOM(queryParams) {
  let domContent = "";
    Object.keys(queryParams).forEach((key) => {
      domContent +=
      `<li class='inline-item border1'>
        <p class='line-item-text borderRight1'> ${key}</p>
        <p class="line-item-text borderRight1">${queryParams[key].value}</p>
        <span class='line-item borderRight1'>
          <input class='checkbox' type='checkbox' data-value=${key} ${queryParams[key].checked ? "checked" : ''}>
        </span
        <span class='line-item'>
          <button class='reloadBtn'>Reload</button>
        </span>
      </li>`;
    })
    document.getElementById("paramList").innerHTML = domContent;
}

function handleCheckboxSelection(checkbox) {
   const paramModified = checkbox.getAttribute("data-value");
   const paramValuesInStorage = paramsStoredinStorage[paramModified];
   if(paramModified && paramValuesInStorage) {
    checkbox.checked ?
      paramValuesInStorage.checked = true :
      paramValuesInStorage.checked = false;
   }
   storeQueryParamsinStorage (
     paramModified,
     paramValuesInStorage.value,
     paramValuesInStorage.checked
   );
}

function removeURLParameter(url, parameter) {
  var urlparts= url.split('?');
  if (urlparts.length>=2) {
    var prefix= encodeURIComponent(parameter)+'=';
    var pars= urlparts[1].split(/[&;]/g);
    for (var i= pars.length; i-- > 0;) {
      if (pars[i].lastIndexOf(prefix, 0) !== -1) {
          pars.splice(i, 1);
      }
    }
    url= urlparts[0]+'?'+pars.join('&');
    return url;
  } else {
      return url;
  }
}
