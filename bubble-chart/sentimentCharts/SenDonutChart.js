function createDonutChart(containerId, sentimentData) {
    // Dimensions and radius for the chart
    const width = 200;
    const height = 200;
    const radius = Math.min(width, height) / 2;

    // Clear existing chart
    d3.select(containerId).selectAll("*").remove();

    // Create SVG container
    const svg = d3.select(containerId)
        .attr("width", width + 100) // Extra space for the legend
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Arc generator
    const arc = d3.arc()
        .innerRadius(radius - 50) // Inner radius for the donut hole
        .outerRadius(radius); // Outer radius for the arcs

    // Pie generator
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

    // Draw arcs
    svg.selectAll("path")
        .data(pie(sentimentData))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => d.data.color);

    // Add percentage text inside arcs
    svg.selectAll(".percentage")
        .data(pie(sentimentData))
        .enter()
        .append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", "0.35em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "white")
        .text(d => `${Math.round(d.data.value * 100)}%`);

    // Add legend to the right of the chart
     const legend = d3.select(containerId)
     .append("g")
     .attr("class", "legend")
     .attr("transform", `translate(${width + 20}, 120)`); // Adjust position

    // Append legend items
    legend.selectAll(".legend-item")
        .data(sentimentData)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`) // Spacing between legend items
        .each(function (d) {
            // Add colored squares
            d3.select(this)
                .append("circle")
                .attr("cx", 5) 
                .attr("cy", 5) 
                .attr("r", 5) 
                .attr("fill", d.color);

            // Add text labels
            d3.select(this)
                .append("text")
                .attr("x", 15)
                .attr("y", 10)
                .style("font-size", "12px")
                .style("alignment-center", "middle") // Vertically align text with rectangles
                .text(d.label);
        });
}

export {createDonutChart}
