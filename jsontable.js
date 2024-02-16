// Todo:
// Save settings and filters to cookie with uniqkey (?)
// Show/Hide Cols
// Select/Deselect All and Search Bar for filters
// Add Number of records to filter list
// Sum/Avg/Min./Max. Numbers to footer row or an info window
// Pop-up window for long texts
// Buttons for rows with custom click events
// Select rows and actions for selection
// Export to Excel, CSV
// Pivot Table ?

class JsonTable {
    constructor(element, settings) {

        // settings
        this.innerHTML = settings.innerHTML || 1;
        this.numberOfRow = settings.numberOfRow || 10;
        this.lang = settings.lang || 'tr-TR';
        this.numberCols = settings.numberCols || [];
        this.dateCols = settings.dateCols || [];
        this.sortBy = settings.sortBy || 0;
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
        this.filterWrappers = [];

        //creating DOM
        this.topPanel = document.createElement("div");
        this.bottomPanel = document.createElement("div");

        this.counter = document.createElement("span");
        this.pagination = document.createElement("div");

        this.searchbar = document.createElement("input");
        this.searchbar.classList.add("searchbar");
        
        this.statTable = document.createElement("table");
        this.statTable.classList.add("stat-table");

        this.searchbar.setAttribute("placeholder", this.localTexts["search"]);

        this.parent.append(this.topPanel);
        this.parent.append(this.tableWrapper);
        this.tableWrapper.append(this.table);
        this.parent.append(this.bottomPanel);

        this.topPanel.append(this.searchbar);
        this.bottomPanel.append(this.counter);
        this.bottomPanel.append(this.pagination);
        this.bottomPanel.append(this.statTable);

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

        // document.addEventListener("click", function (event) {
        //     if (event.target.closest(".showing-filters")) return
        //     document.querySelectorAll('.showing-filters').forEach(el => {
        //         el.classList.remove("showing-filters");
        //     });
        // })
        document.addEventListener("click", function (event) {
            if (event.target.closest(".showing-filters") || event.target.closest(".filter-container")) return
            document.querySelectorAll('.filter-wrapper').forEach(el => {
                el.classList.remove("visible");
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
                if(filter.value == "<empty>"){
                    return value == "" || value == null;
                }
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
            if (index == this.styleRow) {
                if (element != " ") {
                    if (element != " ") {
                        element.split('|').forEach((word) => {
                            row.classList.add(word.replace(" ", "-"));
                        })
                    }
                }
                return;
            }
            if (index == this.idRow) {
                row.setAttribute("id",element);
                return;
            }
            if (this.numberCols.indexOf(index) != -1) {
                element = parseFloat(element) || 0;
                element = element.toLocaleString(this.lang);
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

    calculateStats = function () {
        this.statTable.innerHTML = "<tr><th>" + this.localTexts["column"] + "</th><th>" + this.localTexts["total"] + "</th><th>" + this.localTexts["avg"] + "</th><th>" + this.localTexts["min"] + "</th><th>" + this.localTexts["max"] + "</th><th>" + this.localTexts["percentage"] +"</th><tr>";
    this.stats = [];
    this.numberCols.forEach((index) => {
        var sum = this.resultarray.reduce((accum, item) => accum + (parseFloat(Object.values(item)[index]) || 0), 0), index;
        var total_sum = this.data.reduce((accum, item) => accum + (parseFloat(Object.values(item)[index]) || 0), 0), index;

        var filteredStat = {
            name: Object.keys(this.resultarray[0])[index].replace("_format:number", ""),
            sum: sum,
            avg: sum / this.resultarray.length,
            min: Math.min(...this.resultarray.map(item => parseFloat(Object.values(item)[index] || 0))),
            max: Math.max(...this.resultarray.map(item => parseFloat(Object.values(item)[index] || 0))),
            total_sum: total_sum,
            total_avg: total_sum / this.data.length,
            total_min: Math.min(...this.data.map(item => parseFloat(Object.values(item)[index] || 0))),
            total_max: Math.max(...this.data.map(item => parseFloat(Object.values(item)[index] || 0))),
            percentage: sum / total_sum * 100,
        };
        this.stats.push(filteredStat);
    });
    this.stats.forEach((stat) => {
        let row = document.createElement("tr");
        let cell = document.createElement("td");
        cell.innerText = stat.name;
        row.append(cell);
        cell = document.createElement("td");
        cell.innerText = stat.sum.toLocaleString(this.lang) + " / " + stat.total_sum.toLocaleString(this.lang);
        row.append(cell);
        cell = document.createElement("td");
        cell.innerText = stat.avg.toLocaleString(this.lang) + " / " + stat.total_avg.toLocaleString(this.lang);
        row.append(cell);
        cell = document.createElement("td");
        cell.innerText = stat.min.toLocaleString(this.lang) + " / " + stat.total_min.toLocaleString(this.lang);
        row.append(cell);
        cell = document.createElement("td");
        cell.innerText = stat.max.toLocaleString(this.lang) + " / " + stat.total_max.toLocaleString(this.lang);
        row.append(cell);
        cell = document.createElement("td");
        cell.innerText = stat.percentage.toLocaleString(this.lang) + " %";
        row.append(cell);
        this.statTable.append(row);
    });
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

        
        this.calculateStats();
    }
}