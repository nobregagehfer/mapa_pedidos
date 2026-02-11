// Updated JavaScript code for mapa_v7_1_completo.js with critical changes applied

// Change keyboard shortcuts
const keyboardShortcuts = {
    ...
    "Alt+C": "Action to trigger"
};

// Replace filterSel with multi-select dropdown for DESGRUPO filter
const desgropoFilter = document.createElement('select');
desgropoFilter.multiple = true;
// Add checkboxes for each option in the multi-select
const options = ['Option1', 'Option2', 'Option3'];
options.forEach(opt => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = opt;
    const label = document.createElement('label');
    label.textContent = opt;
    desgropoFilter.appendChild(checkbox);
    desgropoFilter.appendChild(label);
});

// Add CSS for multi-select components
const style = document.createElement('style');
style.innerHTML = `
.select-multi { /* Style */ }
`;
document.head.appendChild(style);

// Change activeDesgrupo to a Set
const activeDesgrupos = new Set();

// Update buildDesgrupoOptions and create new functions for multi-select
function buildDesgrupoOptions() {
    // Logic for building multi-select options goes here
}

function onMultiSelectChange(event) {
    // Logic for handling changes in multi-select
}

// Update button label
const button = document.getElementById('myButton');
button.textContent = 'Alt+C';
// Update hints accordingly
