import { createSunburstPlot } from "./sunburst.js";
import { createBubblePlot } from "./sentimentCharts/SenBubbleChart.js";

var currentFilter = "title";
var currentMonth = null;
var currentCountry = null;
var currentCategory = null;

// Update chart state
function updateState(newFilter, month = null, country = null, category = null) {
  let diffMap = {
    // To check which filters have changed
    currentFilter: newFilter !== currentFilter,
    currentMonth: month !== currentMonth,
    currentCountry: country !== currentCountry,
    currentCategory: category !== currentCategory,
  };

  currentFilter = newFilter; // Update global filter
  currentMonth = month; // Update global month filter
  currentCountry = country; // Update global country filter
  currentCategory = category; // Update global category filter
  createBubblePlot(
    currentFilter,
    currentMonth,
    currentCountry,
    currentCategory
  ); // Update bubble plot

  if (diffMap.currentFilter || diffMap.currentMonth) {
    // Only update sunburst plot if filter or month has changed
    createSunburstPlot(
      currentFilter,
      currentMonth,
      currentCountry,
      currentCategory
    );
  }

  if (diffMap.currentFilter) {
    const allFilters = ["title", "description", "tags"];

    allFilters.forEach((filter) => {
      if (filter !== currentFilter) {
        d3.select(`#${filter}Btn`).classed("active", false);
      }
    });

    d3.select(`#${currentFilter}Btn`).classed("active", true);
  }

  // update text
  d3.select("#layer").text(
    `${currentCountry ?? "All Countries"}/${currentCategory ?? "..."}`
  );
  d3.select("#dateFilter").text(currentMonth ?? "All Dates");

  console.log(
    "State updated:",
    currentFilter,
    currentMonth,
    currentCountry,
    currentCategory
  );
}

function updateFilterOnly(newFilter) {
  updateState(newFilter, currentMonth, currentCountry, currentCategory);
}

// Initialize with default state
window.updateState = updateState;
updateState("title");

window.updateFilterOnly = updateFilterOnly;

export { currentFilter, currentMonth, currentCountry, currentCategory };
