import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Load CSV files, add metadata
const files = [
  {
    path: "./data/sentiments_CAvideos.csv",
    metadata_path: "./data/CA_category_id.json",
    country: "Canada",
  },
  {
    path: "./data/sentiments_GBvideos.csv",
    metadata_path: "./data/GB_category_id.json",
    country: "Great Britain",
  },
  {
    path: "./data/sentiments_USvideos.csv",
    metadata_path: "./data/US_category_id.json",
    country: "United States",
  },
];

// Loop through csv files -> add metadata -> and store in allCountryData array
const allCountryData = [];
for (const f of files) {
  let rows = await d3.csv(f.path);
  let metadata = await d3.json(f.metadata_path);

  // Create dict that maps from id to category name
  //  we need this to add category names to the arcs
  const catMap = {};
  for (const cat of metadata.items) {
    catMap[cat.id] = cat.snippet.title;
  }

  // Add category names
  rows = rows.map((row) => {
    return { ...row, category_name: catMap[row.category_id] };
  });

  // Collect data for this country
  allCountryData.push({ country: f.country, rows });
}

// Helper func that picks sentiment based on title
function getTitleSentiment(row) {
  const neg = +row.title_neg;
  const neu = +row.title_neu;
  const pos = +row.title_pos;

  const maxVal = Math.max(neg, neu, pos);

  if (maxVal === neg) return "Negative";
  if (maxVal === pos) return "Positive";
  return "Neutral"; // fallback is "Neutral"
}

// Our top level is "all countries".
// Then layers are: each country's name -> categories -> sentiment
const topLevel = {
  name: "All Countries",
  children: [], // will be filled with each country's node
};

// For every country
for (const country of allCountryData) {
  const countryName = country.country;
  const rows = country.rows; // actual data

  // Group by category_name
  const categoryMap = d3.group(rows, (d) => d.category_name); // map<category_name, rows>

  // For every layer we need to build groups
  const cat_children = [];
  for (const [catName, rowsInCat] of categoryMap.entries()) {
    // LAYER: category
    // group by sentiment
    const sen_groups = { Negative: [], Neutral: [], Positive: [] };

    for (const row of rowsInCat) {
      const sentiment = getTitleSentiment(row);
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

// Reduced dimensions so it’s not huge
const width = 600;
const height = 600;
const radius = width / 6;

const color = d3.scaleOrdinal(
  d3.quantize(d3.interpolateRainbow, data.children.length + 1)
);

const root = d3
  .hierarchy(data)
  .sum((d) => d.value)
  .sort((a, b) => b.value - a.value);

let selected = root;

d3.partition().size([2 * Math.PI, root.height + 1])(root);

root.each((d) => (d.current = d));

const arc = d3
  .arc()
  .startAngle((d) => d.x0)
  .endAngle((d) => d.x1)
  .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
  .padRadius(radius * 1.5)
  .innerRadius((d) => d.y0 * radius)
  .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));

// Create SVG container
const svg = d3
  .create("svg")
  .attr("viewBox", [-width / 2, -height / 2, width, height])
  .attr("width", width)
  .attr("height", height)
  .style("font", "10px sans-serif");

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

// Add SVG to DOM
document.getElementById("sunburstChart").appendChild(svg.node());

function clicked(event, p) {
  parent.datum(p.parent || root);
  selected = p;

  root.each((d) => {
    d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth),
    };
  });

  const t = svg.transition().duration(event.altKey ? 7500 : 750);

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
        console.log(d);
        // Only show extraText if this is sentiment node (depth == 3)
        // and  parent is the current selected node
        if (d.depth === 3 && d.parent === selected && d.data.extraText) {
          this.textContent = d.data.name + d.data.extraText;
        } else {
          this.textContent = d.data.name;
        }
      };
    });

  centerLabel.text(p.data.name);
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
