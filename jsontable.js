class JsonTable {
    constructor(element, settings) {

        // settings
        this.innerHTML = settings.innerHTML || 1;
        this.numberOfRow = settings.numberOfRow || 10;
        this.lang = settings.lang || 'tr-TR';
        this.numberCols = settings.numberCols || [];
        this.dateCols = settings.dateCols || [];
        this.sortBy = settings.sortBy || 1;
        this.order = settings.order || 1;

        // localizations
        
   
        this.localTexts = jsonTableLocalText;

      
        this.parent = document.querySelector(element);
        this.tableWrapper = document.createElement("div");
        this.tableWrapper.classList.add("table-wrapper");
        this.table = document.createElement("table");
        this.searchText = "";
        this.styleRow = -1;
        this.idRow = -1;
        this.page = 0;
        this.filteredUniq = [];
        this.filterSavedState = [];
        this.tableFilters = [];

        //creating DOM
        this.topPanel = document.createElement("div");
        this.bottomPanel = document.createElement("div");

        this.counter = document.createElement("span");
        this.pagination = document.createElement("div");

        this.searchbar = document.createElement("input");
        this.searchbar.classList.add("searchbar");
        this.searchbar.setAttribute("placeholder", this.localTexts["search"]);

        this.parent.append(this.topPanel);
        this.parent.append(this.tableWrapper);
        this.tableWrapper.append(this.table);
        this.parent.append(this.bottomPanel);

        this.topPanel.append(this.searchbar);
        this.bottomPanel.append(this.counter);
        this.bottomPanel.append(this.pagination);

        let numberOfRowsSelect = document.createElement("select");
        numberOfRowsSelect.classList.add("nor-select");
        for (const opt of [
            [10, "10"],
            [25, "25"],
            [50, "50"],
            [-1, this.localTexts["all"]]
        ]) {
            let option = document.createElement("option");
            option.setAttribute("value", opt[0]);
            option.innerText = opt[1];
            numberOfRowsSelect.append(option);
        }
        numberOfRowsSelect.addEventListener("change", () => this.setNumberOfRows(numberOfRowsSelect.value));

        this.topPanel.append(document.createTextNode(this.localTexts["number_of_rows"]));
        this.topPanel.append(numberOfRowsSelect);
        
        this.clearFilters = document.createElement("button");
        this.clearFilters.innerText = this.localTexts["clear_filters"];
        this.clearFilters.classList.add("clear-filters");
        this.clearFilters.addEventListener("click", () => this.clearAllFilters());
        this.topPanel.append(this.clearFilters);


        let prevBtn = document.createElement("button");
        prevBtn.innerText = "<";
        prevBtn.addEventListener("click", () => this.gotopage("p"));

        this.pagination.append(prevBtn);

        this.pageSelect = document.createElement("select");
        this.pageSelect.addEventListener("change", () => this.gotopage(this.pageSelect.value));
        this.searchbar.addEventListener("input", () => {
            this.searchText = this.searchbar.value;
            this.build();
        });
        this.pagination.append(this.pageSelect);

        let nextBtn = document.createElement("button");
        nextBtn.innerText = ">";
        nextBtn.addEventListener("click", () => this.gotopage("n"));
        this.pagination.append(nextBtn);
        this.pagination.classList.add("pagination-wrapper");



        this.table.classList.add("table");
        this.table.classList.add("jsontable");

        document.addEventListener("click", function (event) {
            if (event.target.closest(".showing-filters")) return
            document.querySelectorAll('.showing-filters').forEach(el => {
                el.classList.remove("showing-filters");
            });
        })
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
        if (typeof filter.value == 'undefined' || filter.value == '') {
            return 1
        };
        switch (filter.op) {
            case "na":
                return 1;
                break;
            case "gt":
                return value > filter.value;
                break;
            case "lt":
                return value < filter.value;
                break;
            case "eq":
                return value == filter.value;
                break;
            case "bt":
                return value > filter.value && value < filter.value2;
                break;
            case "inc":
                if (value == null) {
                    return 0;
                }
                return value.toString().toLocaleLowerCase(this.lang).includes(filter.value.toString().toLocaleLowerCase(this.lang));
                break;
            case "select":
                if (value == null) {
                    return 0;
                }
                if (filter.value.indexOf(value.toString()) != -1) {
                    return 1;
                } else {
                    return 0;
                }
                break;
            default:
                return 1;
                break;
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
        this.headers[row].classList.toggle("showing-filters");
        let listTarget = this.headers[row].getElementsByClassName("select-value")[0];
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
            cb.setAttribute("type", "checkbox");
            cb.setAttribute("value", element);
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
            if (this.dateCols.indexOf(row) != -1) {
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
            preview.innerHTML = element;
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
        ascIcon.innerText = "↑";
        let descIcon = document.createElement("div");
        descIcon.classList.add("desc");
        descIcon.innerText = "↓";


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
            if (element.includes("_format:number")) {
                this.numberCols.push(index);
                element = element.replace("_format:number", "");
            }
            if (element.includes("_format:date")) {
                this.dateCols.push(index);
                element = element.replace("_format:date", "");
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
            filterIcon.innerText = "≡";
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
            if (this.numberCols.indexOf(index) != -1) {
                inputType = "number";
            }
            if (this.dateCols.indexOf(index) != -1) {
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
            cell.append(cellFilters);
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
        return row;
    }
    makeRow(items) {
        let row = document.createElement("tr");
        items.forEach((element, index) => {
            if (index == this.styleRow) {
                if (element != " ") {
                    row.classList.add(element);
                }
                return;
            }
            if (index == this.idRow) {
                row.classList.add(element);
                return;
            }
            if (this.numberCols.indexOf(index) != -1) {
                element = parseFloat(element).toLocaleString(this.lang);
            }
            let cell = document.createElement("td");
            if (this.dateCols.indexOf(index) != -1) {
                let dd = new Date(element);
                if (element == '0000-00-00') {
                    element = this.localTexts["not_a_date"];
                }
                if (dd != "Invalid Date" && element != null) {
                    element = dd.toLocaleDateString(this.lang);
                } else {
                    element = this.localTexts["not_a_date"];
                }
            }
            if (/^(ftp|http|https):\/\/[^ "]+$/.test(element)) {
                element = "<a href='" + element + "'>" + element + "</a>";
            }

            if (this.innerHTML) {
                cell.innerHTML = element;
            } else {
                cell.innerText = element;
            }
            row.append(cell);
        });
        return row;
    }
    build() {
        this.rows.forEach(row => {
            row.remove();
        })

        this.headers.forEach((header, index) => {
            if (this.tableFilters.length > 1 && this.tableFilters[index].op != "na" && this.tableFilters[index].value != "") {
                header.classList.add("filtered");
            } else {
                header.classList.remove("filtered");

            }
        });


        this.filteredUniq = [];
        let resultarray = this.data.filter(row => {
            let values = Object.values(row);

            for (let index = 0; index < values.length; index++) {

                if (this.tableFilters.length > 1 && !this.filterArray(this.tableFilters[index], values[index])) {
                    return 0;
                }
            }
            return 1;
        });

        if (this.searchText != "") {
            resultarray = resultarray.filter(row => {
                let values = Object.values(row);
                for (let index = 0; index < values.length; index++) {
                    if (values[index] != null && values[index].toString().toLocaleLowerCase(this.lang).includes(this.searchText.toString().toLocaleLowerCase(this.lang))) {
                        return 1;
                    }
                }
                return 0;
            });
        }

        resultarray.forEach(row => {
            let values = Object.values(row);
            for (let index = 0; index < values.length; index++) {
                if (typeof this.filteredUniq[index] == 'undefined') {
                    this.filteredUniq[index] = [];
                }
                if (this.filteredUniq[index].indexOf(values[index]) == -1) {
                    this.filteredUniq[index].push(values[index]);
                }
            }
        });

        let nr = 0;

        resultarray.sort((a, b) => {
            a = Object.values(a)[this.sortBy];
            b = Object.values(b)[this.sortBy];
            var ret = 0;
            if (a < b) {
                var ret = -1;
            } else if (a > b) {
                var ret = 1;
            }
            return this.order ? ret : -1 * ret;

        });


        if (this.page > resultarray.length / this.numberOfRow) {
            this.page = 0;
        }


        resultarray.forEach(element => {
            if (!nr && !this.headers.length) {
                this.table.append(this.makeHeader(Object.keys(element)));
            }
            if (this.page * this.numberOfRow <= nr && nr < (this.page + 1) * this.numberOfRow) {
                let newrow = this.makeRow(Object.values(element));
                this.rows.push(newrow);
                this.table.append(newrow);
            }
            nr++;
        });
        this.resultarray = resultarray;
        this.counter.innerText = this.localText("number_of_shown_records", [this.data.length, resultarray.length]);
        this.pageSelect.innerHTML = "";
        for (let index = 0; index < resultarray.length / this.numberOfRow; index++) {
            let opt = document.createElement("option");
            opt.innerText = index + 1;
            opt.value = index;

            this.pageSelect.append(opt);
        }
        this.pageSelect.value = this.page;

    }
}