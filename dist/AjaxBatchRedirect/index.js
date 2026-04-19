//#region gadgets/AjaxBatchRedirect/code.js
/**
* AjaxBatchRedirect
* (based off of AjaxBatchDelete by Ozank Cx, //dev.fandom.com/AjaxBatchDelete)
* @description Extends AjaxRedirect with a modal that facilitates batch redirect.
* @author MonkeysHK
*/
(function($, mw) {
	var config = mw.config.get([
		"wgCanonicalNamespace",
		"wgCanonicalSpecialPageName",
		"wgPageName",
		"wgUserGroups",
		"wgRevisionId",
		"wgIsRedirect"
	]), groupsWithDeletePerm = [
		"bureaucrat",
		"sysop",
		"global-admin"
	], colorProgress = "rgb(20, 220, 23)", colorError = "rgb(220, 20, 60)", colorWarning = "rgb(100, 149, 237)", colorInfo = "black", api, i18n, myModal, processFlag;
	var $form, $progress, $pagesFrom, $pagesTo, $errorOutput;
	if (window.AjaxBatchRedirectLoaded) return;
	window.AjaxBatchRedirectLoaded = true;
	function notifyError(messagekey) {
		console.log(i18n.msg(messagekey).plain());
		mw.notify(i18n.msg(messagekey).plain(), { type: "error" });
	}
	function modalConsoleLog(messagekey, color, pagename, pagename2) {
		$errorOutput.append($("<div>").css("color", color).text(i18n.msg(messagekey, pagename, pagename2).escape()));
	}
	function makeSimpleRedirect(fromPage, toPage) {
		return new Promise(function(resolve) {
			api.postWithEditToken({
				action: "edit",
				watchlist: "nochange",
				title: fromPage,
				minor: true,
				bot: true,
				text: "#REDIRECT [[" + toPage.charAt(0).toUpperCase() + toPage.slice(1) + "]]"
			}).done(function(d) {
				if (d.error) console.warn(d.error);
				resolve({ error: !d.error ? false : "redirectfail" });
			}).fail(function(err) {
				console.warn(err);
				resolve({ error: "redirectfail" });
			});
		});
	}
	function makeDeleteRedirect(fromPage, toPage) {
		return new Promise(function(resolve) {
			api.postWithEditToken({
				action: "delete",
				watchlist: "nochange",
				title: fromPage,
				reason: i18n.msg("deleteReason").plain()
			}).done(function(d) {
				if (d.error) {
					console.warn(d.error);
					resolve({ error: "deleteFail" });
					return;
				}
				resolve(makeSimpleRedirect(fromPage, toPage));
			}).fail(function(err) {
				console.warn(err);
				resolve({ error: "deleteFail" });
			});
		});
	}
	function makePageInfoQuery(pageList) {
		return new Promise(function(resolve) {
			api.get({
				action: "query",
				titles: pageList.flat().join("|"),
				prop: "info"
			}).done(function(d) {
				if (d.error) console.warn(d.error);
				resolve(d.error ? false : d.query.pages);
			}).fail(function(err) {
				console.warn(err);
				resolve(false);
			});
		});
	}
	function burstBuffer5x(pageList, actionFn, i, promisesHead, delay) {
		return new Promise(function(resolve) {
			var segment = pageList.slice(i, i + 5);
			promisesHead = promisesHead.concat(segment.map(function(v) {
				return actionFn(v[0], v[1]);
			}));
			if (i + 5 >= pageList.length) resolve(promisesHead);
			else {
				$progress.empty().append($("<div>").css("color", colorProgress).text(i18n.msg("inCooldown", promisesHead.length, pageList.length).escape()));
				setTimeout(function() {
					burstBuffer5x(pageList, actionFn, i + 5, promisesHead, delay).then(function(promisesHead) {
						resolve(promisesHead);
					});
				}, delay);
			}
		});
	}
	function runDeleteRedirectList(deleteRedirectList, failureList) {
		return new Promise(function(resolve) {
			burstBuffer5x(deleteRedirectList, makeDeleteRedirect, 0, [], 1e4).then(function(promisesHead) {
				Promise.allSettled(promisesHead).then(function(values) {
					for (var i in values) if (values[i].reason || values[i].value.error === "redirectfail") {
						modalConsoleLog("consoleRedirectFail", colorError, deleteRedirectList[i][0], deleteRedirectList[i][1]);
						failureList.push(deleteRedirectList[i]);
						if (values[i].reason) console.warn(values[i].reason);
					} else if (values[i].value.error === "deleteFail") {
						modalConsoleLog("consoleDeleteFail", colorError, deleteRedirectList[i][0], deleteRedirectList[i][1]);
						failureList.push(deleteRedirectList[i]);
					}
					resolve(true);
				});
			});
		});
	}
	function runSimpleRedirectList(simpleRedirectList, failureList) {
		return new Promise(function(resolve) {
			burstBuffer5x(simpleRedirectList, makeSimpleRedirect, 0, [], 5e3).then(function(promisesHead) {
				Promise.allSettled(promisesHead).then(function(values) {
					for (var i in values) if (values[i].reason || values[i].value.error === "redirectfail") {
						modalConsoleLog("consoleRedirectFail", colorError, simpleRedirectList[i][0], simpleRedirectList[i][1]);
						failureList.push(simpleRedirectList[i]);
						if (values[i].reason) console.warn(values[i].reason);
					}
					resolve(true);
				});
			});
		});
	}
	function redirectPages(pageList) {
		makePageInfoQuery(pageList).then(function(queryResults) {
			if (!queryResults) {
				notifyError("queryError");
				return;
			}
			var pageinfo = {}, simpleRedirectList = [], deleteRedirectList = [], failureList = [], tasksawait = 1, i;
			var finished = function() {
				if (--tasksawait === 0) {
					var successCount = simpleRedirectList.length + deleteRedirectList.length - failureList.length;
					$errorOutput.append($("<div>").css("color", colorInfo).text(i18n.msg("finished", successCount).escape()));
					$pagesFrom.val(failureList.map(function(v) {
						return v[0];
					}).join("\n"));
					$pagesTo.val(failureList.map(function(v) {
						return v[1];
					}).join("\n"));
					$progress.empty();
					$pagesFrom.removeAttr("disabled");
					$pagesTo.removeAttr("disabled");
					processFlag = false;
				}
			};
			for (i in queryResults) pageinfo[queryResults[i].title] = queryResults[i];
			for (i in pageList) {
				var frompage = pageinfo[pageList[i][0]];
				if (frompage.ns === 6 && frompage.missing !== "" && frompage.redirect !== "") deleteRedirectList.push(pageList[i]);
				else simpleRedirectList.push(pageList[i]);
			}
			if (deleteRedirectList.length > 0) if (!config.wgUserGroups.some(function(g) {
				return groupsWithDeletePerm.indexOf(g) > -1;
			})) for (i in deleteRedirectList) {
				modalConsoleLog("consoleDeleteNoPerm", colorWarning, deleteRedirectList[i][0], deleteRedirectList[i][1]);
				failureList.push(deleteRedirectList[i]);
			}
			else if (confirm(i18n.msg("confirmDeletePages", deleteRedirectList.map(function(v) {
				return v[0];
			}).join("\n")).plain())) {
				tasksawait++;
				runDeleteRedirectList(deleteRedirectList, failureList).then(finished);
			} else for (i in deleteRedirectList) {
				modalConsoleLog("consoleDeleteSkipped", colorWarning, deleteRedirectList[i][0], deleteRedirectList[i][1]);
				failureList.push(deleteRedirectList[i]);
			}
			runSimpleRedirectList(simpleRedirectList, failureList).then(finished);
		});
	}
	function start() {
		if (processFlag) return;
		processFlag = true;
		var fromList = $pagesFrom.val().split("\n");
		var toList = $pagesTo.val().split("\n");
		var pageList = [];
		for (var i = 0; i < Math.max(fromList.length, toList.length); i++) {
			var fromPage = (fromList[i] || "").replaceAll("_", " ").trim();
			var toPage = (toList[i] || "").replaceAll("_", " ").trim();
			if (fromPage === "" && toPage === "");
			else if (fromPage === "" || toPage === "") {
				alert(i18n.msg("pageCouplingError", i + 1, fromPage, toPage).plain());
				processFlag = false;
				return;
			} else pageList.push([fromPage, toPage]);
		}
		if (pageList.length > 0) {
			$pagesFrom.attr("disabled", "");
			$pagesTo.attr("disabled", "");
			$errorOutput.empty();
			redirectPages(pageList);
		} else processFlag = false;
	}
	function createForm() {
		return $("<form>").append($("<fieldset>").append($("<p>", { text: i18n.msg("inputInstructions").plain() }), $("<p>", { id: "form-progress" }), $("<div>", { id: "form-main-wrapper" }).append($("<div>").append($("<p>", { text: i18n.msg("inputPagesFrom").plain() + ":" }), $("<textarea>", { id: "text-pages-from" })), $("<div>").append($("<p>", { text: i18n.msg("inputPagesTo").plain() + ":" }), $("<textarea>", { id: "text-pages-to" }))), $("<p>", { text: i18n.msg("errorsForm").plain() + ":" }), $("<div>", { id: "text-error-output" }))).prop("outerHTML");
	}
	function click() {
		if (myModal) {
			myModal.show();
			return;
		}
		myModal = new window.dev.modal.Modal({
			content: createForm(),
			id: "batchredirect-form",
			size: "large",
			title: i18n.msg("modalTitle").escape(),
			buttons: [{
				id: "batchredirect-start",
				text: i18n.msg("initiate").escape(),
				primary: true,
				event: "start"
			}],
			events: { start },
			closeOnClickingBackdrop: false
		});
		myModal.create();
		$form = $("#batchredirect-form");
		$progress = $form.find("#form-progress");
		$pagesFrom = $form.find("#text-pages-from");
		$pagesTo = $form.find("#text-pages-to");
		$errorOutput = $form.find("#text-error-output");
		myModal.show();
	}
	function init() {
		api = new mw.Api();
		mw.libs.PowertoolsPlacement.addPortletLink(mw.config.values.skin, {
			id: "t-batchredirect",
			href: "#",
			label: i18n.msg("toolsTitle").plain(),
			tooltip: "AjaxBatchRedirect",
			onClick: click
		});
	}
	var preloadsLeft = 3;
	function preload() {
		if (--preloadsLeft === 0) mw.loader.using(["mediawiki.api", "mediawiki.user"]).done(init);
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
			return module.loadMessages("AjaxBatchRedirect", {});
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
			"toolsTitle": "Batch Redirect",
			"modalTitle": "Ajax Batch Redirect",
			"inputInstructions": "Put the name of each page on a separate line. Each line on the left side table will be redirected to the corresponding line on the right side.",
			"inputPagesFrom": "Pages to redirect from",
			"inputPagesTo": "Pages to redirect to",
			"errorsForm": "Any errors encountered will appear below",
			"initiate": "Initiate",
			"deleteReason": "Reason: Making redirect",
			"finished": "Finished. $1 pages redirected. Failed pages are reinserted to the input boxes.",
			"confirmDeletePages": "Delete the following file pages to make way for redirect?\n\n$1",
			"pageCouplingError": "Cannot couple pages correctly. Please check that each line on the left panel corresponds to each line on the right panel.\n\nError on Line $1: from page $2, to page $3",
			"queryError": "Unexpected error on page info query.",
			"inCooldown": "$1/$2 (in cooldown)",
			"consoleRedirectFail": "Redirect edit failed: from page $1, to page $2.",
			"consoleDeleteFail": "Failed to delete file page $1 for redirecting to $2.",
			"consoleDeleteNoPerm": "Not enough permission to delete file page $1 for redirecting to $2.",
			"consoleDeleteSkipped": "User skipped a file page redirect: from page $1, to page $2."
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
