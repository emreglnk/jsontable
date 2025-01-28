# JsonTable

A lightweight, feature-rich JavaScript library for creating interactive data tables from JSON data. JsonTable provides sorting, filtering, pagination, and statistical analysis capabilities out of the box.

## Features

- 📊 Dynamic table generation from JSON data
- 🔍 Advanced filtering with multiple operators (equals, greater than, less than, between, includes)
- 🔄 Column sorting
- 📑 Pagination
- 📈 Automatic statistics calculation for numeric columns
- 🔎 Global search functionality
- 🌐 Localization support
- 🎨 Customizable styling

## Installation

Include the JsonTable library in your HTML file:

```html
<script src="jsontable.js"></script>
```

## Usage

### Basic Implementation

```javascript
// Initialize the table
const table = new JsonTable('#tableElement', {
    numberOfRow: 10,  // Number of rows per page
    lang: 'tr-TR',   // Localization setting
    columnTypes: {    // Optional: Specify column types
        price: 'number',
        quantity: 'number'
    }
});

// Load data
const data = [
    { name: "Product A", price: 100, quantity: 5 },
    { name: "Product B", price: 150, quantity: 3 }
];
table.loadData(data);
```

### HTML Structure

```html
<div id="tableElement"></div>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| numberOfRow | number | 10 | Number of rows per page |
| lang | string | 'tr-TR' | Localization setting |
| columnTypes | object | {} | Define column types (e.g., 'number' for statistical calculations) |
| innerHTML | boolean | true | Use innerHTML for cell content |
| sortBy | number | 0 | Default column index for sorting |
| order | number | 1 | Default sort order (1: ascending, -1: descending) |

## Features in Detail

### Automatic Statistics

JsonTable automatically calculates statistics for numeric columns:
- Total (filtered / total)
- Average (filtered / total)
- Minimum (filtered / total)
- Maximum (filtered / total)
- Percentage of filtered sum compared to total

### Filtering

Multiple filter types are available:
- Equal to (eq)
- Greater than (gt)
- Less than (lt)
- Between (bt)
- Includes (inc)
- Select (select)

### Search

Global search functionality that filters across all columns.

## Events

The table automatically updates when:
- Data is loaded
- Filters are applied
- Search is performed
- Page is changed
- Number of rows is changed

## Styling

The table generates with the following CSS classes:
- `.table-wrapper`: Main container
- `.jsontable`: Table element
- `.stat-table`: Statistics table
- `.searchbar`: Search input
- `.pagination-wrapper`: Pagination container

## Browser Support

Compatible with all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## License

MIT License - feel free to use in your projects!
