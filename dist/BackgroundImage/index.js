//#region gadgets/BackgroundImage/index.js
(function() {
	const hints = document.querySelectorAll(".background-image-hint");
	const portraitMode = window.innerWidth < window.innerHeight;
	function setBackground(image) {
		if (image.startsWith("//")) image = "https:" + image;
		const url = new URL(image);
		if (!(url.protocol === "http:" || url.protocol === "https:")) {
			mw.log.error("Invalid image URL:", image);
			return;
		}
		const style = document.createElement("style");
		style.innerHTML = `
body.has-bg::before {
	background-image: linear-gradient(
		rgba(var(--gadget-bg-color), var(--gadget-bg-overlay-opacity, 0.5)),
		rgba(var(--gadget-bg-color), var(--gadget-bg-overlay-opacity, 0.5))), url(${mw.html.escape(url.toString())});
}
			`;
		document.head.appendChild(style);
		document.body.classList.add("has-bg");
	}
	function checkBackgroundHintAndSet(dataset) {
		let image = dataset.image;
		let portrait = !!dataset.portrait;
		if (!image || image === "") return false;
		if (portraitMode ^ portrait) return false;
		setBackground(image);
		return true;
	}
	for (let hint of hints) if (checkBackgroundHintAndSet(hint.dataset)) return;
	const windowHints = window.gadgetBackgroundHints;
	if (!windowHints || !windowHints.length) return;
	for (let hint of windowHints) if (checkBackgroundHintAndSet(hint)) return;
})();
//#endregion
