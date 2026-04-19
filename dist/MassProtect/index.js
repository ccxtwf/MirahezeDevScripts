//#region gadgets/MassProtect/code.js
/**
* @Name            MassProtect
* @Version         v2.3
* @Author          KnazO
* @Author          TheGoldenPatrik1
* @Description     Protect listed pages.
*/
mw.loader.using(["mediawiki.api", "mediawiki.user"], function() {
	if (window.MassProtectLoaded) return;
	window.MassProtectLoaded = true;
	var Api = new mw.Api(), i18n, preloads = 3, protectModal, paused = true;
	var $form, $pageListInput, $errorOutput, $protectExpiry, $protectCreate, $protectEdit, $protectMove, $protectUpload, $protectReason;
	/**
	* @method generateElement
	* @description Creates a select dropdown menu.
	* @parama {String} type - The protection type.
	*/
	function generateElement(type) {
		return $("<div>", { "class": "edit-input-control" }).append($("<div>").text(i18n.msg(type).plain()), $("<select>", { id: "protect-" + type }).append($("<option>", {
			value: "",
			text: i18n.msg("unset").plain()
		}), $("<option>", {
			value: type + "=all",
			text: i18n.msg("all").plain()
		}), $("<option>", {
			value: type + "=autoconfirmed",
			text: i18n.msg("autoconfirmed").plain()
		}), $("<option>", {
			value: type + "=sysop",
			text: i18n.msg("sysop").plain()
		})));
	}
	/**
	* @method formHtml
	* @description The modal's HTML.
	*/
	function formHtml() {
		return $("<form>").append($("<fieldset>").append($("<p>", {
			text: i18n.msg("protection").plain(),
			"class": "protection-bold"
		}), generateElement("edit"), generateElement("move"), generateElement("upload"), generateElement("create"), $("<hr/>"), $("<div>", { "class": "protection-bold edit-input-control" }).append($("<div>").text(i18n.msg("expiry").plain()), $("<input>", {
			type: "text",
			id: "protect-expiry",
			placeholder: "indefinite"
		})), $("<hr/>"), $("<div>", { "class": "protection-bold edit-input-control" }).append($("<div>").text(i18n.msg("reason").plain()), $("<input>", {
			type: "text",
			id: "protect-reason"
		})), $("<hr/>"), $("<p>", { text: i18n.msg("instructions").plain() }), $("<textarea/>", { id: "text-mass-protect" }), $("<hr/>"), $("<div>", {
			id: "text-error-output",
			text: i18n.msg("error").plain()
		}).append($("<br/>")))).prop("outerHTML");
	}
	/**
	* @method preload
	* @description Preloads the script and the hooks.
	*/
	function preload() {
		if (--preloads === 0) init();
	}
	/**
	* @method init
	* @description Initiates the script and adds the button.
	*/
	function init() {
		mw.libs.PowertoolsPlacement.addPortletLink(mw.config.values.skin, {
			id: "t-mp",
			href: "#",
			cssClasses: "custom",
			label: i18n.msg("title").plain(),
			tooltip: "MassProtect",
			onClick: click
		});
	}
	/**
	* @method click
	* @description Shows the MassProtect modal.
	*/
	function click() {
		if (protectModal) {
			protectModal.show();
			return;
		}
		protectModal = new window.dev.modal.Modal({
			content: formHtml(),
			id: "form-mass-protect",
			size: "medium",
			title: i18n.msg("title").escape(),
			buttons: [
				{
					id: "mp-start",
					text: i18n.msg("initiate").escape(),
					primary: true,
					event: "start"
				},
				{
					id: "mp-pause",
					text: i18n.msg("pause").escape(),
					primary: true,
					event: "pause",
					disabled: true
				},
				{
					id: "mp-add-pages-in-category",
					text: i18n.msg("addCategory").escape(),
					primary: true,
					event: "addCategoryContents"
				},
				{
					text: i18n.msg("cancel").escape(),
					event: "close"
				}
			],
			events: {
				addCategoryContents,
				pause,
				start
			},
			closeOnClickingBackdrop: false
		});
		protectModal.create();
		$form = $("#form-mass-protect");
		$pageListInput = $form.find("#text-mass-protect");
		$errorOutput = $form.find("#text-error-output");
		$protectExpiry = $form.find("#protect-expiry");
		$protectCreate = $form.find("#protect-create");
		$protectEdit = $form.find("#protect-edit");
		$protectMove = $form.find("#protect-move");
		$protectUpload = $form.find("#protect-upload");
		$protectReason = $form.find("#protect-reason");
		protectModal.show();
	}
	/**
	* @method pause
	* @description Pauses the operation.
	*/
	function pause() {
		paused = true;
		protectModal.disableActionButtons("mp-pause");
		protectModal.enableActionButtons(["mp-start", "mp-add-pages-in-category"]);
	}
	/**
	* @method start
	* @description Initiates the operation.
	*/
	function start() {
		paused = false;
		protectModal.disableActionButtons(["mp-start", "mp-add-pages-in-category"]);
		protectModal.enableActionButtons("mp-pause");
		process();
	}
	/**
	* @method process
	* @description Performs the process.
	*/
	function process() {
		if (paused) return;
		var pages = ($pageListInput.val() || "").split("\n"), currentPage = pages[0];
		if (!currentPage) {
			pause();
			$errorOutput.append(i18n.msg("finished").escape() + " " + i18n.msg("done").escape() + "<br/>");
		} else protectPage(currentPage);
		pages = pages.slice(1, pages.length);
		$pageListInput.val(pages.join("\n"));
	}
	/**
	* @method addCategoryContents
	* @description Inputs the contents of a category.
	*/
	function addCategoryContents() {
		var category = prompt(i18n.msg("categoryPrompt").plain());
		if (!category) return;
		Api.get({
			action: "query",
			list: "categorymembers",
			cmtitle: "Category:" + category,
			cmlimit: "max"
		}).done(function(d) {
			var data = d.query;
			for (var i in data.categorymembers) {
				var currTitles = $pageListInput.val();
				$pageListInput.val(currTitles + data.categorymembers[i].title + "\n");
			}
		}).fail(function(code) {
			$errorOutput.append(i18n.msg("categoryFail").escape() + category + " : " + code + "<br/>");
		});
	}
	/**
	* @method protectPage
	* @description Performs the protection.
	* @param {String} page - The page to protect.
	*/
	function protectPage(page) {
		Api.postWithEditToken({
			action: "protect",
			expiry: $protectExpiry.val() || $protectExpiry.attr("placeholder"),
			protections: $protectCreate.val() || [
				$protectEdit.val(),
				$protectMove.val(),
				$protectUpload.val()
			].filter(Boolean).join("|"),
			watchlist: "preferences",
			title: page,
			reason: $protectReason.val()
		}).done(function() {
			console.log(i18n.msg("success", page).plain());
		}).fail(function(code) {
			console.log(i18n.msg("fail").escape() + page + ": " + code);
			$errorOutput.append(i18n.msg("fail").escape() + page + ": " + code + "<br/>");
		});
		setTimeout(process, window.massProtectDelay || 1e3);
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
			return module.loadMessages("MassProtect", {});
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
			"unset": "Unset",
			"all": "Allow all users",
			"autoconfirmed": "Block new users and unregistered users",
			"sysop": "Administrators and Content Moderators only",
			"title": "Mass Protect",
			"edit": "Edit:",
			"move": "Move:",
			"upload": "Upload:",
			"create": "Create:",
			"cancel": "Cancel",
			"addCategory": "Add Category Contents",
			"initiate": "Initiate",
			"finished": "Finished!",
			"done": "Nothing left to do, or next line is blank.",
			"close": "Close",
			"categoryPrompt": "Enter the category name (no category prefix):",
			"categoryFail": "Failed to get contents of ",
			"success": "Protection of $1 successful!",
			"fail": "Failed to protect ",
			"protection": "Protection:",
			"expiry": "Expiry time:",
			"reason": "Reason:",
			"instructions": "Put the name of each page you want to protect on a separate line.",
			"error": "Any errors encountered will appear below",
			"pause": "Pause",
			"comment": "Comment:"
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
