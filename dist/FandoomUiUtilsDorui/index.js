//#region gadgets/FandoomUiUtilsDorui/code.js
(function() {
	if (window.dev && window.dev.dorui) return;
	var htmlTags = [
		"html",
		"head",
		"body",
		"title",
		"meta",
		"script",
		"style",
		"link",
		"noscript",
		"span",
		"div",
		"ul",
		"ol",
		"li",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"form",
		"fieldset",
		"label",
		"legend",
		"input",
		"textarea",
		"button",
		"select",
		"option",
		"optgroup",
		"datalist",
		"meter",
		"progress",
		"output",
		"img",
		"audio",
		"video",
		"picture",
		"source",
		"track",
		"a",
		"cite",
		"p",
		"pre",
		"code",
		"em",
		"i",
		"mark",
		"b",
		"strong",
		"s",
		"u",
		"small",
		"sub",
		"sup",
		"blockquote",
		"q",
		"dl",
		"dt",
		"dd",
		"dfn",
		"kbd",
		"samp",
		"br",
		"hr",
		"abbr",
		"address",
		"main",
		"article",
		"header",
		"nav",
		"footer",
		"aside",
		"section",
		"details",
		"summary",
		"dialog",
		"figure",
		"figcaption",
		"time",
		"data",
		"bdi",
		"bdo",
		"iframe",
		"canvas",
		"object",
		"param",
		"embed",
		"map",
		"area",
		"table",
		"thead",
		"tbody",
		"tfoot",
		"th",
		"tr",
		"td",
		"caption",
		"col",
		"colgroup",
		"ins",
		"del"
	], svgTags = [
		"svg",
		"use",
		"defs",
		"symbol",
		"g",
		"line",
		"path",
		"rect",
		"circle",
		"ellipse",
		"stop",
		"polygon",
		"text",
		"mask",
		"image",
		"linearGradient",
		"geometry",
		"foreignObject",
		"desc",
		"clipPath",
		"animation",
		"animate",
		"filter",
		"feOffset",
		"feGaussianBlur",
		"feColorMatrix"
	], w3 = "http://www.w3.org/", x = w3 + "2000/xmlns/", nsAttrs = {
		xmlns: x,
		"xmlns:xlink": x,
		"xlink:href": w3 + "1999/xlink"
	};
	function setAttr(svg, elem, k, v) {
		if (svg && k in nsAttrs) elem.setAttributeNS(nsAttrs[k], k, v);
		else elem.setAttribute(k, v);
	}
	function makeUI(isSVG) {
		return function(tag, options) {
			var elem;
			if (isSVG) elem = document.createElementNS(w3 + "2000/svg", tag);
			else elem = document.createElement(tag);
			for (var optionKey in options) {
				var value = options[optionKey];
				var key;
				switch (optionKey) {
					case "html":
						elem.innerHTML = value;
						break;
					case "text":
						elem.appendChild(document.createTextNode(value));
						break;
					case "child":
						if (value) elem.appendChild(value);
						break;
					case "children":
						for (var i = 0; i < value.length; i++) {
							var child = value[i];
							if (typeof child === "string") elem.appendChild(document.createTextNode(child));
							else if (child) elem.appendChild(child);
						}
						break;
					case "classes":
						if (value instanceof Array) elem.setAttribute("class", value.join(" "));
						else for (key in value) if (value[key]) elem.classList.add(key);
						break;
					case "events":
						for (key in value) elem.addEventListener(key, value[key]);
						break;
					case "style":
						for (key in value) {
							var rawValue = value[key];
							var propName = key.replace(/[A-Z]/g, function(c) {
								return "-" + c.toLowerCase();
							});
							if (propName.slice(0, 3) == "ms-") propName = "-" + propName;
							var isImportant = rawValue.trim().slice(-10) == "!important";
							var importance = isImportant ? "important" : "";
							var propValue = isImportant ? rawValue.trim().slice(0, -10) : rawValue;
							elem.style.setProperty(propName, propValue, importance);
						}
						break;
					case "attrs":
						for (key in value) {
							var val = value[key];
							if (val === false) continue;
							if (val === true) val = key;
							setAttr(isSVG, elem, key, val);
						}
						break;
					case "props":
						for (key in value) elem[key] = value[key];
						break;
					default: setAttr(isSVG, elem, optionKey, value);
				}
			}
			return elem;
		};
	}
	var ui = makeUI(false);
	var svgUI = makeUI(true);
	ui.frag = function(children) {
		var frag = document.createDocumentFragment();
		for (var i = 0; i < children.length; i++) {
			var child = children[i];
			if (typeof child === "string") frag.appendChild(document.createTextNode(child));
			else if (child) frag.appendChild(child);
		}
		return frag;
	};
	var i, tag;
	for (i in svgTags) {
		tag = svgTags[i];
		ui[tag] = svgUI.bind(this, tag);
	}
	for (i in htmlTags) {
		tag = htmlTags[i];
		ui[tag] = ui.bind(this, tag);
	}
	window.dev = window.dev || {};
	window.dev.dorui = ui;
	if (typeof mw === "object" && typeof mw.hook === "function") mw.hook("dev.doru.ui").fire(ui);
})();
//#endregion
