$(function(){

    // Safari detectiong for clipboard message
    var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
    var is_safari = navigator.userAgent.indexOf("Safari") > -1;
    if ((is_chrome)&&(is_safari)) {is_safari=false;}

    // the current item data object as global jQuery variable

    var currentItemData;

    $(document).keyup(function(e) {
        if (e.keyCode == 27) { // escape key maps to keycode `27`
            history.pushState('', document.title, window.location.pathname);
            refreshAfterHashChange();
        }
        if (e.keyCode == 37) {
            turnItem(-1);
        }
        if (e.keyCode == 39) {
            turnItem(1);
        }
    });

    function refreshAfterHashChange(sStrippedHash) {
        $(".item-element").removeClass("active");

        var sStrippedHash= location.hash.replace('#', '');
        if (sStrippedHash.length == 0){
            // No item, hide panel, remove highlight, stop doing stuff
            // This is for when users hit the back button until beginning
            $("#showcase").hide();
            return;
        }

        currentItemData = $("#data-" + sStrippedHash);

        $("#item-" + sStrippedHash).parent().addClass("active")
                                            .closest("ul").show();

        if ( $(currentItemData).length == 0 ) {
            return;
        }

        $("#showbox-code").html( $(currentItemData).children(".code").html() );
        if ($(currentItemData).children(".alt-rendered").length) {
            var htmlForPreview = $(currentItemData).children(".alt-rendered")
        } else {
            var htmlForPreview = $(currentItemData).children(".rendered")
        }

        $("#showbox-example").html( $(htmlForPreview).html() );
        $("#current-item-title").html($(currentItemData).children(".display-title").html());
        $("#showcase").show();
        // prevent links from going to the top in the preview box
        $('#showbox-example a[href="#"]').click(function (e) {
          e.preventDefault()
        })

        if (   sStrippedHash === "dropdown__open"
            || sStrippedHash === "dropdown-divider"
            || sStrippedHash === "dropdown-item__disabled"
            || sStrippedHash === "dropdown-header") {
            // Bootstrap.js somehow removes .open from this when copying from data to preview box
            $("#showbox-example").children(".dropdown").addClass('open');
        }

        $('#showbox-example [data-spy="scroll"]').each(function () {
          $(this).scrollspy('refresh')
        })

        $('#showbox-example [data-toggle="tooltip"]').tooltip();
        $('#showbox-example [data-toggle="popover"]').popover();
        $('#showbox-example .toast').toast();

        highlightClass();
    }

    function highlightClass() {
        // A programmer has a problem, he decides to use regex. Now he has two problems.

        if( $(currentItemData).children(".clipboard").length ) {
            // As basis we take the clipboard value of any type (eg. "col-md-1")
            var sHighlightThis = $(currentItemData).children(".clipboard").html();

            // Use regex to make a regex :)
            var sFindRegex = sHighlightThis.replace(/(xs|sm|md|lg|xl)/, '(xs|sm|md|lg|xl)');
            sFindRegex = sFindRegex.replace(/(1|2|3|4|5|6|7|8|9|10|12)/, '(1|2|3|4|5|6|7|8|9|10|12)');
            sFindRegex += '(?!-)'; // prevents greedy matching for list-item and list-item-inline
            var rFindRegex = new RegExp(sFindRegex, 'g');
            // above example, "col-md-1", would now be "col-(xs|sm|md|lg|xl)-(1|2|3|4|5|6|7|8|9|10|12)"
            // a bug right now is that in the case of "col-md-1 col-xs-5" this would highlight both


            // Cooking up the replace pattern,
            // from "col-md-1" to "col-$1-$2" OR "display-1" to "display-$1"
            if(sHighlightThis.match(/(xs|sm|md|lg|xl)/)) {
                // if xs* is present, then the number will be the second match..
                var sNumberReplaceVariable = '$$2';
            } else {
                // otherwise it will be the first and only match
                var sNumberReplaceVariable = '$$1';
            }
            var sReplacePattern = sHighlightThis.replace(/(12|10|1|2|3|4|5|6|7|8|9)/,
                                                        sNumberReplaceVariable);
            sReplacePattern = sReplacePattern.replace(/(xs|sm|md|lg|xl)/, '$$1');

            $("#showbox-code").html(
                $("#showbox-code").html().replace(
                    rFindRegex ,'<span class="harder-highlight">' + sReplacePattern + '</span>'
                )
            );
        }
    }

    window.onhashchange = function() {
        refreshAfterHashChange();
    };

    $(".item-link").click(function(e) {
        // if the clicked item is currently shown, we toggle instead
        if ( $(this).attr('href') == location.hash ) {
            history.pushState('', document.title, window.location.pathname);
            refreshAfterHashChange();
            e.preventDefault()
        }
    });

    //this array will carry a list of all present items, for navigation arrows
    aItemList = [];

    $(".item-link").each(function() {
        aItemList.push($(this).attr("id"));
    });

    function turnItem(distance) {
        var sCurrentlyActive = $('.item-element.active .item-link').attr("id");

        if(sCurrentlyActive === undefined){
            if (distance > 0) {
                // if none is active and we go forward, select first item
                var iNextItem = 0;
            } else {
                // if none is active and we go backwards, select last item
                var iNextItem = aItemList.length - 1;
            }
        } else if (distance > 0) {
            var iNextItem = 0;
            var index = aItemList.indexOf(sCurrentlyActive);
            if (index >= 0 && index < aItemList.length - 1) {
                iNextItem = index + 1;
            }
        } else {
            var sCurrentlyActive = $('.item-element.active .item-link').attr("id");
            var iNextItem = aItemList.length - 1;
            var index = aItemList.indexOf(sCurrentlyActive);
            if (index >= 1 && index < aItemList.length) {
                iNextItem = index - 1;
            }
        }
        var jqNextItem = $("#"+aItemList[iNextItem]);
        $(jqNextItem).closest("ul").show();
        $(jqNextItem).get(0).click();
    }

    $("#next-item-link").click(function(e){
        e.preventDefault();
        turnItem(1);
    });

    $("#previous-item-link").click(function(e){
        e.preventDefault();
        turnItem(-1);
    });

    var elementClipboard = new Clipboard('.item-copy-link', {
        text: function(trigger) {
            var elementToCopy = $(trigger).attr("id").replace('copy-','data-');
            return $("#"+elementToCopy + " .rendered").html();
        }
    });

    var showboxClipboard = new Clipboard('#showbox-copy', {
        text: function() {
            return $(currentItemData).children(".rendered").html();
        }
    });

    var classClipboard = new Clipboard('.class-copy-link');

    $("#showbox-copy").tooltip();
    $(".item-copy-link").tooltip();
    $(".doc-link").tooltip();
    $(".class-copy-link").tooltip();

    function tooltipSuccess(e){
        tooltipSwitcharoo(e, 'Copied!');
    }

    function tooltipError(e){
        if(is_safari) {
            tooltipSwitcharoo(e, 'Error! Safari is not supported.');
        } else {
            tooltipSwitcharoo(e, 'Error! Something has gone wrong.');
        }
    }
    function tooltipSwitcharoo(e, sMessage) {
        var originalTitle = $(e.trigger).attr('data-original-title');
        $(e.trigger)
            .attr('title', sMessage)
            .tooltip('_fixTitle')
            .tooltip('show')
            .attr('title', originalTitle)
            .tooltip('_fixTitle')
    }

    showboxClipboard.on('success', tooltipSuccess);
    elementClipboard.on('success', tooltipSuccess);
    classClipboard.on('success', tooltipSuccess);

    showboxClipboard.on('error', tooltipError);
    elementClipboard.on('error', tooltipError);
    classClipboard.on('error', tooltipError);

    $('.item-copy-link').click(function (e) {
      e.preventDefault()
    });

    $('.class-copy-link').click(function (e) {
      e.preventDefault()
    });

    $('#showbox-copy').click(function (e) {
      e.preventDefault()
    });

    $("#close-showcase").click(function(e) {
        history.pushState('', document.title, window.location.pathname);
        refreshAfterHashChange();
        e.preventDefault();
    });

    $(".category h3").click(function(e) {
        $(this).siblings("ul").toggle();
    });

    $(".category h3 a.doc-link").click(function(e) {
        e.stopPropagation();
    });

    $("#show-all").click(function(e) {
        $(".category ul").show();
        e.preventDefault()
    });

    $("#collapse-all").click(function(e) {
        $(".category ul").hide();
        e.preventDefault()
    });

    refreshAfterHashChange();

    // Banner
    $("#myGoodFriends-next").click(function(e) {
        var currentAd = $(".myGoodFriends-link.myGoodFriends-current");
        var nextAd = $(currentAd).next();

        if (nextAd.length === 0) {
            nextAd = $(".myGoodFriends-link").first();
        }

        $(currentAd).toggleClass("myGoodFriends-current").toggleClass("myGoodFriends-hidden");
        $(nextAd).toggleClass("myGoodFriends-current").toggleClass("myGoodFriends-hidden");

        e.preventDefault();
    });

    $("#myGoodFriends-prev").click(function(e) {
        var currentAd = $(".myGoodFriends-link.myGoodFriends-current");
        var nextAd = $(currentAd).prev();

        if (nextAd.length === 0) {
            nextAd = $(".myGoodFriends-link").last();
        }

        $(currentAd).toggleClass("myGoodFriends-current").toggleClass("myGoodFriends-hidden");
        $(nextAd).toggleClass("myGoodFriends-current").toggleClass("myGoodFriends-hidden");

        e.preventDefault();
    });
});
