if (typeof currentFilter === 'undefined') {
    var currentFilter = "tags"; // Default filter type
  }
  
  function initTimeGrid() {
    // Create a dataset representing months
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
    // Create SVG
    const svg = d3.select("#timegrid")
      .append("svg")
      .attr("width", 400)
      .attr("height", 300); // Adjust height for 3 rows
  
    // Grid specs
    const cols = 4;
    const rows = 3; // 3 rows instead of 4
    const rectSize = 80;
    const padding = 5;
  
    // Append rect for each month
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
        d3.select(this).attr("fill", "red"); // Change color to red on click
        window.updateState(currentFilter, d); // Update chart with selected month
      });
  
    // Append text for each month
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