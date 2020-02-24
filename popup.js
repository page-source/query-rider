function reloadPage(){
  if(chrome.storage == null || chrome.storage == 'undefined') {
    console.log('storage doesnt exist')
  }
  chrome.storage.sync.get(["checkBoxValues"], function(items) {
    console.log(items.checkBoxValues);
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentURL = tabs[0].url;
      let modifiedURLwithQueryString = currentURL;
      if(currentURL.indexOf("?") !== -1) {
        const splitURL = currentURL.split("?");
        if(Array.isArray(splitURL) && splitURL.length) {
          modifiedURLwithQueryString = splitURL[0];
        }
      }
      for (let i = 0; i < items.checkBoxValues.length; i++) {
        modifiedURLwithQueryString = addQueryStringsToURL(items.checkBoxValues[i], modifiedURLwithQueryString);
      }
      console.log(modifiedURLwithQueryString);
      chrome.tabs.update(tabs[0].id, {url: modifiedURLwithQueryString});
    });
  });
}

function addQueryStringsToURL(param, URL) {
  let _url = URL;
  _url += (_url.split('?')[1] ? '&':'?') + param;
  return _url;
}

function storeCheckedValues() {
  let checkedValue = [];
  const inputElements = document.getElementsByClassName('checkbox');
  for (let i=0; inputElements[i]; ++i) {
        if(inputElements[i].checked) {
          checkedValue.push(inputElements[i].value);
        }
  }
  chrome.storage.sync.set({ "checkBoxValues": checkedValue }, function() {
    console.log("saving data!");
  });
}
function extensionLoaded() {
  chrome.storage.sync.get(["checkBoxValues"], function(items){
    console.log(items.checkBoxValues);
  });
}
document.addEventListener('DOMContentLoaded', function () {
  extensionLoaded();
  const reloadBtns = document.getElementsByClassName('reloadBtn');
  for (let i = 0; i < reloadBtns.length; i++) {
    reloadBtns[i].addEventListener('click', reloadPage)
  }
  const checkBoxes = document.getElementsByClassName('checkbox');
  for (let i = 0; i < checkBoxes.length; i++) {
    checkBoxes[i].addEventListener('change', storeCheckedValues)
  }
});
