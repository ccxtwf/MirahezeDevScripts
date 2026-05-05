//#region gadgets/MassNullEdit/code.js
/**
* Mass Null Edit
* @description Null edit listed multiple pages.
* @author Ozuzanna
*/
(function($, mw) {
	"use strict";
	if (window.loadedMassNullEdit) return;
	window.loadedMassNullEdit = true;
	var apiModeData = {
		backlinks: {
			name: "backlinks",
			limit: "bllimit",
			value: "bltitle"
		},
		transclusions: {
			name: "embeddedin",
			limit: "eilimit",
			value: "eititle"
		},
		fileusage: {
			name: "imageusage",
			limit: "iulimit",
			value: "iutitle"
		},
		prefix: {
			name: "allpages",
			limit: "aplimit",
			value: "apprefix"
		},
		category: {
			name: "categorymembers",
			limit: "cmlimit",
			value: "cmtitle"
		},
		namespace: {
			name: "allpages",
			limit: "aplimit",
			value: "apnamespace"
		}
	};
	var threshold = 5e3;
	var config = mw.config.get([
		"wgUserGroups",
		"wgCanonicalNamespace",
		"wgCanonicalSpecialPageName",
		"wgFormattedNamespaces",
		"wgNamespaceIds",
		"wgRelevantPageName"
	]);
	var editApi = {
		action: "edit",
		summary: "Null edit (this edit should not be visible)",
		notminor: true,
		prependtext: "",
		nocreate: true
	};
	var i18n;
	var nsBlacklist = ["-2", "-1"];
	var nsCategory = config.wgFormattedNamespaces[14] + ":";
	var nsFile = config.wgFormattedNamespaces[6] + ":";
	var failedPages = [];
	var input;
	var modalMain;
	var modalAddPages;
	var paused = true;
	var rateLimited = false;
	var rateLimitTimeoutId;
	var stopAddPages = null;
	function log(i18nMsg) {
		$("#mne-output").prepend(i18nMsg.parse(), "<br>");
	}
	function pageToNamespaceIdAndTitle(page) {
		var colonPos = page.indexOf(":");
		var nsText = page.slice(0, colonPos).toLowerCase().replace(/ /g, "_");
		var title = page.slice(colonPos + 1);
		var ns = config.wgNamespaceIds[nsText];
		return {
			namespaceId: ns || 0,
			title: ns ? title : page
		};
	}
	function addToInput(pages) {
		var currentPages = input.value.split("\n");
		pages = pages.filter(function(page) {
			return currentPages.indexOf(page) === -1;
		});
		if (pages.length) input.value += pages.join("\n") + "\n";
		return pages.length;
	}
	function nullEdit(page) {
		var query = { title: page };
		var editReq = editApi.postWithEditToken(query);
		editReq.always(function(result, resultIfRejected) {
			if (editReq.state() === "rejected") result = resultIfRejected;
			var error = result.error && result.error.code || "unknown";
			if (result.edit && result.edit.result === "Success") return;
			if (error === "ratelimited") {
				rateLimited = true;
				input.value = page + "\n" + input.value;
			} else {
				failedPages.push(page);
				log(i18n("fail", page, error));
			}
		});
	}
	function pause() {
		paused = true;
		rateLimited = false;
		modalMain.$element.removeClass("processing");
	}
	function start() {
		paused = false;
		modalMain.$element.addClass("processing");
		process();
	}
	function process() {
		if (rateLimited) {
			log(i18n("notice-ratelimit"));
			pause();
			rateLimitTimeoutId = setTimeout(start, 3e4);
		}
		if (paused || input === null) return;
		var delay = Number(window.nullEditDelay) || 1e3;
		if (delay < 100) delay *= 1e3;
		var pages = input.value.split("\n");
		var page;
		do
			page = pages.shift();
		while (page === "");
		input.value = pages.join("\n");
		if (page) {
			nullEdit(page.trim());
			setTimeout(process, delay);
		} else {
			log(i18n("notice-finished"));
			addToInput(failedPages);
			failedPages = [];
			pause();
		}
	}
	function addPages(query, mode, displayValue) {
		var pages = [];
		var queryApi = new mw.Api({ parameters: query });
		function complete(error) {
			if (error) log(i18n("notice-error-" + mode, displayValue, error));
			if (!error || pages.length) {
				var addedCount = addToInput(pages);
				log(i18n("notice-success-" + mode, displayValue, addedCount));
			}
			modalAddPages.$element.removeClass("processing");
			modalAddPages.hide();
		}
		function collect(promise, more, fetched) {
			var d = $.Deferred();
			var queryReq = queryApi.get(more);
			queryReq.always(function(result, resultIfRejected) {
				if (queryReq.state() === "rejected") result = resultIfRejected;
				var error = result.error && result.error.code;
				var data = result.query && result.query[query.list];
				if (error || !data) {
					complete(error || "unknown error");
					d.resolve();
					return;
				}
				var hasMore = false;
				pages = pages.concat(data.map(function(entry) {
					return entry.title;
				}));
				fetched.n += data.length;
				if (threshold === null || fetched.n < threshold) {
					if (result["continue"] !== void 0) {
						hasMore = true;
						Object.assign(more, result["continue"]);
					}
					if (result["query-continue"]) {
						hasMore = true;
						var args = [more].concat(Object.values(result["query-continue"]));
						more = Object.assign.apply(null, args);
					}
				} else if (threshold) alert(i18n("reached-threshold", threshold));
				if (stopAddPages === null && hasMore) stopAddPages = !confirm(i18n("confirm-big-request", result.limits[query.list]).parse());
				if (!stopAddPages && hasMore) promise.then(collect(promise, more, fetched));
				else complete();
				d.resolve();
			});
			return d;
		}
		modalAddPages.$element.addClass("processing");
		var promise = $.when();
		promise.then(collect.bind(this, promise, {}, { n: 0 }));
	}
	function addPagesProcess(mode, value) {
		var modeData = apiModeData[mode];
		var query = {};
		if (!modeData || !value) return;
		value = value.replace(/_/g, " ");
		var displayValue = value;
		switch (mode) {
			case "namespace":
				displayValue = value === "0" ? i18n("namespace-main").escape() : config.wgFormattedNamespaces[value];
				break;
			case "category":
				if (value.indexOf(nsCategory) !== 0) value = nsCategory + value;
				else displayValue = displayValue.slice(nsCategory.length);
				break;
			case "fileusage":
				if (value.indexOf(nsFile) !== 0) value = nsFile + value;
				else displayValue = displayValue.slice(nsFile.length);
				break;
			case "prefix":
				var nsAndTitle = pageToNamespaceIdAndTitle(value);
				query.apnamespace = nsAndTitle.namespaceId;
				value = nsAndTitle.title;
				break;
		}
		query.list = modeData.name;
		query[modeData.value] = value;
		query[modeData.limit] = "max";
		addPages(query, mode, displayValue);
	}
	function addPagesCreateModalRow(mode) {
		var $row = $("<p>", { "class": "mne-addpages-row" });
		var $radio = $("<input>").attr({
			type: "radio",
			name: "mode",
			value: mode
		});
		var $input = $("<input>").attr({
			type: "text",
			name: mode
		});
		if (mode === "namespace") {
			$input = $("<select>").attr("name", mode);
			Object.keys(config.wgFormattedNamespaces).forEach(function(ns) {
				if (nsBlacklist.indexOf(ns) !== -1) return;
				var opt = document.createElement("option");
				opt.value = ns;
				opt.textContent = ns === "0" ? i18n("namespace-main").plain() : config.wgFormattedNamespaces[ns];
				$input.append(opt);
			});
		}
		$input.on("change", function() {
			$radio.prop("checked", true);
		});
		$row.append($("<label>").append($radio, document.createTextNode(i18n("addpages-" + mode).plain())), $input);
		return $row;
	}
	function addPagesOpenModal() {
		var formData;
		var $modalContent = $("<form>").attr("id", "mne-mode");
		Object.keys(apiModeData).forEach(function(mode) {
			$modalContent.append(addPagesCreateModalRow(mode));
		});
		modalAddPages.show({
			title: i18n("addpages").plain(),
			content: $modalContent,
			onShow: function() {
				stopAddPages = null;
				formData = document.forms["mne-mode"].elements;
				modalAddPages.$footer.append($("<span>").attr("id", "mne-processing-msg").text(i18n("processing").plain()), mw.libs.QDmodal.getSpinner());
			},
			onHide: function() {
				stopAddPages = true;
			},
			buttons: [{
				text: i18n("addpages").plain(),
				attr: { id: "mne-addpages-start" },
				handler: function() {
					var mode = modalAddPages.$content.find("[name=mode]:checked").val();
					addPagesProcess(mode, formData[mode] && formData[mode].value);
				}
			}, {
				text: i18n("cancel").plain(),
				handler: modalAddPages.hide.bind(modalAddPages)
			}]
		});
	}
	function autoFillPages() {
		var relevantPage = config.wgRelevantPageName.replace(/_/g, " ");
		if (config.wgCanonicalNamespace === "Category") addPagesProcess("category", relevantPage);
		if (config.wgCanonicalSpecialPageName === "Whatlinkshere") {
			addPagesProcess("backlinks", relevantPage);
			addPagesProcess("transclusions", relevantPage);
			if (relevantPage.indexOf(nsFile) === 0) addPagesProcess("fileusage", relevantPage);
		}
		if (config.wgCanonicalSpecialPageName === "Allpages") addPagesProcess("namespace", $("form [name=\"namespace\"]").val());
		if (config.wgCanonicalSpecialPageName === "Prefixindex") {
			var prefix = $("form [name=\"prefix\"]").val();
			var prefixNs = $("form [name=\"namespace\"]").val();
			var page = "";
			if (prefixNs !== "0") page += config.wgFormattedNamespaces[prefixNs] + ":";
			page += prefix;
			addPagesProcess("prefix", page);
		}
	}
	function openModal(ev) {
		ev.preventDefault();
		var modalContents = "<p>" + i18n("instructions").escape() + "</p><textarea id=\"mne-input\"></textarea><div id=\"mne-output\"><i>" + i18n("notice-output").escape() + "</i></div>";
		modalMain.show({
			title: i18n("title").plain(),
			content: modalContents,
			onShow: function() {
				input = document.getElementById("mne-input");
				pause();
				modalMain.$footer.append($("<span>").attr("id", "mne-processing-msg").text(i18n("processing").plain()), mw.libs.QDmodal.getSpinner());
			},
			onHide: function() {
				pause();
				input = null;
				clearTimeout(rateLimitTimeoutId);
			},
			buttons: [
				{
					text: i18n("initiate").plain(),
					attr: { id: "mne-main-start" },
					handler: start
				},
				{
					text: i18n("pause").plain(),
					attr: { id: "mne-main-pause" },
					handler: pause
				},
				{
					text: i18n("addpages").plain(),
					handler: addPagesOpenModal
				},
				{
					text: i18n("cancel").plain(),
					handler: modalMain.hide.bind(modalMain)
				}
			]
		});
		mw.loader.using(["mediawiki.api", "mediawiki.user"]).done(function() {
			if (!(editApi instanceof mw.Api)) editApi = new mw.Api({ parameters: editApi });
			autoFillPages();
		});
	}
	function hasRights(rights) {
		return rights.some(function(right) {
			return config.wgUserGroups.indexOf(right) > -1;
		}.bind(this));
	}
	function main() {
		modalMain = new mw.libs.QDmodal("mne-main");
		modalAddPages = new mw.libs.QDmodal("mne-addpages");
		modalMain.$element.addClass("mne-modal");
		modalAddPages.$element.addClass("mne-modal");
		if (hasRights([
			"bureaucrat",
			"sysop",
			"bot"
		])) if (window.MassNullEdit && window.MassNullEdit.threshold !== void 0) threshold = window.MassNullEdit.threshold;
		else threshold = 2e4;
		else if (hasRights(["autoconfirmed"])) threshold = 1e4;
		mw.hook("dev.powertools.placement").add(function(module) {
			module.addPortletLink(mw.config.values.skin, {
				id: "t-mne",
				label: i18n("title").plain(),
				tooltip: "MassNullEdit",
				onClick: openModal
			});
		});
	}
	getI18nLoader().done(function(loader) {
		i18n = prepareI18n(loader);
		i18n = i18n.msg.bind(i18n);
		mw.hook("dev.qdmodal").add(main);
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
			return module.loadMessages("MassNullEdit", {});
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
			"title": "Mass Null Edit",
			"instructions": "Enter the name of each page to null edit on a separate line. Remember to include the namespace too if it is not in main.",
			"notice-output": "Any notices will appear here",
			"notice-ratelimit": "<b>Rate limited!</b> Waiting 30 seconds before next edit.",
			"notice-finished": "<b>Finished!</b> Any pages with failed edits have been re-added above.",
			"notice-success-backlinks": "<b>Added pages!</b> $2 {{PLURAL:$2|page|pages}} that {{PLURAL:$2|links|link}} to “$1” added.",
			"notice-success-transclusions": "<b>Added pages!</b> $2 {{PLURAL:$2|page|pages}} that {{PLURAL:$2|transcludes|transclude}} “$1” added.",
			"notice-success-fileusage": "<b>Added pages!</b> $2 {{PLURAL:$2|page|pages}} that {{PLURAL:$2|includes|include}} the file “$1” added.",
			"notice-success-prefix": "<b>Added pages!</b> $2 {{PLURAL:$2|page|pages}} with the prefix “$1” added.",
			"notice-success-category": "<b>Added pages!</b> $2 {{PLURAL:$2|page|pages}} from “$1” category added.",
			"notice-success-namespace": "<b>Added pages!</b> $2 {{PLURAL:$2|page|pages}} from “$1” namespace added.",
			"notice-error-backlinks": "<b>API error!</b> Failed to get pages that link to “$1”: <b>$2</b>.",
			"notice-error-transclusions": "<b>API error!</b> Failed to get pages that transclude “$1”: <b>$2</b>.",
			"notice-error-fileusage": "<b>API error!</b> Failed to get pages that include the file “$1”: <b>$2</b>.",
			"notice-error-prefix": "<b>API error!</b> Failed to get pages with the prefix “$1”: <b>$2</b>.",
			"notice-error-category": "<b>API error!</b> Failed to get pages from “$1” category: <b>$2</b>.",
			"notice-error-namespace": "<b>API error!</b> Failed to get pages from “$1” namespace: <b>$2</b>.",
			"cancel": "Cancel",
			"pause": "Pause",
			"initiate": "Start",
			"addpages": "Add pages",
			"addpages-backlinks": "Add pages that link to:",
			"addpages-transclusions": "Add pages that transclude:",
			"addpages-fileusage": "Add pages that include the file:",
			"addpages-prefix": "Add pages with the prefix:",
			"addpages-category": "Add members of category:",
			"addpages-namespace": "Add pages from namespace:",
			"namespace-main": "(Main)",
			"processing": "Processing…",
			"confirm-big-request": "This request will be big (more than $1 pages) and may be slow. Do you want to continue?",
			"success": "Null edit of “$1” successful!",
			"fail": "Failed to null edit “$1”: <b>$2</b>.",
			"reached-threshold": "A maximum of $1 pages can only be loaded at a time to prevent abuse and performance issues."
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
})(jQuery, mediaWiki);
//#endregion
