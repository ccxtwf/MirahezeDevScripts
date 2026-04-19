//#region gadgets/FilterTable/index.js
mw.hook("wikipage.content").add(function() {
	const DEBUG_MODE = [
		"localhost:",
		"safemode=",
		"action=submit"
	].some((str) => window.location.href.includes(str));
	const scriptUrl = "https://cdn.jsdelivr.net/npm/datatables@1.10.18/media/js/jquery.dataTables.min.js";
	if (!$(".filter-wrapper").length) return;
	const StringMatchingMode = Object.freeze({
		CONTAINS: Symbol("contains"),
		EXACT: Symbol("exact")
	});
	class ColumnFilterManager {
		constructor(table) {
			this.table = table;
			this.columnFilters = /* @__PURE__ */ new Map();
		}
		registerRow(colIndex, rowIndex, mode) {
			if (!this.columnFilters.has(colIndex)) this.columnFilters.set(colIndex, /* @__PURE__ */ new Map());
			this.columnFilters.get(colIndex).set(rowIndex, {
				mode,
				filters: /* @__PURE__ */ new Set()
			});
		}
		toggleFilter(colIndex, rowIndex, query, isActive) {
			const { filters } = this.columnFilters.get(colIndex).get(rowIndex);
			if (isActive) filters.add(query);
			else filters.delete(query);
			this.applyColumnFilter(colIndex);
		}
		clearRow(colIndex, rowIndex) {
			this.columnFilters.get(colIndex).get(rowIndex).filters.clear();
			this.applyColumnFilter(colIndex);
		}
		rowHasFilters(colIndex, rowIndex) {
			return this.columnFilters.get(colIndex).get(rowIndex).filters.size > 0;
		}
		applyColumnFilter(colIndex) {
			const columnMap = this.columnFilters.get(colIndex);
			if (!columnMap) return;
			const activeFilters = Array.from(columnMap.entries()).map(([_, rowData]) => rowData).filter((rowData) => rowData && rowData.filters && rowData.filters.size);
			if (activeFilters.length === 0) {
				this.table.column(colIndex).search("").draw();
				return;
			}
			if (activeFilters.length === 1) {
				const [{ mode, filters }] = activeFilters;
				const regex = Array.from(filters).join("|");
				const finalRegex = mode === StringMatchingMode.EXACT ? "^(" + regex + ")$" : regex;
				this.table.column(colIndex).search(finalRegex, true, false).draw();
				return;
			}
			const combinedRegex = activeFilters.map(({ mode, filters }) => {
				if (mode !== StringMatchingMode.CONTAINS) mw.notify(`More than one filter row specifies the same column with exact matching mode. This should not happen.`, {
					autoHide: false,
					type: "error",
					title: "FilterTable invalid matching mode."
				});
				return `(?=.*(${Array.from(filters).join("|")}))`;
			}).join("");
			this.table.column(colIndex).search(combinedRegex, true, false).draw();
		}
	}
	function preprocessTable($table) {
		if ($table.find("thead").length === 0) {
			const $headerRow = $table.find("tr").first();
			const $thead = $("<thead></thead>").append($headerRow);
			$table.prepend($thead);
		}
		$table.find("style").each(function() {
			$(this).appendTo("head");
		});
	}
	function processRowCounter($wrapper, table) {
		const $counter = $wrapper.find(".filter-counter");
		const $counterTotal = $wrapper.find(".filter-counter-total");
		if ($counter.length) table.on("draw", function() {
			const info = table.page.info();
			if (DEBUG_MODE) console.log(info);
			$counter.text(info.recordsDisplay);
			$counterTotal.text(info.recordsTotal);
		});
	}
	function processRow($row, table, filterManager, rowIndex) {
		const colIndex = parseInt($row.data("col")) - 1;
		if (isNaN(colIndex)) return;
		const modeString = $row.data("mode");
		let mode;
		if (modeString === "contains") mode = StringMatchingMode.CONTAINS;
		else mode = StringMatchingMode.EXACT;
		filterManager.registerRow(colIndex, rowIndex, mode);
		const $allBtn = $row.find(".filter-button.is-all");
		const $optionButtons = $row.find(".filter-button").not(".is-all");
		$allBtn.on("click", function() {
			$row.find(".filter-button").removeClass("button-selected");
			$(this).addClass("button-selected");
			filterManager.clearRow(colIndex, rowIndex);
		});
		$optionButtons.on("click", function() {
			const $this = $(this);
			const query = ($this.attr("data-query") || $this.text().trim()).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const isActive = $this.hasClass("button-selected");
			filterManager.toggleFilter(colIndex, rowIndex, query, !isActive);
			$this.toggleClass("button-selected");
			const hasActiveFilters = filterManager.rowHasFilters(colIndex, rowIndex);
			$allBtn.toggleClass("button-selected", !hasActiveFilters);
		});
		$allBtn.trigger("click");
	}
	function processSearchFields($wrapper, table) {
		const searchFields = [];
		$wrapper.find(".filter-search").each(function() {
			const $container = $(this);
			const $searchField = $("<input type=\"text\" placeholder=\"Type to search...\" />");
			$searchField.on("keyup input", function() {
				table.search(this.value).draw();
			});
			$container.append($searchField);
			searchFields.push($searchField);
		});
		return searchFields;
	}
	function processResetAllButton($wrapper, searchFields) {
		$wrapper.find(".filter-reset").on("click", function() {
			searchFields.forEach(function($searchField) {
				$searchField.val("").trigger("input");
			});
			$wrapper.find(".filter-row").each(function() {
				const $selectAllButton = $(this).find(".is-all");
				if ($selectAllButton.length) $selectAllButton.trigger("click");
				else $(this).find(".filter-button.button-selected").trigger("click");
			});
		});
	}
	$.getScript(scriptUrl, function() {
		$(".filter-wrapper").each((_, element) => {
			const $wrapper = $(element);
			const tableId = $wrapper.data("table-id");
			const $table = $(document.getElementById(tableId));
			if (!$table.length) return;
			preprocessTable($table);
			let table;
			try {
				table = $table.DataTable({
					paging: false,
					info: false,
					searching: true,
					dom: "t",
					autoWidth: false,
					responsive: false,
					order: []
				});
			} catch (e) {
				mw.notify(`Error initializing DataTable on table with id ${tableId}.\nMessage: ${e.message}`, {
					autoHide: false,
					type: "error",
					title: "FilterTable initialization failed."
				});
				return;
			}
			const filterManager = new ColumnFilterManager(table);
			if (mw.config.get("skin") === "citizen") $table.unwrap(".dataTables_wrapper");
			processRowCounter($wrapper, table);
			const searchFields = processSearchFields($wrapper, table);
			$wrapper.find(".filter-row").each(function(index) {
				processRow($(this), table, filterManager, index);
			});
			processResetAllButton($wrapper, searchFields);
		});
	});
});
//#endregion
