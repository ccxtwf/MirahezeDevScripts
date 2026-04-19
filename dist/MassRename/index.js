//#region gadgets/MassRename/code.js
/**
* Mass Rename
* @description Rename pages quickly.
* @author KnazO
*/
mw.loader.using("mediawiki.api", function() {
	if (window.MassRenameLoaded) return;
	window.MassRenameLoaded = true;
	var i18n, renameModal, preloads = 3, paused = false;
	var $form, $pageListInput, $customSummary, $redirectCheck, $errorOutput;
	/**
	* @method formHtml
	* @description Creates the modal HTML
	*/
	function formHtml() {
		return $("<form>").append($("<fieldset>").append($("<p>", { text: i18n.msg("instructions").plain() }), $("<p>", { text: i18n.msg("instructions2").plain() }), $("<label>", {
			"for": "redirect-check",
			text: i18n.msg("redirect").plain()
		}).append($("<input>", {
			type: "checkbox",
			id: "redirect-check"
		})), $("<div>", { "class": "edit-input-control" }).append($("<label>", { "for": "custom-summary" }).append($("<div>").text(i18n.msg("custom-summary").plain()), $("<input>", { id: "custom-summary" }))), $("<textarea>", {
			id: "text-rename",
			placeholder: "old_name new_name"
		}), $("<div>", {
			id: "text-error-output",
			text: i18n.msg("outputInitial").plain(),
			append: "<br/>"
		}))).prop("outerHTML");
	}
	/**
	* @method preload
	* @description Loads the hooks and I18n messages
	*/
	function preload() {
		if (--preloads === 0) init();
	}
	/**
	* @method init
	* @description Initiates the script
	*/
	function init() {
		mw.libs.PowertoolsPlacement.addPortletLink(mw.config.values.skin, {
			id: "t-mr",
			href: "#",
			label: i18n.msg("title").plain(),
			tooltip: "MassRename",
			onClick: click
		});
	}
	/**
	* @method click
	* @description Opens the MassRename modal
	*/
	function click() {
		if (renameModal) {
			renameModal.show();
			return;
		}
		renameModal = new window.dev.modal.Modal({
			content: formHtml(),
			id: "form-mass-rename",
			size: "medium",
			title: i18n.msg("title").escape(),
			buttons: [
				{
					id: "mr1-start",
					text: i18n.msg("initiate").escape(),
					primary: true,
					event: "start"
				},
				{
					id: "mr1-pause",
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
		renameModal.create();
		$form = $("#form-mass-rename");
		$pageListInput = $form.find("#text-rename");
		$customSummary = $form.find("#custom-summary");
		$redirectCheck = $form.find("#redirect-check");
		$errorOutput = $form.find("#text-error-output");
		renameModal.show();
	}
	/**
	* @method pause
	* @description Pauses the operation
	*/
	function pause() {
		paused = true;
		renameModal.disableActionButtons("mr1-pause");
		renameModal.enableActionButtons("mr1-start");
	}
	/**
	* @method start
	* @description Starts the operation
	*/
	function start() {
		paused = false;
		renameModal.disableActionButtons("mr1-start");
		renameModal.enableActionButtons("mr1-pause");
		process();
	}
	/**
	* @method process
	* @description Analyzes the inputted data
	*/
	function process() {
		if (paused) return;
		var pages = ($pageListInput.val() || "").split("\n"), page = pages[0];
		if (!page) {
			$errorOutput.append(i18n.msg("finished").escape() + " " + i18n.msg("nothingLeftToDo").escape() + "<br/>");
			pause();
		} else rename(page);
		pages = pages.slice(1, pages.length);
		$pageListInput.val(pages.join("\n"));
	}
	/**
	* @method rename
	* @description Renames the page
	* @param {String} name - The rename data
	*/
	function rename(name) {
		if (name.split(" ").length !== 2) $errorOutput.append(i18n.msg("invalidInput", name).escape() + "<br/>");
		else {
			var oldName = name.split(" ")[0], newName = name.split(" ")[1], config = {
				action: "move",
				from: oldName,
				to: newName,
				noredirect: "",
				reason: $customSummary.first().val() || window.massRenameSummary || i18n.inContentLang().msg("summary").plain()
			};
			if ($redirectCheck.prop("checked")) delete config.noredirect;
			new mw.Api().postWithEditToken(config).done(function(d) {
				if (!d.error) console.log(i18n.msg("renameDone", oldName, newName).plain());
				else {
					console.error(i18n.msg("renameFail", oldName, newName).escape() + ": " + d.error.code);
					$errorOutput.append(i18n.msg("renameFail", oldName, newName).escape() + ": " + d.error.code + "<br/>");
				}
			}).fail(function(error) {
				console.error(i18n.msg("renameFail", oldName, newName).plain() + ": " + error);
				$errorOutput.append(i18n.msg("renameFail2", oldName, newName).escape() + "<br/>");
			});
		}
		setTimeout(process, window.massRenameDelay || 1e3);
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
			return module.loadMessages("MassRename", {});
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
			"title": "Mass rename",
			"instructions": "Put the name of the page you want to rename, then the new name afterwards with a space in between on each separate line.",
			"instructions2": "For page names with spaces, use underscores instead of spaces.",
			"redirect": "Leave a redirect behind?",
			"summary": "automatic",
			"outputInitial": "Any errors encountered will appear below",
			"initiate": "Initiate",
			"cancel": "Cancel",
			"finished": "Finished!",
			"nothingLeftToDo": "Nothing left to do, or next line is blank.",
			"close": "Close",
			"renameDone": "Successfully renamed $1 to $2!",
			"invalidInput": "The line \"$1\" is invalid input!",
			"renameFail": "Failed to rename $1 to $2",
			"renameFail2": "Failed to rename $1 to $2!",
			"pause": "Pause",
			"custom-summary": "Reason for moving "
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
