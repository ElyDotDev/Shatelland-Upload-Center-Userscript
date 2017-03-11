// ==UserScript==
// @name         Shatelland Upload Center Advanced Features Development
// @namespace    http://allii.ir/
// @version      0.0.0beta
// @description  Add new and advanced features to Shatelland upload center
// @author       Alireza Dabiri Nejad | alireza.dabirinejad@live.com | http://allii.ir
// @include      http*://*shatelland.com/upload*
// @run-at       document-end
// @noframes
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    'use strict';
    
    GM_xmlhttpRequest({
        method: 'GET',
        url: 'http://localhost:5005/bundle.js',
        onload: function (response) {
            var s = document.createElement('script');
            s.type = 'text/javascript';
            s.innerHTML = response.responseText;
            document.getElementsByTagName('body')[0].appendChild(s);
        }
    });
})();
