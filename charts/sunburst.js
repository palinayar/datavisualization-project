import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { filterByMonth } from "./sentimentCharts/SenBubbleChart.js";
import { allCountryData } from "./dataLoader.js";
import {
  currentFilter,
  currentMonth,
  currentCountry,
  currentCategory,
} from "./state.js";

// Reduced dimensions so it’s not huge
const width = 600;
const height = 600;
const radius = width / 6;

let selected; // Current selected layer
let country = null; // Current selected country, if any

// Create SVG container
const svg = d3
  .select("#sunburstChart")
  .attr("viewBox", [-width / 2, -height / 2, width, height])
  .attr("width", width)
  .attr("height", height)
  .style("font", "12px sans-serif");

// Helper func that picks sentiment, given property
function getSentiment(row, prop = "title") {
  const neg = +row[prop + "_neg"];
  const neu = +row[prop + "_neu"];
  const pos = +row[prop + "_pos"];

  const maxVal = Math.max(neg, neu, pos);

  if (maxVal === neg) return "Negative";
  if (maxVal === pos) return "Positive";
  return "Neutral"; // fallback is "Neutral"
}

function createSunburstPlot(
  filterType,
  month,
  country = null,
  category = null
) {
  console.log("Rendering sunburst plot...");

  // Our top level is "all countries".
  // Then layers are: each country's name -> categories -> sentiment
  const topLevel = {
    name: "All Countries",
    children: [], // will be filled with each country's node
  };

  // For every country
  for (const country of allCountryData) {
    const countryName = country.country;
    let rows = country.rows; // actual data

    if (month) {
      rows = filterByMonth(rows, month);
      console.log(month, rows.length);
    }

    // Group by category_name
    const categoryMap = d3.group(rows, (d) => d.category_name); // map<category_name, rows>

    // For every layer we need to build groups
    const cat_children = [];
    for (const [catName, rowsInCat] of categoryMap.entries()) {
      // LAYER: category
      // group by sentiment
      const sen_groups = { Negative: [], Neutral: [], Positive: [] };

      for (const row of rowsInCat) {
        const sentiment = getSentiment(row, filterType ? filterType : "title");
        sen_groups[sentiment].push(row);
      }

      // Construct sent. children
      const sen_children = [];
      for (const [sLabel, sVideos] of Object.entries(sen_groups)) {
        // LAYER: sentiment

        // NOTE: -> If you want to show videos as leaves, uncomment this block
        //  but it will become VERY laggy!
        //
        /// Each video is a leaf
        /// const videoNodes = sVideos.map((video) => ({
        ///   name: video.video_id, // or video.title if you prefer
        ///   value: 1, // all videos have equal weight
        /// }));

        sen_children.push({
          name: sLabel,
          extraText: ` (${((100 * sVideos.length) / rowsInCat.length).toFixed(
            2
          )}%)`,
          // children: videoNodes,
          value: sVideos.length,
        });
      }

      // Sentiments per category
      cat_children.push({
        name: catName,
        children: sen_children,
      });
    }

    // Create node for this country
    topLevel.children.push({
      name: countryName,
      children: cat_children,
    });
  }

  const data = topLevel; // the hierarchical data

  const color = d3.scaleOrdinal(
    d3.quantize(d3.interpolateRainbow, data.children.length + 1)
  );

  const root = d3
    .hierarchy(data)
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);

  selected = root;

  d3.partition().size([2 * Math.PI, root.height + 1])(root);

  root.each((d) => (d.current = d));

  // reset svg
  svg.selectAll("*").remove();

  const arc = d3
    .arc()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius((d) => d.y0 * radius)
    .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));

  const centerLabel = svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .style("pointer-events", "none")
    .style("font-size", "14px")
    .text(root.data.name);

  const path = svg
    .append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
    .attr("fill", (d) => {
      // Use custom colors if we're at the sentiment level
      if (d.depth === 3) {
        if (d.data.name === "Negative") return "red";
        if (d.data.name === "Neutral") return "gray";
        if (d.data.name === "Positive") return "green";
      }

      // Otherwise color by top level parent
      while (d.depth > 1) d = d.parent;
      return color(d.data.name);
    })
    .attr("fill-opacity", (d) =>
      arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0
    )
    .attr("pointer-events", (d) => (arcVisible(d.current) ? "auto" : "none"))
    .attr("d", (d) => arc(d.current));

  // Click to zoom in/out if node has children
  path
    .filter((d) => d.children)
    .style("cursor", "pointer")
    .on("click", clicked);

  // Title tooltips
  const format = d3.format(",d");
  path.append("title").text(
    (d) =>
      d
        .ancestors()
        .map((a) => a.data.name)
        .reverse()
        .join("/") + `\n${format(d.value)}`
  );

  // Labels
  const label = svg
    .append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .style("user-select", "none")
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text")
    .attr("dy", "0.35em")
    .attr("fill-opacity", (d) => +labelVisible(d.current))
    .attr("transform", (d) => labelTransform(d.current))
    .text((d) => {
      return d.data.name;
    });

  // Center circle for zooming out
  const parent = svg
    .append("circle")
    .datum(root)
    .attr("r", radius)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("click", clicked);

  function clicked(event, p) {
    parent.datum(p.parent || root);
    selected = p;

    root.each((d) => {
      d.target = {
        x0:
          Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1:
          Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth),
      };
    });

    const useTransition = !event.disableTransitions;
    const t = useTransition
      ? svg.transition().duration(event.altKey ? 7500 : 750)
      : null;

    // We only use transitions if the user actually clicked on it
    if (useTransition) {
      // Update arcs
      path
        .transition(t)
        .tween("data", (d) => {
          const i = d3.interpolate(d.current, d.target);
          return (t) => (d.current = i(t));
        })
        .filter(function (d) {
          return +this.getAttribute("fill-opacity") || arcVisible(d.target);
        })
        .attr("fill-opacity", (d) =>
          arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0
        )
        .attr("pointer-events", (d) => (arcVisible(d.target) ? "auto" : "none"))
        .attrTween("d", (d) => () => arc(d.current));

      // Update labels
      label
        .filter(function (d) {
          return +this.getAttribute("fill-opacity") || labelVisible(d.target);
        })
        .transition(t)
        .attr("fill-opacity", (d) => +labelVisible(d.target))
        .attrTween("transform", (d) => () => labelTransform(d.current))
        .tween("text", function (d) {
          return () => {
            // Only show extraText if this is sentiment node (depth == 3)
            // and  parent is the current selected node
            if (d.depth === 3 && d.parent === selected && d.data.extraText) {
              this.textContent = d.data.name + d.data.extraText;
            } else {
              this.textContent = d.data.name;
            }
          };
        });
    } else {
      root.each((d) => (d.current = d.target));

      path
        .attr("fill-opacity", (d) =>
          arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0
        )
        .attr("pointer-events", (d) => (arcVisible(d.target) ? "auto" : "none"))
        .attr("d", (d) => arc(d.current));

      label
        .attr("fill-opacity", (d) => +labelVisible(d.target))
        .attr("transform", (d) => labelTransform(d.current))
        .text((d) => {
          if (d.depth === 3 && d.parent === selected && d.data.extraText) {
            return d.data.name + d.data.extraText;
          }
          return d.data.name;
        });
    }

    centerLabel.text(p.data.name);

    let cat = null;

    if (p.depth === 0) {
      country = null;
      cat = null;
    } else if (p.depth === 1) {
      country = p.data.name;
    } else if (p.depth === 2) {
      country = p.parent.data.name;
      cat = p.data.name;
    }

    window.updateState(currentFilter, currentMonth, country, cat);
  }

  function arcVisible(d) {
    // Show arcs only in [1..3] levels
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
    // Show labels only if there's enough space
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  }

  function labelTransform(d) {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    const y = ((d.y0 + d.y1) / 2) * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }

  if (country) {
    // Find the country
    const countryNode = root.children.find(
      (d) => d.data.name === country && d.depth === 1
    );

    if (countryNode) {
      clicked(
        {
          altKey: false,
          disableTransitions: true,
        },
        countryNode
      );

      // Find cateegory (if given)
      if (category) {
        const categoryNode = countryNode.children?.find(
          (d) => d.data.name === category && d.depth === 2
        );

        if (categoryNode) {
          clicked(
            {
              altKey: false,
              disableTransitions: true,
            },
            categoryNode
          );
        }
      }
    }
  }
}

createSunburstPlot();

export { createSunburstPlot };
