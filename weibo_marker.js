// ==UserScript==
// @name        Weibo Bookmark
// @namespace   https://github.com/henix/userjs/weibo_marker
// @description You can place a marker on the last newsfeed you have read, so it can be found easily next time. Ctrl-Click on an item to mark it, again to remove the mark.
// @author      henix
// @version     20151010.3
// @include     http://weibo.com/*
// @include     http://www.weibo.com/*
// @license     MIT License
// @require     https://cdnjs.cloudflare.com/ajax/libs/dom4/1.5.1/dom4.js
// @grant       GM_addStyle
// ==/UserScript==

/**
 * ChangeLog:
 *
 * 2013-3-30	henix
 * 		解决在分组可见微博上添加书签不可见的问题
 *
 * 		分组可见微博有 type_group 这个 class 从而使原始 css 的优先级更高
 *
 * 		Version 1.0.1
 *
 * 2012-10-26	henix
 * 		Updated to new version weibo.
 *
 * 		Version 1.0
 *
 * 2012-7-11	henix
 * 		Fix the bug that can't add marker just upon "XX分钟前，你看到这里".
 *
 * 		Weibo will add a style dl.W_no_border which has a higher priority than ".feedmarker",
 * 		so my style on border will be never applied.
 * 		Change ".feedmarker" to "dl.feedmarker" can fix this bug.
 *
 * 2012-6-14	henix
 * 		Add www.weibo.com
 *
 * 2012-5-30	henix
 * 		Fix the bug that you can not add marker on Chrome sometimes.
 *
 * 		If the script executed before DOM loaded completely, the click handler will not be registered.
 *
 * 2012-2-27	henix
 * 		don't listen on load event
 *
 * 2012-2-27	henix
 * 		Version 0.1
 */

// Array.prototype.find - MIT License (c) 2013 Paul Miller <http://paulmillr.com>
// For all details and docs: https://github.com/paulmillr/array.prototype.find
(function(globals){
  if (Array.prototype.find) return;

  var find = function(predicate) {
    var list = Object(this);
    var length = list.length < 0 ? 0 : list.length >>> 0; // ES.ToUint32;
    if (length === 0) return undefined;
    if (typeof predicate !== 'function' || Object.prototype.toString.call(predicate) !== '[object Function]') {
      throw new TypeError('Array#find: predicate must be a function');
    }
    var thisArg = arguments[1];
    for (var i = 0, value; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) return value;
    }
    return undefined;
  };

  if (Object.defineProperty) {
    try {
      Object.defineProperty(Array.prototype, 'find', {
        value: find, configurable: true, enumerable: false, writable: true
      });
    } catch(e) {}
  }

  if (!Array.prototype.find) {
    Array.prototype.find = find;
  }
})(this);

var curMark;

function markItem(e) {
  if (curMark) {
    demarkItem();
  }
  e.classList.add('feedmarker');
  curMark = e;
}

function demarkItem() {
  curMark.classList.remove('feedmarker');
  curMark = null;
}

function clickHandler(e) {
  if (!e) e = window.event;
  if (!e.ctrlKey) {
    return;
  }
  var tg = window.event ? e.srcElement : e.target;
  if (tg.nodeName === 'A') {
    return;
  }
  var p = tg.parentNode;
  while (p != this) {
    tg = p;
    p = tg.parentNode;
  }
  if (curMark !== tg) {
    markItem(tg);
    localStorage.setItem('feedmarkid', tg.getAttribute('mid'));
  } else {
    demarkItem();
    localStorage.removeItem('feedmarkid');
  }
}

var CSS = (
'div.WB_feed div.WB_feed_type.feedmarker, ' +
'div.WB_feed div.WB_feed_type.feedmarker-old, ' +
'div.WB_feed div.WB_feed_type.type_group.feedmarker, ' +
'div.WB_feed div.WB_feed_type.type_group.feedmarker-old {' +
'border-top-width: 20px;' +
'border-right-width: 1px;' +
'border-bottom-width: 1px;' +
'border-left-width: 1px;' +
'border-top-style: solid;' +
'border-right-style: dashed;' +
'border-bottom-style: dashed;' +
'border-left-style: dashed;' +
'border-right-color: black;' +
'border-bottom-color: black;' +
'border-left-color: black;' +
'}' +
'div.WB_feed div.WB_feed_type.feedmarker-old, ' +
'div.WB_feed div.WB_feed_type.type_group.feedmarker-old {' +
'border-top-color: #ff6;' +
'}' +
'div.WB_feed div.WB_feed_type.feedmarker, ' +
'div.WB_feed div.WB_feed_type.type_group.feedmarker {' +
'border-top-color: #ccc;' +
'}'
);

function whenExists(query, f) {
  var x = query();
  if (x) {
    f(x);
  } else {
    setTimeout(function() { whenExists(query, f); }, 500);
  }
}

if (document.querySelector("div.WB_miniblog")) {
  GM_addStyle(CSS);
  whenExists(function() { return document.querySelector("div.WB_feed"); }, function(feedlist) {
    feedlist.addEventListener('click', clickHandler);
    var oldId = localStorage.getItem('feedmarkid');
    if (oldId) {
      var markOld = function() {
        var item = Array.prototype.slice.call(feedlist.querySelectorAll("div.WB_feed_type")).find(function(e) { return e.getAttribute("mid") == oldId; });
        if (item) {
          item.classList.add("feedmarker-old");
        } else {
          setTimeout(markOld, 1000 * 2); // retry after 2s
        }
      };
      markOld();
    }
  });
}
