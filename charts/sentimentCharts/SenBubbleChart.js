import { createDonutChart } from './SenDonutChart.js';

let currentFilter = "tags"; // Default filter type
let currentCategory = 0; // Default category type

let categories = ["Film & Animation", "Autos & Vehicles", "Music"]
// Set up the SVG canvas dimensions
const margin = { top: 30, right: 30, bottom: 30, left: 30 };
const width = 800; // Smaller width
const height = 600; // Smaller height

const svg = d3.select("#bubble")
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

// Define drag behavior for the Y-axis
const dragYAxis = d3.drag()
.on("drag", function (event) {
    // Calculate the new position for the Y-axis
    const newY = Math.max(0, Math.min(height, event.y)); // Keep within chart bounds
    d3.select(this).attr("transform", `translate(${xScale(0)}, ${newY - height})`); // Adjust position dynamically
})
.on("end", function (event) {
    // Adjust the Y-scale domain based on drag end position
    const newMaxY = yScale.invert(height - event.y); // Map pixel to data
    yScale.domain([0, newMaxY]); // Update domain of Y-scale
    
    // Redraw the Y-axis
    svg.select(".y-axis").call(d3.axisLeft(yScale));

    // Update bubble positions based on new Y-scale
    svg.selectAll("circle")
        .attr("cy", d => yScale(d.views));
});

// Bubble Plot Function
function createBubblePlot(filterType, categoryInt) {
    d3.csv("./data/sentiments_CAvideos_uniq.csv").then(data => {

        // Format and parse the data based on the filter type
        data.forEach(d => {
            d.sentiment = +d[`${filterType}_pos`] - +d[`${filterType}_neg`]; // Sentiment score
            d.views = +d.views; // Views
            d.engagement = +d.comment_count; // Engagement metric
            d.category_id = +d.category_id;
        });

        // Filter data by category if a category is selected
        if (categoryInt) {
            data = data.filter(d => d.category_id == categoryInt);
        }

        // Update scales
        xScale.domain([-1, 1]); // Sentiment range from -1 to 1
        yScale.domain([0, d3.max(data, d => d.views)]); // Views range from 0 to max views
        sizeScale.domain(d3.extent(data, d => d.engagement));

        // Clear old elements
        svg.selectAll("*").remove();
        
        // Add X-axis
        svg.append("g")
            .attr("transform", `translate(0, ${yScale(0)})`) // Position X-axis at y = 0
            .call(d3.axisBottom(xScale))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .text("Sentiment Score (Negative to Positive)");

        // Add Y-axis
        svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${xScale(0)}, 0)`) // Initial position
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("x", 0) // Adjust for padding
            .attr("y", -20) // Position above the axis
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .text("Views");

        let selectedBubble = null; // Keep track of the currently selected bubble

        // Add bubbles
        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.sentiment))
            .attr("cy", d => yScale(d.views))
            .attr("r", d => sizeScale(d.engagement))
            .attr("fill", "steelblue")
            .attr("opacity", 0.5)
            .on("mouseover", function () {
                d3.select(this)
                    .attr("fill", d => d.sentiment > 0.2 ? "green" : d.sentiment < -0.4 ? "red" : "orange")
                    .attr("opacity", 0.7);
            })
            .on("mouseout", function () {
                if (this !== selectedBubble) {
                    d3.select(this)
                        .attr("fill", "steelblue")
                        .attr("opacity", 0.5);
                }
            })
            .on("click", function (event, d) {
                // If there is a previously selected bubble and it's not the same as the currently clicked bubble
                if (selectedBubble && selectedBubble !== this) {
                    d3.select(selectedBubble)
                        .attr("fill", "steelblue") // Reset the previous bubble to blue
                        .attr("opacity", 0.5); // Reset the opacity of the previous bubble
                }
            
                // Update the selectedBubble to the currently clicked bubble
                selectedBubble = this;
            
                // Highlight the currently clicked bubble
                d3.select(this)
                    .attr("fill", d => d.sentiment > 0.2 ? "green" : d.sentiment < -0.4 ? "red" : "orange") // Highlight based on sentiment
                    .attr("opacity", 0.9); // Make the clicked bubble stand out
            
                // Display the tooltip
                tooltip.style("display", "block");
            
                // Clear previous tooltip content
                tooltip.selectAll("*").remove();
            
                // Add content to the tooltip
                tooltip.append("div")
                    .attr("class", "tooltip-title")
                    .html(`<strong>Sentiment scores for video ${filterType}</strong>`);
            
                tooltip.append("div")
                    .attr("class", "chart-container")
                    .style("display", "flex")
                    .style("justify-content", "center")
                    .style("align-items", "center")
                    .append("svg")
                    .attr("id", "donutChart")
                    .attr("width", 300)
                    .attr("height", 200);
            
                tooltip.append("div")
                    .attr("class", "video-title")
                    .html(`<strong>Title:</strong> ${d.title}`);

                tooltip.append("div")
                    .attr("class", "video-category")
                    .html(`<strong>Category:</strong> ${categories[categoryInt]}`);
            
                tooltip.append("div")
                    .attr("class", "video-likes")
                    .html(`<strong>Likes:</strong> ${d.likes}`);
            
                tooltip.append("div")
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
                if (selectedBubble) {
                    d3.select(selectedBubble)
                        .attr("fill", "steelblue")
                        .attr("opacity", 0.5);
                    selectedBubble = null;
                }
                tooltip.style("display", "none");
            }
        });


    });
}


// Update chart state
function updateState(newFilter, newCategory) {
    currentFilter = newFilter; // Update global filter
    currentCategory = newCategory;
    createBubblePlot(currentFilter, currentCategory); // Update bubble plot
}

// Initialize with default state
window.updateState = updateState;
updateState("tags", null);
