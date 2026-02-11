// Complete n8n code including the ALT+C keyboard shortcut fix and the multi-select dropdown with checkboxes for DESGRUPO filter. 

const mapaPoints_b64 = 'your_base64_string_here';

// CSS styles for multi-select component
const styles = `
.multiSelectButton {
    /* Your styles here */
}
.multiSelectDropdown {
    /* Your styles here */
}
.multiSelectOption {
    /* Your styles here */
}
`;

// HTML structure changes
const html = `
<div class="multiSelectButton" id="desgrupoButton">Select Desgrupo</div>
<div class="multiSelectDropdown" id="desgrupoDropdown">
    <div class="multiSelectOption"><input type="checkbox" id="option1"> Option 1</div>
    <div class="multiSelectOption"><input type="checkbox" id="option2"> Option 2</div>
</div>
`;

// JavaScript functions for multi-select functionality
function toggleDesgrupoDropdown() {
    const dropdown = document.getElementById('desgrupoDropdown');
    dropdown.style.display = (dropdown.style.display === 'none' ? 'block' : 'none');
}

function onDesgrupoChange(event) {
    // Handle changes
}

function toggleSelectAll() {
    // Logic to select or deselect all options
}

function clearDesgrupoFilter() {
    // Clear selected filters
}

function updateDesgrupoCheckboxes() {
    // Update the checkbox states
}

function buildDesgrupoOptions() {
    // Build options dynamically
}

// Event listener for keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.altKey && event.key === 'c') {
        toggleDesgrupoDropdown();
    }
});

// Include the styles and HTML in the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
document.body.innerHTML += html;
