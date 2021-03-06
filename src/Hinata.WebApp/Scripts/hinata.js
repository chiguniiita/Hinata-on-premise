﻿/// <reference path="_references.js" />

(function (window) {
    'use strict';

    var escapeHtml = function (str) {
        var escapeMap = {
            '"': '&quot;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            ' ': '&nbsp;',
            "'": '&#x27;',
            '`': '&#x60;'
        };
        var escapeReg = '[';
        var reg;
        for (var p in escapeMap) {
            if (escapeMap.hasOwnProperty(p)) {
                escapeReg += p;
            }
        }
        escapeReg += ']';
        reg = new RegExp(escapeReg, 'g');

        str = (str === null || str === undefined) ? '' : '' + str;
        return str.replace(reg, function (match) {
            return escapeMap[match];
        });
    };

    var hinata = {}

    hinata.insertAtCaret = function (areaId, text) {
        var txtarea = document.getElementById(areaId);
        var scrollPos = txtarea.scrollTop;
        var strPos = 0;
        var br = ((txtarea.selectionStart || txtarea.selectionStart === "0") ? "ff" : (document.selection ? "ie" : false));
        var range;
        if (br === "ie") {
            txtarea.focus();
            range = document.selection.createRange();
            range.moveStart("character", -txtarea.value.length);
            strPos = range.text.length;
        } else if (br === "ff") strPos = txtarea.selectionStart;

        var front = (txtarea.value).substring(0, strPos);
        var back = (txtarea.value).substring(strPos, txtarea.value.length);
        txtarea.value = front + text + back;
        strPos = strPos + text.length;
        if (br === "ie") {
            txtarea.focus();
            range = document.selection.createRange();
            range.moveStart("character", -txtarea.value.length);
            range.moveStart("character", strPos);
            range.moveEnd("character", 0);
            range.select();
        } else if (br === "ff") {
            txtarea.selectionStart = strPos;
            txtarea.selectionEnd = strPos;
            txtarea.focus();
        }
        txtarea.scrollTop = scrollPos;
    }

    hinata.charcount = function (str) {
        var len = 0;
        str = escape(str);
        for (var i = 0; i < str.length; i++, len++) {
            if (str.charAt(i) === "%") {
                if (str.charAt(++i) === "u") {
                    i += 3;
                    len++;
                }
                i++;
            }
        }
        return len;
    }

    hinata.diff = function(oldText, newText) {
        var diff = JsDiff.diffLines(oldText, newText);
        var html = '';
        if (diff.length !== 1) {
            var oldLineCount = oldText.split('\n').length;
            var newLineCount = newText.split('\n').length;
            html = '<div class="diff-block-info">@@ -1,' + oldLineCount + ' +1,' + newLineCount + ' @@</div>';
        }
        diff.forEach(function(block) {
            var symbol;
            var className;
            if (block.added) {
                className = 'added';
                symbol = '<span class="symbol">+</span>';
            }
            else if (block.removed) {
                className = 'removed';
                symbol = '<span class="symbol">-</span>';
            } else {
                className = 'unchanged';
                symbol = '<span class="symbol">&nbsp;</span>';
            }

            var lines = block.value.replace(/\n+$/g,'').split('\n');

            lines.forEach(function (line) {
                html += '<div class="' + className + '">' + symbol + escapeHtml(line) + '</div>';
            });
        });
        return html;
    }

    hinata.getGuid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        })
    };

    window.hinata = hinata;
})(window);

(function ($, window, undefined) {
    "use strict";

    $.fn.extend({
        tabIndent: function (spaces) {
            if (!$(this).data("_keydownAttached")) {
                $(this).data("_keydownAttached", true);

                if (spaces === null || spaces === undefined) {
                    spaces = 4;
                }

                $(this).on("keydown", function(event) {
                    var keyCode = event.keyCode || event.which;

                    if (keyCode === 9) {
                        event.preventDefault();
                        var elem = event.target;
                        var val = elem.value;
                        var pos = elem.selectionStart;
                        var lines = elem.value.substring(0, pos).split("\n");
                        var lineText = lines[lines.length - 1];
                        if (event.shiftKey === false) {
                            var lineCharCount = hinata.charcount(lineText);
                            var spaceCount = spaces - (lineCharCount % spaces);
                            var putSpace = "";
                            for (var i = 0; i < spaceCount; i++) {
                                putSpace += " ";
                            }
                            elem.value = val.substr(0, pos) + putSpace + val.substr(pos, val.length);
                            elem.setSelectionRange(pos + spaceCount, pos + spaceCount);
                        } else {
                            var spaceRemoveCount = 0;
                            for (var j = 1; j <= spaces; j++) {
                                if (lineText.substr(lineText.length - 1, 1) === " ") {
                                    lineText = lineText.substr(0, lineText.length - 1);
                                    spaceRemoveCount = j;
                                } else {
                                    break;
                                }
                            }
                            elem.value = val.substr(0, pos - spaceRemoveCount) + val.substr(pos, val.length);
                            elem.setSelectionRange(pos - spaceRemoveCount, pos - spaceRemoveCount);
                        }
                    }
                });
            }
            return $(this);
        },

        typeCharacter: function (func) {
            if (!$(this).data("_keyupAttached")) {
                $(this).data("_keyupAttached", true);
                $(this).on("keyup", function (event) {
                    var keyCode = event.keyCode || event.which;
                    if (([9, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 91, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 144, 145]).indexOf(keyCode) === -1) {
                        $(this).trigger("typeCharacter");
                    }
                });

                if (func) {
                    $(this).bind("typeCharacter", func);
                } else {
                    $(this).trigger("typeCharacter");
                }
            }
            return $(this);
        }
    });
})(jQuery, window);