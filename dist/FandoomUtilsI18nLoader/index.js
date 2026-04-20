//#region gadgets/FandoomUtilsI18nLoader/code.js
/**
* Library for enabling multiple-language support in Fandom Dev Wiki scripts.
* This is a fork of i18n-js (https://dev.fandom.com/wiki/I18n-js) with significant changes, 
* those primarily being:
*  - A less-trusted vendor script should not be responsible for the parsing and embedding 
*    of i18n messages to minimize the risk of XSS. Therefore this module has been changed so 
*    that it is ONLY responsible for language lookup and the loading & caching of messages 
*    from the respective i18n.json files. This module is NOT responsible for the actual 
*    parsing of the messages from string to DOM.
*  - Parsing of messages is instead handled by `mediawiki.message` for each respective gadget
*    that calls upon FandoomUtilsI18nLoader.
*  - Messages are loaded by making a GET request to the latest version of the gadgets CDN.
*    In Fandom's version of I18n-js, this GET request is made to a wiki page on the Fandom
*    Developers wiki instead.
*/
(function() {
	"use strict";
	window.dev = window.dev || {};
	window.dev.i18nLoader = window.dev.i18nLoader || {};
	if (window.dev.i18nLoader.loadMessages !== void 0) return;
	/**
	* Cache of mw config variables.
	*
	* @var {object} conf Cache of mw config variables:
	* - {boolean} debug
	* - {string} wgContentLanguage Site language
	*     Be careful to use this:
	*     - In languages with variants, this will block the language conversion;
	*       see <https://www.mediawiki.org/wiki/Writing_systems>.
	*     - In multilingual wikis like "Feed The Beast", this will block both the
	*       multilingual content providing and language conversion.
	* - {string} wgPageContentLanguage Page Language or Content Modal Language
	*     or Site Language or 'en'
	*     Be careful to use this:
	*     - In Special: pages, this will be the user language.
	*       This behavior will be kept.
	*     - In Module: pages, this will be the content modal language 'en'.
	*       This behavior will be overridden below.
	* - {string} wgPageContentModel Page content modal. This is used to detect
	*     non-wikitext pages/namespaces
	* - {string} wgUserLanguage
	* - {(string|null)} wgUserVariant The language variant user currently using,
	*     'null' when the page lannguage doesn't have language variants.
	*/
	var conf = mw.config.get([
		"debug",
		"wgContentLanguage",
		"wgPageContentLanguage",
		"wgPageContentModel",
		"wgUserLanguage",
		"wgUserVariant",
		"wgServer"
	]), now = Date.now(), oneDay = 1e3 * 60 * 60 * 24, cachePrefix = "i18n-cache-", warnedAboutFallbackLoop = false, cache = {}, deprecatedCodes = {
		"als": "gsw",
		"bat-smg": "sgs",
		"be-x-old": "be-tarask",
		"fiu-vro": "vro",
		"roa-rup": "rup",
		"zh-classical": "lzh",
		"zh-min-nan": "nan",
		"zh-yue": "yue"
	}, nonStandardCodes = {
		"cbk-zam": "cbk",
		"crh-ro": "crh-Latn-RO",
		"de-formal": "de-x-formal",
		"eml": "egl",
		"en-rtl": "en-x-rtl",
		"es-formal": "es-x-formal",
		"hu-formal": "hu-x-formal",
		"kk-cn": "kk-Arab-CN",
		"kk-tr": "kk-Latn-TR",
		"map-bms": "jv-x-bms",
		"mo": "ro-Cyrl-MD",
		"nrm": "nrf",
		"nl-informal": "nl-x-informal",
		"roa-tara": "nap-x-tara",
		"simple": "en-simple",
		"sr-ec": "sr-Cyrl",
		"sr-el": "sr-Latn",
		"zh-cn": "zh-Hans-CN",
		"zh-sg": "zh-Hans-SG",
		"zh-my": "zh-Hans-MY",
		"zh-tw": "zh-Hant-TW",
		"zh-hk": "zh-Hant-HK",
		"zh-mo": "zh-Hant-MO"
	}, fallbacks = {
		"aae": ["it"],
		"ab": ["ru"],
		"abs": ["id"],
		"ace": ["id"],
		"acm": ["ar"],
		"ady": ["ady-cyrl"],
		"aeb": ["aeb-arab"],
		"aeb-arab": ["ar"],
		"aln": ["sq"],
		"alt": ["ru"],
		"ami": [
			"zh-tw",
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"an": ["es"],
		"anp": ["hi"],
		"apc": ["ar"],
		"arn": ["es"],
		"arq": ["ar"],
		"ary": ["ar"],
		"arz": ["ar"],
		"ast": ["es"],
		"atj": ["fr"],
		"av": ["ru"],
		"avk": [
			"fr",
			"es",
			"ru"
		],
		"awa": ["hi"],
		"ay": ["es"],
		"azb": ["fa"],
		"ba": ["ru"],
		"ban": ["id"],
		"ban-bali": ["ban"],
		"bar": ["de"],
		"bbc": ["bbc-latn"],
		"bbc-latn": ["id"],
		"bcc": ["fa"],
		"bci": ["fr"],
		"bdr": ["ms"],
		"be-tarask": ["be"],
		"bew": ["id"],
		"bgn": ["fa"],
		"bh": ["bho"],
		"bjn": ["id"],
		"blk": ["my"],
		"bm": ["fr"],
		"bpy": ["bn"],
		"bqi": ["fa"],
		"btm": ["id"],
		"bug": ["id"],
		"bxr": ["ru"],
		"ca": ["oc"],
		"cbk-zam": ["es"],
		"cdo": [
			"nan",
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"ce": ["ru"],
		"co": ["it"],
		"cpx": [
			"cpx-hant",
			"cpx-hans",
			"cpx-latn",
			"cdo",
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"cpx-hans": [
			"cpx",
			"cpx-hant",
			"cpx-latn",
			"cdo",
			"zh-hans",
			"zh",
			"zh-hant"
		],
		"cpx-hant": [
			"cpx",
			"cpx-hans",
			"cpx-latn",
			"cdo",
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"crh": ["crh-latn"],
		"crh-cyrl": ["ru"],
		"crh-ro": ["ro"],
		"cs": ["sk"],
		"csb": ["pl"],
		"cv": ["ru"],
		"de-at": ["de"],
		"de-ch": ["de"],
		"de-formal": ["de"],
		"dsb": ["hsb", "de"],
		"dtp": ["ms"],
		"dty": ["ne"],
		"egl": ["it"],
		"eml": ["it"],
		"es-formal": ["es"],
		"ext": ["es"],
		"fit": ["fi"],
		"fon": ["fr"],
		"frc": ["fr"],
		"frp": ["fr"],
		"frr": ["de"],
		"fur": ["it"],
		"gag": ["tr"],
		"gan": [
			"gan-hant",
			"gan-hans",
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"gan-hans": [
			"gan",
			"gan-hant",
			"zh-hans",
			"zh",
			"zh-hant"
		],
		"gan-hant": [
			"gan",
			"gan-hans",
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"gcf": ["fr"],
		"gcr": ["fr"],
		"gl": ["pt"],
		"gld": ["ru"],
		"glk": ["fa"],
		"gn": ["es"],
		"gom": ["gom-deva", "gom-latn"],
		"gom-deva": ["gom-latn"],
		"gor": ["id"],
		"gsw": ["de"],
		"guc": ["es"],
		"hak": [
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"hif": ["hif-latn"],
		"hrx": ["de"],
		"hsb": ["dsb", "de"],
		"hsn": [
			"zh-cn",
			"zh-hans",
			"zh",
			"zh-hant"
		],
		"ht": ["fr"],
		"hu-formal": ["hu"],
		"hyw": ["hy"],
		"ii": [
			"zh-cn",
			"zh-hans",
			"zh",
			"zh-hant"
		],
		"ike-cans": ["iu"],
		"ike-latn": ["iu"],
		"inh": ["ru"],
		"io": ["eo"],
		"iu": ["ike-cans"],
		"jut": ["da"],
		"jv": ["id"],
		"kaa": ["kk-latn", "kk-cyrl"],
		"kab": ["fr"],
		"kbd": ["kbd-cyrl"],
		"kbp": ["fr"],
		"kea": ["pt"],
		"kge": ["id"],
		"khw": ["ur"],
		"kiu": ["tr"],
		"kjh": ["ru"],
		"kjp": ["my"],
		"kk": ["kk-cyrl"],
		"kk-arab": ["kk", "kk-cyrl"],
		"kk-cn": [
			"kk-arab",
			"kk",
			"kk-cyrl"
		],
		"kk-cyrl": ["kk"],
		"kk-kz": ["kk-cyrl", "kk"],
		"kk-latn": ["kk", "kk-cyrl"],
		"kk-tr": [
			"kk-latn",
			"kk",
			"kk-cyrl"
		],
		"kl": ["da"],
		"ko-kp": ["ko"],
		"koi": ["ru"],
		"krc": ["ru"],
		"krl": ["fi"],
		"ks": ["ks-arab"],
		"ksh": ["de"],
		"ksw": ["my"],
		"ku": ["ku-latn"],
		"ku-arab": ["ku", "ckb"],
		"ku-latn": ["ku"],
		"kum": ["ru"],
		"kv": ["ru"],
		"lad": ["es"],
		"lb": ["de"],
		"lbe": ["ru"],
		"lez": ["ru", "az"],
		"li": ["nl"],
		"lij": ["it"],
		"liv": ["et"],
		"lki": ["fa"],
		"lld": [
			"it",
			"rm",
			"fur"
		],
		"lmo": [
			"pms",
			"eml",
			"lij",
			"vec",
			"it"
		],
		"ln": ["fr"],
		"lrc": ["fa"],
		"ltg": ["lv"],
		"luz": ["fa"],
		"lzh": [
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"lzz": ["tr"],
		"mad": ["id"],
		"mag": ["hi"],
		"mai": ["hi"],
		"map-bms": ["jv", "id"],
		"mdf": ["myv", "ru"],
		"mg": ["fr"],
		"mhr": ["mrj", "ru"],
		"min": ["id"],
		"mnw": ["my"],
		"mo": ["ro"],
		"mrj": ["mhr", "ru"],
		"ms-arab": ["ms"],
		"mui": ["id"],
		"mwl": ["pt"],
		"myv": ["mdf", "ru"],
		"mzn": ["fa"],
		"nah": ["es"],
		"nan": [
			"nan-latn-pehoeji",
			"nan-latn-tailo",
			"nan-hant",
			"cdo",
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"nan-hant": [
			"nan",
			"nan-latn-pehoeji",
			"nan-latn-tailo",
			"cdo",
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"nap": ["it"],
		"nb": ["no", "nn"],
		"nds": ["de"],
		"nds-nl": ["nl"],
		"nia": ["id"],
		"nl-informal": ["nl"],
		"nn": ["no", "nb"],
		"no": ["nb"],
		"nrm": ["nrf", "fr"],
		"nyo": [
			"ttj",
			"nyn",
			"lg",
			"sw"
		],
		"oc": ["ca", "fr"],
		"olo": ["fi"],
		"os": ["ru"],
		"pcd": ["fr"],
		"pdc": ["de"],
		"pdt": ["de"],
		"pfl": ["de"],
		"pms": ["it"],
		"pnt": ["el"],
		"pt": ["pt-br"],
		"pt-br": ["pt"],
		"pwn": [
			"zh-tw",
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"qu": ["qug", "es"],
		"qug": ["qu", "es"],
		"rgn": ["it"],
		"rm": ["de"],
		"rmy": ["ro"],
		"roa-tara": ["it"],
		"rsk": ["sr-cyrl", "sr-ec"],
		"rue": ["uk", "ru"],
		"rup": ["ro"],
		"ruq": ["ruq-latn", "ro"],
		"ruq-cyrl": ["mk"],
		"ruq-latn": ["ro"],
		"rut": ["ru"],
		"sa": ["hi"],
		"sah": ["ru"],
		"scn": ["it"],
		"sdc": ["it"],
		"sdh": ["ckb", "fa"],
		"se": ["nb", "fi"],
		"se-fi": [
			"se",
			"fi",
			"sv"
		],
		"se-no": [
			"se",
			"nb",
			"nn"
		],
		"se-se": ["se", "sv"],
		"ses": ["fr"],
		"sg": ["fr"],
		"sgs": ["lt"],
		"sh": [
			"sh-latn",
			"sh-cyrl",
			"bs",
			"sr-latn",
			"sr-el",
			"hr"
		],
		"sh-cyrl": [
			"sr-cyrl",
			"sr-ec",
			"sh",
			"sh-latn"
		],
		"sh-latn": [
			"sh",
			"sh-cyrl",
			"bs",
			"sr-latn",
			"sr-el",
			"hr"
		],
		"shi": ["shi-latn", "fr"],
		"shy": ["shy-latn"],
		"shy-latn": ["fr"],
		"sjd": ["ru"],
		"sk": ["cs"],
		"skr": ["skr-arab"],
		"skr-arab": ["skr"],
		"sli": ["de"],
		"sma": ["sv", "nb"],
		"smn": ["fi"],
		"sr": [
			"sr-cyrl",
			"sr-ec",
			"sr-latn",
			"sr-el"
		],
		"sr-cyrl": ["sr-ec", "sr"],
		"sr-ec": ["sr-cyrl", "sr"],
		"sr-el": ["sr-latn", "sr"],
		"sr-latn": ["sr-el", "sr"],
		"srn": ["nl"],
		"sro": ["it"],
		"stq": ["de"],
		"sty": ["ru"],
		"su": ["id"],
		"szl": ["pl"],
		"szy": [
			"zh-tw",
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"tay": [
			"zh-tw",
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"tcy": ["kn"],
		"tet": ["pt"],
		"tg": ["tg-cyrl"],
		"tg-cyrl": ["tg"],
		"tg-latn": ["tg"],
		"trv": [
			"zh-tw",
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"tt": ["tt-cyrl", "ru"],
		"ttj": [
			"nyo",
			"nyn",
			"lg",
			"sw"
		],
		"tt-cyrl": ["ru"],
		"ty": ["fr"],
		"tyv": ["ru"],
		"udm": ["ru"],
		"ug": ["ug-arab"],
		"vec": ["it"],
		"vep": ["et"],
		"vls": ["nl"],
		"vmf": ["de"],
		"vmw": ["pt"],
		"vot": ["fi"],
		"vro": ["et"],
		"wa": ["fr"],
		"wls": ["fr"],
		"wo": ["fr"],
		"wuu": [
			"wuu-hans",
			"wuu-hant",
			"zh-hans",
			"zh",
			"zh-hant"
		],
		"wuu-hans": [
			"wuu",
			"wuu-hant",
			"zh-hans",
			"zh",
			"zh-hant"
		],
		"wuu-hant": [
			"wuu",
			"wuu-hans",
			"zh-hant",
			"zh",
			"zh-hans"
		],
		"xal": ["ru"],
		"xmf": ["ka"],
		"yi": ["he"],
		"yue": ["yue-hant", "yue-hans"],
		"yue-hans": ["yue", "yue-hant"],
		"yue-hant": ["yue", "yue-hans"],
		"za": [
			"zh-hans",
			"zh",
			"zh-hant"
		],
		"zea": ["nl"],
		"zh": [
			"zh-hans",
			"zh-hant",
			"zh-cn",
			"zh-tw",
			"zh-hk"
		],
		"zh-cn": [
			"zh-hans",
			"zh",
			"zh-hant"
		],
		"zh-hans": [
			"zh-cn",
			"zh",
			"zh-hant"
		],
		"zh-hant": [
			"zh-tw",
			"zh-hk",
			"zh",
			"zh-hans"
		],
		"zh-hk": [
			"zh-hant",
			"zh-tw",
			"zh",
			"zh-hans"
		],
		"zh-mo": [
			"zh-hk",
			"zh-hant",
			"zh-tw",
			"zh",
			"zh-hans"
		],
		"zh-my": [
			"zh-sg",
			"zh-hans",
			"zh-cn",
			"zh",
			"zh-hant"
		],
		"zh-sg": [
			"zh-hans",
			"zh-cn",
			"zh",
			"zh-hant"
		],
		"zh-tw": [
			"zh-hant",
			"zh-hk",
			"zh",
			"zh-hans"
		]
	};
	/**
	* Override the if wgPageContentModel is not wikitext.
	* This is to fix the behavior in non-wikitext pages like Scribunto Lua
	* module pages
	*
	* - {string} conf.wgPageContentModel The content modal of the current page.
	* - {string} conf.wgPageContentLanguage The page language.
	* - {string} conf.wgContentLanguage The site language.
	*/
	if (conf.wgPageContentModel && conf.wgPageContentModel !== "wikitext") conf.wgPageContentLanguage = conf.wgContentLanguage;
	/**
	* Get the normalised IETF/BCP 47 language tag.
	* 
	* mediawiki.language.bcp47 doesn't handle deprecated language codes, and
	* some non-standard language codes are missed from LanguageCode.php, so
	* this function is added to override the behavior.
	*
	* @param {string} lang The language code to convert.
	* @return {string} The language code complying with BCP 47 standards.
	*
	* @see https://gerrit.wikimedia.org/r/c/mediawiki/core/+/376506/
	* @see /resources/src/mediawiki.language/mediawiki.language.js in MediaWiki core
	* @see /includes/language/LanguageCode.php in MediaWiki core
	*/
	function bcp47(lang) {
		if (nonStandardCodes[lang]) return nonStandardCodes[lang];
		if (deprecatedCodes[lang]) return bcp47(deprecatedCodes[lang]);
		/**
		* @var {string[]} formatted
		* @var {boolean} isFirstSegment Whether is the first segment
		* @var {boolean} isPrivate Whether the code of the segment is private use
		* @var {string[]} segments The segments of language code
		*/
		var formatted, isFirstSegment = true, isPrivate = false;
		formatted = lang.split("-").map(function(segment) {
			/**
			* @var {string} newSegment The converted segment of language code
			*/
			var newSegment;
			if (isPrivate) newSegment = segment.toLowerCase();
			else if (segment.length === 2 && !isFirstSegment) newSegment = segment.toUpperCase();
			else if (segment.length === 4 && !isFirstSegment) newSegment = segment.charAt(0).toUpperCase() + segment.substring(1).toLowerCase();
			else newSegment = segment.toLowerCase();
			isPrivate = segment.toLowerCase() === "x";
			isFirstSegment = false;
			return newSegment;
		});
		return formatted.join("-");
	}
	/**
	* Log a warning message to the browser console if the language fallback chain is
	* about to start a loop. Only logs once to prevent flooding the browser console.
	*
	* @param {string} lang Language in use when loop was found.
	* @param {string[]} fallbackChain Array of languages involved in the loop.
	*/
	function warnOnFallbackLoop(lang, fallbackChain) {
		if (warnedAboutFallbackLoop) return;
		warnedAboutFallbackLoop = true;
		fallbackChain.push(lang);
		console.error("[FandoomUtilsI18nLoader] Duplicated fallback language found. Debug: \nLanguage fallback chain:", fallbackChain.join(", "));
	}
	/**
	* Get a translation of a message from the messages object in the requested
	* language.
	*
	* - Missing `messages`, `msgName`, `lang` parameters: `return false;` .
	* - Didn't find message in the current language: Try the fallback list.
	* - Didn't find a fallback list for current language: Try to find `en` message.
	* - Didn't find message in the current fallback language: Try to find message
	*     in the next fallback language.
	* - Found duplicated language code in the fallback list:
	*     `warnOnFallbackLoop(lang, fallbackChain)`.
	* - Didn't find more language code in the fallback list: Try to find `en` message.
	* - Didn't find message in `en`: `return false;`.
	*
	* @param {object} messages The message object to look translations up in.
	* @param {string} msgName The name of the message to get.
	* @param {string} lang The language to get the message in.
	* @param {string[]} fallbackChain Array of languages that have already been checked.
	*     Used to detect if the fallback chain is looping.
	* @return {(string|boolean)} The requested translation or `false` if no message could be found.
	*/
	function getMsg(messages, msgName, lang, fallbackChain) {
		if (!lang || !messages || !msgName) return false;
		if (deprecatedCodes[lang]) return getMsg(messages, msgName, deprecatedCodes[lang], fallbackChain);
		if (messages[lang] && messages[lang][msgName]) return messages[lang][msgName];
		if (!fallbackChain) fallbackChain = [];
		/**
		* Try to find fallback messages by using the fallback chain.
		* We need to check whether the lang is defined in the fallback list before
		* trying to go through them.
		*
		* @var {number} i The current index in fallbacks[lang]
		*/
		for (var i = 0; fallbacks[lang] && i < fallbacks[lang].length; i += 1) {
			/**
			* @var {string} fallbackLang
			*/
			var fallbackLang = fallbacks[lang][i];
			if (messages[fallbackLang] && messages[fallbackLang][msgName]) return messages[fallbackLang][msgName];
			if (fallbackChain.indexOf(fallbackLang) !== -1) {
				/**
				* Duplicated language code in fallback list.
				* Try to find next fallback language from list.
				*/
				warnOnFallbackLoop(fallbackLang, fallbackChain);
				continue;
			}
			fallbackChain.push(fallbackLang);
		}
		if (messages.en && messages.en[msgName]) return messages.en[msgName];
		return false;
	}
	/**
	* Create a new i18n loader object.
	*
	* @param {object} messages The message object to look translations up in.
	* @param {string} name The name of the script the messages are for.
	* @param {object} options Options set by the loading script.
	* @return {object}
	*/
	function createI18nLoader(messages, name, options) {
		return {
			_defaultLang: options.language,
			_tempLang: null,
			_msgMaps: {},
			_rawMessageJson: messages,
			_setDefaultLang: function(lang) {
				this._defaultLang = lang;
			},
			_setTempLang: function(lang) {
				this._tempLang = lang;
			},
			getMessages: function() {
				var lang = this._tempLang || this._defaultLang;
				if (!lang) {
					console.error("[FandoomUtilsI18nLoader] Language is not set!");
					return new mw.Map();
				}
				function fetch(lang) {
					if (this._tempLang) this._tempLang = null;
					return this._msgMaps[lang];
				}
				if (this._msgMaps[lang]) return fetch.call(this, lang);
				var messagesToLoad = messages[lang];
				if (messagesToLoad === void 0) if (messages.en) {
					console.warn("[FandoomUtilsI18nLoader] Unable to find messages for the script '" + name + "' and the language '" + lang + "'. Switching to English as fallback.");
					messagesToLoad = messages.en;
				} else {
					console.error("[FandoomUtilsI18nLoader] No messages to load for " + name);
					messagesToLoad = {};
				}
				if (window.dev && window.dev.i18n && window.dev.i18n.overrides && window.dev.i18n.overrides[name]) Object.entries(window.dev.i18n.overrides[name]).forEach(function(kv) {
					messagesToLoad[kv[0]] = kv[1];
				});
				/** 
				* Mechanism to save messages to the internal cache. 
				*/
				var m = new mw.Map();
				m.set(messagesToLoad);
				this._msgMaps[lang] = m;
				delete messages[lang];
				return fetch.call(this, lang);
			},
			useLang: function() {
				console.warn("[FandoomUtilsI18nLoader] “useLang()” is no longer supported by I18n-js (used in “" + name + "”) - using user language.");
				this.useUserLang();
			},
			inLang: function(lang) {
				if (!options.cacheAll) {
					console.warn("[FandoomUtilsI18nLoader] “inLang()” is not supported without configuring `options.cacheAll` (used in “" + name + "”) - using user language.");
					return this;
				}
				this._setTempLang(lang);
				return this;
			},
			useContentLang: function() {
				this._setDefaultLang(conf.wgContentLanguage);
			},
			inContentLang: function() {
				this._setTempLang(conf.wgContentLanguage);
				return this;
			},
			usePageLang: function() {
				this._setDefaultLang(conf.wgPageContentLanguage);
			},
			inPageLang: function() {
				this._setTempLang(conf.wgPageContentLanguage);
				return this;
			},
			usePageViewLang: function() {
				this._setDefaultLang(conf.wgUserVariant || conf.wgPageContentLanguage || conf.wgContentLanguage);
			},
			inPageViewLang: function() {
				this._setTempLang(conf.wgUserVariant || conf.wgPageContentLanguage || conf.wgContentLanguage);
				return this;
			},
			useUserLang: function() {
				this._setDefaultLang(options.language);
			},
			inUserLang: function() {
				this._setTempLang(options.language);
				return this;
			}
		};
	}
	/**
	* Preprocess each message's fallback chain for the user and content languages.
	* This allows us to save only those messages needed to the cache.
	*
	* @param {string} name The name of the script the messages are for.
	* @param {object} messages The message object to look translations up in.
	* @param {object} options Options set by the loading script.
	*/
	function optimiseMessages(name, messages, options) {
		var existingLangs = cache[name] && cache[name]._rawMessageJson._isOptimised, langs = [options.language], msgKeys = Object.keys(messages.en || {}), optimised = {};
		if (!msgKeys.length) return messages;
		/**
		* @var addMsgsForLanguage
		*/
		var addMsgsForLanguage = function(lang) {
			if (optimised[lang]) return;
			optimised[lang] = {};
			msgKeys.forEach(function(msgName) {
				/**
				* @var msg
				*/
				var msg = getMsg(messages, msgName, lang);
				if (msg !== false) optimised[lang][msgName] = msg;
			});
		};
		if (langs.indexOf(conf.wgContentLanguage) === -1) langs.push(conf.wgContentLanguage);
		/**
		* If cache exists and is optimised, preserve existing languages.
		* This allows an optimised cache even when using different
		* language wikis on same domain (i.e. sharing same cache).
		*/
		if (existingLangs) existingLangs.forEach(function(lang) {
			if (langs.indexOf(lang) === -1) langs.push(lang);
		});
		langs.forEach(addMsgsForLanguage);
		/**
		* `cacheAll` is an array of message names for which translations
		* should not be optimised - save all translations of these messages
		*/
		if (Array.isArray(options.cacheAll)) {
			msgKeys = options.cacheAll;
			Object.keys(messages).forEach(addMsgsForLanguage);
		}
		optimised._isOptimised = langs;
		return optimised;
	}
	/**
	* Check that the cache for a script exists and, if optimised, contains the
	* necessary languages.
	*
	* @param {string} name The name of the script to check for.
	* @param {object} options Options set by the loading script.
	* @return {boolean} Whether the cache should be used.
	*/
	function cacheIsSuitable(name, options) {
		var messages = cache[name] && cache[name]._rawMessageJson;
		if (!messages) return false;
		/**
		* Optimised messages missing user or content language.
		* We'll need to load from server in this case.
		*/
		if (messages._isOptimised && !(messages[options.language] && messages[conf.wgContentLanguage])) return false;
		return true;
	}
	/**
	* Remove out-of-date entries in the i18n cache (those older than two days).
	*
	* This can never be perfect: it will only work on wikis that are visited.
	*/
	function removeOldCacheEntries() {
		var isCacheKey = new RegExp("^(" + cachePrefix + ".+)-content$"), storageKeys = [];
		try {
			storageKeys = Object.keys(localStorage);
		} catch (e) {}
		storageKeys.filter(function(key) {
			return isCacheKey.test(key);
		}).forEach(function(key) {
			var keyPrefix = key.match(isCacheKey)[1], cacheTimestamp;
			try {
				cacheTimestamp = Number(localStorage.getItem(keyPrefix + "-timestamp"));
			} catch (e) {}
			if (now - cacheTimestamp < oneDay * 2) return;
			try {
				localStorage.removeItem(keyPrefix + "-content");
				localStorage.removeItem(keyPrefix + "-timestamp");
				localStorage.removeItem(keyPrefix + "-version");
			} catch (e) {}
		});
	}
	/**
	* Save messages string to local storage for caching.
	*
	* @param {string} name The name of the script the messages are for.
	* @param {object} json The JSON object.
	* @param {number} cacheVersion Cache version requested by the loading script.
	*/
	function saveToCache(name, json, cacheVersion) {
		var keyPrefix = cachePrefix + name;
		if (Object.keys(json).length === 0) return;
		try {
			localStorage.setItem(keyPrefix + "-content", JSON.stringify(json));
			localStorage.setItem(keyPrefix + "-timestamp", now);
			localStorage.setItem(keyPrefix + "-version", cacheVersion || 0);
		} catch (e) {}
	}
	/**
	* Parse JSON string loaded from page and create an i18n object.
	*
	* @param {string} name The name of the script the messages are for.
	* @param {object} json The JSON object.
	* @param {object} options Options set by the loading script.
	* @return {object} The resulting i18n object.
	*/
	function parseMessagesToObject(name, json, options) {
		var obj;
		if (options.useCache && !options.loadedFromCache && options.cacheAll !== true) json = optimiseMessages(name, json, options);
		obj = createI18nLoader(json, name, options);
		cache[name] = obj;
		if (!options.loadedFromCache) saveToCache(name, json, options.cacheVersion);
		return obj;
	}
	/**
	* Load messages string from local storage cache and add to cache object.
	*
	* @param {string} name The name of the script the messages are for.
	* @param {object} options Options set by the loading script.
	*/
	function loadFromCache(name, options) {
		var keyPrefix = cachePrefix + name, cacheContent, cacheVersion;
		try {
			cacheContent = localStorage.getItem(keyPrefix + "-content");
			cacheVersion = Number(localStorage.getItem(keyPrefix + "-version"));
		} catch (e) {}
		if (cacheContent && cacheVersion >= options.cacheVersion) {
			try {
				cacheContent = JSON.parse(cacheContent);
			} catch {
				console.warn("[FandoomUtilsI18nLoader] Malformed JSON found in cache for " + keyPrefix);
				return;
			}
			options.loadedFromCache = true;
			parseMessagesToObject(name, cacheContent, options);
		}
	}
	/**
	* Load messages stored as JSON on a page.
	*
	* @param {string} name The page title under which the the i18n.json file is a subpage of. 
	*     This will be used to get messages from 
	*     https://some-cdn-domain/<gadget-name>/i18n.json
	*
	* @param {object} options Options set by the loading script:
	* - {string} entrypoint
	*     No validation check is done against this supplied API entrypoint.
	*     Depending on your wiki's Content Security Policy, requests to some wiki domains may be blocked.
	* - {(array|boolean)} cacheAll: Either an array of message names for which
	*     translations should not be optimised, or `true` to disable the optimised cache.
	* - {number} cacheVersion: Minimum cache version requested by the loading script.
	* - {string} language: Set a default language for the script to use, instead of wgUserLanguage.
	* - noCache: Never load i18n from cache (not recommended for general use).
	*
	* @return {object} A jQuery.Deferred instance. Unlike Fandoom's version of i18n-js, this 
	* jQuery.Deferred object instance will reject on event of failure during fetching of the messages.  
	* 
	*/
	function loadMessages(name, options) {
		/**
		* @var {object} deferred
		* @var {string} entrypoint
		* @var {object} params
		* @var {object} api
		*/
		var deferred = $.Deferred(), entrypoint = "https://cdn.jsdelivr.net/gh/ccxtwf/MirahezeDevScripts@1776669844/dist";
		options = options || {};
		options.entrypoint = options.entrypoint || entrypoint;
		options.cacheVersion = Number(options.cacheVersion) || 0;
		options.language = options.language || conf.wgUserLanguage;
		options.useCache = (options.noCache || conf.debug) !== true;
		if (options.useCache) {
			loadFromCache(name, options);
			if (cacheIsSuitable(name, options)) return deferred.resolve(cache[name]);
		}
		options.loadedFromCache = false;
		$.getJSON(entrypoint + "/" + name + "/i18n.json").done(function(json) {
			deferred.resolve(parseMessagesToObject(name, json, options));
		}).fail(function(xhr, err) {
			console.error("Failed to fetch contents from " + options.entrypoint + " for gadget " + name, xhr, err);
			deferred.reject();
		});
		return deferred;
	}
	/**
	* Maintain backwards compatibility with Fandom's version of i18n-js:
	* Proxy i18n-js's `escape()` method with mw.Message's native `escaped()`
	*/
	if (mw.Message.prototype.escape === void 0) mw.Message.prototype.escape = mw.Message.prototype.escaped;
	var loader = {
		loadMessages,
		_bcp47: bcp47,
		_saveToCache: saveToCache,
		_getMsg: getMsg,
		_fallbacks: fallbacks,
		_cache: cache
	};
	if (typeof mwModule !== "undefined" && mwModule.exports) mwModule.exports = loader;
	window.dev.i18nLoader = $.extend(window.dev.i18nLoader, loader);
	mw.hook("dev.fandoom.i18n").fire(window.dev.i18nLoader);
	removeOldCacheEntries();
})();
//#endregion
