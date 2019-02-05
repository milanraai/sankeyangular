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

      d3.json("../assets/data.json", function (error, data: any) {
          if (error) throw error;

         ////////added data manupulations
         
         var makeObj = function(orObj, index) {
            let obj = {};
            obj['nodeId'] = index;
            obj['name'] = orObj;
            return obj;
          };
          
          function recur(old, arr) {
            let toRet = old;
            arr.forEach((data, index) => {
              if (toRet.indexOf(data.key) < 0 && data.key != "Positive Comment") {
                //remove duplicates
                toRet.push(data.key);
              }
              if (
                data.group_by_category !== undefined &&
                data.group_by_category.buckets.length > 0
              ) {
                recur(toRet, data.group_by_category.buckets);
              }
            });
            return toRet;
          }
          
          var uniqueKeys = recur([], data.aggregations.group_by_category.buckets);
          
          var nodes = uniqueKeys.map((data, index) => {
            return makeObj(data, index);
          });

          var links = [];
          
          var getNodeId = function(nodes, key){
            var sourceId = nodes.find(da=>{
              return da.name == key;
            });
            return sourceId.nodeId;
          }
          
          data.aggregations.group_by_category.buckets.map((data)=>{
            let source = getNodeId(nodes, data.key);
            if(data.group_by_category.buckets){
              data.group_by_category.buckets.map(data2=>{
                if(data2.key != "Positive Comment"){
                let target = getNodeId(nodes, data2.key);
                let linkObj = {};
                linkObj['source']= source;
                linkObj['target'] = target;
                linkObj['value'] = data2.doc_count;
                linkObj['uom'] = "'Widget(s)'";
                links.push(linkObj);
                }
              })
            }
          })
          


         ////end of adding
         data = {
            nodes, links
         }
         console.log(data);
         
        
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
