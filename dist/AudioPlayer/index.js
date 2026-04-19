//#region gadgets/AudioPlayer/index.js
/**
* Author: User:PetraMagna
* License: CC BY-SA 4.0
*/
(function() {
	function addScript(src, callback) {
		var s = document.createElement("script");
		s.setAttribute("src", src);
		s.onload = callback;
		document.body.appendChild(s);
	}
	function getTimeCodeFromNum(num) {
		let seconds = parseInt(num);
		let minutes = Math.floor(seconds / 60);
		seconds -= minutes * 60;
		const hours = Math.floor(minutes / 60);
		minutes -= hours * 60;
		if (hours === 0) return `${minutes}:${String(seconds % 60).padStart(2, 0)}`;
		return `${String(hours).padStart(2, 0)}:${minutes}:${String(seconds % 60).padStart(2, 0)}`;
	}
	async function checkOggOpusSupport() {
		if (!("mediaCapabilities" in navigator)) {
			console.warn("MediaCapabilities API not supported");
			return false;
		}
		const mediaConfig = {
			type: "file",
			audio: {
				contentType: "audio/ogg; codecs=\"opus\"",
				channels: 2,
				bitrate: 64e3,
				samplerate: 44100
			}
		};
		try {
			return (await navigator.mediaCapabilities.decodingInfo(mediaConfig)).powerEfficient;
		} catch (e) {
			console.error("Error while checking media capabilities:", e);
			return false;
		}
	}
	let fileExtensionUseTranscoded = {
		"mp3": false,
		"wav": false,
		"ogg": false,
		"flac": true
	};
	const groups = {};
	/**
	* Checks whether the browser supports the container format in the url. If not, return a different
	* url pointing to the transcoded mp3 file on Miraheze's server.
	* @param {string} url Url of the desired audio file
	* @returns string Url to playable audio file
	*/
	function processAudioUrl(url) {
		const index = url.search(/\.[a-zA-Z0-9]+$/i);
		if (index === -1) return url;
		if (fileExtensionUseTranscoded[url.substring(index + 1).toLowerCase()] === false) return url;
		return url.replace(/wikitide\.net\/([^/]+)\/(.)\/(..)\/(\w+)\.ogg/i, "wikitide.net/$1/transcoded/$2/$3/$4.ogg/$4.ogg.mp3");
	}
	function initAudioPlayer(index, audioPlayer) {
		const dataSet = audioPlayer.dataset;
		const audioGroup = dataSet.group;
		const shouldLoop = dataSet.loop === "true";
		const shouldPreload = dataSet.preload !== "false";
		const loopStart = parseFloat(dataSet.loopStart);
		const loopEnd = parseFloat(dataSet.loopEnd);
		const isPauseButton = dataSet.pauseButton;
		const filename = dataSet.filename;
		const playButton = audioPlayer.querySelector(".toggle-play");
		const progressBar = audioPlayer.querySelector(".progress");
		const timeline = audioPlayer.querySelector(".timeline");
		let startingVolume = parseFloat(dataSet.volume);
		if (isNaN(startingVolume)) startingVolume = 1;
		const volumeButton = audioPlayer.querySelector(".volume-button");
		const volumeButtonIcon = audioPlayer.querySelector(".volume");
		const volumeSlider = audioPlayer.querySelector(".volume-slider");
		const volumePercentage = audioPlayer.querySelector(".volume-percentage");
		const audioTime = audioPlayer.querySelector(".time");
		const audioCurrentTime = audioPlayer.querySelector(".current");
		const audioDivider = audioPlayer.querySelector(".divider");
		const audioLength = audioPlayer.querySelector(".length");
		if (isPauseButton && isPauseButton === "true") {
			playButton.parentElement.addEventListener("click", function() {
				groups[audioGroup].pause();
			});
			return;
		}
		let muted = false;
		function onAudioPauseOrStop() {
			playButton.classList.remove("pause");
			playButton.classList.add("play");
		}
		function howlerLoad() {
			if (howler.state() === "unloaded") howler.load();
		}
		function setVolumeBarWidth(volumeFraction) {
			if (volumePercentage) volumePercentage.style.width = volumeFraction * 100 + "%";
		}
		const howler = new Howl({
			src: [processAudioUrl(dataSet.src)],
			preload: shouldPreload,
			onpause: onAudioPauseOrStop,
			onplay: function() {
				playButton.classList.remove("play");
				playButton.classList.add("pause");
				if (shouldLoop && loopEnd !== 0) setTimeout(checkBGMLoop, 20);
				if (shouldLoop && loopEnd !== 0 || progressBar || audioCurrentTime) setTimeout(updateProgress, 100);
			},
			onend: function() {
				if (shouldLoop) {
					howler.seek(0);
					howler.play();
				} else onAudioPauseOrStop();
			},
			onload: function() {
				if (audioTime) {
					audioCurrentTime.innerText = "0:00";
					audioDivider.innerText = "/";
					audioLength.innerText = getTimeCodeFromNum(howler.duration());
				}
			},
			onloaderror: function(err) {
				if (audioCurrentTime) audioCurrentTime.innerText = "Failed to load";
				console.log(err);
			},
			onvolume: function() {
				setVolumeBarWidth(howler.volume());
			}
		});
		setVolumeBarWidth(startingVolume);
		howler.volume(startingVolume);
		function checkBGMLoop() {
			const seek = howler.seek();
			if (seek >= loopEnd && seek - loopEnd < .5) howler.seek(loopStart);
			if (howler.playing) setTimeout(checkBGMLoop, 20);
		}
		function updateProgress() {
			const seek = howler.seek();
			if (progressBar) progressBar.style.width = seek / howler.duration() * 100 + "%";
			if (audioCurrentTime) audioCurrentTime.innerText = getTimeCodeFromNum(seek);
			if (howler.playing) setTimeout(updateProgress, 20);
		}
		howler.on("seek", updateProgress);
		function openFilePage() {
			if (filename) {
				const filepage = "/wiki/File:" + filename;
				window.open(filepage, "_blank").focus();
				return true;
			}
			return false;
		}
		playButton.parentElement.addEventListener("contextmenu", function(event) {
			event.preventDefault();
			return !openFilePage();
		});
		playButton.parentElement.addEventListener("click", function(event) {
			if (event.ctrlKey) {
				if (openFilePage()) return;
			}
			howlerLoad();
			if (howler.playing()) howler.pause();
			else {
				if (audioGroup && audioGroup !== "concurrent") {
					const previousPlaying = groups[audioGroup];
					if (previousPlaying) previousPlaying.pause();
					groups[audioGroup] = howler;
				}
				howler.play();
			}
		});
		if (timeline) timeline.addEventListener("click", (e) => {
			howlerLoad();
			const timelineWidth = window.getComputedStyle(timeline).width;
			const timeToSeek = e.offsetX / parseInt(timelineWidth) * howler.duration();
			howler.seek(timeToSeek);
		});
		function toggleMute() {
			if (muted) {
				howler.mute(false);
				volumeButtonIcon.classList.remove("icon-muted");
				volumeButtonIcon.classList.add("icon-volume-medium");
			} else {
				howler.mute(true);
				volumeButtonIcon.classList.add("icon-muted");
				volumeButtonIcon.classList.remove("icon-volume-medium");
			}
			muted = !muted;
		}
		if (volumeButton) volumeButton.addEventListener("click", toggleMute);
		if (volumeSlider) volumeSlider.addEventListener("click", (e) => {
			if (muted) toggleMute();
			const sliderWidth = window.getComputedStyle(volumeSlider).width;
			const newVolume = e.offsetX / parseInt(sliderWidth);
			howler.volume(newVolume);
		});
	}
	async function audioInit() {
		if (!await checkOggOpusSupport()) fileExtensionUseTranscoded.ogg = true;
		$(".audio-player").each(initAudioPlayer);
	}
	addScript("https://cdn.jsdelivr.net/npm/howler@2.2.4/dist/howler.min.js", audioInit);
})();
//#endregion
