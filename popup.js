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
let deletedParams =  [];
const store = new Proxy(paramsStoredinStorage, validator);
chrome.storage.sync.get(["QueryRiderQueryParams"], function(items) {
  paramsStoredinStorage = items.QueryRiderQueryParams || {};

  if(Object.keys(paramsStoredinStorage).length>0) {
   addNewParamstoDOM(paramsStoredinStorage);
  }
});

/** This Function picks the query params from the Chrome Storage,
 * appends them in the current URL and reloads the page
**/
function reloadPage() {
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
    for (const item of deletedParams) {
      modifiedURLwithQueryString = removeURLParameter(modifiedURLwithQueryString ,item);
    }
    if(modifiedURLwithQueryString.slice(-1) === "?") {
      modifiedURLwithQueryString = modifiedURLwithQueryString.replace(/\?$/, '');
    }
    if(modifiedURLwithQueryString !== currentURL) {
      chrome.tabs.update(tabs[0].id, {url: modifiedURLwithQueryString});
    }
  });
}

/* This Function adds query params to the URL passed */
function addQueryStringsToURL(param, value, URL) {
  let _url = URL;
  _url += (_url.split('?')[1] ? '&':'?') + param;
  return _url+"="+value;
}

function removeParamFromStorage(e) {
  const paramRemoved = e.getAttribute("data-value");
  deletedParams.push(paramRemoved);
  chrome.storage.sync.get(items => {
    delete items.QueryRiderQueryParams[paramRemoved];
    paramsStoredinStorage = items.QueryRiderQueryParams || {};
    chrome.storage.sync.set({ QueryRiderQueryParams: items.QueryRiderQueryParams}, function() {
      console.log("items set");
    });;
    addNewParamstoDOM(items.QueryRiderQueryParams);
  })
}

/* Function which runs after Extension finishes loading */

document.addEventListener('DOMContentLoaded', function () {
  const addNewButton = document.getElementById("addNewButton");
  addNewButton.addEventListener('click', addNewQueryParam);

  document.getElementsByTagName('body')[0].addEventListener("click", function(e) {
    if(e.target && e.target.className == "reloadBtn") {
      reloadPage();
    }
    if(e.target.type === "checkbox" && e.target.nodeName == "INPUT"){
      handleCheckboxSelection(e.target);
    }
    if(e.target && e.target.className == "deleteBtn"){
      removeParamFromStorage(e.target);
    }
  });
});

/* Function which adds retrieves param and value from inputs and sends those to storeQueryParamsinStorage func
*/

function addNewQueryParam() {
  const newQueryParamKey = document.getElementById("newQueryStringKey").value;
  const newQueryParamVal = document.getElementById("newQueryStringValue").value;
  if(newQueryParamKey !== "" && newQueryParamVal !== "") {
    storeQueryParamsinStorage(newQueryParamKey,newQueryParamVal, true);
  }
}

/* Function which stores query params in Chrome Storage when user adds a new param */

function storeQueryParamsinStorage(key,val,checked) {
  chrome.storage.sync.get(["QueryRiderQueryParams"], (items) => {
    if(Object.keys(items).length > 0 && Object.keys(items.QueryRiderQueryParams).length > 0 ) {
      const existingQueryParams = items.QueryRiderQueryParams;
      existingQueryParams[key] = {value:val, checked:checked};
      chrome.storage.sync.set({ "QueryRiderQueryParams": existingQueryParams}, function() {
        paramsStoredinStorage[key] = {value:val, checked:checked};
        store[key] = {value:val, checked:checked};
      });
    } else {
      chrome.storage.sync.set({ "QueryRiderQueryParams": {[key]: {value:val, checked:checked}}}, function() {
        store[key] = {value:val, checked:checked};
      });
    }
  })

}

/* This Function adds new params to the list shown in second half of the screen */

function addNewParamstoDOM(queryParams) {
  let domContent = "";
    Object.keys(queryParams).map((key) => {
      domContent +=
      `<li class='inline-item border1'>
        <p class='line-item-text borderRight1'>${key}</p>
        <p class="line-item-text borderRight1">${queryParams[key].value}</p>
        <span class='line-item'>
          <input  ${queryParams[key].checked ? "checked" : ''} class='checkbox' type='checkbox' data-value="${key}"/>
        </span>
        <button class="deleteBtn" data-value="${key}">X</button>
      </li>`;
    })
    if(document.getElementById("paramList")) {
      document.getElementById("paramList").innerHTML = domContent;
    }
}

/* Handle Checkbox Selection */
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

/* Function for a custom paramter web3feo - written for testing purposes */

let isAccessDenied = document && document.querySelectorAll('body h1');
if( isAccessDenied.length &&
    isAccessDenied[0] &&
    isAccessDenied[0].innerHTML === "Access Denied" &&
    !location.href.includes("web3feo")) {
  const newURL = addParameterToURL("web3feo");
  window.location.replace(newURL);
}
