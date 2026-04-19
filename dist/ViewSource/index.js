//#region gadgets/ViewSource/definitions.js
var parserFunctions = {
	"#expr": "Help:Extension:ParserFunctions#.23expr",
	"#if": "Help:Extension:ParserFunctions#.23if",
	"#ifeq": "Help:Extension:ParserFunctions#.23ifeq",
	"#iferror": "Help:Extension:ParserFunctions#.23iferror",
	"#ifexpr": "Help:Extension:ParserFunctions#.23ifexpr",
	"#ifexist": "Help:Extension:ParserFunctions#.23ifexist",
	"#rel2abs": "Help:Extension:ParserFunctions#.23rel2abs",
	"#switch": "Help:Extension:ParserFunctions#.23switch",
	"#time": "Help:Extension:ParserFunctions#.23time",
	"#timel": "Help:Extension:ParserFunctions#.23timel",
	"#titleparts": "Help:Extension:ParserFunctions#.23titleparts",
	"subst": "Help:Substitution",
	"safesubst": "Help:Substitution",
	"#len": "Extension:StringFunctions#.23len:",
	"#pos": "Extension:StringFunctions#.23pos:",
	"#rpos": "Extension:StringFunctions#.23rpos:",
	"#sub": "Extension:StringFunctions#.23sub:",
	"#pad": "Extension:StringFunctions#.23pad:",
	"#replace": "Extension:StringFunctions#.23replace:",
	"#explode": "Extension:StringFunctions#.23explode:",
	"#urlencode": "Extension:StringFunctions#.23urlencode:_and_.23urldecode:",
	"#urldecode": "Extension:StringFunctions#.23urlencode:_and_.23urldecode:",
	"#invoke": "Extension:Scribunto#Usage",
	"#lst": "Extension:Labeled_Section_Transclusion#How_it_works",
	"#lsth": "Extension:Labeled_Section_Transclusion#How_it_works",
	"#lstx": "Extension:Labeled_Section_Transclusion#How_it_works",
	"#var": "Extension:Variables#.23var",
	"#var_final": "Extension:Variables#.23var_final",
	"#vardefine": "Extension:Variables#.23vardefine",
	"#vardefineecho": "Extension:Variables#.23vardefineecho",
	"#varexists": "Extension:Variables#.varexists",
	"#dpl": "Extension:DynamicPageList_(third-party)",
	"#ev": "Extension:EmbedVideo_(fork)",
	"#evl": "Extension:EmbedVideo_(fork)",
	"#evt": "Extension:EmbedVideo_(fork)",
	"#evu": "Extension:EmbedVideo_(fork)",
	"#dateformat": "Help:Magic_words#Formatting",
	"#formatdate": "Help:Magic_words#Formatting",
	"lc": "Help:Magic_words#Formatting",
	"lcfirst": "Help:Magic_words#Formatting",
	"uc": "Help:Magic_words#Formatting",
	"ucfirst": "Help:Magic_words#Formatting",
	"#language": "Help:Magic_words#Miscellaneous",
	"#special": "Help:Magic_words#Miscellaneous",
	"#tag": "Help:Magic_words#Miscellaneous",
	"ns": "Help:Magic_words#Namespaces",
	"PAGESINCAT": "Help:Magic_words#Statistics",
	"PAGESINCATEGORY": "Help:Magic_words#Statistics",
	"DEFAULTSORT": "Help:Magic_words#Technical_metadata",
	"DISPLAYTITLE": "Help:Magic_words#Technical_metadata",
	"int": "Help:Magic_words#Transclusion_modifiers"
};
var parserTags = {
	aoaudio: "https://www.mediawiki.org/wiki/Extension:YouTube",
	aovideo: "https://www.mediawiki.org/wiki/Extension:YouTube",
	archiveorg: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	bandcamp: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	bilibili: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	categorytree: "https://www.mediawiki.org/wiki/Extension:CategoryTree",
	ccc: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	ce: "https://www.mediawiki.org/wiki/Math",
	charinsert: "https://www.mediawiki.org/wiki/Extension:CharInsert",
	chem: "https://www.mediawiki.org/wiki/Math",
	choose: "https://www.mediawiki.org/wiki/Extension:RandomSelection",
	comments: "https://www.mediawiki.org/wiki/Extension:Comments",
	dailymotion: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	dpl: "https://www.mediawiki.org/wiki/Extension:DynamicPageList3",
	dynamicpagelist: "https://www.mediawiki.org/wiki/Extension:DynamicPageList3",
	embedvideo: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	evlplayer: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	externalvideo: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	gallery: "https://www.mediawiki.org/wiki/Help:Images#Rendering_a_gallery_of_images",
	gforms: "https://www.mediawiki.org/wiki/Extension:GoogleForms",
	googleforms: "https://www.mediawiki.org/wiki/Extension:GoogleForms",
	hiero: "https://www.mediawiki.org/wiki/Extension:WikiHiero",
	imagemap: "https://www.mediawiki.org/wiki/Extension:ImageMap",
	includeonly: "https://www.mediawiki.org/wiki/Help:Templates#Control_template_inclusion",
	infobox: "https://github.com/Universal-Omega/PortableInfobox",
	inputbox: "https://www.mediawiki.org/wiki/Extension:InputBox",
	kakaotv: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	loom: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	"mainpage-endcolumn": "https://community.fandom.com/wiki/Help:Main_page_column_tags",
	"mainpage-leftcolumn-start": "https://community.fandom.com/wiki/Help:Main_page_column_tags",
	"mainpage-rightcolumn-start": "https://community.fandom.com/wiki/Help:Main_page_column_tags",
	math: "https://www.mediawiki.org/wiki/Math",
	metacafe: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	mobileonly: "https://www.mediawiki.org/wiki/Extension:MobileDetect",
	navertv: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	niconico: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	nicovideo: "https://www.mediawiki.org/wiki/Extension:YouTube",
	nomobile: "https://www.mediawiki.org/wiki/Extension:MobileDetect",
	noinclude: "https://www.mediawiki.org/wiki/Help:Templates#Control_template_inclusion",
	nowiki: "https://meta.wikimedia.org/wiki/Help:Wikitext_examples#Just_show_what_I_typed",
	onlyinclude: "https://www.mediawiki.org/wiki/Help:Templates#Control_template_inclusion",
	poem: "https://www.mediawiki.org/wiki/Extension:Poem",
	pollembed: "https://www.mediawiki.org/wiki/Extension:PollNY",
	pre: "https://meta.wikimedia.org/wiki/Help:Wikitext_examples#Just_show_what_I_typed",
	randomimage: "https://www.mediawiki.org/wiki/Extension:RandomImage",
	ref: "https://www.mediawiki.org/wiki/Extension:Cite",
	references: "https://www.mediawiki.org/wiki/Extension:Cite",
	rss: "https://www.mediawiki.org/wiki/Extension:RSS",
	section: "https://www.mediawiki.org/wiki/Extension:Labeled_Section_Transclusion",
	seo: "https://www.mediawiki.org/wiki/Extension:WikiSEO",
	sharepoint: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	soundcloud: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	source: "https://www.mediawiki.org/wiki/Extension:SyntaxHighlight",
	spoiler: "https://www.mediawiki.org/wiki/Extension:Spoilers",
	spotifyalbum: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	spotifyartist: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	spotifyepisode: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	spotifyshow: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	spotifytrack: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	substack: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	syntaxhighlight: "https://www.mediawiki.org/wiki/Extension:SyntaxHighlight",
	tabber: "https://www.mediawiki.org/wiki/Extension:TabberNeue",
	tabbertransclude: "https://www.mediawiki.org/wiki/Extension:TabberNeue",
	templatedata: "https://www.mediawiki.org/wiki/Extension:TemplateData",
	templatestyles: "https://www.mediawiki.org/wiki/Extension:TemplateStyles",
	timeline: "https://www.mediawiki.org/wiki/Extension:Timeline",
	twitch: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	twitchclip: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	twitchvod: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	videolink: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	vimeo: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	vk: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	vote: "https://www.mediawiki.org/wiki/Extension:VoteNY",
	vplayer: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	wistia: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	youku: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	youtube: "https://www.mediawiki.org/wiki/Extension:YouTube",
	youtubeoembed: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	youtubeplaylist: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)",
	youtubevideolist: "https://www.mediawiki.org/wiki/Extension:EmbedVideo_(fork)"
};
var interwikiMap = {
	acronym: "https://www.acronymfinder.com/~/search/af.aspx?string=exact&Acronym=$1",
	arxiv: "https://www.arxiv.org/abs/$1",
	att: "https://allthetropes.org/wiki/$1",
	c: "https://commons.wikimedia.org/wiki/$1",
	c2find: "https://c2.com/cgi/wiki?FindPage&value=$1",
	cache: "https://www.google.com/search?q=cache:$1",
	commons: "https://commons.miraheze.org/wiki/$1",
	cvt: "https://cvt.miraheze.org/wiki/$1",
	d: "https://www.wikidata.org/wiki/$1",
	dev: "https://dev.miraheze.org/wiki/$1",
	dictionary: "https://www.dict.org/bin/Dict?Database=*&Form=Dict1&Strategy=*&Query=$1",
	doi: "https://dx.doi.org/$1",
	drumcorpswiki: "https://www.drumcorpswiki.com/$1",
	emacswiki: "https://www.emacswiki.org/cgi-bin/wiki.pl?$1",
	fandom: "https://community.fandom.com/wiki/w:c:$1",
	foldoc: "https://foldoc.org/?$1",
	freebsdman: "https://www.FreeBSD.org/cgi/man.cgi?apropos=1&query=$1",
	github: "https://www.github.com/$1",
	google: "https://www.google.com/search?q=$1",
	googlegroups: "https://groups.google.com/groups?q=$1",
	hammondwiki: "https://www.dairiki.org/HammondWiki/$1",
	hrwiki: "https://www.hrwiki.org/wiki/$1",
	imdb: "https://www.imdb.com/find?q=$1&tt=on",
	libera: "https://web.libera.chat/?channel=$1",
	linuxwiki: "https://linuxwiki.de/$1",
	litse: "https://literature.stackexchange.com/questions/$1",
	loginwiki: "https://login.miraheze.org/wiki/$1",
	lqwiki: "https://wiki.linuxquestions.org/wiki/$1",
	lugkr: "https://www.lug-kr.de/wiki/$1",
	m: "https://meta.miraheze.org/wiki/$1",
	meatball: "https://meatballwiki.org/wiki/$1",
	mediawikiwiki: "https://www.mediawiki.org/wiki/$1",
	mediazilla: "https://phabricator.wikimedia.org/$1",
	meta: "https://meta.miraheze.org/wiki/$1",
	metawiki: "https://meta.miraheze.org/wiki/$1",
	metawikimedia: "https://meta.wikimedia.org/wiki/$1",
	mh: "https://meta.miraheze.org/wiki/$1",
	mozillawiki: "https://wiki.mozilla.org/$1",
	mw: "https://www.mediawiki.org/wiki/$1",
	namu: "https://namu.wiki/w/$1",
	oeis: "https://oeis.org/$1",
	oldwikisource: "https://wikisource.org/wiki/$1",
	phab: "https://issue-tracker.miraheze.org/$1",
	phabricator: "https://issue-tracker.miraheze.org/$1",
	phorge: "https://issue-tracker.miraheze.org/$1",
	pmid: "https://www.ncbi.nlm.nih.gov/pubmed/$1?dopt=Abstract",
	ppr: "https://c2.com/cgi/wiki?$1",
	pythoninfo: "https://wiki.python.org/moin/$1",
	reports: "https://reports.miraheze.org/$1",
	rfc: "https://tools.ietf.org/html/rfc$1",
	s23wiki: "https://s23.org/wiki/$1",
	senseislibrary: "https://senseis.xmp.net/?$1",
	shoutwiki: "https://www.shoutwiki.com/wiki/$1",
	sourceforge: "https://sourceforge.net/$1",
	sourcewatch: "https://www.sourcewatch.org/index.php?title=$1",
	squeak: "https://wiki.squeak.org/squeak/$1",
	templatewiki: "https://dev.miraheze.org/wiki/$1",
	testwiki: "https://publictestwiki.com/wiki/$1",
	tfipcheck: "https://ipcheck.toolforge.org/index.php?ip=$1",
	theopedia: "https://www.theopedia.com/$1",
	tmbw: "https://www.tmbw.net/wiki/$1",
	translatewiki: "https://translatewiki.net/wiki/$1",
	twiki: "https://twiki.org/cgi-bin/view/$1",
	uncyclopedia: "https://en.uncyclopedia.co/wiki/$1",
	unreal: "https://wiki.beyondunreal.com/$1",
	usemod: "https://www.usemod.com/cgi-bin/wiki.pl?$1",
	w: "https://en.wikipedia.org/wiki/$1",
	wf: "https://meta.wikiforge.net/wiki/$1",
	wiki: "https://wiki.c2.com/?$1",
	wikia: "https://community.fandom.com/wiki/w:c:$1",
	wikiapiary: "https://wikiapiary.com/wiki/$1",
	wikibooks: "https://en.wikibooks.org/wiki/$1",
	wikif1: "https://www.wikif1.org/$1",
	wikihow: "https://www.wikihow.com/$1",
	wikimedia: "https://foundation.wikimedia.org/wiki/$1",
	wikimediacommons: "https://commons.wikimedia.org/wiki/$1",
	wikimediaphab: "https://phabricator.wikimedia.org/$1",
	wikinews: "https://en.wikinews.org/wiki/$1",
	wikinfo: "https://www.wikinfo.org/wikinfo/index.php/$1",
	wikipedia: "https://en.wikipedia.org/wiki/$1",
	wikiquote: "https://en.wikiquote.org/wiki/$1",
	wikisource: "https://en.wikisource.org/wiki/$1",
	wikispecies: "https://species.wikimedia.org/wiki/$1",
	wikiversity: "https://en.wikiversity.org/wiki/$1",
	wikivoyage: "https://en.wikivoyage.org/wiki/$1",
	wikt: "https://en.wiktionary.org/wiki/$1",
	wiktionary: "https://en.wiktionary.org/wiki/$1",
	wmfphab: "https://phabricator.wikimedia.org/$1",
	wp: "https://en.wikipedia.org/wiki/Wikipedia:$1",
	wt: "https://meta.wikitide.org/wiki/$1"
};
//#endregion
//#region gadgets/ViewSource/code.js
/**
* View Source
*
* © Peter Coester 2013 [[User_talk:Pecoes|Pecoes]]
*
* Original code:
* https://dev.fandom.com/wiki/MediaWiki:View_Source/code.js?oldid=207789
* 
* documentation and examples at:
* https://dev.fandom.com/wiki/View_Source
*/
(function(module, mw, $) {
	"use strict";
	if (module.loadSource) return;
	var config = mw.config.get([
		"wgAction",
		"wgArticleId",
		"wgArticlePath",
		"wgContentLanguage",
		"wgCurRevisionId",
		"wgFormattedNamespaces",
		"wgNamespaceIds",
		"wgPageContentModel",
		"wgPageName",
		"wgUserLanguage",
		"wgVersion",
		"skin"
	]), preloads = 2, i18n, $content, $source, $a, $toc, headers = [];
	if (config.wgPageContentModel !== "wikitext" || config.wgAction !== "view" || config.wgArticleId === 0) return;
	function preload() {
		if (--preloads === 0) init();
	}
	function init() {
		$content = $("#mw-content-text");
		if ($content.length) {
			addButton(config.skin);
			if (mw.util.getParamValue("view") === "source") module.loadSource();
		}
	}
	function addButton(skin) {
		if ($("#ca-view-source").length) return;
		var portlet = getAvailablePortlet(skin);
		if (portlet.length === 0) {
			console.error("view-source: skin " + skin + " is unsupported");
			return;
		}
		mw.util.addPortletLink(portlet.attr("id"), "", "View Source", "ca-view-source");
		$a = $("#ca-view-source > a, #ca-view-source > span").first();
		$a.text(i18n.msg("viewSource").plain()).attr("href", null).attr("title", i18n.msg("tooltip").plain()).data("source", false).on("click", function(e) {
			module[$a.data("source") ? "hideSource" : "loadSource"]();
			e.preventDefault();
		});
	}
	function getAvailablePortlet(skin) {
		var portlet = null;
		switch (skin) {
			case "minerva":
				portlet = $("#p-tb");
				break;
			case "cosmos":
				portlet = $("#cosmos-actionsList-list");
				break;
			default:
				portlet = $("#p-cactions");
				if (portlet.length === 0) portlet = $("#ca-purge, #ca-watch, #ca-delete, #ca-move").parents(".mw-portlet").last();
		}
		return portlet;
	}
	function joinHrefParts(parts) {
		for (var i = 0; i < parts.length; i++) parts[i] = encodeURIComponent(parts[i]);
		return parts.join(":").replace(/ /g, "_");
	}
	function createHref(link) {
		var parts, hash = "";
		if (link.indexOf("#") !== -1) {
			parts = link.split(/\#/);
			link = parts.shift();
			if (!link.length) link = config.wgPageName;
			hash = "#" + parts.pop();
		}
		if (link[0] === "/") link = config.wgPageName + link;
		parts = link.split(/\:/);
		if (parts.length > 1 && interwikiMap[parts[0].toLowerCase()]) return interwikiMap[parts.shift().toLowerCase()].replace(/\$1/, joinHrefParts(parts) + hash);
		return config.wgArticlePath.replace("$1", joinHrefParts(parts) + hash);
	}
	function replaceTag(all, delim, tag) {
		if (!parserTags[tag]) if (/\//g.test(all)) return "&lt;/" + tag;
		else return "&lt;" + tag;
		return delim + "<a href=\"" + mw.html.escape(parserTags[tag]) + "\">" + tag + "</a>";
	}
	function replaceHeaders(m) {
		headers.push(m);
		return "<a name=\"h" + (headers.length - 1) + "\"></a>" + m;
	}
	function replaceWikiLink(all, link, title) {
		title = title || "";
		return "[[<a href=\"" + mw.html.escape(createHref(link)) + "\">" + link + "</a>" + title + "]]";
	}
	function replaceTemplates(all, delim, name) {
		var href, m = name.match(/^(\#?)(\w+)(\:.*)/), fn = m && parserFunctions[m[1] + m[2]];
		if (fn) return delim + m[1] + "<a href=\"https://www.mediawiki.org/wiki/" + fn + "\">" + m[2] + "</a>" + m[3];
		name = name.replace(/&lt;\!\-\-[\s\S]*\-\-&gt;/, "");
		m = name.match(/^(\s*)(.+)(\s*)$/);
		if (m === null) return all;
		if (m[2][0] === ":") href = m[2].substring(1);
		else if (m[2].indexOf("w:") === 0) {
			href = "w:" + (m[2][2] === ":" ? m[2].substring(3) : "Template:" + m[2].substring(2));
			console.log(href);
		} else if (m[2][0] === "/") href = mw.config.values.wgPageName + m[2];
		else {
			var templ = config.wgFormattedNamespaces[10] + ":";
			if (m[2].indexOf(":") !== -1) {
				var pagenamePrefix = m[2].split(":")[0];
				if (config.wgNamespaceIds[pagenamePrefix.toLowerCase()] !== void 0) href = m[2];
				else href = templ + m[2];
			} else href = templ + m[2];
		}
		return delim + m[1] + "<a href=\"" + mw.html.escape(createHref(href)) + "\">" + m[2] + "</a>" + m[3];
	}
	function replaceRegularLinks(all, link, title) {
		title = title || "";
		return "[<a href=\"" + mw.html.escape(link) + "\">" + link + "</a>" + title + "]";
	}
	function replaceModules(all, prefix, title, postfix) {
		var page = config.wgFormattedNamespaces[828] + ":" + title.trim();
		return prefix + "<a href=\"" + mw.html.escape(createHref(page)) + "\">" + title.trim() + "</a>" + postfix;
	}
	module.loadSource = function() {
		$a.text(i18n.msg("viewArticle").plain()).data("source", true);
		if ($source) {
			$source.show();
			$content.hide();
			if ($toc) $toc.show();
		} else $.get(mw.util.getUrl(config.wgPageName, {
			action: "raw",
			maxage: "0",
			smaxage: "0",
			oldid: mw.util.getParamValue("diff") || mw.util.getParamValue("oldid") || config.wgCurRevisionId
		})).done(function(wikitext) {
			$source = $("<pre id=\"source-code\">" + wikitext.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/({{#invoke:)([\s\S]*?)(\||})/gim, replaceModules).replace(/(&lt;\/?)([\w\:\-]+)/g, replaceTag).replace(/^((=+)[^\[\]\{\}]+?\2)/gm, replaceHeaders).replace(/\[{2}([^\[\]\{\}\|]+)(\|[^\]]+)?\]{2}/g, replaceWikiLink).replace(/\[(https?:\/\/[^ \]]+)([^\]]*)\]/g, replaceRegularLinks).replace(/((?:^|[^\{])\{\{)([^\{\|\}]+)/g, replaceTemplates).replace(/\r\n|\r|\n/g, "<br />") + "</pre>").insertBefore($content.css("display", "none"));
		});
	};
	module.hideSource = function() {
		if (!$source) return;
		$a.text(i18n.msg("viewSource").plain()).data("source", false);
		$source.hide();
		$content.show();
		if ($toc) $toc.hide();
	};
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
			return module.loadMessages("ViewSource", {});
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
			"viewSource": "View source",
			"viewArticle": "View article",
			"tooltip": "Toggle the visibility of the wiki source code of the current page"
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
	$.when(getI18nLoader(), mw.loader.using("mediawiki.util")).done(function(i18nLoader) {
		i18n = prepareI18n(i18nLoader);
		preload();
	});
	mw.hook("wikipage.content").add(preload);
})((window.dev = window.dev || {}).viewSource = window.dev.viewSource || {}, mediaWiki, jQuery);
//#endregion
