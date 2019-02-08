import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey';
// import { ElasticService } from '../app/service/elastic.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit{
  title = 'app';

//   constructor( private elasticService : ElasticService) { }
  

  ngOnInit(): void {
      this.DrawChart();
  }

  private DrawChart() {

      var svg = d3.select("#sankey"),
          width = +svg.attr("width"),
          height = +svg.attr("height");

      var formatNumber = d3.format(",.0f"),
          format = function (d: any) { return formatNumber(d) + " series"; },
          color = d3.scaleOrdinal(d3.schemeCategory10);

      var sankey = d3Sankey.sankey()
          .nodeWidth(15)
          .nodePadding(10)
          .extent([[1, 1], [width - 1, height - 6]]);

      var link = svg.append("g")
          .attr("class", "links")
          .attr("fill", "none")
          .attr("stroke", "#000")
          .attr("stroke-opacity", 0.2)
          .selectAll("path");

      var node = svg.append("g")
          .attr("class", "nodes")
          .attr("font-family", "tahoma")
          .attr("font-size", 10)
          .selectAll("g");

      d3.json("../assets/kibana.json", function (error, data: any) {
          if (error) throw error;

         ////////added data manupulations
         
         function getData(input, visited=new Map(), parent, nodes=[], links=[])
         {
             input.forEach(x =>
             {
                 // Add node into the node list, if not visited previosuly.
         
                 if (!visited.has(x.key))
                 {
                     let currId = nodes.length;
                     nodes.push({nodeId: currId, name: x.key});
                     visited.set(x.key, currId);
                 }
         
                 // If a parent node exists, add relation into the links list.
         
                 if (parent)
                 {
                     // Note, we use the "Map" to get the ids.
                     //if(parent.key != x.key){
                     links.push({
                         source: visited.get(parent.key),
                         target: visited.get(x.key),
                         value: x.doc_count,
                         "uom": "'Widget(s)'"
                     });
                     //}
                 }
         
                 // Traverse (if required) to the next level of deep.
         
                 if (x.group_by_category && x.group_by_category.buckets)
                     getData(x.group_by_category.buckets, visited, x, nodes, links)
             });
         
             return {nodes: nodes, links: links};
         }
         
          

         data = getData(data.aggregations.group_by_category.buckets);


         console.log(data);
         ////end of adding
        
          sankey(data);

          link = link
              .data(data.links)
              .enter().append("path")
              .attr("d", d3Sankey.sankeyLinkHorizontal())
              .attr("stroke-width", function (d: any) { return Math.max(1, d.width); });

          link.append("title")
              .text(function (d: any) { return d.source.name + " → " + d.target.name + "\n" + format(d.value); });

          node = node
              .data(data.nodes)
              .enter().append("g");

          node.append("rect")
              .attr("x", function (d: any) { return d.x0; })
              .attr("y", function (d: any) { return d.y0; })
              .attr("height", function (d: any) { return d.y1 - d.y0; })
              .attr("width", function (d: any) { return d.x1 - d.x0; })
              .attr("fill", function (d: any) { return color(d.name.replace(/ .*/, "")); })
              .attr("stroke", "#000");

          node.append("text")
              .attr("x", function (d: any) { return d.x0 - 6; })
              .attr("y", function (d: any) { return (d.y1 + d.y0) / 2; })
              .attr("dy", "0.35em")
              .attr("text-anchor", "end")
              .text(function (d: any) { return d.name + "("+ d.value +")"; })
              .filter(function (d: any) { return d.x0 < width / 2; })
              .attr("x", function (d: any) { return d.x1 + 6; })
              .attr("text-anchor", "start");

          node.append("title")
              .text(function (d: any) { return d.name + "\n" + format(d.value); });
      });
    };
}
