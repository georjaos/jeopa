function removeClass(selector, cls){
    var doms = document.querySelectorAll(selector);
    for(var i = 0; i < doms.length; i++){
        doms[i].classList.remove(cls);
    }
}


function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

function ready(fn) {
  if (document.readyState != 'loading' && document.body){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

if (!Math.log2) Math.log2 = function(x) {
      return Math.log(x) * Math.LOG2E;
};

function capSizes(el, max_width, max_height){
    return
    var treeWalker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT, null, false);
    var did_work = false;
    while(treeWalker.nextNode()){
        node = treeWalker.currentNode;
        if(node.tagName == "IMG" || node.tagName == "VIDEO" || node.tagName == "IFRAME"){
            try {
                var real_width = parseInt(node.width) || max_width;
                var real_height = parseInt(node.height) || max_height;
                var a = Math.min(1.0*max_width / real_width, 1.0*max_height / real_height)
                node.style.maxWidth = real_width*a + "px";
                node.style.maxHeight = real_height*a + "px";
                did_work = true;
            } catch (e) {
            }

        }
    }

    return did_work;
}

var shrink_cell_cache = {};
var enable_caching = false;
function shrink_cell($cell, $scaler, max_width, max_height, max_font_size, transforms, capsizes){
    if(enable_caching){
        var cache_key = [max_width, max_height, $cell.innerHTML].join(".");
        var cached = shrink_cell_cache[cache_key];
    } else {
        return _shrink_cell($cell, $scaler, max_width, max_height, max_font_size, transforms, capsizes);
    }

    if(cached){
        $scaler.style.fontSize = cached.font_size + "px";
        $scaler.style.transform = (transforms || "") + " scale(" + cached.scale + ") ";
        capSizes($cell, max_width, max_height);
    } else {
        shrink_cell_cache[cache_key] = _shrink_cell($cell, $scaler, max_width, max_height, max_font_size, transforms, capsizes);
    }
}

test_divs = [];
function initDivs(max_font_size){
    if(test_divs.length-1 == max_font_size){
        return;
    }
    for(var i = 0; i <= max_font_size; i++){
        var dummy_element = test_divs[i];
        if(!dummy_element){
            var dummy_element = document.createElement("div");
            //dummy_element.style.opacity = 0;
            dummy_element.style.display = "block";
            //dummy_element.style.overflowX = "auto";
            dummy_element.style.position = "absolute";
            //dummy_element.style.visibility = "hidden";
            dummy_element.style.left = "-100000px";
            dummy_element.style.top = -(i*120) + "px";
            dummy_element.style.fontFamily = "Verdana, Arial, Helvetica, sans-serif";
            dummy_element.style.color = "#000";
            dummy_element.style.border = "3px solid black";
            dummy_element.style.fontSize = i + "px";
            //dummy_element.setAttribute("id", "test-height")
            test_divs[i] = dummy_element;
            var body = document.querySelectorAll('body')[0];
            body.appendChild(dummy_element);
        }
    }
}

function shrink_in_place($cell, max_font_size, min_font_size){
    var div = $cell;
    var font_size = max_font_size;

    var a = {length: max_font_size+1}
    var font_size = binarySearch(a, function(el, array, font_size){
        div.style.fontSize = font_size + "px";
        var isHorizontalScrollbar= div.scrollWidth>div.clientWidth;
        var isVerticalScrollbar = div.scrollHeight>div.clientHeight;
        var overflows = isHorizontalScrollbar || isVerticalScrollbar;
        return overflows
    });
    font_size = font_size - 1

    font_size = Math.max(min_font_size, Math.min(font_size, max_font_size));

    div.style.fontSize = font_size + "px";
    return font_size;

}

/**
 *  * Return 0 <= i <= array.length such that !pred(array[i - 1]) && pred(array[i]).
 **/
function binarySearch(array, pred) {
    var lo = -1, hi = array.length;
    while (1 + lo < hi) {
        var mi = lo + ((hi - lo) >> 1);
        if (pred(array[mi], array, mi)) {
            hi = mi;
        } else {
            lo = mi;
        }
    }
    return hi;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getText(el){
    var treeWalker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null, false);
    var text = []
    while(treeWalker.nextNode()){
        var node = treeWalker.currentNode;
        if(node.nodeType == 3){
            text.push(escapeHtml(node.textContent));
        } else if(node.tagName == "BR"){
            text.push("<BR>");
        } else if(node.tagName == "P"){
            if(text.length != 0){
                text.push("<BR>");
            }
        }
    }
    var t = text.join("");
    return t;
}

function _shrink_cell($cell, $scaler, max_width, max_height, max_font_size, transforms, capsizes, min_font_size){
    var imgs = $cell.querySelectorAll("img");
    for(var i = 0; i < imgs.length; i++){
        var node = imgs[i];
        if(!node.complete && !node.width){
            // the image hasn't loaded yet, so wait until that is done so the width/height is known
            node.addEventListener("load", function foo(){
                //console.log("doing callback");
                _shrink_cell($cell, $scaler, max_width, max_height, max_font_size, transforms, capsizes, min_font_size)
                node.removeEventListener("load", foo);
            });
            return
        }
    }

    if(capsizes === undefined){
        capsizes = true;
    }

    if(min_font_size === undefined){
        min_font_size = 1;

    }

    var text = getText($scaler || $cell)

    initDivs(max_font_size);
    for(var i = 0; i <= max_font_size; i++){
        dummy_element = test_divs[i];
        dummy_element.innerHTML = text
        dummy_element.style.width = max_width + "px";
        dummy_element.style.height = max_height + "px";
    }

    var font_size = binarySearch(test_divs, function(div){
        var isHorizontalScrollbar= div.scrollWidth>div.clientWidth;
        var isVerticalScrollbar = div.scrollHeight>div.clientHeight;
        var overflows = isHorizontalScrollbar || isVerticalScrollbar;
        return overflows
    });
    font_size = font_size - 1

    font_size = Math.max(min_font_size, Math.min(font_size, max_font_size));

    if(!$scaler){
        return {font_size: font_size}
    }

    $cell.style.fontSize = "";
    $scaler.style.fontSize = font_size + "px";
    $scaler.style.transform = "";

    //text_length_font_size_cache[text.length] = Math.max(font_size, text_length_font_size_cache[text.length] || 0)


    var extra_width = 0 // parseInt(styles.getPropertyValue("padding-left")) + parseInt(styles.getPropertyValue("padding-right"));
    var extra_height = 0 //parseInt(styles.getPropertyValue("padding-top")) + parseInt(styles.getPropertyValue("padding-bottom"));
    if(capsizes){
        var did_work = capSizes($cell, max_width, max_height);
    }

    var bbox = getBoundingClientRect($scaler);
    var w = bbox.width;
    var h = bbox.height;
    var scale = Math.min(1, Math.min(1.0*(max_width-extra_width)/w, 1.0*(max_height-extra_height)/h));
    if(scale != 1){
        //debugger;
    }
    $scaler.style.transform = (transforms || "") + " scale(" + scale + ") ";

    return {font_size: font_size, scale: scale};
}



function getBoundingClientRect(el){
    var bbox = el.getBoundingClientRect();
    /*
    bbox.left += window.scrollX;
    bbox.top += window.scrollY;*/
    return {
        top: bbox.top + (window.scrollY || document.documentElement.scrollTop || 0),
        left: bbox.left + (window.scrollX || document.documentElement.scrollLeft || 0),
        width: bbox.width,
        height: bbox.height,
        x: bbox.x,
        y: bbox.y
    }
}

/*
function getContainer(grid){
    if(grid.getAttribute("id") == "grid"){
        return window;
    } else {
        return grid;
    }

}*/

var render_queue = [];
var render_queue_index = 0;
var render_interval = null;
var max_renderers = 1
var work_scheduled = false;

function resetRenderQueue(){
    render_queue = [];
    render_queue_index = 0;
}

function renderQueue(){
    var steps = 1;
    var i = 0;
    var start = +new Date();
    while(((+new Date())-start) < 10 && render_queue_index < render_queue.length && render_queue.length){
        i++
        var item = render_queue[render_queue_index];
        item[0].apply(item[1], item.slice(2));
        render_queue_index++;
    }
    //console.log(i);

    if(render_queue_index >= render_queue.length){
        //clearInterval(render_interval);
        //render_interval = null;
        work_scheduled = false;
    } else {
        work_scheduled = setTimeout(renderQueue)
    }
}

function enqueueRender(){
    var item = Array.prototype.slice.call(arguments)
    item[0].apply(item[1], item.slice(2));
    return
    render_queue.push(Array.prototype.slice.call(arguments))
    if(!work_scheduled){
        //console.log("starting queue");
        work_scheduled = setTimeout(renderQueue)
        //render_interval = setInterval(renderQueue, 16);
    }

    //setTimeout(renderQueue, 10);
}

/*
function renderNext(grids, i){
    var d = new Date();
    _resizeCells(grids[i], true);
    console.log(new Date() - d);
    if(i < grids.length - 1){
        setTimeout(renderNext, 0, grids, i+1);
    }
}*/

/*
function setOpacity(el, opacity){
    el.style.opacity = opacity;
}*/


function matches(el, selector) {
      return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
}

function indexInParent(child) {
	var i = 0;
	while( (child = child.previousElementSibling) != null ) {
	  i++;
	}
	return i;
}


function on(eventName, elementSelector, handler, extra){
    var names = eventName.split(" ");
    for(var i = 0; i < names.length; i++){
        var eventName = names[i];
        document.addEventListener(eventName, function(e) {
            // loop parent nodes from the target to the delegation node
            for (var target = e.target; target && target != this; target = target.parentNode) {
                if (matches(target, elementSelector)) {
                    handler.call(target, e);
                    break;
                }
            }
        }, extra || false);
    }
}


function closest(element, selector){
    do {
        if(matches(element, selector)){
            return element;
        }
    } while(element = element.parentElement);
    return null;
}

function coordsFromEvent(e){
    if(e.touches && e.touches.length > 0){
        return e.touches[0];
    }
    return e;
}



function retypeset(scope, then){
    if(!window.MathJax){
        return false;
    }

    /*
    MathJax.Hub.Config({
      asciimath2jax: {
        delimiters: [['`', '`']],
        skipTags: ["script","noscript","style","textarea","pre","code", "body"]
      }
    });*/

    scope = scope || document
    var math = scope.querySelectorAll('.mathy');
    var nodes = [];
    for(var i = 0; i < math.length; i++){
        var node = math[i]
        node.innerText = node.getAttribute("data-original") || ('`' + node.innerText + '`');
        node.setAttribute("data-original", node.innerText)
        //MathJax.Hub.Queue(["Typeset",MathJax.Hub,node]);
        nodes.push(node)
    }

    MathJax.Hub.Queue(["Typeset",MathJax.Hub, nodes]);

    if(math.length > 0){
        MathJax.Hub.Queue([then,window]);
        return true;
    }
    return false;
}


function prepwork(cell, scale_factor){
    if(scale_factor === undefined){
        scale_factor = 1;
    }
    var width = cell.parentElement.clientWidth;
    var height = cell.parentElement.clientHeight;
    var inner = cell.querySelectorAll(".cell-inner")[0];
    var capsizes = mode == "play" ? false : true;
    //console.log(height);
    shrink_cell(cell, inner, width*scale_factor, height*scale_factor, 32, "", capsizes);
    return inner
}

function minirender(grid, on_done, question_scale_factor){
    if(question_scale_factor === undefined){
        question_scale_factor = 1;
    }

    window.nextthing = function(){
        setTimeout(function(){
            grid.classList.add("resizing");
            var t = grid.offsetTop
            miniresize(grid, grid.querySelectorAll(".grid-row-cats .cell"), true, 1);
            miniresize(grid, grid.querySelectorAll(".grid-row-questions .cell"), false, question_scale_factor);
            grid.classList.remove("resizing");
            if(on_done){
                on_done(grid);
            }
        });
    }

    if(!retypeset(grid, "nextthing")){
        window.nextthing();
    }
}

function miniresize(grid, cells, is_cats, scale_factor){
    if(is_cats){
        var cat = grid.querySelectorAll(".grid-row-cats")[0]
        cat.classList.remove("grid-row-cats-resize-done")
        cat.style.height = "auto";
        var max_height = 0;
        for(var i = 0; i < cells.length; i++){
            var cell = cells[i];
            cell.style.paddingTop = 0;
            var inner = prepwork(cell);
            cell.client_height = inner.clientHeight;
            max_height = Math.max(max_height, inner.clientHeight);
        }
        for(var i = 0; i < cells.length; i++){
            var cell = cells[i];
            cell.style.paddingTop = (max_height - cell.client_height) + "px"
        }

        cat.classList.add("grid-row-cats-resize-done");
        cat.style.height = max_height + "px";
    } else {
        for(var i = 0; i < cells.length; i++){
            var cell = cells[i];
            enqueueRender(prepwork, null, cell, scale_factor);
        }

    }
}

/*
function mini(){
    function allresize(){
        resetRenderQueue();

        //var cells = document.querySelectorAll('.cell');
        //miniresize(cells);
        var grids = document.querySelectorAll('.grid');
        for(var i = 0; i < grids.length; i++){
            var cells = grids[i].querySelectorAll(".cell");
            enqueueRender(function(grid){
                grid.style.display = "block";
                grid.style.opacity = "0";
            }, null, grids[i]);
            miniresize(cells);
            enqueueRender(function(grid){
                grid.style.opacity = "1";
            }, null, grids[i]);
        }
    }

    window.allresize = allresize;

    function unzoom(){
        var zoomed = document.querySelectorAll(".grid-zoomed");
        for(var i = 0; i < zoomed.length; i++){
            zoomed[i].classList.remove("grid-zoomed");
            zoomed[i].style.transform = "";
        }
    }

    var did_all_resize = retypeset(document, "allresize");
    if(!did_all_resize){
        allresize();
    }
    window.addEventListener("resize", debounce(allresize, 100, false));

    document.addEventListener("keyup", function(e){
        if(e.keyCode == 27){
            unzoom();
        }
    }, false);

    document.addEventListener("click", function(e){
        unzoom();
    }, false);

    on("click", ".grid", function(e){
        //console.log(e);
        var bbox = getBoundingClientRect(this);
        var x = e.pageX - bbox.left;
        var y = e.pageY - bbox.top;
        //console.log(x, y);
        this.classList.add("grid-zoomed");
        //this.style.t
        //this.style.transformOrigin = x + "px " + y + "px";
        //this.style.transform = "translate(" + (x) + "px, " + (y) + "px) scale(3) translate(" + (-x) + "px, " + (-y) + "px)";
        this.style.transform = "scale(2)";
    });

}*/
