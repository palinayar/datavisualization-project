// Ensure a default filter
if (typeof currentFilter === 'undefined') {
  var currentFilter = "tags";
}

function initTimeGrid() {
  // Either select existing SVG or create a new one if none exists
  let svg = d3.select("#timegrid").select("svg");
  if (svg.empty()) {
    svg = d3.select("#timegrid")
      .append("svg")
      .attr("width", 400)
      .attr("height", 300);
  } else {
    // Clear out any existing elements
    svg.selectAll("*").remove();
  }

  // Display months in a grid
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const cols = 4;
  const rectSize = 80;
  const padding = 5;

  // Month squares
  svg.selectAll("rect")
    .data(months)
    .enter()
    .append("rect")
    .attr("x", (d, i) => (i % cols) * (rectSize + padding))
    .attr("y", (d, i) => Math.floor(i / cols) * (rectSize + padding))
    .attr("width", rectSize)
    .attr("height", rectSize)
    .attr("fill", "steelblue")
    .on("click", function(event, d) {
      createDayGrid(d);
    });

  // Month labels
  svg.selectAll("text")
    .data(months)
    .enter()
    .append("text")
    .attr("x", (d, i) => (i % cols) * (rectSize + padding) + rectSize / 2)
    .attr("y", (d, i) => Math.floor(i / cols) * (rectSize + padding) + rectSize / 2)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .text(d => d);
}

function createDayGrid(month) {
  const svg = d3.select("#timegrid").select("svg");
  // Remove old squares & text
  svg.selectAll("rect").remove();
  svg.selectAll("text").remove();

  // Setup day data
  const daysInMonth = new Date(
    2023,
    new Date(Date.parse(month + " 1, 2023")).getMonth() + 1,
    0
  ).getDate();
  const days = d3.range(1, daysInMonth + 1);
  const cols = 7; // for days of the week
  const rectSize = 50;
  const padding = 5;

  // Append day squares
  svg.selectAll("rect")
    .data(days)
    .enter()
    .append("rect")
    .attr("x", (d, i) => (i % cols) * (rectSize + padding) + 200)
    .attr("y", (d, i) => Math.floor(i / cols) * (rectSize + padding) + 150)
    .attr("width", 0)
    .attr("height", 0)
    .attr("fill", "steelblue")
    .transition()
    .duration(1000)
    .attr("x", (d, i) => (i % cols) * (rectSize + padding))
    .attr("y", (d, i) => Math.floor(i / cols) * (rectSize + padding))
    .attr("width", rectSize)
    .attr("height", rectSize)
    .on("end", function() {
      // Single unified click handler for shift-click or normal click
      d3.select(this).on("click", function(event, d) {
        if (event.shiftKey) {
          // Remove days and re-init
          svg.selectAll("*").remove();
          window.updateState(currentFilter);
          initTimeGrid();
        } else {
          // Remove black border from all squares
          svg.selectAll("rect")
            .attr("stroke", null)
            .attr("stroke-width", null);

          // Add black border to newly selected square
          d3.select(this)
            .attr("stroke", "black")
            .attr("stroke-width", 2);

          // Single day update
          window.updateState(currentFilter, `${month} ${d}`);
        }
      });
    });

  // Append text labels
  svg.selectAll("text")
    .data(days)
    .enter()
    .append("text")
    .attr("x", (d, i) => (i % cols) * (rectSize + padding) + rectSize / 2 + 200)
    .attr("y", (d, i) => Math.floor(i / cols) * (rectSize + padding) + rectSize / 2 + 150)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .text(d => d)
    .transition()
    .duration(1000)
    .attr("x", (d, i) => (i % cols) * (rectSize + padding) + rectSize / 2)
    .attr("y", (d, i) => Math.floor(i / cols) * (rectSize + padding) + rectSize / 2);

  // --------- Add a brush for multi-day selection --------------
  const brush = d3.brush()
    .extent([[0, 0], [400, 300]]) // match SVG width & height
    .on("end", brushed);

  svg.append("g")
    .attr("class", "brush")
    .call(brush);

  function brushed(event) {
    const selection = event.selection;
    if (!selection) return;

    const [[x0, y0], [x1, y1]] = selection;

    // Clear existing borders
    svg.selectAll("rect")
      .attr("stroke", null)
      .attr("stroke-width", null);

    // Filter squares fully within the brush area
    const selectedRect = svg.selectAll("rect")
      .filter(function() {
        const xVal = +d3.select(this).attr("x");
        const yVal = +d3.select(this).attr("y");
  
        // Compute overlap area
        const overlapWidth = Math.min(x1, xVal + rectSize) - Math.max(x0, xVal);
        const overlapHeight = Math.min(y1, yVal + rectSize) - Math.max(y0, yVal);
  
        // If either dimension is negative, no overlap
        if (overlapWidth <= 0 || overlapHeight <= 0) {
          return false;
        }
  
        const intersectionArea = overlapWidth * overlapHeight;
        const squareArea = rectSize * rectSize;
  
        // Require at least 30% coverage
        return intersectionArea >= 0.3 * squareArea;
      })
      .attr("stroke", "black")
      .attr("stroke-width", 2);

    // Get all of the brushed days from their bound data
    const brushedDays = selectedRect.data();

    // Combine all brushed days into a single parameter string
    // e.g., "Jan 1,2,3"
    if (brushedDays.length > 0) {
      const joinedDays = brushedDays.join(",");
      window.updateState(currentFilter, `${month} ${joinedDays}`);
    }

    // Clear the brush selection if desired
    svg.select(".brush").call(brush.move, null);
  }
}
