//#region gadgets/MassCategorization/code.js
(function() {
	if (window.MassCategorization && window.MassCategorization.loaded) return;
	window.MassCategorization = $.extend({
		loaded: true,
		delay: null,
		stopAddPages: null,
		wg: mw.config.get([
			"wgUserGroups",
			"wgNamespaceIds",
			"wgArticlePath",
			"wgContentLanguage",
			"wgFormattedNamespaces",
			"wgNamespaceNumber"
		]),
		modal: null,
		typemap: {
			"1": "add",
			"2": "remove",
			"3": "replace"
		},
		running: false,
		refs: {},
		loading: [
			"api",
			"i18n",
			"modal-js",
			"dorui",
			"placement"
		],
		onload: function(key, arg) {
			switch (key) {
				case "i18n":
					this.i18n = prepareI18n(arg);
					break;
				case "api":
					this.api = new mw.Api();
					break;
				case "dorui":
					ui = arg;
					break;
			}
			var index = this.loading.indexOf(key);
			if (index === -1) throw new Error("Unregistered dependency loaded: " + key);
			this.loading.splice(index, 1);
			if (this.loading.length !== 0) return;
			this.init();
		},
		hasRights: function(rights) {
			return rights.some(function(right) {
				return this.wg.wgUserGroups.indexOf(right) > -1;
			}.bind(this));
		},
		getPrefixedModule: function(name) {
			var modules = mw.loader.getModuleNames();
			var prefix = name + "-";
			var len = prefix.length;
			var moduleName = modules.find(function(mod) {
				return mod.slice(0, len) === prefix;
			});
			return mw.loader.using(moduleName).done(function(require) {
				return require(moduleName);
			});
		},
		preload: function() {
			getI18nLoader().done(this.onload.bind(this, "i18n"));
			mw.hook("dev.modal").add(this.onload.bind(this, "modal-js"));
			mw.hook("dev.doru.ui").add(this.onload.bind(this, "dorui"));
			mw.hook("dev.powertools.placement").add(this.onload.bind(this, "placement"));
			mw.loader.using("mediawiki.api").done(this.onload.bind(this, "api"));
		},
		buildCategoryUpdate: function() {
			function onSelectChange(e) {
				this.onSelectChange(update, e);
			}
			var update = ui.div({
				classes: ["MassCat-category-update", "MassCat-category-update-add"],
				children: [ui.div({
					class: "MassCat-mode-select-wrapper",
					events: { input: onSelectChange.bind(this) },
					children: [this.i18n.msg("mode-dropdown-label").plain() + " ", ui.select({
						class: "MassCat-mode-select",
						children: [
							ui.option({
								value: 1,
								text: this.i18n.msg("mode-dropdown-add").plain()
							}),
							ui.option({
								value: 2,
								text: this.i18n.msg("mode-dropdown-remove").plain()
							}),
							ui.option({
								value: 3,
								text: this.i18n.msg("mode-dropdown-replace").plain()
							})
						]
					})]
				}), ui.div({
					classes: ["MassCat-category-inputs"],
					child: ui.div({
						class: "MassCat-category-input-wrapper",
						children: [ui.div({ text: this.i18n.msg("category-label").plain() + " " }), ui.input({
							type: "text",
							class: "MassCat-category-input",
							events: { input: function() {
								this.running = false;
							}.bind(this) }
						})]
					})
				})]
			});
			return update;
		},
		onSelectChange: function(elem, e) {
			this.running = false;
			var typecat = elem.classList.item(1);
			var from = typecat.replace("MassCat-category-update-", "");
			var to = this.typemap[e.target.value];
			var inputs = elem.querySelector(".MassCat-category-inputs");
			if (to === "replace" && from !== "replace") {
				inputs.appendChild(this.fadeIn(ui.div({
					classes: ["MassCat-category-input-wrapper", "MassCat-replacement-category-input-wrapper"],
					children: [this.i18n.msg("category-replace-label").plain() + " ", ui.input({
						type: "text",
						classes: ["MassCat-category-input", "MassCat-replacement-category-input"],
						events: { change: function() {
							this.running = false;
						}.bind(this) }
					})]
				}), 300));
				this.reflowModal();
			} else if (to !== "replace" && from === "replace") {
				var wrapper = inputs.querySelector(".MassCat-replacement-category-input-wrapper");
				console.assert(wrapper === inputs.lastElementChild);
				this.fadeOut(wrapper, 300, function() {
					this.reflowModal();
				}.bind(this));
			}
			elem.classList.remove(typecat);
			elem.classList.add("MassCat-category-update-" + to);
		},
		fadeIn: function(elem, delay) {
			elem.classList.add("MassCat-fading-in");
			setTimeout(function() {
				elem.classList.remove("MassCat-fading-in");
			}, delay);
			return elem;
		},
		fadeOut: function(elem, delay, callback) {
			elem.classList.add("MassCat-fading-out");
			setTimeout(function() {
				elem.classList.remove("MassCat-fading-out");
				elem.parentNode.removeChild(elem);
				if (callback) callback();
			}, delay);
		},
		buildCategoryAdder: function() {
			return ui.div({
				id: "MassCat-category-adder",
				children: [
					ui.span({
						id: "MassCat-add-category",
						text: "+",
						events: { click: this.addUpdate.bind(this) }
					}),
					ui.br(),
					this.refs.removeButton = ui.span({
						id: "MassCat-remove-category",
						class: ["disabled"],
						text: "-",
						events: { click: this.removeUpdate.bind(this) }
					})
				]
			});
		},
		addUpdate: function(e) {
			e.preventDefault();
			this.running = false;
			this.refs.updatesList.appendChild(this.fadeIn(this.buildCategoryUpdate(), 300));
			this.refs.removeButton.classList.remove("disabled");
			this.reflowModal();
		},
		removeUpdate: function(e) {
			e.preventDefault();
			this.running = false;
			var children = this.refs.updatesList.querySelectorAll(".MassCat-category-update:not(.MassCat-fading-out)");
			var last = children[children.length - 1];
			if (children.length === 2) this.refs.removeButton.classList.add("disabled");
			this.fadeOut(last, 300, function() {
				this.reflowModal();
			}.bind(this));
		},
		buildModalContent: function() {
			this.refs.pagesTextarea = ui.textarea({
				class: "MassCat-pages-textarea",
				events: { input: function() {
					this.running = false;
				}.bind(this) }
			});
			new MutationObserver(this.reflowModal.bind(this)).observe(this.refs.pagesTextarea, {
				attributes: true,
				attributeFilter: ["style"]
			});
			return ui.div({
				id: "MassCat-content-container",
				children: [
					ui.div({
						id: "MassCat-updates-container",
						children: [this.refs.updatesList = ui.div({
							id: "MassCat-updates-list",
							child: this.buildCategoryUpdate()
						}), this.buildCategoryAdder()]
					}),
					ui.div({
						id: "MassCat-options-container",
						children: [
							this.i18n.msg("options-section-label").plain(),
							ui.label({
								class: "MassCat-options-label",
								children: [this.refs.noIncludeCheckbox = ui.input({
									type: "checkbox",
									events: { change: function() {
										this.running = false;
									}.bind(this) }
								}), this.i18n.msg("options-no-include-label").plain()]
							}),
							ui.label({
								class: "MassCat-options-label",
								children: [this.refs.caseSensitiveCheckbox = ui.input({
									type: "checkbox",
									events: { change: function() {
										this.running = false;
									}.bind(this) }
								}), this.i18n.msg("options-case-sensitive-label").plain()]
							}),
							ui.label({
								class: "MassCat-options-label",
								children: [this.refs.suppressAutomaticCheckbox = ui.input({
									type: "checkbox",
									events: { change: function() {
										this.running = false;
									}.bind(this) }
								}), this.i18n.msg("options-suppress-automatic-label").plain()]
							})
						]
					}),
					ui.div({
						id: "MassCat-pages-container",
						children: [this.i18n.msg("pages-section-label").plain(), this.refs.pagesTextarea]
					}),
					this.refs.statusContainer = ui.div({
						id: "MassCat-status-container",
						class: "MassCat-logger MassCat-hidden"
					}),
					this.refs.errorsContainer = ui.div({
						id: "MassCat-errors-container",
						class: "MassCat-logger MassCat-hidden",
						child: this.refs.errorsText = ui.div({ id: "MassCat-errors-text" })
					})
				]
			});
		},
		resetOutput: function() {
			this.refs.statusContainer.classList.add("MassCat-hidden");
			this.refs.errorsContainer.classList.add("MassCat-hidden");
			this.refs.statusContainer.innerText = "";
			this.refs.errorsText.innerText = "";
		},
		showModal: function() {
			this.modal.show();
		},
		escapeRegex: mw.util.escapeRegExp,
		upcaseFirst: function(s) {
			return s[0].toUpperCase() + s.slice(1);
		},
		escapeIdentifier: function(id) {
			return this.escapeRegex(id).replace(/ +/g, "[_ ]*").replace(/^([a-zA-Z])/g, function(c) {
				return "[" + c.toUpperCase() + c.toLowerCase() + "]";
			});
		},
		getCategoryRegex: function(category, isCaseSensitive) {
			var flags = "g" + (isCaseSensitive ? "" : "i");
			var escapedCat = this.escapeIdentifier(category);
			var leftPrefix = "\\[\\[\\s*" + ("(?:" + this.categoryAliases.join("|") + ")") + "\\s*:\\s*" + escapedCat + "\\s*";
			var sRegEx = "(?:" + leftPrefix + "\\|(.*?)\\]\\]|" + leftPrefix + "\\]\\])";
			return new RegExp(sRegEx, flags);
		},
		categorize: function(title, updates) {
			var currentStep = this.addStatus(this.i18n.msg("status-fetching", title).plain());
			this.api.get({
				action: "query",
				titles: title,
				prop: "revisions|categories",
				rvprop: "content"
			}).done(function(data) {
				var page = Object.values(data.query.pages)[0];
				if (page.missing === "") {
					this.logError(this.i18n.msg("error-page-does-not-exist", title).plain());
					return;
				}
				var content = page.revisions[0]["*"].trim();
				var newContent = content;
				var categories = !page.categories ? [] : page.categories.map(function(category) {
					return category.title.slice(category.title.indexOf(":") + 1).toLowerCase();
				});
				var changes = [];
				var updateMap = {
					add: [],
					remove: [],
					replace: []
				};
				updates.forEach(function(update) {
					updateMap[update.mode].push(update);
				});
				updateMap.replace.forEach(function(update) {
					var category = update.category;
					var replacement = update.replacement;
					var cSens = this.refs.caseSensitiveCheckbox.checked;
					var regex = this.getCategoryRegex(category, cSens);
					var matches = regex.exec(newContent);
					if (matches) {
						changes.push(this.i18n.inContentLang().msg("change-replaced", category, replacement).plain());
						var sortkey = matches[1];
						var newCat = "[[" + this.categoryLocal + ":" + this.upcaseFirst(replacement) + (sortkey ? "|" + sortkey : "") + "]]";
						newContent = newContent.replace(regex, newCat);
						var index = categories.indexOf(category.toLowerCase());
						if (index !== -1) categories.splice(index, 1, replacement.toLowerCase());
					}
				}.bind(this));
				updateMap.remove.forEach(function(update) {
					var category = update.category;
					var cSens = this.refs.caseSensitiveCheckbox.checked;
					var regex = this.getCategoryRegex(category, cSens);
					if (regex.exec(newContent)) {
						changes.push(this.i18n.inContentLang().msg("change-removed", category).plain());
						newContent = newContent.replace(regex, "");
						var index = categories.indexOf(category.toLowerCase());
						if (index !== -1) categories.splice(index, 1);
					}
				}.bind(this));
				if (updateMap.add.some(function(update) {
					return categories.indexOf(update.category.toLowerCase()) === -1;
				})) {
					var addingCategories = updateMap.add.map(function(update) {
						return update.category;
					});
					var appendContent = "\n";
					addingCategories.forEach(function(category) {
						if (categories.indexOf(category.toLowerCase()) === -1) {
							changes.push(this.i18n.inContentLang().msg("change-added", category).plain());
							appendContent += "[[" + this.categoryLocal + ":" + category + "]]\n";
						}
					}.bind(this));
					if (this.refs.noIncludeCheckbox.checked) {
						var noInclude = "</noinclude>";
						if (newContent.slice(-noInclude.length) === noInclude) {
							newContent = newContent.slice(0, -noInclude.length);
							appendContent = appendContent + "</noinclude>";
							if (newContent.slice(-1) === "\n") appendContent = appendContent.trimStart();
						} else appendContent = "\n<noinclude>" + appendContent + "</noinclude>";
					}
					newContent += appendContent;
				}
				if (content !== newContent) {
					currentStep = this.replaceStatus(currentStep, this.i18n.msg("status-publishing", title).plain());
					var summary = this.i18n.inContentLang().msg("summary", changes.join(", ")).plain();
					if (!this.refs.suppressAutomaticCheckbox.checked) summary += " (" + this.i18n.inContentLang().msg("automatic").plain() + ")";
					this.api.postWithEditToken({
						action: "edit",
						watchlist: "nochange",
						title,
						summary,
						nocreate: "",
						text: newContent,
						bot: true,
						minor: true
					}).done(function(res) {
						this.removeStatus(currentStep, this.i18n.msg("status-published-waiting", title).plain());
						if (res.error && res.error.code) this.logError(this.i18n.msg("error-publishing", title).plain() + ": " + res.error.code);
					}.bind(this)).fail(function(code) {
						this.removeStatus(currentStep, this.i18n.msg("status-failed-publish-waiting", title).plain());
						if (typeof code === "string") this.logError(this.i18n.msg("error-publishing", title).plain() + ": " + code);
						else this.logError(this.i18n.msg("error-publishing", title).plain());
					}.bind(this));
				} else this.removeStatus(currentStep, this.i18n.msg("status-no-changes-waiting", title).plain());
			}.bind(this));
		},
		pluckNextLine: function() {
			var val = this.refs.pagesTextarea.value;
			var index = val.indexOf("\n");
			if (index === -1) index = val.length;
			var title = val.slice(0, index).trim();
			this.refs.pagesTextarea.value = val.slice(index + 1);
			return title;
		},
		getUpdates: function() {
			return Array.from(this.refs.updatesList.children).map(function(elem) {
				var select = elem.querySelector(".MassCat-mode-select");
				var inputs = elem.querySelectorAll(".MassCat-category-input");
				var value = {
					mode: this.typemap[select.value],
					category: inputs[0].value.trim(),
					invalid: inputs[0].value.trim() === ""
				};
				if (value.mode == "replace") {
					value.replacement = inputs[1].value.trim();
					value.invalid = value.invalid || value.replacement.trim() === "";
				}
				return value;
			}.bind(this));
		},
		start: function() {
			if (this.running) return;
			this.resetOutput();
			this.reflowModal();
			this.modal.enableActionButtons("mcat-pause");
			this.modal.disableActionButtons(["mcat-start", "mcat-add-pages-in-category"]);
			var updates = this.getUpdates();
			for (var i = 0; i < updates.length; i++) {
				var update = updates[i];
				if (update.invalid) {
					if (update.category === "") {
						alert(this.i18n.msg("error-missing-category", i + 1).plain());
						return;
					} else if (update.replacement === "") {
						alert(this.i18n.msg("error-missing-replacement", i + 1).plain());
						return;
					}
					alert("This code is unreachable. If you can see this, wat");
					return;
				}
			}
			this.running = true;
			var editNext = function() {
				if (!this.running) {
					this.logError(this.i18n.msg("interrupted").plain());
					return;
				}
				var next = this.pluckNextLine();
				if (!next) {
					alert(this.i18n.msg("nothing-left-to-do-prompt").plain());
					this.addStatus(this.i18n.msg("status-finished").plain(), true);
					this.pause();
					return;
				}
				this.categorize(next, updates);
				setTimeout(editNext.bind(this), this.delay);
			}.bind(this);
			editNext.call(this);
		},
		pause: function() {
			this.running = false;
			this.modal.enableActionButtons(["mcat-start", "mcat-add-pages-in-category"]);
			this.modal.disableActionButtons("mcat-pause");
		},
		addCategoryContents: function() {
			var category = prompt(this.i18n.msg("add-category-prompt").plain());
			if (category === null || category.trim() === "") return;
			this.resetOutput();
			this.reflowModal();
			this.streamCategoryMembers(category);
		},
		query: function(promise, params, cbOnFetch, cbOnAllFinished, cbOnError, fetched) {
			var d = $.Deferred();
			this.api.get(params).done(function(data) {
				var hasMore = false;
				cbOnFetch(data);
				if (this.threshold === null || fetched.n < this.threshold) {
					if (data["continue"] !== void 0) {
						hasMore = true;
						Object.assign(params, data["continue"]);
					}
					if (data["query-continue"]) {
						hasMore = true;
						var args = [params].concat(Object.values(data["query-continue"]));
						params = Object.assign.apply(null, args);
					}
				} else if (this.threshold) alert(this.i18n.msg("reached-threshold", this.threshold));
				if (this.stopAddPages === null && hasMore) this.stopAddPages = !confirm(this.i18n.msg("confirm-big-request", (data.limits || {}).categorymembers || 500).parse());
				if (!this.stopAddPages && hasMore) promise.then(this.query.bind(this, promise, params, cbOnFetch, cbOnAllFinished, cbOnError, fetched));
				else cbOnAllFinished();
				d.resolve();
			}.bind(this)).fail(function(err) {
				cbOnError(err);
				cbOnAllFinished();
				d.resolve();
			});
			return d;
		},
		streamCategoryMembers: function(category) {
			var params = {
				action: "query",
				list: "categorymembers",
				cmtitle: "Category:" + category,
				cmprop: "title",
				cmlimit: "max",
				cachebuster: Date.now()
			};
			var fetched = { n: 0 };
			function cbOnFetch(data) {
				var members = data.query.categorymembers.map(function(page) {
					return page.title;
				});
				fetched.n += members.length;
				if (members.length === 0) {
					this.logError(this.i18n.msg("error-category-does-not-exist", category).plain());
					return;
				}
				var textarea = this.refs.pagesTextarea;
				var toAdd = textarea.value.length !== 0 && textarea.value.charAt(textarea.value.length - 1) !== "\n" ? "\n" : "";
				toAdd += members.join("\n");
				textarea.value += toAdd;
			}
			function cbOnError(err) {
				console.error(err);
				this.logError(this.i18n.msg("error-failed-to-get-contents", category).plain());
			}
			function cbOnAllFinished() {
				alert(this.i18n.msg("status-finished-fetch").plain());
			}
			this.stopAddPages = null;
			var promise = $.when();
			promise.then(this.query.bind(this, promise, params, cbOnFetch.bind(this), cbOnAllFinished.bind(this), cbOnError.bind(this), fetched));
		},
		addStatus: function(msg, temp) {
			var status = this.buildStatus(msg, temp);
			var old = this.refs.statusContainer.querySelector(".MassCat-temp");
			if (old !== null) this.refs.statusContainer.replaceChild(status, old);
			else this.refs.statusContainer.appendChild(status);
			this.refs.statusContainer.classList.remove("MassCat-hidden");
			this.reflowModal();
			return status;
		},
		removeStatus: function(status, ifEmpty) {
			this.refs.statusContainer.removeChild(status);
			if (ifEmpty && this.refs.statusContainer.children.length === 0) this.addStatus(ifEmpty, true);
		},
		replaceStatus: function(oldStatus, msg) {
			var status = this.buildStatus(msg);
			this.refs.statusContainer.replaceChild(status, oldStatus);
			return status;
		},
		buildStatus: function(msg, temp) {
			return ui.div({
				classes: {
					"MassCat-status-message": true,
					"MassCat-temp": temp
				},
				text: msg
			});
		},
		logError: function(msg) {
			console.error(msg);
			this.refs.errorsContainer.classList.remove("MassCat-hidden");
			this.refs.errorsText.appendChild(ui.div({
				classes: ["MassCat-log", "MassCat-error"],
				text: msg
			}));
			this.reflowModal();
		},
		reflowModal: function() {
			var $frame = this.modal._modal.$frame;
			var $body = this.modal._modal.$body;
			var stop = $body.prop("scrollTop");
			dev.modal._windowManager.updateWindowSize(this.modal._modal);
			if (!$frame || !$body) return console.error("OOUI is dumb");
			var frame = $frame.get(0);
			var body = $body.get(0);
			body.scrollTop = stop;
			frame.addEventListener("transitionend", function() {
				var height = body.clientHeight;
				if (body.scrollHeight > height) body.classList.add("overflow-allowed");
				else body.classList.remove("overflow-allowed");
			}, { once: true });
		},
		setPageEditThreshold: function() {
			if (this.hasRights([
				"bureaucrat",
				"sysop",
				"bot"
			])) if (window.MassCategorization && window.MassCategorization.threshold !== void 0) this.threshold = window.MassCategorization.threshold;
			else this.threshold = 2e4;
			else this.threshold = 1e4;
		},
		setDefaultDelay: function() {
			if (!this.delay) if (this.hasRights([
				"bureaucrat",
				"sysop",
				"bot"
			])) this.delay = 2e3;
			else this.delay = 4e3;
		},
		createModal: function() {
			this._loadedModalContent = false;
			this.modal = new dev.modal.Modal({
				id: "MassCatModal",
				size: "large",
				title: this.i18n.msg("modal-title").plain(),
				content: this.buildModalContent(),
				closeOnClickingBackdrop: false,
				events: {
					addCategoryContents: this.addCategoryContents.bind(this),
					start: this.start.bind(this),
					pause: this.pause.bind(this)
				},
				buttons: [
					{
						text: this.i18n.msg("start-button").plain(),
						id: "mcat-start",
						event: "start",
						primary: true
					},
					{
						text: this.i18n.msg("cancel-button").plain(),
						id: "mcat-cancel",
						event: "close",
						primary: false
					},
					{
						text: this.i18n.msg("pause-button").plain(),
						id: "mcat-pause",
						event: "pause",
						primary: true
					},
					{
						text: this.i18n.msg("add-category-contents-button").plain(),
						event: "addCategoryContents",
						id: "mcat-add-pages-in-category",
						primary: false
					}
				],
				close: function() {
					if (!this.running) return true;
					if (confirm(this.i18n.msg("close-modal-prompt").plain())) {
						this.running = false;
						return true;
					}
					return false;
				}
			});
			this.modal.create();
		},
		addToolbarButton: function() {
			mw.libs.PowertoolsPlacement.addPortletLink(mw.config.values.skin, {
				id: "MassCat-tools-button",
				cssClasses: "custom",
				label: this.i18n.msg("my-tools-button").plain(),
				tooltip: "MassCategorization",
				onClick: this.showModal.bind(this)
			});
		},
		init: function() {
			this.categoryLocal = this.wg.wgFormattedNamespaces["14"];
			this.categoryAliases = Object.keys(this.wg.wgNamespaceIds).filter(function(key) {
				return this.wg.wgNamespaceIds[key] === 14;
			}.bind(this)).map(this.escapeIdentifier.bind(this));
			this.setPageEditThreshold();
			this.setDefaultDelay();
			this.createModal();
			this.addToolbarButton();
		}
	}, window.MassCategorization);
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
			return module.loadMessages("MassCategorization", {});
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
			"modal-title": "MassCategorization",
			"my-tools-button": "MassCategorization",
			"start-button": "Start",
			"pause-button": "Pause",
			"cancel-button": "Cancel",
			"add-category-contents-button": "Add category contents",
			"mode-dropdown-label": "Mode:",
			"mode-dropdown-add": "Add",
			"mode-dropdown-remove": "Remove",
			"mode-dropdown-replace": "Replace",
			"category-label": "Category:",
			"category-replace-label": "Replace with:",
			"options-section-label": "Options:",
			"options-no-include-label": "Do not include in transclusion (for templates)",
			"options-case-sensitive-label": "Case sensitive (remove and replace only)",
			"options-suppress-automatic-label": "Suppress (automatic) from the edit summary",
			"pages-section-label": "Put the name of each page you want to categorize on a separate line",
			"status-description": "Here you will see what the script is doing",
			"status-categorizing": "Categorizing $1...",
			"status-fetching": "Fetching content for $1...",
			"status-publishing": "Publishing $1...",
			"status-published-waiting": "Published $1. Waiting on delay...",
			"status-failed-publish-waiting": "Failed while publishing $1. Waiting on delay...",
			"status-no-changes-waiting": "No changes made. Waiting on delay...",
			"status-finished": "Finished!",
			"status-paused": "Paused",
			"status-finished-fetch": "Finished loading the category contents!",
			"close-modal-prompt": "Are you sure you want to close the modal without finishing?",
			"add-category-prompt": "Please enter the category name (no category prefix):",
			"nothing-left-to-do-prompt": "Nothing left to do, or next line is blank",
			"error-failed-to-get-contents": "Failed to get contents of $1",
			"error-category-does-not-exist": "$1 is empty",
			"interrupted": "Execution was interrupted by a change in the settings",
			"error-page-does-not-exist": "$1 does not exist",
			"automatic": "automatic",
			"summary": "Updating categories: $1",
			"change-added": "added $1",
			"change-removed": "removed $1",
			"change-replaced": "replaced $1 with $2",
			"error-missing-category": "Missing category in update number $1",
			"error-missing-replacement": "Missing replacement category in update number $1",
			"error-publishing": "Could not publish an edit to $1",
			"confirm-big-request": "This request will be big (more than $1 pages) and may be slow. Do you want to continue?",
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
	window.MassCategorization.preload();
})();
//#endregion
