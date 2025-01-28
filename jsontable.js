/**
 * JsonTable - A JavaScript class for creating interactive data tables
 * Features:
 * - Sorting
 * - Filtering
 * - Pagination
 * - Statistics
 * - Search
 * - Localization support
 */

class JsonTable {
    constructor(element, settings) {
        // Initialize settings with defaults
        this.initializeSettings(settings);
        
        // Initialize properties
        this.parent = document.querySelector(element);
        this.initializeProperties();
        
        // Create UI components
        this.createUIComponents();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    initializeSettings(settings) {
        this.innerHTML = settings.innerHTML || 1;
        this.numberOfRow = settings.numberOfRow || 10;
        this.lang = settings.lang || 'tr-TR';
        this.columnTypes = settings.columnTypes || {};
        this.sortBy = settings.sortBy || 0;
        this.order = settings.order || 1;
        this.localTexts = jsonTableLocalText;
    }

    initializeProperties() {
        this.tableWrapper = document.createElement("div");
        this.tableWrapper.classList.add("table-wrapper");
        this.table = document.createElement("table");
        this.table.classList.add("table", "jsontable");
        
        this.searchText = "";
        this.styleRow = -1;
        this.idRow = -1;
        this.page = 0;
        this.filteredUniq = [];
        this.filterSavedState = [];
        this.tableFilters = [{
            op: 'na',
            value: '',
            value2: ''
        }];
        this.filterWrappers = [];
        this.headers = [];
        this.rows = [];
    }

    createUIComponents() {
        // Create panels
        this.createPanels();
        
        // Create search and filter components
        this.createSearchComponents();
        
        // Create pagination components
        this.createPaginationComponents();
        
        // Append components to DOM
        this.appendComponentsToDOM();
    }

    createPanels() {
        this.topPanel = document.createElement("div");
        this.bottomPanel = document.createElement("div");
        this.counter = document.createElement("span");
        this.pagination = document.createElement("div");
        this.pagination.classList.add("pagination-wrapper");
        this.statTable = document.createElement("table");
        this.statTable.classList.add("stat-table");
    }

    createSearchComponents() {
        // Create searchbar
        this.searchbar = document.createElement("input");
        this.searchbar.classList.add("searchbar");
        this.searchbar.setAttribute("placeholder", this.localTexts["search"]);

        // Create number of rows select
        this.createNumberOfRowsSelect();
        
        // Create clear filters button
        this.createClearFiltersButton();
    }

    createNumberOfRowsSelect() {
        let numberOfRowsSelect = document.createElement("select");
        numberOfRowsSelect.classList.add("nor-select");
        
        const options = [
            [10, "10"],
            [25, "25"],
            [50, "50"],
            [-1, this.localTexts["all"]]
        ];

        options.forEach(([value, text]) => {
            let option = document.createElement("option");
            option.setAttribute("value", value);
            option.innerText = text;
            numberOfRowsSelect.append(option);
        });

        numberOfRowsSelect.addEventListener("change", () => this.setNumberOfRows(numberOfRowsSelect.value));
        this.numberOfRowsSelect = numberOfRowsSelect;
    }

    createClearFiltersButton() {
        this.clearFilters = document.createElement("button");
        this.clearFilters.innerText = this.localTexts["clear_filters"];
        this.clearFilters.classList.add("clear-filters");
    }

    createPaginationComponents() {
        // Create navigation buttons
        const prevBtn = this.createPaginationButton("<", "p");
        const nextBtn = this.createPaginationButton(">", "n");
        
        // Create page select
        this.pageSelect = document.createElement("select");
        
        // Append pagination components
        this.pagination.append(prevBtn, this.pageSelect, nextBtn);
    }

    createPaginationButton(text, action) {
        const btn = document.createElement("button");
        btn.innerText = text;
        btn.addEventListener("click", () => this.gotopage(action));
        return btn;
    }

    appendComponentsToDOM() {
        // Append main components
        this.parent.append(this.topPanel, this.tableWrapper, this.bottomPanel);
        this.tableWrapper.append(this.table);
        
        // Append search components
        this.topPanel.append(
            this.searchbar,
            document.createTextNode(this.localTexts["number_of_rows"]),
            this.numberOfRowsSelect,
            this.clearFilters
        );
        
        // Append bottom panel components
        this.bottomPanel.append(this.counter, this.pagination, this.statTable);
    }

    setupEventListeners() {
        // Setup search event
        this.searchbar.addEventListener("input", () => {
            this.searchText = this.searchbar.value;
            this.build();
        });

        // Setup clear filters event
        this.clearFilters.addEventListener("click", () => this.clearAllFilters());

        // Setup page select event
        this.pageSelect.addEventListener("change", () => this.gotopage(this.pageSelect.value));

        // Setup document click event for filters
        document.addEventListener("click", (event) => {
            if (event.target.closest(".showing-filters") || event.target.closest(".filter-container")) return;
            document.querySelectorAll('.filter-wrapper').forEach(el => {
                el.classList.remove("visible");
            });
        });
    }

    localText(key, arr) {
        let str=this.localTexts[key];
        return str.replace(/%(\d+)/g, function (_, m) {
            return arr[--m];
        });
    }

    clearAllFilters() {
        this.searchText = "";
        this.tableFilters.forEach((filter,index)=>{
            this.tableFilters[index] = {
                op: 'na',
                value: '',
                value2: ''
            };
        });
        this.build();
    }

    clearFilter(index) {
            this.tableFilters[index] = {
                op: 'na',
                value: '',
                value2: ''
            };
            this.build();
            this.showFilters(index);
    }

    loadData(data) {
        this.data = data;
        this.headers = [];
        this.rows = [];
        
        // Auto-detect numeric columns if not specified in settings
        if (Object.keys(this.columnTypes).length === 0 && data.length > 0) {
            const firstRow = data[0];
            Object.keys(firstRow).forEach(key => {
                const value = firstRow[key];
                // Check if the value is numeric
                if (typeof value === 'number' || (typeof value === 'string' && !isNaN(value) && value.trim() !== '')) {
                    this.columnTypes[key] = 'number';
                }
            });
        }
        
        this.build();
    }

    setNumberOfRows(number){
        if (number>0){
            this.numberOfRow = number;
        }else{
            this.numberOfRow=9999999;
        }
        this.build();
    }

    filterArray(filter, value) {
        // Guard clause for undefined filter
        if (!filter || typeof filter.value === 'undefined' || filter.value === '') {
            return true;
        }

        switch (filter.op) {
            case "na":
                return true;
            case "gt":
                return value > filter.value;
            case "lt":
                return value < filter.value;
            case "eq":
                return value == filter.value;
            case "bt":
                return value > filter.value && value < filter.value2;
            case "inc":
                if (value == null) {
                    return false;
                }
                return value.toString().toLocaleLowerCase(this.lang)
                    .includes(filter.value.toString().toLocaleLowerCase(this.lang));
            case "select":
                if (filter.value === "<empty>") {
                    return value === "" || value == null;
                }
                if (value == null) {
                    return false;
                }
                return Array.isArray(filter.value) && filter.value.indexOf(value.toString()) !== -1;
            default:
                return true;
        }
    }


    sort(row) {
        this.sortBy = row;
        this.order = !this.order;
        this.headers.forEach(header => {
            header.classList.remove("sorting-asc");
            header.classList.remove("sorting-desc");
        });
        this.headers[this.sortBy].classList.add(this.order ? "sorting-asc" : "sorting-desc");
        this.build();
    };

    showFilters(row) {
        this.headers.forEach(header => {
            header.classList.remove("showing-filters");
        });
        this.filterWrappers.forEach(fw => {
            fw.classList.remove("visible");
        });
        let header = this.headers[row]
        header.classList.toggle("showing-filters");
        let filter = this.filterWrappers[row];
        filter.classList.toggle("visible");
        // set position of filter from header
        let rect = header.getBoundingClientRect();
        filter.style.top = rect.bottom + "px";
        filter.style.left = rect.left-90 + "px";
        filter.style.width = rect.width + "px"; 
        let listTarget = filter.getElementsByClassName("select-value")[0];
        listTarget.innerHTML = '';
        let activeState = this.filteredUniq[row];
        if (this.filterSavedState[row] != undefined) {
            activeState = this.filterSavedState[row];
        }

        activeState.sort((a, b) => {
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
            return 0;
        });

        activeState.forEach(element => {
            let li = document.createElement("li");
            let cb = document.createElement("input");
            let preview = document.createElement("div");
 
            if (element == "") {
                cb.setAttribute("type", "checkbox");
                cb.setAttribute("value", "<empty>");
                preview.innerText = this.localTexts["<empty>"];;
            } else {
                cb.setAttribute("type", "checkbox");
                cb.setAttribute("value", element);
                preview.innerHTML = element;
            }
            if (typeof (this.tableFilters[row].value) == 'object' && this.tableFilters[row].value.indexOf(cb.value) != -1) {
                cb.setAttribute("checked", "checked");
            }
            cb.addEventListener("change", () => {
                if (cb.checked) {
                    this.filterSavedState = [];
                    this.filterSavedState[row] = activeState;
                    this.tableFilters[row].op = "select";
                    if (typeof this.tableFilters[row].value == 'string') {
                        this.tableFilters[row].value = [];
                    }
                    this.tableFilters[row].value.push(cb.value);
                    this.build();
                } else {
                    let index = this.tableFilters[row].value.indexOf(cb.value);
                    this.tableFilters[row].value.splice(index, 1);
                    if (this.tableFilters[row].value.length == 0) {
                        this.tableFilters[row].op = "na";
                        this.tableFilters[row].value = "";
                    }
                    this.build();
                }
            });
            if (this.columnTypes[Object.keys(this.data[0])[row]] === "date") {
                let dd = new Date(element);
                if (element == '0000-00-00') {
                    element = this.localTexts["not_a_date"];
                }
                if (dd != "Invalid Date" && element != null) {
                    element = dd.toLocaleDateString(this.lang);
                }else{
                    element = this.localTexts["not_a_date"];
                }
            }
            
            li.append(cb);
            li.append(preview);
            listTarget.append(li);
        });

    };

    gotopage(page) {
        if (page == "p") {
            if (this.page > 0) {
                page = this.page - 1;
            } else {
                page = 0;
            }
        }
        if (page == "n") {
            if (this.page + 1 < (this.resultarray.length / this.numberOfRow)) {
                page = this.page + 1;
            } else {
                page = this.page;
            }
        }
        this.page = parseInt(page);
        this.build();
    }

    makeHeader(items) {
        let row = document.createElement("thead");
        let ascIcon = document.createElement("div");
        ascIcon.classList.add("asc");
        ascIcon.innerHTML = '<svg fill="#000000" width="20px" height="15px" viewBox="0 0 32 32"><path d="M8 20.695l7.997-11.39L24 20.695z"/></svg>';
        let descIcon = document.createElement("div");
        descIcon.classList.add("desc");
        descIcon.innerHTML = '<svg fill="#000000" width="20px" height="15px" viewBox="0 0 32 32"><path d="M24 11.305l-7.997 11.39L8 11.305z"/></svg>';
        let filterContainer = document.createElement("div");

        items.forEach((element, index) => {
            this.tableFilters.push({
                op: 'na',
                value: '',
                value2: ''
            });

            if (element == "_row_style") {
                this.styleRow = index;
                return;
            }
            if (element == "_row_id") {
                this.idRow = index;
                return;
            }

            let cell = document.createElement("td");
            cell.classList.add("header");

            let cellVisible = document.createElement("div");
            let headerTitle = document.createElement("span");
            let cellFilters = document.createElement("div");

            cellVisible.classList.add('header-text');
            if (this.innerHTML) {
                headerTitle.innerHTML = element;
            } else {
                headerTitle.innerText = element;
            }
            let filterIcon = document.createElement("div");
            filterIcon.classList.add("filter");
            filterIcon.innerHTML = '<svg  class="filtericon" width="20px" height="15px" viewBox="0 0 512 512"><polygon points="0 48 192 288 192 416 320 464 320 288 512 48 0 48"/></svg>';
            filterIcon.addEventListener("click", () => {
                this.showFilters(index);
            })
            headerTitle.addEventListener("click", () => {
                this.sort(index);
            })
            cellVisible.append(headerTitle);
            cellVisible.append(filterIcon);
            let filterTypeSelect = document.createElement("select");
            for (const filt of [
                ["select", this.localTexts["choose"]],
                ["inc", this.localTexts["contains"]],
                ["gt", this.localTexts["bigger_than"]],
                ["lt", this.localTexts["smaller_than"]],
                ["eq", this.localTexts["equals"]],
                ["bt", this.localTexts["between"]]
            ]) {
                let filter = document.createElement("option");
                filter.setAttribute("value", filt[0]);
                filter.innerText = filt[1];
                filterTypeSelect.append(filter);
            }
            cellFilters.append(filterTypeSelect);

            let valueList = document.createElement("ul");
            valueList.classList.add("select-value");
            let filterInput = document.createElement("input");
            let inputType = "text";
            if (this.columnTypes[element] === "number") {
                inputType = "number";
            }
            if (this.columnTypes[element] === "date") {
                inputType = "date";
            }
            filterInput.setAttribute("type", inputType);
            filterInput.addEventListener("input", () => {
                this.tableFilters[index].value = filterInput.value;
                this.build();
            });
            let filterInput2 = document.createElement("input");
            filterInput2.setAttribute("type", inputType);
            filterInput2.addEventListener("input", () => {
                this.tableFilters[index].value2 = filterInput2.value;
                this.build();
            });
            filterInput.classList.add("hidden");
            filterInput2.classList.add("hidden");
            filterTypeSelect.addEventListener("change", () => {
                switch (filterTypeSelect.value) {
                    case "select":
                        filterInput.classList.add("hidden");
                        filterInput2.classList.add("hidden");
                        valueList.classList.remove("hidden");
                        filterInput.value = '';
                        filterInput2.value = '';
                        this.tableFilters[index].value = [];
                        break;
                    case "bt":
                        filterInput.classList.remove("hidden");
                        filterInput2.classList.remove("hidden");
                        valueList.classList.add("hidden");
                        break;
                    default:
                        filterInput.classList.remove("hidden");
                        filterInput2.classList.add("hidden");
                        valueList.classList.add("hidden");
                        break;
                }

                this.tableFilters[index].op = filterTypeSelect.value;
                this.build();
            });
            cellFilters.append(filterInput);
            cellFilters.append(filterInput2);
            cellFilters.append(valueList);
            cellFilters.className = 'filter-wrapper';
            headerTitle.append(ascIcon.cloneNode(1));
            headerTitle.append(descIcon.cloneNode(1));
            this.filterWrappers.push(cellFilters);
            filterContainer.append(cellFilters);
            cell.append(cellVisible);
            this.headers.push(cell);
            row.append(cell);

            let clearFilter = document.createElement("button");
            clearFilter.innerText = this.localTexts["clear_filters"];
            clearFilter.classList.add("clear-filters");
            clearFilter.addEventListener("click", () => this.clearFilter(index));
            cellFilters.append(clearFilter);

            // row.append(cellFilters);
        });
        filterContainer.classList.add("filter-container");
        this.tableWrapper.append(filterContainer);
        return row;
    }

    makeRow(items) {
        let row = document.createElement("tr");
        items.forEach((element, index) => {
            // Handle special rows
            if (this.handleSpecialRows(row, element, index)) return;
            
            // Format element based on column type
            element = this.formatElement(element, index);
            
            // Create and append cell
            let cell = this.createCell(element);
            row.append(cell);
        });
        return row;
    }

    handleSpecialRows(row, element, index) {
        if (index === this.styleRow) {
            if (element !== " ") {
                element.split('|').forEach(word => {
                    row.classList.add(word.replace(" ", "-"));
                });
            }
            return true;
        }
        if (index === this.idRow) {
            row.setAttribute("id", element);
            return true;
        }
        return false;
    }

    formatElement(element, index) {
        if (this.columnTypes[Object.keys(this.data[0])[index]] === "number") {
            element = parseFloat(element) || 0;
            element = element.toLocaleString(this.lang);
        } else if (this.columnTypes[Object.keys(this.data[0])[index]] === "date") {
            element = this.formatDate(element);
        } else if (this.isUrl(element)) {
            element = `<a href='${element}'>${element}</a>`;
        }
        return element;
    }

    formatDate(element) {
        if (element === '0000-00-00') return this.localTexts["not_a_date"];
        
        const date = new Date(element);
        if (date !== "Invalid Date" && element != null) {
            return date.toLocaleDateString(this.lang);
        }
        return this.localTexts["not_a_date"];
    }

    isUrl(str) {
        return /^(ftp|http|https):\/\/[^ "]+$/.test(str);
    }

    createCell(element) {
        const cell = document.createElement("td");
        if (this.innerHTML) {
            cell.innerHTML = element;
        } else {
            cell.innerText = element;
        }
        return cell;
    }

    calculateStats() {
        // Clear existing stats
        this.statTable.innerHTML = '';
        
        this.initializeStatsTable();
        this.stats = [];
        
        Object.keys(this.columnTypes).forEach(key => {
            if (this.columnTypes[key] === "number") {
                const stat = this.calculateColumnStats(key);
                if (stat) {
                    this.stats.push(stat);
                }
            }
        });
        
        this.renderStats();
    }

    initializeStatsTable() {
        const headers = ["column", "total", "avg", "min", "max", "percentage"]
            .map(key => this.localTexts[key])
            .join("</th><th>");
            
        this.statTable.innerHTML = `<tr><th>${headers}</th></tr>`;
    }

    calculateColumnStats(key) {
        if (!this.data.length || !this.data[0].hasOwnProperty(key)) {
            return null; // Return null or an appropriate default if the key doesn't exist
        }

        const values = {
            filtered: this.resultarray.map(item => parseFloat(item[key]) || 0),
            total: this.data.map(item => parseFloat(item[key]) || 0)
        };

        const sum = values.filtered.reduce((a, b) => a + b, 0);
        const totalSum = values.total.reduce((a, b) => a + b, 0);

        return {
            name: key, // Assuming the key is now clean without any suffix
            sum,
            avg: this.resultarray.length ? sum / this.resultarray.length : 0,
            min: Math.min(...values.filtered),
            max: Math.max(...values.filtered),
            total_sum: totalSum,
            total_avg: this.data.length ? totalSum / this.data.length : 0,
            total_min: Math.min(...values.total),
            total_max: Math.max(...values.total),
            percentage: totalSum ? (sum / totalSum) * 100 : 0
        };
    }

    renderStats() {
        this.stats.forEach(stat => {
            const row = document.createElement("tr");
            const cells = [
                stat.name,
                `${stat.sum.toLocaleString(this.lang)} / ${stat.total_sum.toLocaleString(this.lang)}`,
                `${stat.avg.toLocaleString(this.lang)} / ${stat.total_avg.toLocaleString(this.lang)}`,
                `${stat.min.toLocaleString(this.lang)} / ${stat.total_min.toLocaleString(this.lang)}`,
                `${stat.max.toLocaleString(this.lang)} / ${stat.total_max.toLocaleString(this.lang)}`,
                `${stat.percentage.toLocaleString(this.lang)} %`
            ];

            cells.forEach(text => {
                const cell = document.createElement("td");
                cell.innerText = text;
                row.append(cell);
            });

            this.statTable.append(row);
        });
    }

    build() {
        this.clearTable();
        this.updateHeaderFilters();
        
        const resultarray = this.filterData();
        this.updateFilteredUnique(resultarray);
        
        this.sortData(resultarray);
        this.renderTable(resultarray);
        
        this.updatePagination(resultarray);
        // Calculate stats after data is filtered and sorted
        this.calculateStats();
    }

    clearTable() {
        this.rows.forEach(row => row.remove());
    }

    updateHeaderFilters() {
        this.headers.forEach((header, index) => {
            const isFiltered = this.tableFilters.length > 1 && 
                             this.tableFilters[index].op !== "na" && 
                             this.tableFilters[index].value !== "";
                             
            header.classList.toggle("filtered", isFiltered);
        });
    }

    filterData() {
        let filtered = this.data.filter(row => {
            const values = Object.values(row);
            return values.every((value, index) => {
                const filter = this.tableFilters[index];
                return !filter || this.filterArray(filter, value);
            });
        });

        if (this.searchText) {
            filtered = this.applySearch(filtered);
        }

        return filtered;
    }

    applySearch(data) {
        return data.filter(row => {
            const values = Object.values(row);
            return values.some(value => 
                value != null && 
                value.toString().toLocaleLowerCase(this.lang)
                    .includes(this.searchText.toString().toLocaleLowerCase(this.lang))
            );
        });
    }

    updateFilteredUnique(resultarray) {
        resultarray.forEach(row => {
            const values = Object.values(row);
            values.forEach((value, index) => {
                if (!this.filteredUniq[index]) {
                    this.filteredUniq[index] = [];
                }
                if (!this.filteredUniq[index].includes(value)) {
                    this.filteredUniq[index].push(value);
                }
            });
        });
    }

    sortData(resultarray) {
        resultarray.sort((a, b) => {
            const valA = Object.values(a)[this.sortBy];
            const valB = Object.values(b)[this.sortBy];
            
            const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
            return this.order ? comparison : -comparison;
        });
    }

    renderTable(resultarray) {
        let rowCount = 0;
        resultarray.forEach(element => {
            if (!rowCount && !this.headers.length) {
                this.table.append(this.makeHeader(Object.keys(element)));
            }
            
            const isInPage = this.page * this.numberOfRow <= rowCount && 
                           rowCount < (this.page + 1) * this.numberOfRow;
                           
            if (isInPage) {
                const newrow = this.makeRow(Object.values(element));
                this.rows.push(newrow);
                this.table.append(newrow);
            }
            rowCount++;
        });
        
        this.resultarray = resultarray;
        this.counter.innerText = this.localText("number_of_shown_records", 
            [this.data.length, resultarray.length]);
    }

    updatePagination(resultarray) {
        const pageCount = Math.ceil(resultarray.length / this.numberOfRow);
        
        this.pageSelect.innerHTML = "";
        for (let i = 0; i < pageCount; i++) {
            const opt = document.createElement("option");
            opt.innerText = i + 1;
            opt.value = i;
            this.pageSelect.append(opt);
        }
        
        this.pageSelect.value = this.page;
    }
}