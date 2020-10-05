// Setting footer date
document.getElementById("Date").textContent = new Date().getFullYear();

//   Accessing svg
const svg = d3.select("svg");

//   Creating tooltip
const tooltip = d3.select("body").append("div")
  .style("opacity", 0)
  .attr("class", "tooltip")
  .attr("id", "tooltip");

async function main() {

  //   Fetching US education data
  const eduResp = await fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json');

  //   Fetching US counties data
  const usResp = await fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json');

  //   Parsing the data from the APIs
  const education = await eduResp.json();
  const usCounties = await usResp.json();

  // Crate a geo path
  const path = d3.geoPath();

  //   Create color scale and scheme
  const minEdu = d3.min(education, e => e.bachelorsOrHigher);
  const maxEdu = d3.max(education, e => e.bachelorsOrHigher);

  //   Generating color scale
  const colorScale = d3.scaleThreshold()
    .domain(d3.range(minEdu, maxEdu, (maxEdu - minEdu) / 8))
    .range(d3.schemeOranges[9]);

  //   Creat the Map
  svg.append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(usCounties, usCounties.objects.counties).features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "county")
    .attr("data-fips", d => d.id)
    .attr("fill", d => {
      let result = education.filter(ed => ed.fips === d.id);
      return result[0] ? colorScale(result[0].bachelorsOrHigher) : 0;
    })
    .attr("data-education", (d) => {
      let result = education.filter(ed => ed.fips === d.id);
      return result[0] ? result[0].bachelorsOrHigher : 0;
    })
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1);

      // Adding data education attribute
      tooltip.attr("data-education", () => {
        let result = education.filter(ed => ed.fips === d.id);
        return result[0] ? result[0].bachelorsOrHigher : 0;
      });

      // Setting content for tooltip
      tooltip.html(() => {
        let result = education.filter(ed => ed.fips === d.id);
        if (result[0]) {
          return result[0].area_name + " - " + result[0].state + ", " + result[0].bachelorsOrHigher + "%";
        }
        return 0;
      });

      // Choosing spot for tooltip
      tooltip.style("left", (event.pageX + 14) + "px");
      tooltip.style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  // Drawing line between states
  svg.append('path')
    .datum(
      topojson.mesh(usCounties, usCounties.objects.states, function (a, b) {
        return a !== b;
      })
    )
    .attr('class', 'states')
    .attr('d', path);

  // Generating legend
  const legendHeight = 15;
  const legendWidth = 300 / 8;

  // Creating legend
  const legend = svg.append("g")
    .attr("id", "legend");

  // Drawing the color legends 
  legend.selectAll("rect")
    .data(colorScale.domain())
    .enter()
    .append("rect")
    .attr("height", legendHeight)
    .attr("width", legendWidth)
    .attr("transform", `translate(${svg.attr("width") - 380},${legendHeight / 2})`)
    .attr("x", (c, i) => i * legendWidth)
    .attr("y", 0)
    .attr("fill", c => colorScale(c));

  //   Creating the Legend Scale
  const legendScale = d3.scaleLinear()
    .domain(d3.range(minEdu, maxEdu, (maxEdu - minEdu) / 8))
    .range(d3.range(0, 300, legendWidth));

  //   creating legend axis
  const legendAxis = d3.axisBottom(legendScale).tickValues(colorScale.domain()).tickFormat(d => Math.round(d) + "%");

  //   Generating the legend axis
  legend.append("g")
    .attr("transform", `translate(${svg.attr("width") - 380},${legendHeight*1.5})`)
    .call(legendAxis);
}

main();