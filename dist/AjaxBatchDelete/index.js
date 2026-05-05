//#region gadgets/AjaxBatchDelete/code.js
/**
* Ajax Batch Delete
* @description Delete listed multiple pages
* Does not need to go to Special:BlankPage to use
* Includes the option to protect after deleting
* Includes the option to grab a whole category's contents
* @author Ozank Cx
*/
mw.loader.using("mediawiki.api", function() {
	"use strict";
	if (window.AjaxBatchDeleteLoaded) return;
	window.AjaxBatchDeleteLoaded = true;
	var api = new mw.Api(), i18n, preloads = 3, deleteModal, paused = true;
	var $form, $deleteReasonInput, $pageListInput, $protectCheckInput, $errorOutput;
	function preload() {
		if (--preloads === 0) init();
	}
	function init() {
		mw.libs.PowertoolsPlacement.addPortletLink(mw.config.values.skin, {
			id: "t-bd",
			label: i18n.msg("toolsTitle").plain(),
			tooltip: "AjaxBatchDelete",
			onClick: click
		});
	}
	function click() {
		if (deleteModal) {
			deleteModal.show();
			return;
		}
		deleteModal = new window.dev.modal.Modal({
			content: formHtml(),
			id: "form-batch-delete",
			size: "large",
			title: i18n.msg("modalTitle").escape(),
			buttons: [
				{
					id: "abd-start",
					text: i18n.msg("initiate").escape(),
					primary: true,
					event: "start"
				},
				{
					id: "abd-pause",
					text: i18n.msg("pause").escape(),
					primary: true,
					event: "pause",
					disabled: true
				},
				{
					id: "abd-add-pages-in-category",
					text: i18n.msg("addCategoryContents").escape(),
					primary: true,
					event: "addCategoryContents"
				}
			],
			events: {
				addCategoryContents,
				pause,
				start
			},
			closeOnClickingBackdrop: false
		});
		deleteModal.create();
		$form = $("#form-batch-delete");
		$errorOutput = $form.find("#text-error-output");
		$pageListInput = $form.find("#text-mass-delete");
		$deleteReasonInput = $form.find("#ajax-delete-reason");
		$protectCheckInput = $form.find("#protect-check");
		deleteModal.show();
	}
	function formHtml() {
		return $("<form>").append($("<fieldset>").append($("<div>", { "class": "edit-input-controls" }).append($("<div>", { "class": "edit-input-control" }).append($("<label>", {
			"for": "ajax-delete-reason",
			text: i18n.msg("inputReason").plain()
		}), $("<input>", {
			type: "text",
			name: "ajax-delete-reason",
			id: "ajax-delete-reason"
		})), $("<div>", { "class": "edit-input-control" }).append($("<label>", {
			"for": "protect-check",
			text: i18n.msg("inputProtect").plain()
		}), $("<input>", {
			type: "checkbox",
			id: "protect-check",
			name: "protect-check"
		}))), $("<p>", { text: i18n.msg("inputPages").plain() + ":" }), $("<textarea>", { id: "text-mass-delete" }), $("<p>", { text: i18n.msg("errorsForm").plain() + ":" }), $("<div>", { id: "text-error-output" }))).prop("outerHTML");
	}
	function pause() {
		paused = true;
		deleteModal.disableActionButtons("abd-pause");
		deleteModal.enableActionButtons(["abd-start", "abd-add-pages-in-category"]);
	}
	function start() {
		if (!$deleteReasonInput.val()) {
			alert(i18n.msg("stateReason").plain());
			return;
		}
		paused = false;
		deleteModal.disableActionButtons(["abd-start", "abd-add-pages-in-category"]);
		deleteModal.enableActionButtons("abd-pause");
		process();
	}
	function process() {
		if (paused) return;
		var pages = ($pageListInput.val() || "").split("\n"), currentPage = pages[0];
		if (!currentPage) {
			$errorOutput.append(i18n.msg("endTitle").escape() + " " + i18n.msg("endMsg").escape() + "<br />");
			pause();
		} else performAction(currentPage, $deleteReasonInput.val());
		pages = pages.slice(1, pages.length);
		$pageListInput.val(pages.join("\n"));
	}
	function addCategoryContents() {
		var category = prompt(i18n.msg("enterCategory").plain() + ":");
		if (!category) return;
		api.get({
			action: "query",
			list: "categorymembers",
			cmtitle: "Category:" + category,
			cmlimit: 5e3
		}).done(function(d) {
			var data = d.query;
			for (var i in data.categorymembers) $pageListInput.val(($pageListInput.val() || "") + data.categorymembers[i].title + "\n");
		}).fail(function(code) {
			outputError("GetContents", category, code);
		});
	}
	function outputError(error, param1, param2) {
		$errorOutput.append(i18n.msg("error" + error, param1, param2).escape(), "<br />");
	}
	function performAction(page, reason) {
		api.postWithEditToken({
			action: "delete",
			watchlist: "preferences",
			title: page,
			reason,
			bot: true
		}).done(function() {
			if ($protectCheckInput.prop("checked")) api.postWithEditToken({
				action: "protect",
				expiry: "infinite",
				protections: "create=sysop",
				watchlist: "preferences",
				title: page,
				reason
			}).fail(function() {
				outputError("Protect", page, i18n.msg("ajaxError").plain());
			});
		}).fail(function(code) {
			outputError("Delete", page, code);
		});
		setTimeout(process, window.batchDeleteDelay || 1e3);
	}
	mw.hook("dev.modal").add(preload);
	mw.hook("dev.powertools.placement").add(preload);
	getI18nLoader().then(function(loader) {
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
			return module.loadMessages("AjaxBatchDelete", {});
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
			"toolsTitle": "Batch Delete",
			"modalTitle": "Ajax Batch Delete",
			"inputReason": "Reason for deleting",
			"inputProtect": "Protect for admin only?",
			"inputPages": "Put the name of each page you want to delete on a separate line",
			"errorsForm": "Any errors encountered will appear below",
			"addCategoryContents": "Add category contents",
			"initiate": "Initiate",
			"stateReason": "Please state a reason!",
			"endTitle": "Finished!",
			"endMsg": "Nothing left to do, or next line is blank.",
			"enterCategory": "Please enter the category name (no category prefix)",
			"errorGetContents": "Failed to get contents of $1: $2",
			"errorDelete": "Failed to delete $1: $2",
			"errorProtect": "Failed to protect $1: $2",
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
