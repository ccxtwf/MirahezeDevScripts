//#region gadgets/AjaxBatchUndelete/code.js
mw.loader.using("mediawiki.api", function() {
	"use strict";
	if (window.AjaxBatchUndeleteLoaded) return;
	window.AjaxBatchUndeleteLoaded = true;
	var i18n, preloads = 3, undeleteModal, paused = true;
	var $form, $undeleteReasonInput, $pageListInput, $errorOutput;
	function preload() {
		if (--preloads === 0) init();
	}
	function init() {
		mw.libs.PowertoolsPlacement.addPortletLink(mw.config.values.skin, {
			id: "t-bud",
			label: i18n.msg("toolsTitle").plain(),
			tooltip: "AjaxBatchUndelete",
			onClick: click
		});
	}
	function click() {
		if (undeleteModal) {
			undeleteModal.show();
			return;
		}
		undeleteModal = new window.dev.modal.Modal({
			content: formHtml(),
			id: "form-batch-undelete",
			size: "medium",
			title: i18n.msg("modalTitle").escape(),
			buttons: [
				{
					id: "abu-start",
					text: i18n.msg("initiate").escape(),
					primary: true,
					event: "start"
				},
				{
					id: "abu-pause",
					text: i18n.msg("pause").escape(),
					primary: true,
					event: "pause",
					disabled: true
				},
				{
					text: i18n.msg("close").escape(),
					event: "close"
				}
			],
			events: {
				pause,
				start
			},
			closeOnClickingBackdrop: false
		});
		undeleteModal.create();
		$form = $("#form-batch-undelete");
		$undeleteReasonInput = $form.find("#undelete-reason");
		$pageListInput = $form.find("#text-batch-undelete");
		$errorOutput = $form.find("#text-error-output");
		undeleteModal.show();
	}
	function formHtml() {
		return $("<form>").append($("<fieldset>").append($("<div>", { "class": "edit-input-controls" }).append($("<label>", {
			"for": "undelete-reason",
			text: i18n.msg("inputReason").plain()
		}), $("<input>", {
			type: "text",
			name: "undelete-reason",
			id: "undelete-reason"
		})), $("<p>", { text: i18n.msg("inputPages").plain() + ":" }), $("<textarea>", { id: "text-batch-undelete" }), $("<p>", { text: i18n.msg("errorsForm").plain() }), $("<div>", { id: "text-error-output" }))).prop("outerHTML");
	}
	function pause() {
		paused = true;
		undeleteModal.disableActionButtons("abu-pause");
		undeleteModal.enableActionButtons("abu-start");
	}
	function start() {
		if (!$undeleteReasonInput.val()) {
			alert(i18n.msg("stateReason").plain());
			return;
		}
		paused = false;
		undeleteModal.disableActionButtons("abu-start");
		undeleteModal.enableActionButtons("abu-pause");
		process();
	}
	function process() {
		if (paused) return;
		var pages = $pageListInput.val().split("\n"), currentPage = pages[0];
		if (!currentPage) {
			$errorOutput.append(i18n.msg("endMsg").escape() + "<br/>");
			pause();
		} else undelete(currentPage, $undeleteReasonInput.val());
		pages = pages.slice(1, pages.length);
		$pageListInput.val(pages.join("\n"));
	}
	function undelete(page, reason) {
		new mw.Api().postWithEditToken({
			format: "json",
			action: "undelete",
			watchlist: "preferences",
			timestamps: "",
			title: page,
			reason
		}).done(function(d) {
			if (!d.error) console.log(i18n.msg("success", page).escape());
			else {
				console.log(i18n.msg("failure").escape() + " " + page + ": " + d.error.code);
				$errorOutput.append(i18n.msg("failure").escape() + " " + page + ": " + d.error.code + "<br/>");
			}
		}).fail(function() {
			console.log(i18n.msg("failure").escape() + " " + page);
			$errorOutput.append(i18n.msg("failure").escape() + " " + page + "<br/>");
		});
		setTimeout(process, window.batchUndeleteDelay || 1e3);
	}
	mw.hook("dev.modal").add(preload);
	mw.hook("dev.powertools.placement").add(preload);
	getI18nLoader().done(function(loader) {
		i18n = prepareI18n(loader);
		preload();
	});
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
			return module.loadMessages("AjaxBatchUndelete", {});
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
			"modalTitle": "Ajax Batch Undelete",
			"endMsg": "Done! Nothing left to do, or next line is blank.",
			"inputReason": "Reason for recovery:",
			"inputPages": "Put the name of each page you want to undelete on a separate line",
			"errorsForm": "Any errors encountered will appear below:",
			"close": "Close",
			"initiate": "Initiate",
			"stateReason": "Please state a reason!",
			"success": "Recovery of $1 successful!",
			"failure": "Failed to recover",
			"toolsTitle": "Batch Undelete",
			"pause": "Pause"
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
});
//#endregion
