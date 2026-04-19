//#region gadgets/PreloadTemplates/code.js
(function() {
	"use strict";
	var defaultConfig = {
		primary: "MediaWiki:PreloadTemplates/primary",
		secondary: "MediaWiki:PreloadTemplates/secondary",
		subpage: "preload",
		storageCacheAge: 900 * 1e3,
		serverCacheAge: 900,
		preloadNamespace: "10"
	};
	var config = $.extend(window.PreloadTemplates || {}, defaultConfig);
	if (!isNaN(config.storageCacheAge)) config.storageCacheAge = defaultConfig.storageCacheAge;
	if (!isNaN(config.serverCacheAge)) config.serverCacheAge = defaultConfig.serverCacheAge;
	var i18n, $main, $help;
	var mwc = mw.config.get(["wgFormattedNamespaces"]), $module = $("div#wpSummaryLabel"), $moduleOld = $("div.module_content:first");
	var visualEditorSelector = "div.ve-ui-toolbar.ve-ui-positionedTargetToolbar";
	var LC_PREFIX_PLTEMPLATES_PRIMARY = "wiki_preload_templates_data_primary", LC_PREFIX_PLTEMPLATES_SECONDARY = "wiki_preload_templates_data_secondary", LC_PREFIX_PLTEMPLATES_LIST_PAGENAME_PRIMARY = "wiki_preload_templates_list-pagename_primary", LC_PREFIX_PLTEMPLATES_LIST_PAGENAME_SECONDARY = "wiki_preload_templates_list-pagename_secondary", LC_PREFIX_PLTEMPLATES_EXPIRATION = "wiki_preload_templates_expiration";
	function msg(message) {
		return i18n.msg(message).plain();
	}
	function parseMW(source) {
		return source.replace(/<includeonly>(\n)?|(\n)?<\/includeonly>|\s*<noinclude>[^]*?<\/noinclude>/g, "");
	}
	function notFound(page) {
		alert(i18n.msg("error", "\"" + page + "\"").plain());
	}
	function saveListOfTemplatesToCache(data) {
		localStorage.setItem(LC_PREFIX_PLTEMPLATES_PRIMARY, data.list);
		localStorage.setItem(LC_PREFIX_PLTEMPLATES_SECONDARY, data.listSecondary);
		localStorage.setItem(LC_PREFIX_PLTEMPLATES_LIST_PAGENAME_PRIMARY, data.pagename);
		localStorage.setItem(LC_PREFIX_PLTEMPLATES_LIST_PAGENAME_SECONDARY, data.pagenameSecondary);
		if (config.storageCacheAge > 0) localStorage.setItem(LC_PREFIX_PLTEMPLATES_EXPIRATION, new Date(Date.now() + config.storageCacheAge).getTime());
	}
	function clearListOfTemplatesCache() {
		localStorage.removeItem(LC_PREFIX_PLTEMPLATES_PRIMARY);
		localStorage.removeItem(LC_PREFIX_PLTEMPLATES_SECONDARY);
		localStorage.removeItem(LC_PREFIX_PLTEMPLATES_LIST_PAGENAME_PRIMARY);
		localStorage.removeItem(LC_PREFIX_PLTEMPLATES_LIST_PAGENAME_SECONDARY);
	}
	function getListOfTemplatesFromCache(pagename, pagenameSecondary) {
		var cacheExpiredTime = localStorage.getItem(LC_PREFIX_PLTEMPLATES_EXPIRATION);
		var cachedPagename = localStorage.getItem(LC_PREFIX_PLTEMPLATES_LIST_PAGENAME_PRIMARY);
		var cachedPagenameSecondary = localStorage.getItem(LC_PREFIX_PLTEMPLATES_LIST_PAGENAME_SECONDARY);
		if (cacheExpiredTime === null || isNaN(+cacheExpiredTime) || Date.now() > +cacheExpiredTime || cachedPagename !== pagename || cachedPagenameSecondary !== pagenameSecondary) {
			clearListOfTemplatesCache();
			return null;
		}
		return [localStorage.getItem(LC_PREFIX_PLTEMPLATES_PRIMARY), localStorage.getItem(LC_PREFIX_PLTEMPLATES_SECONDARY)];
	}
	function insertAtCursor(myField, myValue) {
		if (document.selection) {
			myField.focus();
			window.sel = document.selection.createRange();
			window.sel.text = myValue;
		} else if (myField.selectionStart || myField.selectionStart === 0) {
			var startPos = myField.selectionStart, endPos = myField.selectionEnd;
			myField.value = myField.value.substring(0, startPos) + myValue + myField.value.substring(endPos, myField.value.length);
		} else myField.value += myValue;
	}
	function getPreloadPage(title) {
		var namespace = (function() {
			if (typeof mwc.wgFormattedNamespaces[config.preloadNamespace] != "undefined") return mwc.wgFormattedNamespaces[config.preloadNamespace];
			for (var key in mwc.wgFormattedNamespaces) if (mwc.wgFormattedNamespaces[key] == config.preloadNamespace) return mwc.wgFormattedNamespaces[key];
			return mwc.wgFormattedNamespaces["10"];
		})();
		var namespacePagename = (function() {
			if (namespace) return namespace + ":";
			return "";
		})();
		var page = config.subpage === "case-by-case" ? namespacePagename + title : namespacePagename + title + "/" + config.subpage;
		$.get(mw.util.wikiScript(), {
			title: page,
			action: "raw",
			ctype: "text/plain",
			maxage: 0,
			smaxage: 0
		}).done(function(preloadData) {
			var preloadDataParsed = parseMW(preloadData);
			if (preloadDataParsed === "") {
				notFound(page);
				return;
			}
			var cke = document.getElementsByClassName("cke_source"), textbox = document.getElementById("wpTextbox1"), cm5 = $(".CodeMirror").get(0), cm6 = $(".cm-editor").get(0);
			if (window.ve && ve.init && ve.init.target && ve.init.target.active) ve.init.target.getSurface().getModel().getFragment().insertContent(preloadDataParsed);
			else if (cke.length) insertAtCursor(cke[0], preloadDataParsed);
			else if (cm5) insertAtCursorCodeMirror5(cm5, preloadDataParsed);
			else if (cm6) insertAtCursorCodeMirror6(cm6, textbox, preloadDataParsed);
			else if (textbox) insertAtCursorVanillaTextbox(textbox, preloadDataParsed);
			else console.warn("[PreloadTemplates] Could not find textbox to bind to");
		}).fail(function() {
			notFound(page);
		});
	}
	function insertAtCursorCodeMirror5(cm5, preloadDataParsed) {
		var cmdDoc = cm5.CodeMirror.getDoc();
		cmdDoc.replaceRange(preloadDataParsed, cmdDoc.getCursor());
	}
	function insertAtCursorCodeMirror6(cm6, textbox, preloadDataParsed) {
		/**
		* CodeMirrorV6: text editor with syntax highlight 
		* (only way to interact with editor is through a hook return)
		**/
		var cm6Edit = function(a, b) {
			var cmEditor = typeof b === "undefined" ? a : b;
			if (!cmEditor.isActive) if (textbox) insertAtCursorVanillaTextbox(textbox, preloadDataParsed);
			else console.warn("[PreloadTemplates] Could not find textbox to bind to");
			var cmCursor = cmEditor.view.state && cmEditor.view.state.selection && cmEditor.view.state.selection.ranges && cmEditor.view.state.selection.ranges[0] || {
				from: 0,
				to: 0
			};
			cmEditor.view.dispatch({
				changes: {
					from: cmCursor.from,
					to: cmCursor.to,
					insert: preloadDataParsed
				},
				selection: { anchor: cmCursor.from }
			});
			cmEditor.view.focus();
			mw.hook("ext.CodeMirror.ready").remove(cm6Edit);
		};
		mw.hook("ext.CodeMirror.ready").add(cm6Edit);
	}
	function insertAtCursorVanillaTextbox(textbox, preloadDataParsed) {
		insertAtCursor(textbox, preloadDataParsed);
	}
	function appendModule(vsEditor) {
		if (vsEditor === true) $(visualEditorSelector).after($main);
		else if ($module.length) $module.after($main);
		else if ($moduleOld.length) $moduleOld.append($main);
	}
	function preInit(i18nLoader) {
		i18n = prepareI18n(i18nLoader);
		$main = $("<div>", { id: "preload-templates" });
		$main.append($("<span>", { text: msg("preload") }));
		$help = $("<div>", { id: "pt-help" }).append($("<a>", {
			target: "_blank",
			href: "https://dev.miraheze.org/wiki/PreloadTemplates",
			title: msg("devWiki"),
			text: "?"
		}));
		appendModule();
	}
	function listHTML(parsed) {
		return mw.html.element("option", {
			selected: true,
			disabled: true
		}, msg("choose")) + parsed.split("\n").map(function(line) {
			if (line.trim() === "") return "";
			if (line.indexOf("*") === 0) {
				var title = line.substring(1).trim();
				if (title.indexOf("|") !== -1) {
					var parts = title.split("|");
					return mw.html.element("option", { value: parts[0].trim() }, parts[1].trim());
				} else return mw.html.element("option", { value: title }, title);
			} else return mw.html.element("option", { disabled: true }, line.trim(""));
		}).join();
	}
	function initFail() {
		var primaryPlPagename = config.primary;
		$main.append(i18n.msg("error", mw.html.element("a", { href: mw.util.getUrl(primaryPlPagename) }, primaryPlPagename)).plain(), $help);
	}
	function init() {
		if ($main.find("#pt-list").length > 0) return;
		var primaryPlPagename = config.primary;
		var secondaryPlPagename = config.secondary;
		var fetchedFromCache = getListOfTemplatesFromCache(primaryPlPagename, secondaryPlPagename);
		if (fetchedFromCache !== null) {
			populateDropdowns(fetchedFromCache[0], fetchedFromCache[1]);
			return;
		}
		$.get(mw.util.wikiScript(), {
			title: primaryPlPagename,
			action: "raw",
			ctype: "text/plain",
			maxage: config.serverCacheAge,
			smaxage: config.serverCacheAge
		}).done(function(listData) {
			if (secondaryPlPagename) $.get(mw.util.wikiScript(), {
				title: secondaryPlPagename,
				action: "raw",
				ctype: "text/plain",
				maxage: config.serverCacheAge,
				smaxage: config.serverCacheAge
			}).done(function(listSecondary) {
				populateDropdowns(listData, listSecondary);
				saveListOfTemplatesToCache({
					list: listData,
					listSecondary,
					pagename: primaryPlPagename,
					pagenameSecondary: secondaryPlPagename
				});
			}).fail(function() {
				populateDropdowns(listData, "");
			});
			else {
				populateDropdowns(listData, "");
				saveListOfTemplatesToCache({
					list: listData,
					listSecondary: "",
					pagename: primaryPlPagename,
					pagenameSecondary: null
				});
			}
		}).fail(initFail);
	}
	function populateDropdowns(listPrimary, listSecondary) {
		var parsedPrimary = parseMW(listPrimary);
		var parsedSecondary = parseMW(listSecondary);
		if (parsedPrimary === "") {
			initFail();
			return;
		}
		var dropdown = $("<select>", {
			id: "pt-list",
			title: msg("help"),
			html: listHTML(parsedPrimary)
		}).change(function() {
			var $this = $(this), val = $this.val();
			$this.find("option:first-child").prop("selected", true);
			getPreloadPage(val);
		});
		var dropdownSecondary = $("<select>", {
			id: "pt-list-secondary",
			title: msg("help"),
			html: parsedSecondary === "" ? void 0 : listHTML(parsedSecondary),
			style: parsedSecondary === "" ? "display:none;" : void 0
		}).change(function() {
			var $this = $(this), val = $this.val();
			$this.find("option:first-child").prop("selected", true);
			getPreloadPage(val);
		});
		$main.append(dropdown, dropdownSecondary, $help);
	}
	function prepareI18n(i18nLoader) {
		i18nLoader.msg = function() {
			var args = Array.prototype.slice.call(arguments);
			if (args.length === 0) return;
			var key = args.shift();
			return new mw.Message(this.getMessages(), key, args);
		};
		return i18nLoader;
	}
	function getI18nLoader() {
		var deferred = new $.Deferred();
		var waitTask = new $.Deferred();
		function onLoadedModule(module) {
			return module.loadMessages("PreloadTemplates", {});
		}
		function onLoadedMessages(i18nLoader) {
			deferred.resolve(i18nLoader);
		}
		waitTask.then(onLoadedModule).then(onLoadedMessages).catch(function(err) {
			console.error(err);
			deferred.resolve(getFallbackMessages());
		});
		var _h = function(loader) {
			waitTask.resolve(loader);
			mw.hook("dev.fandoom.i18n").remove(_h);
		};
		mw.hook("dev.fandoom.i18n").add(_h);
		var _f = function() {
			if (deferred.state() !== "pending") return;
			waitTask.reject("Failed to load FandoomUtilsI18nLoader after 10 seconds");
			mw.hook("dev.fandoom.i18n").remove(_h);
		};
		setTimeout(_f, 1e4);
		return deferred;
	}
	function getFallbackMessages() {
		console.warn("[FandoomUtilsI18nLoader] Failed to load messages. Using fallback messages instead.");
		var msgMap = new mw.Map();
		msgMap.set({
			"preload": "Preload template:",
			"choose": "(choose)",
			"help": "Select a template to insert its preloaded syntax at the current position",
			"devWiki": "Check the documentation on Dev Wiki",
			"error": "No valid syntax found at $1 or page is missing."
		});
		if (mw.Message.prototype.escape === void 0) mw.Message.prototype.escape = mw.Message.prototype.escaped;
		var m = { getMessages: function() {
			return msgMap;
		} };
		[
			"_setDefaultLang",
			"_setTempLang",
			"useLang",
			"usePageLang",
			"useContentLang",
			"usePageViewLang",
			"useUserLang"
		].forEach(function(prop) {
			m[prop] = $.noop;
		});
		[
			"inLang",
			"inPageLang",
			"inContentLang",
			"inPageViewLang",
			"inUserLang"
		].forEach(function(prop) {
			m[prop] = function() {
				return this;
			};
		});
		return m;
	}
	$.when(getI18nLoader(), mw.loader.using("mediawiki.util")).done(function(i18nLoader) {
		preInit(i18nLoader);
		mw.hook("wikipage.content").add(init);
	});
})();
//#endregion
