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

  // Add category names + country
  rows = rows.map((row) => {
    return {
      ...row,
      category_name: catMap[row.category_id],
      country: f.country,
    };
  });

  // FIXME:
  // temporary speedup for debugging, work with 25% of data
  rows = rows.slice(0, Math.floor(rows.length / 4));

  // Collect data for this country
  allCountryData.push({ country: f.country, rows });
}

const allRows = allCountryData.flatMap((d) => d.rows);

export { allCountryData, allRows };
