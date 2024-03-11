import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const container = document.querySelector("#container")
let description = document.querySelector("#description")
const URL = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"

async function getData(){
    try{
        const response = await fetch(URL)
        const data = await response.json()
        description.innerHTML += `base temperature  ${data.baseTemperature} ℃` 
        heatmap(data.monthlyVariance, data.baseTemperature)
    }catch(e){
        console.error(e)
    }
}

getData()


function heatmap(data, temp){
    const width = 1300
    const height = 500
    const margin = {top: 40, bottom: 80, left: 80, right: 40}

    const svg = d3.create("svg")
                    .attr("width", width)
                    .attr("height", height)

   
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    
    const y = d3.scaleBand()
                .domain(data.map(d => d.month))
                .range([margin.top, height - margin.bottom]) 
                .padding(0)   
         
    const x = d3.scaleBand()
                .domain(data.map(d => d.year))
                .range([margin.left, width - margin.right])

    
    
    const tooltip = d3.select("body")
                .append("div")
                .style("position", "absolute")
                .attr("id", "tooltip")
                .style("background-color", "rgba(34, 34, 56, 0.9)")
                .style("color", "white")
                .style("padding", "1rem")
                .style("border-radius", "10px")
                .style("pointer-events", "none")
                .style("opacity", 0)  

    const colorScale = d3.scaleSequential()
                .domain([d3.max(data, d => d.variance), d3.min(data, d => d.variance)])
                .interpolator(d3.interpolateRdYlBu);

    const uniqueYears = [...new Set(data.map(d => d.year))];    
    const tickValues = uniqueYears.filter(year => year % 10 === 0);


    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .attr("id", "x-axis")
        .call(d3.axisBottom(x).tickValues(tickValues))
        
    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .attr("id", "y-axis")
        .call(d3.axisLeft(y).tickFormat((month) => months[month - 1]))

    const dataRect = svg.append("g")
        .attr("id", "data-rect")

    dataRect.selectAll(".cell")
        .data(data)
        .enter().append("rect")
        .attr("class", "cell")
        .attr("x", d => x(d.year))
        .attr("y", d => y(d.month))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("data-month", d => {
            const index = months.indexOf(d.month);
            return index >= 0 ? index : 0;
        })
        .attr("data-year", d => d.year)
        .attr("data-temp", d => d.variance)
        .style("fill", d => colorScale(d.variance))
        .style("stroke", "none");

    svg.selectAll(".cell")
        .on("mouseenter", (e, d) => {
            tooltip
            .style("opacity", 1)
            .html(`${d.month} - ${d.year} <br> ${(temp + d.variance).toFixed(2)} ℃ <br> ${(d.variance).toFixed(2)} ℃`)
            .style("left", (e.pageX + 20) + "px")
            .style("top", (e.pageY + 20) + "px")
            .attr("data-year", d.year)
        })
        .on("mouseleave", () => {
            tooltip.style("opacity", 0)
        })


        .on("mouseover", function() {
            d3.select(this) 
                .style("stroke", "#333") 
                .style("stroke-width", "2px");
        })
        .on("mouseout", function() {
            d3.select(this) 
                .style("stroke", "none"); 
        });

        const tempMin = d3.min(data, d => (d.variance + temp));
        const tempMax = d3.max(data, d => (d.variance + temp));

        const tempValues = d3.range(tempMin, tempMax, (tempMax - tempMin) / 8);

        const legendWidth = 20; 
        const legendHeight = 20; 

        const tempX = d3.scaleBand()
            .domain(tempValues.map(d => d.toFixed(2)))
            .range([0, legendWidth * 13]); 

        const legend = svg.append("g")
            .attr("id", "legend")
            .attr("transform", `translate(${margin.left * 4}, ${(height - margin.bottom / 2) + 10 })`);

        const colorRect = legend.append("g")
            .attr("id", "color-rect");


        const labelRect = legend.append("g")
            .attr("id", "label-rect")
            .attr("transform", "translate(-250, 0)")
            

        labelRect.append("g")
            .call(d3.axisBottom(tempX));


        colorRect.selectAll(".legend-rect")
            .data(colorScale.ticks(10))
            .enter()
            .append("rect")
            .attr("class", "legend-rect")
            .attr("x", (d, i) => i * legendWidth) 
            .attr("y", 0) 
            .attr("transform", "rotate(180)")
            .attr("width", legendWidth) 
            .attr("height", legendHeight) 
            .style("fill", colorScale)
            .style("stroke", "#333") 
            .style("stroke-width", "2px");

    container.appendChild(svg.node())
}