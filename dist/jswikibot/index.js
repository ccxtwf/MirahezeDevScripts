//#region gadgets/jswikibot/models/state.ts
var Cache = class {
	namespaces;
	userRights;
	userGroups;
	allUserRights = /* @__PURE__ */ new Set();
	cachedPageInfo = {};
};
var Config = class {
	debug = false;
	summaryBot = "[[meta:User:PetraMagna/jswikibot|bot]]";
	readThrottle = .2;
	writeThrottle = 1;
};
var State = class {
	cache = new Cache();
	config = new Config();
};
var state = new State();
function isDebugMode() {
	return state.config.debug;
}
function cachePageInfo(pageInfo) {
	state.cache.cachedPageInfo[pageInfo.title] = pageInfo;
}
function clearCachedPageInfo() {
	state.cache.cachedPageInfo = {};
}
//#endregion
//#region gadgets/jswikibot/utils/result.ts
function newErrorResult(e) {
	return {
		ok: false,
		error: e
	};
}
function unwrap(r) {
	if (r.ok) return r.value;
	else throw new Error("Unable to unwrap result");
}
function flatMap(result, func) {
	if (result.ok) return {
		ok: true,
		value: func(result.value)
	};
	return {
		ok: false,
		error: result.error
	};
}
//#endregion
//#region gadgets/jswikibot/utils/mw_api.ts
var ThrottleControl = class {
	lastAction;
	constructor() {
		this.lastAction = {
			download: 0,
			read: 0,
			write: 0
		};
	}
	async throttle(type, time) {
		let curTime = Date.now();
		if (this.lastAction[type]) {
			const sleepUntil = this.lastAction[type] + time * 1e3;
			if (sleepUntil > curTime) {
				await new Promise((r) => setTimeout(r, sleepUntil - curTime));
				curTime = Date.now();
			}
		}
		this.lastAction[type] = curTime;
	}
};
var Api = class {
	token;
	defaultParams = { format: "json" };
	throttleControl = new ThrottleControl();
	constructor(api = new mw.Api()) {
		this.api = api;
	}
	async getToken(types = "csrf") {
		const type = typeof types === "string" ? types : types.join("|");
		this.token = (await this.post({
			action: "query",
			meta: "tokens",
			type
		})).query.tokens;
		return this.token;
	}
	processParams(params) {
		for (const key in this.defaultParams) {
			if (key in params) continue;
			params[key] = this.defaultParams[key];
		}
	}
	async throttle(type, time) {
		if (!time) time = type == "read" ? state.config.readThrottle : state.config.writeThrottle;
		await this.throttleControl.throttle(type, time);
	}
	async get(args) {
		this.processParams(args);
		await this.throttle("read");
		return this.api.get(args);
	}
	async post(args) {
		this.processParams(args);
		await this.throttle("write");
		return this.api.post(args);
	}
	async postWithToken(args) {
		this.processParams(args);
		await this.throttle("write");
		return this.api.postWithToken("csrf", args);
	}
};
var API = new Api();
function formatSummary(summary, additionalParameters = {}) {
	summary = summary.replace("$bot", state.config.summaryBot);
	for (const key in additionalParameters) summary = summary.replace(`$${key}`, additionalParameters[key]);
	return summary;
}
async function purge(titles, api = API) {
	if (titles.length === 0) return false;
	if (titles.length > 50) {
		console.error("Cannot purge more than 50 pages at once");
		return false;
	}
	try {
		return (await api.post({
			action: "purge",
			titles: titles.join("|")
		})).purge.length === titles.length;
	} catch (error) {
		console.error(`Failed to purge pages: ${titles} ${error}`);
		return false;
	}
}
async function savePage(title, text, summary = "$bot: automated edit", minor = true, bot = true, api = API) {
	try {
		return (await api.postWithToken({
			action: "edit",
			title,
			text,
			summary: formatSummary(summary),
			minor,
			bot
		})).edit?.result === "Success";
	} catch (error) {
		console.error("Failed to save page:", title, error);
		return false;
	}
}
async function deletePage(title, reason, deleteTalk = false, bot = true, api = API) {
	try {
		await api.postWithToken({
			action: "delete",
			title,
			reason: formatSummary(reason),
			deletetalk: deleteTalk,
			bot
		});
		return {
			ok: true,
			value: true
		};
	} catch (error) {
		console.error("Failed to delete page:", title, error);
		return newErrorResult(error.toString());
	}
}
async function undeletePage(title, reason, undeleteTalk = false, bot = true, api = API) {
	try {
		await api.postWithToken({
			action: "undelete",
			title,
			reason: formatSummary(reason),
			undeletetalk: undeleteTalk,
			bot
		});
		return {
			ok: true,
			value: true
		};
	} catch (error) {
		console.error("Failed to undelete page:", title, error);
		return newErrorResult(error.toString());
	}
}
async function movePage(from, to, options, api = API) {
	try {
		await api.postWithToken({
			action: "move",
			from,
			to,
			reason: formatSummary(options.reason),
			movetalk: options.moveTalk,
			movesubpages: options.moveSubpages,
			noredirect: options.noRedirect,
			bot: options.bot
		});
		return {
			ok: true,
			value: true
		};
	} catch (error) {
		console.error("Failed to move page:", from, "to:", to, error);
		return newErrorResult(error.toString());
	}
}
var cachedSiteInfo = void 0;
var siteInfoPromise = void 0;
async function getSiteInfo() {
	if (cachedSiteInfo) return cachedSiteInfo;
	if (siteInfoPromise) return siteInfoPromise;
	siteInfoPromise = API.get({
		action: "query",
		meta: "siteinfo",
		siprop: "namespaces|usergroups"
	});
	cachedSiteInfo = await siteInfoPromise;
	return cachedSiteInfo;
}
//#endregion
//#region gadgets/jswikibot/models/namespace.ts
var Namespace = class {
	constructor(name, number) {
		this.name = name;
		this.number = number;
	}
	toString() {
		return `${this.number} (${this.name})`;
	}
};
var NamespaceList = class {
	index;
	constructor(namespaces) {
		this.namespaces = namespaces;
		this.index = {};
		for (const namespace of namespaces) {
			this.index[namespace.name.toLowerCase()] = namespace;
			this.index[namespace.number.toString()] = namespace;
		}
	}
	toNamespace(input) {
		input = String(input).toLowerCase();
		const result = this.index[input];
		if (result) return {
			ok: true,
			value: result
		};
		return {
			ok: false,
			error: `"${input}" is not a valid namespace`
		};
	}
};
var namespacesPromise = null;
function getNamespaces() {
	return state.cache.namespaces;
}
function parseNamespaceString(nsString) {
	const namespaces = getNamespaces();
	const result = [];
	const errors = [];
	for (const ns of nsString.split("|")) {
		const res = namespaces.toNamespace(ns);
		if (res.ok) result.push(res.value);
		else errors.push(res.error);
	}
	if (errors.length === 0) return {
		ok: true,
		value: result
	};
	return {
		ok: false,
		error: errors.join("\n")
	};
}
async function getAllNamespacesAsync() {
	if (state.cache.namespaces) return getNamespaces();
	if (namespacesPromise !== null) return namespacesPromise;
	namespacesPromise = (async () => {
		const response = (await getSiteInfo()).query.namespaces;
		const namespaces = [];
		if (response && typeof response === "object") for (const key in response) {
			const ns = response[key];
			const nsName = ns.id === 0 ? "Main" : ns.canonical || ns["*"];
			namespaces.push(new Namespace(nsName, ns.id));
		}
		state.cache.namespaces = new NamespaceList(namespaces);
		namespacesPromise = null;
		return state.cache.namespaces;
	})();
	return namespacesPromise;
}
//#endregion
//#region gadgets/jswikibot/config.ts
var LOCAL_STORAGE_KEY = "jswikibot-config";
function saveConfig() {
	localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.config));
}
function loadConfig() {
	const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
	if (saved) try {
		const parsed = JSON.parse(saved);
		state.config = Object.assign(new Config(), parsed);
	} catch (e) {
		console.error("JSWikiBot: Failed to load configuration", e);
	}
}
var SettingsDialog = class extends OO.ui.ProcessDialog {
	static static = {
		...OO.ui.ProcessDialog.static,
		name: "settings",
		title: "JSWikiBot - Settings",
		tagName: "div",
		actions: [{
			action: "save",
			label: "Save",
			flags: ["primary", "progressive"]
		}, {
			label: "Cancel",
			flags: ["safe"]
		}]
	};
	debugInput;
	summaryInput;
	readThrottleInput;
	writeThrottleInput;
	initialize() {
		super.initialize();
		this.debugInput = new OO.ui.CheckboxInputWidget({ selected: state.config.debug });
		this.summaryInput = new OO.ui.TextInputWidget({ value: state.config.summaryBot });
		this.readThrottleInput = new OO.ui.NumberInputWidget({
			value: state.config.readThrottle.toString(),
			min: .1,
			max: 10
		});
		this.writeThrottleInput = new OO.ui.NumberInputWidget({
			value: state.config.writeThrottle.toString(),
			min: .5,
			max: 20
		});
		const fieldset = new OO.ui.FieldsetLayout({ label: "Global Bot Configuration" });
		fieldset.addItems([
			new OO.ui.FieldLayout(this.debugInput, {
				label: "Debug mode",
				align: "inline"
			}),
			new OO.ui.FieldLayout(this.summaryInput, {
				label: "Bot summary (\"$bot\" will be replaced by this)",
				align: "top"
			}),
			new OO.ui.FieldLayout(this.readThrottleInput, {
				label: "Read throttle (0.1s to 10s)",
				align: "top"
			}),
			new OO.ui.FieldLayout(this.writeThrottleInput, {
				label: "Write throttle (0.5s to 20s)",
				align: "top"
			})
		]);
		const mainPanel = new OO.ui.PanelLayout({
			padded: true,
			expanded: false
		});
		mainPanel.$element.append(fieldset.$element);
		this.$body.append(mainPanel.$element);
		return this;
	}
	getActionProcess(action) {
		if (action === "save") return new OO.ui.Process(() => {
			state.config.debug = this.debugInput.isSelected();
			state.config.summaryBot = this.summaryInput.getValue();
			state.config.readThrottle = Number(this.readThrottleInput.getValue());
			state.config.writeThrottle = Number(this.writeThrottleInput.getValue());
			saveConfig();
			this.close();
		});
		return super.getActionProcess(action);
	}
	getBodyHeight() {
		return 350;
	}
};
//#endregion
//#region gadgets/jswikibot/utils/alert_window.ts
function simpleAlert(title, message) {
	openWindow(new OO.ui.MessageDialog(), {
		title,
		message,
		actions: [{
			action: "ok",
			label: "OK",
			flags: ["primary", "safe"]
		}]
	});
}
function openWindow(dialog, data, closureCallback = () => {}) {
	const windowManager = new OO.ui.WindowManager({ classes: ["jswikibot-window"] });
	$(document.body).append(windowManager.$element);
	windowManager.addWindows([dialog]);
	windowManager.openWindow(dialog, data).closed.then((result) => {
		windowManager.$element.remove();
		windowManager.destroy();
		closureCallback(result);
	});
}
//#endregion
//#region gadgets/jswikibot/models/page.ts
var PageProps = class {
	constructor(title, pageid, ns) {
		this.title = title;
		this.pageid = pageid;
		this.ns = ns;
	}
};
var PageInfo = class extends PageProps {
	text;
	categories = [];
	fileUrl;
	constructor(props) {
		super(props.title, props.pageid, props.ns);
	}
	titleWithoutNs() {
		if (Number.isInteger(this.ns) && this.ns !== 0) return this.title.split(":").splice(1).join(":");
		return this.title;
	}
};
//#endregion
//#region gadgets/jswikibot/utils/progress_window.ts
var LogSeverity = /* @__PURE__ */ function(LogSeverity) {
	LogSeverity["SUCCESS"] = "Success";
	LogSeverity["INFO"] = "Info";
	LogSeverity["WARNING"] = "Warning";
	LogSeverity["ERROR"] = "Error";
	return LogSeverity;
}({});
var ALL_SEVERITIES = [
	LogSeverity.SUCCESS,
	LogSeverity.INFO,
	LogSeverity.WARNING,
	LogSeverity.ERROR
];
var LogEntry = class {
	element;
	constructor(severity, text) {
		this.severity = severity;
		this.text = text;
		this.element = this.renderLogLine(severity, text);
	}
	formatLogSeverity(severity) {
		const text = severity;
		return $("<span>").text(`[${text}]`).addClass(`log-${text.toLowerCase()}`);
	}
	renderLogLine(severity, text) {
		const logElement = $("<div></div>");
		logElement.append(this.formatLogSeverity(severity), $("<span>").text(": " + text));
		return logElement;
	}
};
var ProgressWindow = class {
	progressBar;
	progressLabel;
	progressDialog;
	logLabel;
	cancelButton;
	logPanelWidget;
	isDone = false;
	progress = 0;
	isCancelled = false;
	constructor(total, cancelCallback = () => false) {
		this.total = total;
		this.cancelCallback = cancelCallback;
		this.progressBar = new OO.ui.ProgressBarWidget({ progress: 0 });
		this.progressLabel = new OO.ui.LabelWidget({ label: `Progress: 0 / ${this.total}` });
		this.logLabel = new OO.ui.LabelWidget({
			label: "",
			classes: ["progress-window-logs"]
		});
		this.cancelButton = new OO.ui.ButtonWidget({
			label: "Cancel",
			flags: ["destructive"]
		});
		this.cancelButton.on("click", () => {
			this.isCancelled = true;
			this.cancelCallback();
			this.hideCancelButton();
			this.addLog(LogSeverity.WARNING, "Cancellation initiated. Note that the bot will likely perform one more operation before stopping. Refreshing the page definitively cancels the bot.");
		});
		const progressAndCancelWidget = new OO.ui.Widget({ content: [this.progressLabel.$element, this.cancelButton.$element] });
		progressAndCancelWidget.$element.css({
			display: "flex",
			justifyContent: "space-between",
			alignItems: "center"
		});
		this.severityEnabled = Object.fromEntries(ALL_SEVERITIES.map((severity) => [severity, true]));
		const toggleButtons = ALL_SEVERITIES.map((severity) => {
			const btn = new OO.ui.ToggleButtonWidget({
				label: severity,
				data: severity,
				value: true
			});
			btn.on("change", (selected) => {
				this.severityEnabled[severity] = selected;
				this.refreshLogs();
			});
			return btn;
		});
		const logFilterButtons = new OO.ui.ButtonGroupWidget({
			items: toggleButtons,
			classes: ["jswikibot-log-filter-button-group"]
		});
		this.logPanelWidget = new OO.ui.Widget({ classes: ["progress-window-log-panel"] });
		this.logPanelWidget.$element.addClass("jswikibot-log-panel");
		this.logPanelWidget.$element.append(this.logLabel.$element);
		const fieldsetLayout = new OO.ui.FieldsetLayout();
		fieldsetLayout.addItems([
			new OO.ui.FieldLayout(this.progressBar, { align: "top" }),
			new OO.ui.FieldLayout(progressAndCancelWidget, { align: "top" }),
			new OO.ui.FieldLayout(logFilterButtons, {
				align: "top",
				label: "Filter log entries"
			}),
			new OO.ui.FieldLayout(this.logPanelWidget, { align: "top" })
		]);
		this.progressDialog = new OO.ui.MessageDialog();
		openWindow(this.progressDialog, {
			title: "Bot progress",
			message: fieldsetLayout.$element,
			actions: [{
				action: "close",
				label: "Close",
				flags: ["neutral"]
			}],
			size: "large"
		});
		const originalGetActionProcess = this.progressDialog.getActionProcess.bind(this.progressDialog);
		this.progressDialog.getActionProcess = (action) => {
			if (action === "close") return new OO.ui.Process(() => {
				if (this.isDone || this.isCancelled) this.progressDialog.close();
				else openWindow(new OO.ui.MessageDialog({ size: "medium" }), {
					title: "Confirm exit",
					size: "medium",
					message: "The bot will still run in the background. Are you sure you want to close this window? If you'd like to cancel the bot, click the cancel button or refresh the page instead.",
					actions: [{
						action: "cancel",
						label: "No, return to the bot progress interface",
						flags: ["neutral", "safe"]
					}, {
						action: "accept",
						label: "Yes, close this window and let the bot keep running",
						flags: ["progressive", "primary"]
					}]
				}, (data) => {
					if (data.action === "accept") this.progressDialog.close();
				});
			});
			return originalGetActionProcess(action);
		};
	}
	setProgress(progress) {
		this.progress = progress;
		const progressPercent = Math.min(progress / this.total * 100, 100);
		this.progressBar.setProgress(progressPercent);
		this.progressLabel.setLabel(`Progress: ${progress} / ${this.total}`);
		if (progress >= this.total) this.done();
	}
	makeProgress(progress) {
		this.setProgress(this.progress + progress);
	}
	logEntries = [];
	severityEnabled;
	logText = $("<div></div>");
	scrollToBottom() {
		const $panel = this.logPanelWidget.$element;
		const panelElement = $panel[0];
		if (($panel.scrollTop() ?? 0) + ($panel.innerHeight() ?? 0) >= panelElement.scrollHeight - 100) $panel.scrollTop(panelElement.scrollHeight);
	}
	addLog(severity, text) {
		const entry = new LogEntry(severity, text);
		this.logEntries.push(entry);
		if (this.severityEnabled[severity]) {
			this.logText.append(entry.element);
			this.logLabel.setLabel(this.logText);
			this.scrollToBottom();
		}
	}
	refreshLogs() {
		this.logText.empty();
		this.logEntries.forEach((entry) => {
			if (this.severityEnabled[entry.severity]) this.logText.append(entry.element);
		});
		this.logLabel.setLabel(this.logText);
	}
	hideCancelButton() {
		this.isCancelled = true;
		this.cancelButton.$element.hide();
	}
	done() {
		if (!this.isDone) {
			this.isDone = true;
			this.setProgress(this.total);
			this.hideCancelButton();
		}
	}
};
//#endregion
//#region gadgets/jswikibot/utils/input_dialog.ts
var InputType = /* @__PURE__ */ function(InputType) {
	InputType[InputType["PAGE"] = 0] = "PAGE";
	InputType[InputType["NAMESPACE"] = 1] = "NAMESPACE";
	InputType[InputType["NAMESPACES"] = 2] = "NAMESPACES";
	InputType[InputType["TEXT"] = 3] = "TEXT";
	InputType[InputType["MULTILINE_TEXT"] = 4] = "MULTILINE_TEXT";
	InputType[InputType["SELECT"] = 5] = "SELECT";
	InputType[InputType["NUMBER"] = 6] = "NUMBER";
	InputType[InputType["BOOLEAN"] = 7] = "BOOLEAN";
	InputType[InputType["TIMESTAMP"] = 8] = "TIMESTAMP";
	return InputType;
}({});
var InputDialog = class {
	static setUpWidgets(inputFields, fieldsetOptions) {
		const widgets = {};
		const fieldset = new OO.ui.FieldsetLayout(fieldsetOptions);
		for (const inputField of inputFields) {
			const __ret = this.constructWidget(inputField);
			const widget = __ret.widget;
			const align = __ret.align;
			widgets[inputField.key] = widget;
			const layout = new OO.ui.FieldLayout(widget, {
				label: inputField.label,
				align,
				help: inputField.help
			});
			fieldset.addItems([layout]);
			if (inputField.depends) {
				const depends = Array.isArray(inputField.depends) ? inputField.depends : [inputField.depends];
				const checkDependencies = () => {
					const allMet = depends.every((dep) => {
						return widgets[dep.key].isSelected() !== !!dep.invert;
					});
					layout.toggle(allMet);
				};
				for (const dep of depends) widgets[dep.key].on("change", checkDependencies);
				checkDependencies();
			}
		}
		return {
			widgets,
			fieldset
		};
	}
	static constructWidget(inputField) {
		let align = "top";
		let widget;
		switch (inputField.type) {
			case InputType.BOOLEAN:
				widget = new OO.ui.CheckboxInputWidget({ selected: inputField.defaultValue || false });
				align = "inline";
				break;
			case InputType.PAGE:
				widget = new mw.widgets.TitleInputWidget({
					value: inputField.defaultValue || "",
					suggestions: true,
					required: true
				});
				break;
			case InputType.NAMESPACE:
				widget = new OO.ui.ComboBoxInputWidget({
					value: inputField.defaultValue || "",
					options: getNamespaces().namespaces.map((ns) => ({
						data: ns.name,
						label: ns.name
					})),
					menu: { filterFromInput: true }
				});
				break;
			case InputType.NAMESPACES:
				widget = new OO.ui.MenuTagMultiselectWidget({
					selected: [],
					options: getNamespaces().namespaces.map((ns) => ({
						data: ns.name,
						label: ns.name
					})),
					allowArbitrary: true,
					inputPosition: "inline",
					placeholder: "Select namespaces...",
					menu: { filterFromInput: true }
				});
				break;
			case InputType.MULTILINE_TEXT:
				widget = new OO.ui.MultilineTextInputWidget({
					value: inputField.defaultValue || "",
					rows: inputField.rows || 5
				});
				break;
			case InputType.SELECT: {
				const options = inputField.options;
				if (options.length == 2) {
					widget = new OO.ui.ButtonSelectWidget({ items: options.map((option) => new OO.ui.ButtonOptionWidget(option)) });
					if (inputField.defaultValue) widget.selectItemByData(inputField.defaultValue);
				} else if (options.length > 2) widget = new OO.ui.ComboBoxInputWidget({
					menu: {
						items: options.map((option) => new OO.ui.MenuOptionWidget(option)),
						filterFromInput: true,
						filterMode: "substring"
					},
					autocomplete: true
				});
				else throw new Error();
				break;
			}
			case InputType.TIMESTAMP:
				widget = new mw.widgets.datetime.DateTimeInputWidget({ value: inputField.defaultValue || void 0 });
				break;
			case InputType.NUMBER:
				widget = new OO.ui.NumberInputWidget({
					value: inputField.defaultValue,
					min: inputField.min
				});
				break;
			default: widget = new OO.ui.TextInputWidget({ value: inputField.defaultValue || "" });
		}
		return {
			widget,
			align
		};
	}
	static getInputData(inputFields, widgets) {
		const args = {};
		const validationErrors = {};
		for (const inputField of inputFields) {
			const widget = widgets[inputField.key];
			let rawValue;
			if (widget instanceof OO.ui.CheckboxInputWidget) rawValue = widget.isSelected();
			else if (widget instanceof OO.ui.MenuTagMultiselectWidget) rawValue = widget.getValue().join("|");
			else if (widget instanceof OO.ui.ButtonSelectWidget) rawValue = widget.getData();
			else if (widget instanceof OO.ui.NumberInputWidget) rawValue = widget.getNumericValue();
			else rawValue = widget.getValue();
			if (inputField.validator) {
				const validationResult = inputField.validator(rawValue);
				if (validationResult.ok) rawValue = validationResult.value;
				else validationErrors[inputField.key] = validationResult.error;
			}
			if (rawValue === "" && inputField.optional) continue;
			args[inputField.key] = rawValue;
		}
		if (Object.keys(validationErrors).length > 0) return {
			ok: false,
			error: Object.values(validationErrors).join("\n")
		};
		return {
			ok: true,
			value: args
		};
	}
};
//#endregion
//#region gadgets/jswikibot/page_selector/page_selector.ts
var PageSelector = class {
	static inputs = [];
};
var PageSelectorDialog = class extends OO.ui.ProcessDialog {
	static static = {
		...super.static,
		name: "listerInputDialog",
		title: "Page selection arguments",
		tagName: "div",
		actions: [{
			action: "save",
			label: "Done",
			flags: ["primary", "progressive"]
		}, {
			label: "Cancel",
			flags: ["safe"]
		}]
	};
	fieldset;
	widgets = {};
	selectorClass;
	callback;
	constructor(options, callback) {
		super(options);
		this.callback = callback;
	}
	initialize() {
		super.initialize();
		return this;
	}
	getSetupProcess(data) {
		return super.getSetupProcess(data).next(() => {
			this.selectorClass = data.selectorClass;
			const result = InputDialog.setUpWidgets(data.selectorClass.inputs);
			this.widgets = result.widgets;
			this.fieldset = result.fieldset;
			const panel = new OO.ui.PanelLayout({
				padded: true,
				expanded: true
			});
			panel.$element.append(this.fieldset.$element);
			this.$body.append(panel.$element);
		});
	}
	getActionProcess(action) {
		if (action === "save" && this.selectorClass) {
			const SelectorClass = this.selectorClass;
			const result = InputDialog.getInputData(SelectorClass.inputs, this.widgets);
			if (!result.ok) return new OO.ui.Process(() => {
				simpleAlert("Invalid input", result.error);
			});
			const args = result.value;
			if (isDebugMode()) console.log(args);
			if (SelectorClass.validator) {
				if (!SelectorClass.validator(args)) return new OO.ui.Process(() => {});
			}
			return new OO.ui.Process(() => {
				this.callback(new SelectorClass(args));
				this.close();
			});
		}
		return super.getActionProcess(action);
	}
	getBodyHeight() {
		return 500;
	}
};
//#endregion
//#region gadgets/jswikibot/utils/regex_helper.ts
var RegexHelper = class {
	static createRegexInputGroup(enableKey, flagsKey, defaults = {}) {
		const depends = [{ key: enableKey }];
		depends.push(...defaults.extraDepends || []);
		return [{
			key: enableKey,
			label: defaults.enableLabel || "Use regular expressions",
			type: InputType.BOOLEAN,
			depends: defaults.extraDepends || []
		}, {
			key: flagsKey,
			label: defaults.flagsLabel || "Regex flags",
			type: InputType.TEXT,
			defaultValue: defaults.defaultFlags || "gm",
			depends,
			help: new OO.ui.HtmlSnippet("Regular expression flags (e.g. <i>i</i> for case-insensitive). <a href=\"https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_Expressions#advanced_searching_with_flags\" target=\"_blank\">More info</a>.")
		}];
	}
	static regexValidator(config, text) {
		if (config.useRegex) try {
			new RegExp(text, config.regexFlags);
		} catch (e) {
			simpleAlert("Invalid regex", e.message);
			return false;
		}
		return true;
	}
};
//#endregion
//#region gadgets/jswikibot/page_selector/page_filter.ts
var RequiredPageInfo = /* @__PURE__ */ function(RequiredPageInfo) {
	RequiredPageInfo[RequiredPageInfo["TEXT"] = 0] = "TEXT";
	RequiredPageInfo[RequiredPageInfo["CATEGORY"] = 1] = "CATEGORY";
	return RequiredPageInfo;
}({});
var PageFilter = class extends PageSelector {
	requiredInfo = [];
	static validator;
	constructor(args) {
		super();
		this.args = args;
	}
	async *filter(input) {
		for await (const page of input) if (this.test(page)) yield page;
	}
	matchText(text) {
		let match;
		if (this.args.useRegex) match = new RegExp(this.args.searchText, this.args.regexFlags || "").test(text);
		else match = text.includes(this.args.searchText);
		return match !== this.args.excludeMatches;
	}
};
var NamespaceFilter = class extends PageFilter {
	static description = "Namespace";
	static inputs = [{
		key: "namespace",
		label: "Namespace:",
		type: InputType.NAMESPACES
	}, {
		key: "excludeMatches",
		label: "Exclude this namespace instead",
		type: InputType.BOOLEAN
	}];
	namespaces;
	constructor(args) {
		super(args);
		this.namespaces = unwrap(parseNamespaceString(args.namespace));
	}
	test(page) {
		return this.namespaces.filter((ns) => ns.number === page.ns).length > 0 !== this.args.excludeMatches;
	}
	getDescription() {
		return `${this.args.excludeMatches ? "Exclude" : "Only include"} pages in namespace ${this.namespaces.toString()}`;
	}
};
var TitleFilter = class extends PageFilter {
	static description = "Page title";
	static inputs = [
		{
			key: "searchText",
			label: "Title matching:",
			type: InputType.TEXT
		},
		...RegexHelper.createRegexInputGroup("useRegex", "regexFlags", { defaultFlags: "m" }),
		{
			key: "excludeMatches",
			label: "Exclude pages with matching titles instead",
			type: InputType.BOOLEAN
		}
	];
	static validator = (args) => {
		return RegexHelper.regexValidator(args, args.searchText);
	};
	test(page) {
		return this.matchText(page.title);
	}
	getDescription() {
		return `${this.args.excludeMatches ? "Exclude" : "Only include"} pages with title matching${this.args.useRegex ? " regex" : ""} ${this.args.searchText}`;
	}
};
var ContentFilter = class extends PageFilter {
	static description = "Page wikitext content";
	static inputs = [
		{
			key: "searchText",
			label: "Content matching:",
			type: InputType.TEXT
		},
		...RegexHelper.createRegexInputGroup("useRegex", "regexFlags", { defaultFlags: "m" }),
		{
			key: "excludeMatches",
			label: "Exclude pages with matching content instead: ",
			type: InputType.BOOLEAN
		}
	];
	requiredInfo = [RequiredPageInfo.TEXT];
	static validator = (args) => {
		return RegexHelper.regexValidator(args, args.searchText || "");
	};
	test(page) {
		return this.matchText(page.text);
	}
	getDescription() {
		return `${this.args.excludeMatches ? "Exclude" : "Only include"} pages with wikitext matching${this.args.useRegex ? " regex" : ""} ${this.args.searchText}`;
	}
};
var InCategoryFilter = class extends PageFilter {
	static description = "Page category";
	static inputs = [{
		key: "searchText",
		label: "Is in category:",
		type: InputType.PAGE,
		defaultValue: "Category:"
	}, {
		key: "excludeMatches",
		label: "Exclude pages in this category instead",
		type: InputType.BOOLEAN
	}];
	requiredInfo = [RequiredPageInfo.CATEGORY];
	test(page) {
		return page.categories.includes(this.args.searchText) !== this.args.excludeMatches;
	}
	getDescription() {
		return `${this.args.excludeMatches ? "Exclude" : "Only include"} pages in category ${this.args.searchText}`;
	}
};
var allPageFilters = [
	NamespaceFilter,
	TitleFilter,
	ContentFilter,
	InCategoryFilter
];
//#endregion
//#region gadgets/jswikibot/utils/page_info_fetcher.ts
async function* fetchPagePropBatch(pages, queryParams, processPage, api = API) {
	const batchSize = 50;
	for (let i = 0; i < pages.length; i += batchSize) {
		const titles = pages.slice(i, i + batchSize).map((p) => p.title).join("|");
		const params = {
			...queryParams,
			titles
		};
		const titleMap = new Map(pages.map((p) => [p.title, p]));
		try {
			const response = await api.get(params);
			if (!response.query || !response.query.pages) continue;
			if (response.query.normalized) for (const norm of response.query.normalized) {
				const original = titleMap.get(norm.from);
				if (original) titleMap.set(norm.to, original);
			}
			for (const pageKey in response.query.pages) {
				const apiPage = response.query.pages[pageKey];
				const pageInfo = titleMap.get(apiPage.title);
				if (pageInfo) {
					pageInfo.ns = apiPage.ns;
					processPage(pageInfo, apiPage);
					yield pageInfo;
				}
			}
		} catch (error) {
			console.error("Error in batch fetch:", error);
			throw error;
		}
	}
}
async function* fetchFileUrl(pages, api = API) {
	yield* fetchPagePropBatch(pages, {
		action: "query",
		prop: "imageinfo",
		iiprop: "url"
	}, (pageInfo, apiPage) => {
		if (apiPage.imageinfo && apiPage.imageinfo.length > 0) {
			const info = apiPage.imageinfo[0];
			if (info.url) pageInfo.fileUrl = info.url;
		}
	}, api);
}
async function* fetchPageText(pages, api = API) {
	yield* fetchPagePropBatch(pages, {
		action: "query",
		prop: "revisions",
		rvprop: "content",
		rvslots: "main"
	}, (pageInfo, apiPage) => {
		if (apiPage.revisions && apiPage.revisions.length > 0) {
			const revision = apiPage.revisions[0];
			if (revision.slots?.main) pageInfo.text = revision.slots.main["*"];
		} else pageInfo.text = "";
	}, api);
}
async function fetchPageCategories(pages, api = API) {
	if (pages.length === 0) return;
	const batchSize = 50;
	for (let i = 0; i < pages.length; i += batchSize) {
		const titles = pages.slice(i, i + batchSize).map((p) => p.title).join("|");
		let continueParams = null;
		const titleMap = new Map(pages.map((p) => [p.title, p]));
		do {
			const params = {
				action: "query",
				titles,
				prop: "categories",
				cllimit: "max"
			};
			if (continueParams) Object.assign(params, continueParams);
			try {
				const response = await api.get(params);
				if (!response.query || !response.query.pages) break;
				if (response.query.normalized) for (const norm of response.query.normalized) titleMap.set(norm.to, titleMap.get(norm.from));
				for (const pageKey in response.query.pages) {
					const page = response.query.pages[pageKey];
					const title = page.title;
					const pageInfo = titleMap.get(title);
					pageInfo.ns = page.ns;
					if (!page || !page.categories) continue;
					const newCategories = page.categories.map((cat) => cat.title);
					if (pageInfo.categories.length) pageInfo.categories.push(...newCategories);
					else pageInfo.categories = newCategories;
				}
				continueParams = response.continue || null;
			} catch (error) {
				console.error("Error fetching page categories:", error);
				throw error;
			}
		} while (continueParams !== null);
	}
}
//#endregion
//#region gadgets/jswikibot/page_selector/page_lister.ts
var PageLister = class extends PageSelector {
	static inputs = [];
	constructor(args) {
		super();
		this.args = args;
	}
	api = API;
	/**
	* Convenience method to fetch all results into a single flat array.
	*/
	async fetchAll() {
		const allResults = [];
		for await (const page of this.getNext()) allResults.push(page);
		return allResults;
	}
};
var ApiListQuery = class extends PageLister {
	constructor(listName, prefix, params = {}) {
		super(params);
		this.listName = listName;
		this.prefix = prefix;
	}
	async *getNext() {
		let continueParams = {};
		const requestParams = {
			action: "query",
			list: this.listName,
			[`${this.prefix}limit`]: "max",
			...this.args
		};
		let limit = parseInt(this.args.limit || "");
		do {
			const response = await this.api.get({
				...requestParams,
				...continueParams
			});
			const r = response.query?.[this.listName];
			const arr = Array.isArray(r) ? r : r?.results ?? [];
			for (const page of arr) {
				yield page;
				if (!isNaN(limit)) {
					limit -= 1;
					if (limit <= 0) break;
				}
			}
			continueParams = response.continue || {};
		} while (Object.keys(continueParams).length > 0);
	}
};
var ApiPropQuery = class extends PageLister {
	constructor(prop, prefix, params = {}) {
		super(params);
		this.prop = prop;
		this.prefix = prefix;
		this.params = params;
	}
	async *getNext() {
		const requestParams = {
			action: "query",
			prop: this.prop,
			[`${this.prefix}limit`]: "max",
			...this.args
		};
		let continueParams = {};
		do {
			const response = await this.api.get({
				...requestParams,
				...continueParams
			});
			const pages = response.query?.pages;
			if (!pages) break;
			const results = pages[Object.keys(pages)[0]][this.prop];
			if (Array.isArray(results)) for (const result of results) yield result;
			continueParams = response.continue || {};
		} while (Object.keys(continueParams).length > 0);
	}
};
var CategoryMembersQuery = class extends ApiListQuery {
	static description = "All pages in category";
	static inputs = [{
		key: "cmtitle",
		label: "Category:",
		type: InputType.PAGE,
		defaultValue: "Category:"
	}];
	constructor(args) {
		super("categorymembers", "cm", args);
	}
	getDescription() {
		return `All members of category ${this.args["cmtitle"]}`;
	}
};
var AllPagesQuery = class extends ApiListQuery {
	static description = "All pages in namespace";
	static inputs = [{
		key: "apnamespace",
		label: "Namespace name or number (only one allowed)",
		type: InputType.NAMESPACE,
		defaultValue: "Main",
		validator: (nsString) => {
			return flatMap(getNamespaces().toNamespace(String(nsString)), (ns) => ns.number.toString());
		}
	}];
	constructor(args) {
		super("allpages", "ap", args);
	}
	getDescription() {
		return `All pages in namespace ${getNamespaces().toNamespace(this.args["apnamespace"]).value.toString()}`;
	}
};
var EmbeddedInQuery = class extends ApiListQuery {
	static description = "All pages transcluding page X";
	static inputs = [{
		key: "eititle",
		label: "Transcluded page name: ",
		type: InputType.PAGE,
		defaultValue: "Template:",
		help: "Usually templates are transcluded, though it is also possible to list transcluded pages"
	}];
	constructor(args) {
		super("embeddedin", "ei", args);
	}
	getDescription() {
		return `All pages that transclude ${this.args["eititle"]}`;
	}
};
var BacklinksQuery = class extends ApiListQuery {
	static description = "All pages linking to page X";
	static inputs = [{
		key: "bltitle",
		label: "Linked page name: ",
		type: InputType.PAGE
	}];
	constructor(args) {
		super("backlinks", "bl", args);
	}
	getDescription() {
		return `All pages that link to ${this.args["bltitle"]}`;
	}
};
var QUERY_PAGE_OPTIONS = "Ancientpages, BrokenRedirects, Deadendpages, DisambiguationPageLinks, DisambiguationPages, DoubleRedirects, Fewestrevisions, GadgetUsage, GloballyWantedFiles, ListDuplicatedFiles, Listredirects, Lonelypages, Longpages, MediaStatistics, MostGloballyLinkedFiles, Mostcategories, Mostimages, Mostinterwikis, Mostlinked, Mostlinkedcategories, Mostlinkedtemplates, Mostrevisions, OrphanedTalkPages, Shortpages, SoftRedirectPageLinks, SoftRedirectPages, Uncategorizedcategories, Uncategorizedimages, Uncategorizedpages, Uncategorizedtemplates, Unusedcategories, Unusedimages, Unusedtemplates, Unwatchedpages, Wantedcategories, Wantedfiles, Wantedpages, Wantedtemplates, Withoutinterwiki";
var QueryPageQuery = class extends ApiListQuery {
	static description = "All pages on a Special page";
	static inputs = [{
		key: "qppage",
		label: "Special page name: (case-sensitive)",
		type: InputType.SELECT,
		options: QUERY_PAGE_OPTIONS.split(",").map((p) => p.trim()).map((p) => {
			return {
				data: p,
				label: p
			};
		})
	}, {
		key: "limit",
		label: "Page limit",
		type: InputType.TEXT,
		defaultValue: "Unlimited",
		help: "Maximum number of pages to fetch. Use a non-numeric value for unlimited pages. Must be a positive integer otherwise."
	}];
	constructor(args) {
		super("querypage", "qp", args);
	}
	getDescription() {
		return `All pages listed on Special:${this.args["qppage"]}`;
	}
};
var LOG_EVENT_TYPES = [
	"block",
	"create",
	"delete",
	"import",
	"move",
	"newusers",
	"patrol",
	"protect",
	"rights",
	"upload"
];
var LogEventsQuery = class extends ApiListQuery {
	static description = "Pages in log entries";
	static inputs = [
		{
			key: "letype",
			label: "Log type:",
			type: InputType.SELECT,
			options: LOG_EVENT_TYPES.map((value) => {
				return {
					data: value,
					label: value
				};
			}),
			optional: true,
			help: new OO.ui.HtmlSnippet("Leave empty for all log types. Only the most common log types are listed, but you are free to enter any valid log type. See <a href='/w/api.php?action=help&modules=query%2Blogevents'>API help page</a> for a complete list.")
		},
		{
			key: "leaction",
			label: "Log action:",
			type: InputType.TEXT,
			optional: true,
			help: new OO.ui.HtmlSnippet("Overrides log type with more specific requirements. Leave empty unless you know what you are looking for. For example, delete/delete refers to page deletions in delete log while delete/resotre refers to page undeletions in the same log. See <a href='/w/api.php?action=help&modules=query%2Blogevents'>API help page</a> for a complete list.")
		},
		{
			key: "lestart",
			label: "Before:",
			type: InputType.TIMESTAMP,
			optional: true
		},
		{
			key: "leend",
			label: "After:",
			type: InputType.TIMESTAMP,
			optional: true
		},
		{
			key: "leuser",
			label: "Filter entries to those made by the given user: ",
			type: InputType.TEXT,
			optional: true
		}
	];
	constructor(args) {
		super("logevents", "le", args);
	}
	getDescription() {
		return `Log entries with ${Object.entries(this.args).filter((pair) => pair[1]).map((pair) => `(${pair[0]}, ${pair[1]})`).join(", ")}`;
	}
};
var PageLinksQuery = class extends ApiPropQuery {
	static description = "All links on a page";
	static inputs = [{
		key: "titles",
		label: "Title: ",
		type: InputType.PAGE
	}];
	constructor(args) {
		super("links", "pl", args);
	}
	getDescription() {
		return `All links on ${this.args["titles"]}`;
	}
};
var PageImagesQuery = class extends ApiPropQuery {
	static description = "All files on a page";
	static inputs = [{
		key: "titles",
		label: "Page: ",
		type: InputType.PAGE
	}];
	constructor(args) {
		super("images", "im", args);
	}
	getDescription() {
		return `All files used on ${this.args.titles}`;
	}
};
var FileUsageQuery = class extends ApiPropQuery {
	static description = "All pages using a file";
	static inputs = [{
		key: "titles",
		label: "File: ",
		type: InputType.PAGE,
		defaultValue: "File:"
	}];
	constructor(args) {
		super("fileusage", "fu", args);
	}
	getDescription() {
		return `All pages that use ${this.args["titles"]}`;
	}
};
var allQueryLister = [
	CategoryMembersQuery,
	AllPagesQuery,
	EmbeddedInQuery,
	BacklinksQuery,
	PageLinksQuery,
	FileUsageQuery,
	PageImagesQuery,
	QueryPageQuery,
	LogEventsQuery
];
//#endregion
//#region gadgets/jswikibot/page_selector/run_page_selector.ts
var PageSelectionDialog = class extends OO.ui.ProcessDialog {
	static static = {
		...OO.ui.ProcessDialog.static,
		name: "pageSelectionDialog",
		title: "Page selection criteria",
		tagName: "div",
		actions: [{
			action: "save",
			label: "Done",
			flags: ["primary", "progressive"]
		}, {
			label: "Cancel",
			flags: ["safe"]
		}]
	};
	indexLayout;
	selectionContainer;
	addedItems = [];
	callback;
	constructor(options, callback) {
		super(options);
		this.callback = callback;
	}
	initialize() {
		super.initialize();
		const panel = new OO.ui.PanelLayout({
			padded: true,
			expanded: false
		});
		this.indexLayout = new OO.ui.IndexLayout({ expanded: false });
		const tab1 = new OO.ui.TabPanelLayout("tab1", {
			label: "Page listers",
			expanded: false
		});
		const tab2 = new OO.ui.TabPanelLayout("tab2", {
			label: "Page filters",
			expanded: false
		});
		tab1.$element.append(this.createActionRows(allQueryLister).map((f) => f.$element));
		tab2.$element.append(this.createActionRows(allPageFilters).map((f) => f.$element));
		this.indexLayout.addTabPanels([tab1, tab2], 0);
		this.selectionContainer = new OO.ui.FieldsetLayout({
			label: "Applied page selection rules:",
			classes: ["jswikibot-selected-items-box"]
		});
		const bottomPanel = new OO.ui.PanelLayout({
			padded: false,
			expanded: false,
			framed: false,
			classes: ["bottom-selection-area"]
		});
		bottomPanel.$element.append(this.selectionContainer.$element);
		panel.$element.append(this.indexLayout.$element, $("<hr>"), bottomPanel.$element);
		this.$body.append(panel.$element);
		return this;
	}
	/**
	* Helper to create the row with Label and Add button
	*/
	createActionRows(items) {
		return items.map((item) => {
			const button = new OO.ui.ButtonWidget({
				label: "Add",
				flags: ["progressive"]
			});
			button.on("click", () => this.addItem(item));
			return new OO.ui.ActionFieldLayout(new OO.ui.Widget({ content: [new OO.ui.LabelWidget({ label: item.description })] }), button, { align: "top" });
		});
	}
	promptUserInputForLister(item) {
		return new Promise((resolve) => {
			openWindow(new PageSelectorDialog({ size: "medium" }, (pageGenerator) => {
				resolve(pageGenerator);
			}), { selectorClass: item });
		});
	}
	/**
	* Adds an item to the bottom list
	*/
	async addItem(item) {
		const instance = await this.promptUserInputForLister(item);
		this.addedItems.push(instance);
		const itemWidget = new OO.ui.LabelWidget({
			label: instance.getDescription(),
			classes: ["selected-item-row"]
		});
		const removeButton = new OO.ui.ButtonWidget({
			label: "Remove",
			flags: ["destructive"],
			framed: false
		});
		const field = new OO.ui.ActionFieldLayout(itemWidget, removeButton, { align: "inline" });
		removeButton.on("click", () => {
			const index = this.addedItems.indexOf(instance);
			if (index > -1) this.addedItems.splice(index, 1);
			this.selectionContainer.removeItems([field]);
			this.updateSize();
		});
		this.selectionContainer.addItems([field]);
		this.updateSize();
	}
	getActionProcess(action) {
		if (action === "save") return new OO.ui.Process(() => {
			const state = { cancelled: false };
			this.showProcessingPopup(state);
			getPageListFromSelectionCriteria(this.addedItems, state).then((pages) => {
				if (state.cancelled) return;
				this.closeProcessingPopup();
				mw.notify(`Page selector done. ${pages.length} pages found.`);
				this.callback(pages);
				this.close();
			}, (error) => {
				this.closeProcessingPopup();
				console.error("Error fetching pages:", error);
				simpleAlert("Error", `Failed to fetch pages due to ${error}`);
			});
		});
		return super.getActionProcess(action);
	}
	processingDialog = null;
	showProcessingPopup(state) {
		this.processingDialog = new OO.ui.MessageDialog();
		this.processingDialog.getActionProcess = (action) => {
			if (action === "cancel") return new OO.ui.Process(() => {
				state.cancelled = true;
				this.closeProcessingPopup();
			});
			return super.getActionProcess(action);
		};
		openWindow(this.processingDialog, {
			title: "Fetching Pages",
			message: "Please wait while we fetch the page list based on your criteria...",
			actions: [{
				action: "cancel",
				label: "Cancel",
				flags: ["safe"]
			}]
		});
	}
	closeProcessingPopup() {
		if (this.processingDialog) this.processingDialog.close();
	}
	getBodyHeight() {
		return 800;
	}
};
async function fetchRequiredInfo(pages, info, state, api = API) {
	if (pages.length === 0) return;
	const needsText = info.includes(RequiredPageInfo.TEXT);
	const needsCategories = info.includes(RequiredPageInfo.CATEGORY);
	if (needsText) {
		for await (const _ of fetchPageText(pages, api)) if (state.cancelled) return;
	}
	if (needsCategories) await fetchPageCategories(pages, api);
}
async function getPageListFromSelectionCriteria(selectedItems, state) {
	const debugMode = isDebugMode();
	if (debugMode) {
		console.log("Selected page generators:");
		console.log(selectedItems);
	}
	const listers = [];
	const filters = [];
	for (const item of selectedItems) if (item instanceof PageLister) listers.push(item);
	else filters.push(item);
	if (debugMode) {
		console.log("Listers and filters:");
		console.log(listers);
		console.log(filters);
	}
	let allPages = [];
	for (const lister of listers) for await (const prop of lister.getNext()) {
		if (state.cancelled) return allPages;
		const info = new PageInfo(prop);
		allPages.push(info);
		cachePageInfo(info);
	}
	if (debugMode) {
		console.log("All listers applied");
		console.log(allPages);
	}
	const simpleFilters = filters.filter((f) => f.requiredInfo.length === 0);
	for (const filter of simpleFilters) allPages = allPages.filter((page) => filter.test(page));
	if (debugMode) {
		console.log("Simple filters applied");
		console.log(allPages);
	}
	const complexFilters = filters.filter((f) => f.requiredInfo.length !== 0);
	const requiredInfo = /* @__PURE__ */ new Set();
	for (const filter of complexFilters) for (const info of filter.requiredInfo) requiredInfo.add(info);
	if (debugMode) console.log("Fetching required info: ", requiredInfo);
	await fetchRequiredInfo(allPages, Array.from(requiredInfo.keys()), state);
	if (state.cancelled) return allPages;
	if (debugMode) {
		console.log("Required info fetched");
		console.log(allPages);
	}
	for (const filter of complexFilters) allPages = allPages.filter((page) => filter.test(page));
	return allPages;
}
function runPageSelector() {
	return new Promise((resolve) => {
		openWindow(new PageSelectionDialog({
			size: "medium",
			classes: ["jswikibot-page-selector"]
		}, async (pages) => {
			resolve(pages);
		}));
	});
}
//#endregion
//#region gadgets/jswikibot/models/user_right.ts
function getUserRights() {
	return state.cache.userRights;
}
var userRightsPromise = null;
async function fetchUserRights() {
	const rights = getUserRights();
	if (rights && rights.length > 0) return rights;
	if (userRightsPromise !== null) return userRightsPromise;
	userRightsPromise = (async () => {
		const rights = await mw.user.getRights();
		state.cache.userRights = rights;
		return rights;
	})();
	return userRightsPromise;
}
//#endregion
//#region gadgets/jswikibot/bots/bot.ts
var Bot = class Bot {
	progressWindow;
	cancelled = false;
	botState = {};
	name;
	description;
	batchSize;
	constructor(options) {
		this.options = options;
		this.name = options.name;
		this.description = options.description;
		if (typeof options.batchSize === "number") this.batchSize = () => options.batchSize;
		else if (options.batchSize === void 0) this.batchSize = () => 1;
		else this.batchSize = options.batchSize;
		if (!options.preprocessPages) options.preprocessPages = this.preprocessPages;
	}
	static cancelledMessage = "Bot cancelled.";
	checkCancelled() {
		if (this.cancelled) {
			this.progressWindow.addLog(LogSeverity.WARNING, Bot.cancelledMessage);
			this.progressWindow.hideCancelButton();
			return true;
		}
		return false;
	}
	async *preprocessPages(pages) {
		for (const page of pages) yield page;
	}
	cancel() {
		this.cancelled = true;
	}
	fetchConfig() {
		return openBotConfigDialog(this.options.createConfigDialog(), this.processPages.bind(this));
	}
	async processPages(config) {
		this.cancelled = false;
		this.botState = {};
		const pages = config.pages.map((title) => new PageInfo({ title }));
		if (pages.length === 0) simpleAlert("Error", "No valid pages found. Please check page titles and try again.");
		let batch = [];
		this.progressWindow = new ProgressWindow(pages.length, this.cancel.bind(this));
		const processBatch = async () => {
			const results = await this.options.processBatch(batch, config, this.botState, this);
			let entries;
			if (Array.isArray(results)) entries = results;
			else entries = [results];
			for (const entry of entries) {
				this.progressWindow.addLog(entry.severity, entry.message);
				this.progressWindow.makeProgress(batch.length);
			}
			batch = [];
		};
		for await (const page of this.options.preprocessPages(pages, config)) {
			if (this.checkCancelled()) return;
			batch.push(page);
			if (batch.length >= this.batchSize(config)) await processBatch.call(this);
		}
		if (batch.length > 0) await processBatch.call(this);
		this.progressWindow.done();
	}
	isAvailable() {
		const requiredRights = this.options.rights;
		const allRights = state.cache.allUserRights;
		if (requiredRights && requiredRights.length > 0) {
			const userRights = getUserRights();
			return requiredRights.every((right) => !allRights.has(right) || userRights?.includes(right));
		}
		return true;
	}
};
async function openBotConfigDialog(dialog, callback) {
	return new Promise((resolve) => {
		dialog.callback = callback;
		openWindow(dialog, {}, async () => {
			resolve();
		});
	});
}
var BotConfigurationDialog = class extends OO.ui.ProcessDialog {
	static static = {
		...OO.ui.ProcessDialog.static,
		name: "configurebot",
		title: "Configure bot",
		tagName: "div",
		actions: [
			{
				action: "next",
				label: "Next",
				flags: ["progressive", "primary"],
				modes: ["step1"]
			},
			{
				action: "back",
				label: "Back",
				modes: ["step2"]
			},
			{
				action: "done",
				label: "Start bot",
				flags: ["progressive", "primary"],
				modes: ["step2"]
			},
			{
				label: "Cancel",
				flags: ["safe"],
				modes: ["step1", "step2"]
			}
		]
	};
	stack;
	step1;
	step2;
	step2Widgets;
	pages = [];
	callback;
	constructor(config) {
		super(config.dialogConfig);
		this.config = config;
	}
	manualPagesInput;
	initialize() {
		super.initialize();
		this.setupStep1();
		this.setupStep2();
		this.stack = new OO.ui.StackLayout({ items: [this.step1, this.step2] });
		this.$body.append(this.stack.$element);
		return this;
	}
	setupStep1() {
		const pageSelectorButton = new OO.ui.ButtonWidget({
			label: "Use Page Selector Tool",
			flags: ["progressive"]
		});
		this.manualPagesInput = new OO.ui.MultilineTextInputWidget({
			placeholder: "Enter page titles, one per line",
			rows: 10
		});
		pageSelectorButton.on("click", () => {
			runPageSelector().then((pageInfoList) => {
				const pageTitles = pageInfoList.map((page) => page.title).join("\n");
				const existingText = this.manualPagesInput.getValue().trim();
				const newText = existingText ? existingText + "\n" + pageTitles : pageTitles;
				this.manualPagesInput.setValue(newText);
			});
		});
		this.step1 = new OO.ui.PanelLayout({
			padded: true,
			expanded: false
		});
		const step1Fieldset = new OO.ui.FieldsetLayout({
			label: "Select pages to work on",
			items: [new OO.ui.FieldLayout(pageSelectorButton, {
				label: "Page selector tool",
				align: "top"
			}), new OO.ui.FieldLayout(this.manualPagesInput, {
				label: "Page titles",
				align: "top",
				help: "Click the button above to select pages using tool, or enter page titles manually. You can edit the list after using the tool."
			})]
		});
		this.step1.$element.append(step1Fieldset.$element);
	}
	setupStep2() {
		const res = InputDialog.setUpWidgets(this.config.inputOptions, { label: "Additional bot settings" });
		this.step2Widgets = res.widgets;
		this.step2 = new OO.ui.PanelLayout({
			padded: true,
			expanded: false
		});
		this.step2.$element.append(res.fieldset.$element);
	}
	getSecondStepData() {
		return InputDialog.getInputData(this.config.inputOptions, this.step2Widgets);
	}
	validate(data) {
		if (this.config.validator) return this.config.validator(data);
		return true;
	}
	getActionProcess(action) {
		if (action === "next") return new OO.ui.Process(() => {
			const pages = this.manualPagesInput.getValue().trim().split("\n").filter((page) => page.trim());
			if (pages.length === 0) {
				simpleAlert("Error", "At least 1 page need to be specified.");
				return;
			}
			this.pages = Array.from(new Set(pages));
			this.stack.setItem(this.step2);
			this.actions.setMode("step2");
		});
		if (action === "back") return new OO.ui.Process(() => {
			this.stack.setItem(this.step1);
			this.actions.setMode("step1");
		});
		if (action === "done") return new OO.ui.Process(() => {
			const result = this.getSecondStepData();
			if (!result.ok) {
				simpleAlert("Invalid input", result.error);
				return;
			}
			const data = {
				...result.value,
				pages: this.pages
			};
			if (!this.validate(data)) return;
			if (this.callback) this.callback(data);
		});
		return super.getActionProcess(action);
	}
	getSetupProcess(data) {
		return super.getSetupProcess(data).next(() => {
			this.stack.setItem(this.step1);
			this.actions.setMode("step1");
		});
	}
	getBodyHeight() {
		return 400;
	}
};
//#endregion
//#region gadgets/jswikibot/utils/diff.ts
function formatDiff(diffResult) {
	return $(`<table class="jswikibot-diff" data-mw="interface" />`).append(diffResult && "<colgroup><col class=\"diff-marker\"><col class=\"diff-content\"><col class=\"diff-marker\"><col class=\"diff-content\"></colgroup>", $("<tbody />").append(diffResult || "<tr><td colspan=\"2\" class=\"diff-notice\"><div class=\"mw-diff-empty\">(no difference)</div></td></tr>"));
}
var compare = async (original, modified, title) => {
	return formatDiff((await API.post({
		action: "compare",
		fromslots: "main",
		"fromtext-main": original,
		toslots: "main",
		"totext-main": modified,
		prop: "diff",
		fromtitle: title
	})).compare["*"]);
};
var DiffDialog = class extends OO.ui.ProcessDialog {
	static static = {
		...OO.ui.ProcessDialog.static,
		name: "diffDialog",
		title: "Text Replacement Preview",
		tagName: "div",
		actions: []
	};
	cancelButton;
	acceptAllButton;
	acceptButton;
	skipButton;
	diffContent;
	constructor(pageTitle, originalText, newText) {
		super({ size: "large" });
		this.pageTitle = pageTitle;
		this.originalText = originalText;
		this.newText = newText;
	}
	initializeButtons() {
		this.cancelButton = new OO.ui.ButtonWidget({
			label: "Cancel",
			flags: ["destructive"]
		});
		this.acceptAllButton = new OO.ui.ButtonWidget({
			label: "Accept All",
			flags: ["progressive"]
		});
		this.acceptButton = new OO.ui.ButtonWidget({
			label: "Accept",
			flags: ["primary", "progressive"]
		});
		this.skipButton = new OO.ui.ButtonWidget({ label: "Skip" });
		const $footerContainer = $("<div>").css({
			"display": "flex",
			"justify-content": "space-between",
			"padding": "12px"
		}).append(this.cancelButton.$element, $("<div>").append(this.skipButton.$element, this.acceptButton.$element, this.acceptAllButton.$element));
		this.$foot.append($footerContainer);
		this.cancelButton.on("click", () => this.executeAction("cancel"));
		this.skipButton.on("click", () => this.executeAction("skip"));
		this.acceptButton.on("click", () => this.executeAction("accept"));
		this.acceptAllButton.on("click", () => this.executeAction("acceptAll"));
	}
	initialize() {
		super.initialize();
		this.diffContent = new OO.ui.PanelLayout({
			padded: true,
			expanded: false
		});
		const titleElement = $("<h3>").css("margin-top", "0").text(`Page: ${this.pageTitle}`);
		const loadingElement = $("<div>").text("Loading diff...");
		const diffContainer = $("<div>").css({
			"max-height": "400px",
			"overflow": "auto"
		}).append(loadingElement);
		this.diffContent.$element.append(titleElement, diffContainer);
		this.$body.append(this.diffContent.$element);
		this.initializeButtons();
		compare(this.originalText, this.newText, this.pageTitle).then((diffElement) => {
			loadingElement.replaceWith(diffElement);
		});
		return this;
	}
	getBodyHeight() {
		return 500;
	}
	getActionProcess(action) {
		if ([
			"accept",
			"acceptAll",
			"skip",
			"cancel"
		].includes(action)) return new OO.ui.Process(() => {
			this.close({ action });
		});
		return super.getActionProcess(action);
	}
};
function showDiffDialog(pageTitle, originalText, newText) {
	return new Promise((resolve) => {
		openWindow(new DiffDialog(pageTitle, originalText, newText), {}, (data) => resolve(data));
	});
}
//#endregion
//#region gadgets/jswikibot/bots/replace_text.ts
var replaceTextBot = new Bot({
	name: "ReplaceTextBot",
	description: "Find and replace text",
	preprocessPages: (pages) => fetchPageText(pages),
	createConfigDialog: () => new BotConfigurationDialog({
		inputOptions: [
			{
				key: "originalText",
				label: "Find",
				type: InputType.MULTILINE_TEXT,
				placeholder: "Text to find",
				rows: 5,
				help: "When using regular expressions, input the regex itself instead of /regex/. Use \\n for newlines."
			},
			{
				key: "replacementText",
				label: "Replace with",
				type: InputType.MULTILINE_TEXT,
				placeholder: "Replace with",
				rows: 5,
				help: "Use the keyboard's enter key for newlines instead of \\n."
			},
			...RegexHelper.createRegexInputGroup("useRegex", "regexFlags"),
			{
				key: "summary",
				label: "Edit summary",
				type: InputType.TEXT,
				defaultValue: "$bot: replace $original with $new"
			}
		],
		validator: (config) => {
			if (config.originalText === "") {
				simpleAlert("Invalid input", "Text to be replaced must be non-empty");
				return false;
			}
			return RegexHelper.regexValidator(config, config.originalText);
		}
	}),
	processBatch: async (pages, config, state, bot) => {
		const page = pages[0];
		let text;
		if (config.useRegex) text = page.text.replace(new RegExp(config.originalText, config.regexFlags), config.replacementText);
		else text = page.text.split(config.originalText).join(config.replacementText);
		if (page.text !== text) {
			if (!state.acceptAll) switch ((await showDiffDialog(page.title, page.text, text)).action) {
				case "accept": break;
				case "acceptAll":
					state.acceptAll = true;
					break;
				case "skip": return {
					severity: LogSeverity.INFO,
					message: `Skipped ${page.title}`
				};
				case "cancel":
					bot.cancel();
					return {
						severity: LogSeverity.WARNING,
						message: "Text replacement cancelled by user"
					};
			}
			const summary = formatSummary(config.summary, {
				original: config.originalText,
				new: config.replacementText
			});
			if (await savePage(page.title, text, summary, true)) return {
				severity: LogSeverity.SUCCESS,
				message: `${page.title} saved`
			};
			else return {
				severity: LogSeverity.ERROR,
				message: `Failed to save ${page.title}`
			};
		} else return {
			severity: LogSeverity.INFO,
			message: `Page ${page.title} not changed`
		};
	},
	rights: ["edit"]
});
//#endregion
//#region gadgets/jswikibot/bots/purge.ts
var purgeBot = new Bot({
	name: "PurgeBot",
	description: "Purge pages or perform null edits",
	batchSize: (config) => config.nullEdit ? 1 : 50,
	preprocessPages: (pages, config) => config.nullEdit ? fetchPageText(pages) : pages,
	processBatch: async (pages, options) => {
		if (options.nullEdit) {
			const page = pages[0];
			if (await savePage(page.title, page.text, "$bot: null edit", true, true)) return {
				severity: LogSeverity.SUCCESS,
				message: `${page.title} null edited`
			};
			else return {
				severity: LogSeverity.ERROR,
				message: `Failed to null edit ${page.title}`
			};
		} else {
			const titles = pages.map((page) => page.title);
			if (await purge(titles)) return {
				severity: LogSeverity.SUCCESS,
				message: `Purged ${titles.length} page(s)`
			};
			else return {
				severity: LogSeverity.ERROR,
				message: `Failed to purge batch: ${titles.join(", ")}`
			};
		}
	},
	createConfigDialog: () => new BotConfigurationDialog({ inputOptions: [{
		key: "nullEdit",
		label: "Use null edit instead of purge",
		type: InputType.BOOLEAN,
		help: "A null edit saves the page without making changes, which also refreshes the cache. Regular purge uses the purge API and is significantly faster."
	}] }),
	rights: ["purge"]
});
//#endregion
//#region gadgets/jswikibot/bots/delete.ts
var deleteBot = new Bot({
	name: "DeleteBot",
	description: "Delete/undelete pages in bulk",
	batchSize: 1,
	processBatch: async (pages, options) => {
		const page = pages[0];
		let result;
		if (options.delete) {
			result = await deletePage(page.title, options.reason, options.deleteTalk);
			if (result.ok) return {
				severity: LogSeverity.SUCCESS,
				message: `${page.title} deleted`
			};
			else return {
				severity: LogSeverity.ERROR,
				message: `Failed to delete ${page.title} due to ${result.error}`
			};
		} else {
			result = await undeletePage(page.title, options.reason, options.deleteTalk);
			if (result.ok) return {
				severity: LogSeverity.SUCCESS,
				message: `${page.title} restored`
			};
			else return {
				severity: LogSeverity.ERROR,
				message: `Failed to undelete ${page.title} due to ${result.error}`
			};
		}
	},
	createConfigDialog: () => new BotConfigurationDialog({ inputOptions: [
		{
			key: "delete",
			label: "Delete page (uncheck to undelete)",
			type: InputType.BOOLEAN,
			defaultValue: true
		},
		{
			key: "reason",
			label: "Deletion/undeletion Reason",
			type: InputType.TEXT,
			defaultValue: "$bot: delete pages in bulk",
			placeholder: "Reason for deletion"
		},
		{
			key: "deleteTalk",
			label: "Delete/undelete talk page",
			type: InputType.BOOLEAN
		}
	] }),
	rights: ["delete"]
});
//#endregion
//#region gadgets/jswikibot/bots/add_text.ts
var addTextBot = new Bot({
	name: "AddTextBot",
	description: "Add text to the top or bottom of pages",
	preprocessPages: (pages) => fetchPageText(pages),
	processBatch: async (pages, options) => {
		const page = pages[0];
		let newText = page.text || "";
		if (options.skipExisting && page.text.includes(newText)) return {
			severity: LogSeverity.WARNING,
			message: `Skipped ${page.title} because it already contains the text to be added.`
		};
		if (options.position === "top") newText = options.textToAdd + newText.trimStart();
		else newText = newText.trimEnd() + options.textToAdd;
		const summary = formatSummary(options.summary, { "text": options.textToAdd });
		if (await savePage(page.title, newText, summary, true)) return {
			severity: LogSeverity.SUCCESS,
			message: `${page.title} saved`
		};
		return {
			severity: LogSeverity.ERROR,
			message: `Failed to save ${page.title}`
		};
	},
	createConfigDialog: () => new BotConfigurationDialog({
		inputOptions: [
			{
				key: "textToAdd",
				label: "Text to add",
				type: InputType.MULTILINE_TEXT,
				placeholder: "Enter the text to add to the pages...",
				rows: 5
			},
			{
				key: "position",
				label: "Position",
				type: InputType.SELECT,
				options: [{
					data: "top",
					label: "Top"
				}, {
					data: "bottom",
					label: "Bottom"
				}],
				defaultValue: "bottom"
			},
			{
				key: "skipExisting",
				label: "Skip page if the text already exists",
				type: InputType.BOOLEAN
			},
			{
				key: "summary",
				label: "Edit summary",
				type: InputType.TEXT,
				defaultValue: "$bot: batch add $text"
			}
		],
		validator: (data) => {
			if (data.textToAdd.trim() === "") {
				simpleAlert("Invalid input", "Text to add is empty. Use the dedicated bot if you want to perform null edits.");
				return false;
			}
			return true;
		}
	}),
	rights: ["edit"]
});
//#endregion
//#region gadgets/jswikibot/bots/download.ts
async function downloadFile(url, title) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
			return false;
		}
		const blob = await response.blob();
		const objectUrl = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = objectUrl;
		a.download = title;
		a.style.display = "none";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(objectUrl);
		return true;
	} catch (err) {
		console.error("Download failed", err);
		return false;
	}
}
var downloadBot = new Bot({
	name: "DownloadBot",
	description: "Download files from the wiki in bulk",
	batchSize: 1,
	preprocessPages: (pages) => {
		return fetchFileUrl(pages);
	},
	processBatch: async (pages, options) => {
		const page = pages[0];
		const url = page.fileUrl;
		if (!url || url === "") return {
			severity: LogSeverity.ERROR,
			message: `Page ${page.title} does not have a valid url. Are you sure it's a valid file page?`
		};
		await API.throttle("download", options.downloadThrottle);
		if (await downloadFile(url, page.titleWithoutNs())) return {
			severity: LogSeverity.SUCCESS,
			message: `${page.title} downloaded`
		};
		else return {
			severity: LogSeverity.ERROR,
			message: `Failed to download ${page.title}`
		};
	},
	createConfigDialog: () => new BotConfigurationDialog({
		inputOptions: [{
			key: "downloadThrottle",
			label: "Download throttle (seconds)",
			type: InputType.NUMBER,
			defaultValue: 1,
			min: 0,
			help: "Time to wait between downloads to avoid overloading the server"
		}],
		validator: (data) => {
			if (data.downloadThrottle < 0) {
				simpleAlert("Invalid input", "Download throttle must be non-negative");
				return false;
			}
			return true;
		}
	})
});
//#endregion
//#region gadgets/jswikibot/bots/move.ts
var moveBot = new Bot({
	name: "MoveBot",
	description: "Move pages in bulk",
	createConfigDialog: () => new BotConfigurationDialog({
		inputOptions: [
			{
				key: "manualInput",
				label: "Manually input page list instead of specifying replacement strings",
				type: InputType.BOOLEAN
			},
			{
				key: "originalText",
				label: "Find in title",
				type: InputType.TEXT,
				placeholder: "Text to find in page title",
				depends: {
					key: "manualInput",
					invert: true
				},
				help: "When using regular expressions, input the regex itself instead of /regex/."
			},
			{
				key: "replacementText",
				label: "Replace with",
				type: InputType.TEXT,
				placeholder: "Replacement text",
				depends: {
					key: "manualInput",
					invert: true
				}
			},
			...RegexHelper.createRegexInputGroup("useRegex", "regexFlags", { extraDepends: [{
				key: "manualInput",
				invert: true
			}] }),
			{
				key: "targetTitles",
				label: "Target titles",
				type: InputType.MULTILINE_TEXT,
				placeholder: "Enter target page titles, one per line (same order as source pages)",
				rows: 10,
				depends: { key: "manualInput" },
				help: "Enter one target title per line in the same order as the source pages selected in step 1."
			},
			{
				key: "moveTalk",
				label: "Move talk page",
				type: InputType.BOOLEAN,
				defaultValue: false
			},
			{
				key: "moveSubpages",
				label: "Move subpages",
				type: InputType.BOOLEAN,
				defaultValue: true
			},
			{
				key: "noRedirect",
				label: `Do not create a redirect (requires suppressredirect user right), which you ${getUserRights()?.includes("suppressredirect") ? "do" : "do not"} have.`,
				type: InputType.BOOLEAN,
				help: "The required user right is usually only available to wiki admins. You can check it manually with Special:ListGroupRights."
			},
			{
				key: "summary",
				label: "Summary",
				type: InputType.TEXT,
				defaultValue: "$bot: bulk move page from [[$from]] to [[$to]]"
			}
		],
		validator: (config) => {
			if (config.manualInput) {
				const targetLines = config.targetTitles.split("\n").filter((t) => t.trim());
				if (targetLines.length !== config.pages.length) {
					simpleAlert("Invalid input", `Number of target titles (${targetLines.length}) must match number of source pages (${config.pages.length})`);
					return false;
				}
				config.pageMapping = {};
				for (let i = 0; i < config.pages.length; i++) config.pageMapping[config.pages[i]] = targetLines[i];
				return true;
			} else {
				if (config.originalText === "") {
					simpleAlert("Invalid input", "Text to find in page title must be non-empty");
					return false;
				}
				return RegexHelper.regexValidator(config, config.originalText);
			}
		}
	}),
	processBatch: async (pages, config) => {
		const page = pages[0];
		let targetTitle;
		if (config.manualInput) targetTitle = config.pageMapping[page.title];
		else if (config.useRegex) targetTitle = page.title.replace(new RegExp(config.originalText, config.regexFlags), config.replacementText);
		else targetTitle = page.title.split(config.originalText).join(config.replacementText);
		if (page.title === targetTitle) return {
			severity: LogSeverity.WARNING,
			message: `Skipped ${page.title} (target title is the same)`
		};
		const moveOptions = {
			reason: formatSummary(config.summary, {
				from: page.title,
				to: targetTitle
			}),
			moveTalk: config.moveTalk,
			moveSubpages: config.moveSubpages,
			noRedirect: config.noRedirect,
			bot: true
		};
		const moveResult = await movePage(page.title, targetTitle, moveOptions);
		if (moveResult.ok) return {
			severity: LogSeverity.SUCCESS,
			message: `${page.title} moved to ${targetTitle}`
		};
		else return {
			severity: LogSeverity.ERROR,
			message: `Failed to move ${page.title} to ${targetTitle}: ${moveResult.error}`
		};
	}
});
//#endregion
//#region gadgets/jswikibot/bot_selector.ts
var BotSelectorDialog = class extends OO.ui.ProcessDialog {
	static static = {
		...OO.ui.ProcessDialog.static,
		name: "botselector",
		title: "JSWikiBot - Select a Bot",
		tagName: "div",
		actions: [{
			action: "close",
			label: "Close",
			flags: ["safe"]
		}, {
			action: "settings",
			label: "Settings",
			flags: ["progressive"]
		}]
	};
	botList = [];
	mainPanel;
	constructor(botList) {
		super({});
		this.botList = botList;
	}
	initialize() {
		super.initialize();
		this.setupMainPanel();
		this.$body.append(this.mainPanel.$element);
		return this;
	}
	setupMainPanel() {
		this.mainPanel = new OO.ui.PanelLayout({
			padded: true,
			expanded: false
		});
		const fieldsetLayout = new OO.ui.FieldsetLayout({ label: "Available Bots" });
		this.botList.forEach((bot) => {
			const isAvailable = bot.isAvailable();
			const runButton = new OO.ui.ButtonWidget({
				label: "Run",
				flags: ["progressive", "primary"],
				disabled: !isAvailable
			});
			if (isAvailable) runButton.on("click", () => {
				this.close({
					action: "run",
					bot
				});
			});
			const botLayout = new OO.ui.FieldLayout(runButton, {
				label: bot.description,
				align: "inline",
				help: bot.isAvailable() ? void 0 : `Requires permission(s): ${bot.options.rights?.join(", ")}`
			});
			fieldsetLayout.addItems([botLayout]);
		});
		this.mainPanel.$element.append(fieldsetLayout.$element);
	}
	getActionProcess(action) {
		if (action === "settings") return new OO.ui.Process(() => {
			openWindow(new SettingsDialog());
		});
		if (action === "close") return new OO.ui.Process(() => {
			this.close({ action: "close" });
		});
		return super.getActionProcess(action);
	}
};
function runBotSelector() {
	openWindow(new BotSelectorDialog([
		replaceTextBot,
		purgeBot,
		deleteBot,
		addTextBot,
		downloadBot,
		moveBot
	]), {}, async (result) => {
		if (result && result.action === "run" && result.bot) {
			clearCachedPageInfo();
			return result.bot.fetchConfig();
		}
	});
}
//#endregion
//#region gadgets/jswikibot/models/user_group.ts
function getAllUserGroups() {
	return state.cache.userGroups;
}
function getAllUserRights(userGroups) {
	return new Set(userGroups.flatMap((group) => group.rights));
}
var userGroupPromise = void 0;
async function fetchAllUserGroups() {
	if (state.cache.userGroups !== void 0) return getAllUserGroups();
	if (userGroupPromise !== void 0) return userGroupPromise;
	userGroupPromise = (async () => {
		const groups = (await getSiteInfo()).query.usergroups;
		state.cache.userGroups = groups;
		state.cache.allUserRights = getAllUserRights(groups);
		return groups;
	})();
	return userGroupPromise;
}
//#endregion
//#region gadgets/jswikibot/index.ts
(function() {
	async function prep() {
		loadConfig();
		return Promise.all([
			getAllNamespacesAsync(),
			fetchUserRights(),
			fetchAllUserGroups()
		]);
	}
	async function start() {
		await prep();
		runBotSelector();
	}
	const specialPageName = "jswikibot";
	if (mw.config.get("wgNamespaceNumber") === -1 && mw.config.get("wgTitle").toLowerCase() === specialPageName) start();
	const id = "toolbar-jswikibot";
	mw.util.addPortletLink("p-tb", mw.util.getUrl(`Special:${specialPageName}`), "jswikibot", id);
	document.getElementById(id)?.addEventListener("click", async (e) => {
		e.preventDefault();
		await start();
	});
})();
//#endregion
