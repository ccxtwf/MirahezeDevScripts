//#region gadgets/ImportButton/index.ts
(() => {
	if (![10, 828].includes(mw.config.get("wgNamespaceNumber"))) return;
	if (mw.config.get("wgUserId") === null) return;
	mw.loader.using("@wikimedia/codex").then((require) => {
		const Vue = require("vue");
		const Codex = require("@wikimedia/codex");
		mw.hook("wikipage.content").add(($content) => {
			if (!$content) return;
			$content.find(".how-to-export").each((_, $howToExport) => {
				const mountPoint = document.createElement("div");
				$howToExport.append(mountPoint);
				Vue.createMwApp({
					data: () => ({
						wikis: [],
						selectedWikiUrl: null,
						templateName: mw.config.get("wgPageName")
					}),
					template: `
          <hr style="margin: 10px 0;" />
          <b>Pre-fill import parameters</b>
          <div style="display: flex; gap: 0.25em;">
          <cdx-select
          v-model:selected="selectedWikiUrl"
          :menu-items="wikis"
          default-label="Select wiki"
          @click="loadWikis"
          @update:selected="saveSelectedWiki"
          />
          <cdx-button
          action="progressive"
          :disabled="!selectedWikiUrl"
          @click="openImportPage"
          >Open</cdx-button>
          </div>
          <p>Clicking the "Open" button will open the import page on the selected wiki in a new tab. Please click "Import" on the import page to complete the installation.</p>
          `,
					methods: {
						openImportPage() {
							if (!this.selectedWikiUrl) return;
							const importUrl = new URL(this.selectedWikiUrl + "/wiki/Special:Import");
							importUrl.searchParams.set("source", "interwiki");
							importUrl.searchParams.set("interwiki", "dev");
							importUrl.searchParams.set("frompage", this.templateName);
							importUrl.hash = "mw-import-interwiki-form";
							const newWindow = window.open(importUrl.href, "_blank");
							if (newWindow) newWindow.focus();
						},
						loadWikis() {
							new mw.Api().get({
								action: "query",
								format: "json",
								meta: "globaluserinfo",
								formatversion: "2",
								guiprop: "groups|unattached|merged"
							}).then((data) => {
								this.wikis = data.query.globaluserinfo.merged.filter((wiki) => wiki.groups && wiki.groups.includes("sysop")).map((wiki) => {
									return {
										label: new URL(wiki.url).hostname,
										value: wiki.url
									};
								});
							}).catch((error) => {
								mw.notify("importButton: Failed to load wikis!", { type: "error" });
								mw.log.error("Failed to load wikis", error);
								this.wikis = [{
									label: "Error loading wikis",
									value: "",
									disabled: true
								}];
							});
						},
						saveSelectedWiki() {
							const wikiEntry = this.wikis.find((wiki) => wiki.value === this.selectedWikiUrl);
							if (!wikiEntry) return;
							mw.storage.set("template-installer-selected-wiki", JSON.stringify({
								label: wikiEntry.label,
								value: wikiEntry.value
							}));
						}
					},
					mounted() {
						const savedValue = mw.storage.get("template-installer-selected-wiki");
						if (savedValue) {
							const data = JSON.parse(savedValue);
							this.wikis.push({
								label: data.label,
								value: data.value
							});
							this.selectedWikiUrl = data.value;
						}
						this.wikis.push({
							label: "Loading...",
							value: "",
							disabled: true
						});
					}
				}).component("cdx-button", Codex.CdxButton).component("cdx-select", Codex.CdxSelect).mount(mountPoint);
			});
		});
	});
})();
//#endregion
