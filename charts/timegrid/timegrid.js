// Wipe filter, ensure its cleared
if (typeof currentFilter === 'undefined') {
  var currentFilter = "tags";
}

function initTimeGrid() {
  // Create the svg, if already exists, clear it
  let svg = d3.select("#timegrid").select("svg");
  if (svg.empty()) {
    svg = d3.select("#timegrid")
      .append("svg")
      .attr("width", 400)
      .attr("height", 300);
  } else {
    svg.selectAll("*").remove();
  }

  // Initliaze constants, including months
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
  // Wipe&Reset
  svg.selectAll("rect").remove();
  svg.selectAll("text").remove();

  // Setup day data, using 2018 for febuary
  const daysInMonth = new Date(
    2018,
    new Date(Date.parse(month + " 1, 2018")).getMonth() + 1,
    0
  ).getDate();
  const days = d3.range(1, daysInMonth + 1);
  const cols = 7;
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
      // Click logic
      d3.select(this).on("click", function(event, d) {
        //Shift logic for zoom-out, really this just wipes + resets
        if (event.shiftKey) {
          svg.selectAll("*").remove();
          window.updateState(currentFilter);
          initTimeGrid();
        } 
        // Brush selection for multiple days, this is also where we pass the data to the bubble chart.
        else {
          svg.selectAll("rect")
            .attr("stroke", null)
            .attr("stroke-width", null);

          d3.select(this)
            .attr("stroke", "black")
            .attr("stroke-width", 2);
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

// Create the brush
const brush = d3.brush()
  .extent([[0, 0], [400, 300]])
  .on("end", brushed);

svg.append("g")
  .attr("class", "brush")
  .call(brush);

// Handle clicks on the brush, this is to maintain shiftclick functionality, same code as above
d3.select(this).on("click", function(event, d) {
  if (event.shiftKey) {
    svg.selectAll("*").remove();
    window.updateState(currentFilter);
    initTimeGrid();
  } else {
    svg.selectAll("rect")
      .attr("stroke", null)
      .attr("stroke-width", null);
    d3.select(this)
      .attr("stroke", "black")
      .attr("stroke-width", 2);
    window.updateState(currentFilter, `${month} ${d}`);
  }
});

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

      // Require at least 30% coverage so that you dont need to fully encompass every square
      return intersectionArea >= 0.3 * squareArea;
    })
    .attr("stroke", "black")
    .attr("stroke-width", 2);

    const brushedDays = selectedRect.data();

  // Combine all brushed days into a string to pass along for the filters
  if (brushedDays.length > 0) {
    const joinedDays = brushedDays.join(",");
    window.updateState(currentFilter, `${month} ${joinedDays}`);
  }

  // Clear the brush selection if desired
  svg.select(".brush").call(brush.move, null);
}


}
