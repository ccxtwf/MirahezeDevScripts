//#region gadgets/AjaxUndo/code.js
/**
* Ajax Undo links
*
* Adds an Ajax undo link next to the normal undo link on page histories
* and on diff pages
*
* @author Grunny
* @author Cqm
*
* @version 0.5
*
* Used files: [[w:c:File:24px-spinner-black.gif]]
*/
(function($, mw) {
	"use strict";
	if (window.AjaxUndoLoaded) return;
	window.AjaxUndoLoaded = true;
	var conf = mw.config.get([
		"wgArticlePath",
		"wgAction",
		"wgVersion",
		"wgCanonicalSpecialPageName"
	]);
	var i18n, api;
	function msg(message) {
		return i18n.msg(message).plain();
	}
	function undoEdit() {
		var $this = $(this), url = $this.data().url, page = $this.data().page, undoId = /&undo=([^&]*)/.exec(url)[1], summaryPromise, defaultSummary = window.AjaxUndoSummary || "";
		if (window.AjaxUndoPrompt) summaryPromise = OO.ui.prompt(msg("summaryprompt"), { textInput: { value: defaultSummary } });
		else {
			summaryPromise = $.Deferred();
			summaryPromise.resolve(defaultSummary);
		}
		summaryPromise.then(function(summary) {
			if (summary === null) return;
			$this.empty().append($.createSpinner({
				size: "small",
				type: "inline"
			}).attr("title", msg("undoing")).css("vertical-align", "baseline"));
			return api.postWithEditToken({
				action: "edit",
				title: page,
				undo: undoId,
				bot: "1",
				minor: window.AjaxUndoMinor ? void 0 : "1",
				summary: summary === "" ? void 0 : summary
			});
		}).done(function(data) {
			if (!data) return;
			if (data.edit && data.edit.result === "Success") $this.text("(" + msg("undone") + ")");
			else {
				$this.text("(" + msg("error") + ")");
				alert(data.error && data.error.code === "undofailure" ? data.error.info : msg("unknownerror"));
			}
		}).fail(function(err) {
			console.error("[AjaxUndo] Error when undoing edit", err);
			$this.text("(" + msg("error") + ")");
			alert(msg("unknownerror"));
		});
	}
	function createUndoLink(url) {
		var uri = new URL(url), title = uri.searchParams.get("title");
		return $("<a>", {
			href: "#ajaxundo",
			"data-url": url,
			"data-page": decodeURIComponent(title || uri.pathname.substring(conf.wgArticlePath.replace("$1", "").length)),
			text: msg("buttontext"),
			click: undoEdit,
			title: msg("undotitle")
		});
	}
	function init(i18nLoader) {
		i18n = prepareI18n(i18nLoader);
		api = new mw.Api();
		if (conf.wgAction === "history" && $(".mw-history-undo > a").length) $(".mw-history-undo > a").each(function() {
			var $this = $(this), $link = createUndoLink($(this).prop("href"));
			$this.parent().parent().after($("<span>").append($link));
		});
		else if ($("table.diff").length && mw.util.getParamValue("diff") !== void 0) {
			const $undoLink = $("table.diff").find(".diff-ntitle .mw-diff-undo a:first"), $link = createUndoLink($undoLink.prop("href"));
			$undoLink.parent().after(" (", $link, ")");
		} else if (conf.wgCanonicalSpecialPageName === "Contributions") $(".mw-contributions-list > li:has(.mw-changeslist-diff)").each(function() {
			const $link = createUndoLink($(this).find(".mw-changeslist-diff").prop("href").replace("?diff=prev&oldid=", "?action=edit&undo="));
			$(this).append($("<span>").append(" (", $link, ")"));
		});
		mw.hook("quickdiff.ready").add(function() {
			const $undoLink = $("#quickdiff-modal table.diff").find(".diff-ntitle .mw-diff-undo a:first"), $link = createUndoLink($undoLink.prop("href"));
			$undoLink.parent().after(" (", $link, ")");
		});
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
			return module.loadMessages("AjaxUndo", {});
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
			"undoing": "Undoing...",
			"undone": "undone",
			"error": "error",
			"unknownerror": "Error: Unknown result from API.",
			"buttontext": "AJAX Undo",
			"undotitle": "Instantly revert this edit without leaving the page",
			"summaryprompt": "Enter the undo summary to leave when undoing this edit:"
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
	$.when(getI18nLoader(), mw.loader.using([
		"mediawiki.api",
		"mediawiki.user",
		"mediawiki.util",
		"oojs-ui-windows",
		"jquery.spinner"
	])).then(init);
})(jQuery, mediaWiki);
//#endregion
