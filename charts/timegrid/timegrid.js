import { allRows } from "../dataLoader.js";
import { currentFilter, currentMonth } from "../state.js";

function initTimeGrid() {
  let data = allRows;
  // Parse the data
  data.forEach((d) => {
    d.views = +d.views;
    d.publish_time = new Date(d.publish_time);
  });

  // Calculate average views for each month
  const monthViews = d3.rollup(
    data,
    (v) => d3.mean(v, (d) => d.views),
    (d) => d.publish_time.getMonth()
  );
  const maxViews = d3.max(monthViews.values());

  // Create a color scale based on the average views using d3.schemeOrRd
  const colorScale = d3
    .scaleQuantize()
    .domain([0, maxViews])
    .range(d3.schemeOrRd[9]);

  // Either select existing SVG or create a new one if none exists
  let svg = d3.select("#timegrid").select("svg");
  if (svg.empty()) {
    svg = d3
      .select("#timegrid")
      .append("svg")
      .attr("width", 400)
      .attr("height", 350); // Adjust height to accommodate legend
  } else {
    // Clear out any existing elements
    svg.selectAll("*").remove();
  }

  // Add legend
  const legendWidth = 300;
  const legendHeight = 20;
  const legendX = 20; // Positioning for the legend
  const legendY = -10;

  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  const gradient = legend
    .append("defs")
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

  d3.schemeOrRd[9].forEach((color, i) => {
    gradient
      .append("stop")
      .attr("offset", `${(i / (d3.schemeOrRd[9].length - 1)) * 100}%`)
      .attr("stop-color", color);
  });

  legend
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#gradient)");

  const legendScale = d3
    .scaleLinear()
    .domain([0, maxViews])
    .range([0, legendWidth]);

  const legendAxis = d3
    .axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d3.format(".2s"));

  legend
    .append("g")
    .attr("class", "legend-axis")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);

  legend
    .append("text")
    .attr("x", 0)
    .attr("y", legendHeight + 35)
    .attr("text-anchor", "start")
    .attr("font-size", "12px")
    .text("Low Views");

  legend
    .append("text")
    .attr("x", legendWidth)
    .attr("y", legendHeight + 35)
    .attr("text-anchor", "end")
    .attr("font-size", "12px")
    .text("High Views");

  // Display months in a grid
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const cols = 4;
  const rectSize = 80;
  const padding = 5;

  // Month squares
  svg
    .selectAll("rect.month")
    .data(months)
    .enter()
    .append("rect")
    .attr("class", "month")
    .attr("x", (d, i) => (i % cols) * (rectSize + padding))
    .attr("y", (d, i) => Math.floor(i / cols) * (rectSize + padding) + 50) // Offset by 50 for legend
    .attr("width", rectSize)
    .attr("height", rectSize)
    .attr("fill", (d) => colorScale(monthViews.get(months.indexOf(d))))
    .on("click", function (event, d) {
      createDayGrid(d);
    });

  // Month labels
  svg
    .selectAll("text.month")
    .data(months)
    .enter()
    .append("text")
    .attr("class", "month")
    .attr("x", (d, i) => (i % cols) * (rectSize + padding) + rectSize / 2)
    .attr(
      "y",
      (d, i) => Math.floor(i / cols) * (rectSize + padding) + rectSize / 2 + 50
    ) // Offset by 50 for legend
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .text((d) => d);
}

function createDayGrid(month) {
  let data = allRows;
  // Parse the data
  data.forEach((d) => {
    d.views = +d.views;
    d.publish_time = new Date(d.publish_time);
  });

  // Calculate average views for each day in the selected month
  const monthIndex = new Date(Date.parse(month + " 1, 2018")).getMonth();
  const dayViews = d3.rollup(
    data.filter((d) => d.publish_time.getMonth() === monthIndex),
    (v) => d3.mean(v, (d) => d.views),
    (d) => d.publish_time.getDate()
  );
  const maxViews = d3.max(dayViews.values());

  // Create a color scale based on the average views using d3.schemeOrRd
  const colorScale = d3
    .scaleQuantize()
    .domain([0, maxViews])
    .range(d3.schemeOrRd[9]);

  const svg = d3.select("#timegrid").select("svg");
  // Wipe&Reset
  svg.selectAll("rect").remove();
  svg.selectAll("text").remove();
  svg.selectAll("g.legend-axis").remove();

  // Add legend
  const legendWidth = 300;
  const legendHeight = 20;
  const legendX = 20; // Positioning for the legend
  const legendY = -10;

  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  const gradient = legend
    .append("defs")
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

  d3.schemeOrRd[9].forEach((color, i) => {
    gradient
      .append("stop")
      .attr("offset", `${(i / (d3.schemeOrRd[9].length - 1)) * 100}%`)
      .attr("stop-color", color);
  });

  legend
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#gradient)");

  const legendScale = d3
    .scaleLinear()
    .domain([0, maxViews])
    .range([0, legendWidth]);

  const legendAxis = d3
    .axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d3.format(".2s"));

  legend
    .append("g")
    .attr("class", "legend-axis")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);

  legend
    .append("text")
    .attr("x", 0)
    .attr("y", legendHeight + 35)
    .attr("text-anchor", "start")
    .attr("font-size", "12px")
    .text("Low Views");

  legend
    .append("text")
    .attr("x", legendWidth)
    .attr("y", legendHeight + 35)
    .attr("text-anchor", "end")
    .attr("font-size", "12px")
    .text("High Views");

  // Setup day data, using 2018 for February
  const daysInMonth = new Date(
    2018,
    new Date(Date.parse(month + " 1, 2018")).getMonth() + 1,
    0
  ).getDate();
  const days = d3.range(1, daysInMonth + 1);
  const cols = 7;
  const rectSize = 50;
  const padding = 5;
  const offset = 50;

  // Append day squares
  svg
    .selectAll("rect.day")
    .data(days)
    .enter()
    .append("rect")
    .attr("class", "day")
    .attr("x", (d, i) => (i % cols) * (rectSize + padding) + 200)
    .attr(
      "y",
      (d, i) => Math.floor(i / cols) * (rectSize + padding) + 150 + offset
    )
    .attr("width", 0)
    .attr("height", 5000)
    .attr("fill", (d) => colorScale(dayViews.get(d)))
    .transition()
    .duration(1000)
    .attr("x", (d, i) => (i % cols) * (rectSize + padding))
    .attr("y", (d, i) => Math.floor(i / cols) * (rectSize + padding) + offset)
    .attr("width", rectSize)
    .attr("height", rectSize)
    .on("end", function () {
      // Click logic
      d3.select(this).on("click", function (event, d) {
        // Shift logic for zoom-out, really this just wipes + resets
        if (event.shiftKey) {
          svg.selectAll("*").remove();
          window.updateState(currentFilter);
          initTimeGrid();
        }
        // Brush selection for multiple days, this is also where we pass the data to the bubble chart.
        else {
          svg.selectAll("rect").attr("stroke", null).attr("stroke-width", null);

          d3.select(this).attr("stroke", "black").attr("stroke-width", 2);
          window.updateState(currentFilter, `${month} ${d}`);
        }
      });
    });

  // Append text labels
  svg
    .selectAll("text.day")
    .data(days)
    .enter()
    .append("text")
    .attr("class", "day")
    .attr("x", (d, i) => (i % cols) * (rectSize + padding) + rectSize / 2 + 200)
    .attr(
      "y",
      (d, i) =>
        Math.floor(i / cols) * (rectSize + padding) +
        rectSize / 2 +
        150 +
        offset
    )
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .text((d) => d)
    .transition()
    .duration(1000)
    .attr("x", (d, i) => (i % cols) * (rectSize + padding) + rectSize / 2)
    .attr(
      "y",
      (d, i) =>
        Math.floor(i / cols) * (rectSize + padding) + rectSize / 2 + offset
    );

  // Create the brush
  const brush = d3
    .brush()
    .extent([
      [0, 0],
      [400, 300],
    ])
    .on("end", brushed);

  svg.append("g").attr("class", "brush").call(brush);
  // Handle clicks on the brush, this is to maintain shiftclick functionality, same code as when generating the squares.
  d3.select(this).on("click", function (event, d) {
    if (event.shiftKey) {
      svg.selectAll("*").remove();
      window.updateState(currentFilter);
      initTimeGrid();
    } else {
      svg.selectAll("rect").attr("stroke", null).attr("stroke-width", null);
      d3.select(this).attr("stroke", "black").attr("stroke-width", 2);
      window.updateState(currentFilter, `${month} ${d}`);
    }
  });
  function brushed(event) {
    const selection = event.selection;
    if (!selection) return;

    const [[x0, y0], [x1, y1]] = selection;

    // Clear existing borders
    svg.selectAll("rect").attr("stroke", null).attr("stroke-width", null);

    // Filter squares fully within the brush area
    const selectedRect = svg
      .selectAll("rect")
      .filter(function () {
        const xVal = +d3.select(this).attr("x");
        const yVal = +d3.select(this).attr("y");

        // Compute overlap area
        const overlapWidth = Math.min(x1, xVal + rectSize) - Math.max(x0, xVal);
        const overlapHeight =
          Math.min(y1, yVal + rectSize) - Math.max(y0, yVal);

        // If either dimension is negative, no overlap
        if (overlapWidth <= 0 || overlapHeight <= 0) {
          return false;
        }

        const intersectionArea = overlapWidth * overlapHeight;
        const squareArea = rectSize * rectSize;

        // Require at least 30% coverage so that you don't need to fully encompass every square
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

initTimeGrid();
