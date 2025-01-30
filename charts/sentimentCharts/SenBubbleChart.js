import { allRows } from "../helpers/dataLoader.js";
import { currentFilter, currentMonth } from "../helpers/state.js";
import { createSunburstPlot } from "../sunburst/sunburst.js";
import { createDonutChart } from "./SenDonutChart.js";

// Set up the SVG canvas dimensions
const margin = { top: 30, right: 0, bottom: 30, left: 0 };
const width = 1000;
const height = 800;

const svg = d3
  .select("#bubble")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Adjust scales
const xScale = d3.scaleLinear().range([0, width - margin.left - margin.right]);
const yScale = d3.scaleLinear().range([height - margin.top - margin.bottom, 0]);
const sizeScale = d3.scaleSqrt().range([2, 20]);

// Create tooltip
const tooltip = d3.select("#tooltip");

function filterByMonth(data, month) {
  const [selectedMonth, daysString] = month.split(" ");
  const monthIndex = new Date(
    Date.parse(selectedMonth + " 1, 2018")
  ).getMonth();
  // Handles multiple days
  if (daysString) {
    const dayList = daysString.split(",").map(Number);
    return data.filter(
      (d) =>
        d.publish_time.getMonth() === monthIndex &&
        dayList.includes(d.publish_time.getDate())
    );
  } else {
    // Filter by month only
    return data.filter((d) => d.publish_time.getMonth() === monthIndex);
  }
}

function resetBubbles() {
  svg.selectAll("circle").attr("fill", "steelblue").attr("opacity", 0.6);
}

function setOtherBubblesOpacity(selectedBubble) {
  svg
    .selectAll("circle")
    .filter(function () {
      return this !== selectedBubble; // Select all bubbles except the one clicked
    })
    .attr("opacity", 0.3);
}

// Bubble Plot Function
async function createBubblePlot(filterType, month, country, category) {
  let data = allRows;

  // Format and parse the data based on the filter type
  data.forEach((d) => {
    d.sentiment = +d[`${filterType}_pos`] - +d[`${filterType}_neg`]; // Sentiment score
    d.views = +d.views; // Views
    //d.engagement = +d.comment_count; // Engagement metric
    d.engagement = +d.comment_count + d.likes / 10 + d.dislikes / 10;
    d.publish_time = new Date(d.publish_time); // Parse publish_time
  });

  // Filter data by month if a month is selected (currently only days are selected, month selection is broken)
  if (month) {
    data = filterByMonth(data, month);
  }

  if (country) {
    data = data.filter((d) => d.country === country);
  }

  if (category) {
    data = data.filter((d) => d.category_name === category);
  }

  // Update scales
  xScale.domain([-1, 1]); // Sentiment range from -1 to 1
  yScale.domain([0, d3.max(data, (d) => d.views)]);
  sizeScale.domain(d3.extent(data, (d) => d.engagement));

  // Clear old elements
  svg.selectAll("*").remove();

  // Add X-axis
  svg
    .append("g")
    .attr("transform", `translate(0, ${yScale(0)})`)
    .call(d3.axisBottom(xScale))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .text("Sentiment Score (Negative to Positive)");

  // Add Y-axis
  svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${xScale(0)}, 0)`)
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("x", 0)
    .attr("y", -20)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .text("Views");

  let selectedBubble = null; // Keep track of the currently selected bubble

  // Add bubbles
  svg
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.sentiment))
    .attr("cy", (d) => yScale(d.views))
    .attr("r", (d) => sizeScale(d.engagement))
    .attr("fill", "steelblue")
    .attr("opacity", 0.6)
    .on("mouseover", function () {
      d3.select(this).attr("fill", (d) =>
        d.sentiment > 0.2 ? "green" : d.sentiment < -0.4 ? "red" : "orange"
      );
    })
    .on("mouseout", function () {
      if (this !== selectedBubble) {
        if (selectedBubble) {
          // Keep this bubble at 0.3 if a bubble is selected
          d3.select(this).attr("fill", "steelblue").attr("opacity", 0.3);
        } else {
          // Reset to normal opacity if no bubble is selected
          d3.select(this).attr("fill", "steelblue").attr("opacity", 0.6);
        }
      }
    })
    .on("click", function (event, d) {
      if (selectedBubble === this) {
        // Deselect bubble if clicked again
        resetBubbles();
        selectedBubble = null;
        tooltip.style("display", "none");
        return;
      }

      // If there was a previously selected bubble
      if (selectedBubble) {
        d3.select(selectedBubble)
          .attr("fill", "steelblue") // Reset previous bubble to blue
          .attr("opacity", 0.6); // Reset opacity to default
      }

      // Update the selectedBubble to the currently clicked bubble
      selectedBubble = this;

      // Highlight the currently clicked bubble
      d3.select(this)
        .attr("fill", (d) =>
          d.sentiment > 0.2 ? "green" : d.sentiment < -0.4 ? "red" : "orange"
        )
        .attr("opacity", 0.9); // Make the clicked bubble stand out

      // Set other bubbles to opacity 0.3
      setOtherBubblesOpacity(this);

      tooltip.style("display", "block");

      // Clear previous tooltip content
      tooltip.selectAll("*").remove();

      // Add content to the tooltip
      tooltip
        .append("div")
        .attr("class", "tooltip-title")
        .html(`<strong>Sentiment scores for video ${filterType}</strong>`);

      tooltip
        .append("div")
        .attr("class", "chart-container")
        .style("display", "flex")
        .style("justify-content", "center")
        .style("align-items", "center")
        .append("svg")
        .attr("id", "donutChart")
        .attr("width", 300)
        .attr("height", 200);

      tooltip
        .append("div")
        .attr("class", "video-title")
        .html(`<strong>Title:</strong> ${d.title}`);

      tooltip
        .append("div")
        .attr("class", "video-category")
        .html(`<strong>Category:</strong> ${d.category_name}`);

      tooltip
        .append("div")
        .attr("class", "video-likes")
        .html(`<strong>Likes:</strong> ${d.likes}`);

      tooltip
        .append("div")
        .attr("class", "video-dislikes")
        .html(`<strong>Dislikes:</strong> ${d.dislikes}`);

      const sentimentData = [
        { label: "Positive", value: d[`${filterType}_pos`], color: "green" },
        { label: "Neutral", value: d[`${filterType}_neu`], color: "orange" },
        { label: "Negative", value: d[`${filterType}_neg`], color: "red" },
      ];

      createDonutChart("#donutChart", sentimentData);

      // Get tooltip dimensions
      const tooltipWidth = tooltip.node().offsetWidth;
      const tooltipHeight = tooltip.node().offsetHeight;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // Calculate initial tooltip position
      let left = event.pageX + 10;
      let top = event.pageY + 10;

      // Adjust position to fit within the viewport
      if (left + tooltipWidth > screenWidth) {
        left = event.pageX - tooltipWidth - 10; // Shift to the left
      }
      if (top + tooltipHeight > screenHeight) {
        top = event.pageY - tooltipHeight - 10; // Shift above
      }

      // Apply adjusted position
      tooltip.style("left", `${left}px`).style("top", `${top}px`);
    });

  // Hide tooltip when clicking outside
  d3.select("body").on("click", function (event) {
    if (!event.target.closest("circle") && !event.target.closest(".tooltip")) {
      resetBubbles();
      selectedBubble = null;
      tooltip.style("display", "none");
    }
  });
}

export { createBubblePlot, currentFilter, filterByMonth };
