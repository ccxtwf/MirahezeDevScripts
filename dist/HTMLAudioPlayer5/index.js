//#region gadgets/HTMLAudioPlayer5/code.js
/**
* @name HTML5AudioPlayer
* @author Manuel de la Fuente (https://manuelfte.com)
* @author KockaAdmiralac <1405223@gmail.com>
* @version 1.5.1
* @license CC-BY-SA-3.0
* @description Play audio files with a native HTML5 player
*/
(function(mw) {
	"use strict";
	var msg;
	function init(content) {
		content[0].querySelectorAll(".html5audio:not(.loaded)").forEach(function(div) {
			var data = div.dataset;
			var files = [];
			var sources = [];
			for (var attr in data) if (attr.startsWith("file")) {
				var s = attr.substring(4);
				var n = parseInt(s.substring(1)) || (s === "" ? 0 : null);
				if (n != null) files[n] = data[attr];
			}
			files = files.filter(function(f) {
				return f;
			});
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				var format = data["fileType" + (i > 0 ? "-" + i : "")];
				if (!format) {
					var f = files[i];
					var queryIndex = f.lastIndexOf("?");
					if (queryIndex != -1) f = f.substring(0, queryIndex);
					var dotIndex = f.lastIndexOf(".");
					if (dotIndex != -1 && f.length - (dotIndex + 1) <= 4) format = f.substring(dotIndex + 1);
				}
				if (format && format.length > 0) {
					if (format == "mp3") format = "mpeg";
					if (!format.startsWith("audio/")) format = "audio/" + format;
				}
				var source = document.createElement("source");
				source.src = file;
				if (format) source.type = format;
				sources.push(source);
			}
			if (sources.length == 0) return;
			var preload = data.preload;
			var download = data.download;
			var options = data.options;
			var opts = { controls: "" };
			var volume = Number(Number(data.volume).toFixed(1));
			var start = parseFloat(data.start);
			var end = parseFloat(data.end);
			var repeatStart = parseFloat(data.repeatStart);
			var repeatEnd = parseFloat(data.repeatEnd);
			if (preload !== "auto" && preload !== "metadata") preload = "none";
			opts.preload = preload;
			if (download === "false") opts.controlsList = "nodownload";
			if (options) {
				var valid = [
					"autoplay",
					"loop",
					"muted"
				];
				options.split(",").forEach(function(el) {
					el = el.trim();
					if (valid.indexOf(el) !== -1) opts[el] = "";
				});
			}
			var audio = document.createElement("audio");
			Object.keys(opts).forEach(function(attr) {
				var value = opts[attr];
				audio.setAttribute(attr, value);
			});
			if (!isNaN(start)) audio.currentTime = start;
			if (!isNaN(end)) {
				var autoPauseUpdate = function() {
					if (audio.currentTime >= end) {
						if (!audio.seeking) audio.pause();
						audio.removeEventListener("timeupdate", autoPauseUpdate);
					}
				};
				audio.addEventListener("timeupdate", autoPauseUpdate);
			}
			if (!isNaN(repeatStart) || !isNaN(repeatEnd)) {
				if (isNaN(repeatStart) || repeatStart < 0) repeatStart = 0;
				audio.addEventListener("loadedmetadata", function() {
					if (isNaN(repeatEnd) || repeatEnd > audio.duration) repeatEnd = audio.duration;
					if (repeatStart == 0 && repeatEnd == audio.duration) {
						audio.removeEventListener("timeupdate", onTimeUpdate);
						audio.removeEventListener("seeking", onSeeking);
						audio.removeEventListener("ended", onEnded);
						audio.setAttribute("loop", "");
						enableRepeat = false;
					} else if (repeatEnd > audio.duration - .25) audio.removeAttribute("loop");
				});
				var enableRepeat = true;
				var onTimeUpdate = function() {
					if (!enableRepeat) return;
					if (audio.paused && !audio.ended) return;
					if (audio.currentTime >= repeatEnd) audio.currentTime = repeatStart;
				};
				var onSeeking = function() {
					enableRepeat = audio.currentTime < repeatEnd;
				};
				var onEnded = function() {
					audio.play();
				};
				audio.addEventListener("ended", onEnded);
				audio.addEventListener("timeupdate", onTimeUpdate);
				audio.addEventListener("seeking", onSeeking);
			}
			Element.prototype.replaceChildren.apply(audio, sources);
			audio.append(msg("text").escape());
			if (volume >= 0 && volume <= 1) audio.volume = volume;
			div.innerHTML = "";
			div.appendChild(audio);
			div.classList.add("loaded");
		});
	}
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
			return module.loadMessages("HTMLAudioPlayer5", {});
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
		msgMap.set({ "text": "Your browser does not support the &lt;audio&gt; tag." });
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
	getI18nLoader().done(function(i18nLoader) {
		var i18n = prepareI18n(i18nLoader);
		msg = i18n.msg.bind(i18n);
		mw.hook("wikipage.content").add(init);
	});
})(window.mediaWiki);
//#endregion
