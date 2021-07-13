import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
  IterableDiffers,
  DoCheck,
  IterableChangeRecord
} from '@angular/core';

import * as L from 'leaflet';
import * as d3 from 'd3';
import crossfilter from 'crossfilter2';
import * as dc from 'dc';
import {Overlay} from '../types/map.types';
import {DataService} from '../services/data.service';
// import '../../assets/AnimatedMarker.js';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  // super important, otherwise the defined css doesn't get added to dynamically created elements, for example, from D3.
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent implements OnInit, DoCheck {
  @Output() startPointChosen = new EventEmitter();
  @Output() endPointChosen = new EventEmitter();
  @Output() routeCalculated = new EventEmitter();

  @Input() overlays: Array<Overlay> = [];
  iterableDiffer: any;
  private mymap: any;

  drawActive = false;
  comparingActive = false;
  comparisonBlockActive = false;

  rainMode: boolean = false;
  windMode: boolean = false;
  sunMode: boolean = false;
  snowMode: boolean = false;
  fogMode: boolean = false;
  darkMode: boolean = false;
  lightMode: boolean = false;
  litMode: boolean = false;
  dryMode: boolean = false;
  wetMode: boolean = false;
  snowRoadMode: boolean = false;
  iceMode: boolean = false;
  floodMode: boolean = false;

  statisticsActive: boolean = false;

  scenario: number = 1;

  conditionPolygonLayers: Array<any> = [];

  speedLimitImage: string = '../../assets/images/speed_limit.png';

  drawType: string;
  pointList: Array<L.LatLng> = [];
  tempPoints: Array<L.Circle> = [];
  comparingObjects: Array<any> = [];

  layerGroup: any;
  savedLayerGroup: any;
  accidentsLayerGroup: any;

  markersGroup: any;

  safePathGroup: any;
  fastPathGroup: any;
  tradePathGroup: any;

  infoActive = false;
  infoText = '';
  comparisonResult = '';

  conditionPolygons: Array<any> = [];

  startPoint: any;
  endPoint: any;
  startMarker: any;
  endMarker: any;

  safePathLinesMap = new Map();
  fastPathLinesMap = new Map();

  private layerControl: L.Control.Layers;

  constructor(private iterable: IterableDiffers, private dataService: DataService) {
    this.iterableDiffer = this.iterable.find(this.overlays).create();
  }

  ngOnInit() {
    // this.createStatistics();

    // use osm tiles
    const basemap = L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    this.dataService.getAvailableArea().subscribe(result => {
      console.log(result);

      result.forEach(e => {
        const polyPointList = [];
        e.geojson.coordinates.forEach(c => {
          c.forEach(l => {
            polyPointList.push(new L.LatLng(l[1], l[0]));
          });
        });

        const polygon = new L.Polygon(polyPointList, {
          color: 'blue',
          weight: 2,
          fillOpacity: 0.01,
          opacity: 0.3,
          smoothFactor: 1
        });

        polygon.addTo(this.layerGroup).bringToFront();
      });
    });

    // create map, set initial view to basemap and zoom level to center of BW
    this.mymap = L.map('main', {layers: [basemap]}).setView([53.4749500889698, -2.5888281241298587], 9);

    this.layerGroup = L.layerGroup().addTo(this.mymap);
    this.safePathGroup = L.layerGroup();
    this.fastPathGroup = L.layerGroup();
    this.tradePathGroup = L.layerGroup();

    this.savedLayerGroup = L.layerGroup();

    // create maps and overlay objects for leaflet control
    const baseMaps = {
      OpenStreetMap: basemap,
    };

    // Add a control which lets us toggle maps and overlays
    this.layerControl = L.control.layers(baseMaps);
    // this.layerControl.addTo(mymap);

    // this.loadSavedFigures();

    this.mymap.on('click', <LeafletMouseEvent>(e) => {

      if (this.drawType === 'startPoint' || this.drawType === 'endPoint') {
        const point = L.circle([e.latlng.lat, e.latlng.lng], {
          color: 'blue',
          radius: 5,
          weight: 3
        });//.addTo(this.layerGroup).bringToFront();

        // Save drawn point to database
        this.dataService.addPoint(e.latlng.lat, e.latlng.lng).subscribe(result => {
          console.log(result);
        });

        if (this.drawType === 'startPoint' && this.startPoint === undefined) {
          this.startPoint = point;

          var startIcon = L.icon({
            iconUrl: '../../assets/images/start.png',

            iconSize:     [32, 32], // size of the icon
            iconAnchor:   [16, 32], // point of the icon which will correspond to marker's location
            popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
          });

          this.startMarker = L.marker([e.latlng.lat, e.latlng.lng], {icon: startIcon});
          this.startMarker.addTo(this.layerGroup);

          this.startPointChosen.emit(true);
        }
        if (this.drawType === 'endPoint' && this.endPoint === undefined) {
          this.endPoint = point;

          var endIcon = L.icon({
            iconUrl: '../../assets/images/end.png',

            iconSize:     [32, 32], // size of the icon
            iconAnchor:   [16, 32], // point of the icon which will correspond to marker's location
            popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
          });

          this.endMarker = L.marker([e.latlng.lat, e.latlng.lng], {icon: endIcon});
          this.endMarker.addTo(this.layerGroup);

          this.endPointChosen.emit(true);
        }
      }
      else {
        console.log(this.drawType);

        if (this.drawType !== undefined && this.drawType !== null) {
          this.tempPoints.push(L.circle([e.latlng.lat, e.latlng.lng], {
            color: 'red',
            radius: 5,
            weight: 3
          }).addTo(this.layerGroup));

          console.log(e.latlng.lat + " " + e.latlng.lng);

          this.pointList.push(new L.LatLng(e.latlng.lat, e.latlng.lng));
          this.infoText = 'Choose another point position of the polygon';
        }
	    }
    });

    // marker.bindPopup("marker").openPopup();
  }

  /**
   * If the input data changes, update the layers
   * @param changes the angular changes object
   */
  ngDoCheck(): void {
    /*
    const changes = this.iterableDiffer.diff(this.overlays);
    if (changes) {

      changes.forEachAddedItem((newOverlay: IterableChangeRecord<Overlay>) => {
        const overlay = newOverlay.item;
        this.layerControl.addOverlay(overlay.createOverlay(), overlay.name);
      });
    }
    */
  }

  /*

  createStatistics(): void{
     d3.csv("../../assets/data/output_1.csv").then(function(data){


        var selectedData = data;

        selectedData = selectedData.filter(function(d){
          if(d!=undefined && d['Police_Force'] == '5')
          {
            return d;
          }
        })

        selectedData.forEach(function(x) {
          if(x != undefined)
          {
            if(x["Year"] == undefined){
              x["Year"] = "2018";
            }
            else
            {
              x["Year"] = x["Year"];
            }

            if(x["Accident_Severity"] != undefined){
              if(x["Accident_Severity"] == 1)
              {
                x["Accident_Severity"] = "Fatal";
              }
              else if(x["Accident_Severity"] == 2)
              {
                x["Accident_Severity"] = "Serious";
              }
              else if(x["Accident_Severity"] == 3)
              {
                x["Accident_Severity"] = "Slight";
              }
              //x["Accident_Severity"] = +x["Accident_Severity"];
            }
            else
            {
              x["Accident_Severity"] = -1;
            }

            if(x["Road_Type"] != undefined){
              if(x["Road_Type"] == 1)
              {
                x["Road_Type"] = "Roundabout";
              }
              else if(x["Road_Type"] == 2)
              {
                x["Road_Type"] = "One way street";
              }
              else if(x["Road_Type"] == 3)
              {
                x["Road_Type"] = "Dual carriageway";
              }
              else if(x["Road_Type"] == 6)
              {
                x["Road_Type"] = "Single carriageway";
              }
              else if(x["Road_Type"] == 7)
              {
                x["Road_Type"] = "Slip Road";
              }
              else if(x["Road_Type"] == 9)
              {
                x["Road_Type"] = "Unknown";
              }
              else if(x["Road_Type"] == 12)
              {
                x["Road_Type"] = "One way street";
              }
              else 
              {
                x["Road_Type"] = "Missing Data";
              }
              //x["Accident_Severity"] = +x["Accident_Severity"];
            }
            else
            {
              x["Road_Type"] = "Missing Data";
            }

            if(x["Light_Conditions"] != undefined){
              if(x["Light_Conditions"] == 1)
              {
                x["Light_Conditions"] = "Daylight";
              }
              else if(x["Light_Conditions"] == 4)
              {
                x["Light_Conditions"] = "Darkness / Lights Lit";
              }
              else if(x["Light_Conditions"] == 5)
              {
                x["Light_Conditions"] = "Darkness / Lights Unlit";
              }
              else if(x["Light_Conditions"] == 6)
              {
                x["Light_Conditions"] = "Darkness / No Lighting";
              }
              else if(x["Light_Conditions"] == 7)
              {
                x["Light_Conditions"] = "Darkness / Unknown";
              }
              else 
              {
                x["Light_Conditions"] = "Missing Data";
              }
            }
            else
            {
              x["Light_Conditions"] = "Missing Data";
            }

            if(x["Weather_Conditions"] != undefined){
              if(x["Weather_Conditions"] == 1)
              {
                x["Weather_Conditions"] = "Fine / No High Winds";
              }
              else if(x["Weather_Conditions"] == 2)
              {
                x["Weather_Conditions"] = "Raining / No High Winds";
              }
              else if(x["Weather_Conditions"] == 3)
              {
                x["Weather_Conditions"] = "Snowing / No High Winds";
              }
              else if(x["Weather_Conditions"] == 4)
              {
                x["Weather_Conditions"] = "Fine / High Winds";
              }
                else if(x["Weather_Conditions"] == 5)
              {
                x["Weather_Conditions"] = "Raining / High Winds";
              }
              else if(x["Weather_Conditions"] == 6)
              {
                x["Weather_Conditions"] = "Snowing / High Winds";
              }
              else if(x["Weather_Conditions"] == 7)
              {
                x["Weather_Conditions"] = "Fog or Mist";
              }
              else 
              {
                x["Weather_Conditions"] = "Other";
              }
              
            }
            else
            {
              x["Weather_Conditions"] = "Missing Data";
            }

            if(x["Number_of_Vehicles"] != undefined || !isNan(x["Number_of_Vehicles"])){
              x["Number_of_Vehicles"] = +x["Number_of_Vehicles"];
            }
            else
            {
              x["Number_of_Vehicles"] = 0;
            }

              if(x["Number_of_Casualties"] != undefined || !isNan(x["Number_of_Casualties"])){
              x["Number_of_Casualties"] = +x["Number_of_Casualties"];
            }
            else
            {
              x["Number_of_Casualties"] = 0;
            }

            x["Amount"] = 1;
          }
          
         });

        console.log(selectedData);
        
        var ndx  = crossfilter(selectedData),
        yearDimension = ndx.dimension(function(d) {return d["Year"] }),
        numCasualtyGroup = yearDimension.group().reduceSum(function(d) {return d["Number_of_Casualties"];}),
        numVehiclesGroup = yearDimension.group().reduceSum(function(d) {return d["Number_of_Vehicles"];}),
        severityDimension = ndx.dimension(function(d){ return d["Accident_Severity"] }),
        accSeverityGroup = severityDimension.group().reduceSum(function(d) {return d["Amount"];}),
        roadTypeDimension = ndx.dimension(function(d){ return d["Road_Type"] }),
        roadTypeGroup = roadTypeDimension.group().reduceSum(function(d) {return d["Amount"];}),
        lightDimension = ndx.dimension(function(d){ return d["Light_Conditions"] }),
        lightGroup = lightDimension.group().reduceSum(function(d) {return d["Amount"];}),
        weatherDimension = ndx.dimension(function(d){ return d["Weather_Conditions"] }),
        weatherGroup = weatherDimension.group().reduceSum(function(d) {return d["Amount"];});

      var max=d3.max(selectedData,function(d){ return d["Number_of_Casualties"]});

      var numCasChart = dc.barChart("#numCasualty").dimension(yearDimension).group(numCasualtyGroup)
         .width(200)
         .height(200)
         .margins({top:20,left:60,right:30,bottom:30})
         .x(d3.scaleOrdinal())
             .xUnits(dc.units.ordinal)
             .yAxisLabel('Number of Casualties')
         .centerBar(true)
               .barPadding(0.1)
               .outerPadding(0)
         .gap(20);

      numCasChart.xAxis().ticks(5); 

      var numVehicleChart = dc.barChart("#numVehicles").dimension(yearDimension).group(numVehiclesGroup)
         .width(200)
         .height(200)
         .margins({top:20,left:60,right:30,bottom:30})
         .x(d3.scaleOrdinal())
         .xUnits(dc.units.ordinal)
         .yAxisLabel('Number of Vehicles')
         .centerBar(true)
         .barPadding(0.1)
         .outerPadding(0)
         .gap(20);

      numCasChart.xAxis().ticks(5); 

      var accSeverityChart = dc.pieChart("#accSeverity").dimension(severityDimension)
        .group(accSeverityGroup)
        .width(300).height(200).radius(80)
        .renderLabel(false) //Not display labels
        .title(function(d){
          return d.key + "$" + d.value;
        }) 
        .transitionDuration(1200) //add animations
        .colors(d3.scaleOrdinal().range(d3.schemeCategory10))
        .legend(dc.legend().x(0).y(5).itemHeight(12).gap(5));


      var lightChart = dc.pieChart("#lightConditions").dimension(lightDimension)
        .group(lightGroup)
        .width(400).height(200).radius(80)
        .renderLabel(false) 
        .title(function(d){
          return d.key + "$" + d.value;
        }) 
        .transitionDuration(1200) 
        .colors(d3.scaleOrdinal().range(d3.schemeCategory10))
        .legend(dc.legend().x(0).y(5).itemHeight(12).gap(5));


      var weatherChart = dc.pieChart("#weather").dimension(weatherDimension)
        .group(weatherGroup)
        .width(500).height(250).radius(80)
        .renderLabel(false)
        .transitionDuration(1200) //add animations
        .colors(d3.scaleOrdinal().range(d3.schemeCategory10))
        .legend(dc.legend().x(0).y(5).itemHeight(12).gap(5));

        dc.renderAll();
       });
  }

  */


  removeStartPoint(): void {
    this.layerGroup.removeLayer(this.startMarker);
    this.startPoint = undefined;
  }

  removeEndPoint(): void {
    this.layerGroup.removeLayer(this.endMarker);
    this.endPoint = undefined;
  }

  /*
  applyConditions(): void {
    if (this.conditionPolygons !== undefined && this.conditionPolygons !== null) {
      this.dataService.updateDanger(this.conditionPolygons).subscribe(result => {
        this.comparisonResult = JSON.stringify(result);
        console.log(result);
      });
    }
  }
  */

  showTradeRoute(): void {
    this.tradePathGroup.addTo(this.mymap);
  }

  showFastestRoute(): void {
    this.fastPathGroup.addTo(this.mymap);
  }

  showSafestRoute(): void {
    this.safePathGroup.addTo(this.mymap);
  }

  hideTradeRoute(): void {
    this.mymap.removeLayer(this.tradePathGroup);
  }

  hideFastestRoute(): void {
    this.mymap.removeLayer(this.fastPathGroup);
  }

  hideSafestRoute(): void {
    this.mymap.removeLayer(this.safePathGroup);
  }

  stopRouting(): void {
    this.hideFastestRoute();
    this.hideSafestRoute();
    this.hideTradeRoute();

    this.fastPathGroup.getLayers().forEach(l => {
      this.fastPathGroup.removeLayer(l);
    });
    
    this.safePathGroup.getLayers().forEach(l => {
      this.safePathGroup.removeLayer(l);
    });

    this.tradePathGroup.getLayers().forEach(l => {
      this.tradePathGroup.removeLayer(l);
    });

    this.rainMode = false;
    this.windMode = false;
    this.sunMode = false;
    this.snowMode = false;
    this.fogMode = false;
    this.darkMode = false;
    this.lightMode = false;
    this.litMode = false;
    this.dryMode = false;
    this.wetMode = false;
    this.snowRoadMode = false;
    this.iceMode = false;
    this.floodMode = false;

    this.scenario = 1;
    this.conditionPolygonLayers.forEach((l) => {
      this.layerGroup.removeLayer(l);
    });
  }

  hideAccidents(): void {
    this.mymap.removeLayer(this.accidentsLayerGroup);
    this.statisticsActive = false;
  }

  showAccidents(): void {

    this.statisticsActive = true;

    d3.csv("../../assets/data/dftRoadSafetyData_Accidents_2018.csv", function(d) {
      return {
        lng: +d.Longitude,
        lat: +d.Latitude,
        authority: +d['Police_Force'],
        fatality: +d['Accident_Severity'],
        weather: +d['Weather_Conditions'],
        date: d['Date']
      };
    }).then(data => {
      /*
      this.tempPoints.forEach(p => {
        this.layerGroup.removeLayer(p);
      });
      */
      this.accidentsLayerGroup = L.layerGroup().addTo(this.mymap);

      let points: any = [];

      const parseTime = d3.timeParse("%d/%M/%Y");
      
      data.forEach(d => {
       
        let date = new Date(parseTime(d.date));
        let curDate = new Date('December 17, 2020 03:24:00');

        if (d.authority == 5 && d.weather == 1) {
          let opacity = 1;
          let color = 'red';

          if (d.fatality == 1) {
            opacity = 1;
            color = 'blue'
          }

          const point = L.circleMarker([d.lat, d.lng], {
            color: color,
            radius: 2,
            weight: 2,
            opacity: opacity
          }).addTo(this.accidentsLayerGroup).bringToFront();

          points.push(point);
        }
      });

      this.mymap.on('zoomend', () => {
        const currentZoom = this.mymap.getZoom();
        let radius = 2;
        let weight = 2;

        if (currentZoom <= 10) {
          radius = 1;
          weight = 1;
        }

        if (currentZoom <= 8) {
          radius = 0.5;
          weight = 0.5;
        }

        points.forEach(p => {
          p.setRadius(radius);
          p.setStyle({'weight': weight});
         // console.log(p.options.opacity);
          //if (p.options.opacity == 0.7) p.setStyle({'opacity': 1});
        });
      });

      /*
      const point = L.circle([e.latlng.lat, e.latlng.lng], {
        color: 'blue',
        radius: 5,
        weight: 3
      }).addTo(this.layerGroup).bringToFront();
      */
    });
  }

  startRouting(): void {
    if (this.startPoint !== undefined && this.endPoint !== undefined) {
      var markers = [
        L.marker(this.startPoint.getLatLng()),
        L.marker(this.endPoint.getLatLng())
      ];

      // console.log(this.startPoint.getLatLng());
      // console.log(this.endPoint.getLatLng());
      const tooltip = d3.select("#tooltip");

      var group = L.featureGroup(markers);
      this.mymap.flyToBounds(group.getBounds(), {padding: [75, 75]});

      const color = d3.scaleLog().range([1, 0]).domain([0.03, 1.062]);

      this.scenario = 1;
      if (this.lightMode && this.sunMode && this.dryMode) this.scenario = 1;
      if (this.darkMode && this.litMode && this.dryMode && this.sunMode) this.scenario = 2;
      if (this.darkMode && this.litMode == false && this.rainMode && this.wetMode) this.scenario = 3;
      if (this.lightMode && this.snowMode && this.snowRoadMode) this.scenario = 4;
      if (this.darkMode && this.litMode == false && this.fogMode && this.iceMode) this.scenario = 5;
      console.log(this.scenario);

      this.dataService.getSafePath(this.startPoint.getLatLng()['lng'], this.startPoint.getLatLng()['lat'], this.endPoint.getLatLng()['lng'], this.endPoint.getLatLng()['lat'], this.scenario).subscribe(result => {

        let pathList = [];

        result.forEach(e => {
          const pathLineList = [];
          e.geojson.coordinates.forEach(c => {
            pathLineList.push(new L.LatLng(c[1], c[0]));
            pathList.push(new L.LatLng(c[1], c[0]));
          });

          const danger = e.danger;
          const polyline = new L.Polyline(pathLineList, {
            color: d3.interpolateRdYlGn(color(danger)),
            weight: 4, //10
            opacity: 1,
            smoothFactor: 1
          });
          polyline.addTo(this.safePathGroup).bringToFront();

          polyline.on('mouseover', (e) => {
            const lineSegmentlayer = this.safePathGroup.getLayer(e.target._leaflet_id);
            if (lineSegmentlayer !== undefined && lineSegmentlayer !== null) {

              lineSegmentlayer.setStyle({'weight': lineSegmentlayer.options.weight + 5});
              lineSegmentlayer.bringToFront();

              tooltip
                //.style('left', e.containerPoint.x - 150 + "px")
                //.style('top', e.containerPoint.y - 90 + "px")
                .transition()
                .duration(0)
                .style('display', "block");

              tooltip.select(".speed").select("a").html(this.safePathLinesMap.get(lineSegmentlayer).kmh);
              tooltip.select(".accidents").select("a").html(this.safePathLinesMap.get(lineSegmentlayer).accidents);
              tooltip.select(".casualties").select("a").html(this.safePathLinesMap.get(lineSegmentlayer).casualties);
            }
          });

          polyline.on('mouseout', (e) => {
            const lineSegmentlayer = this.safePathGroup.getLayer(e.target._leaflet_id);
            if (lineSegmentlayer !== undefined && lineSegmentlayer !== null) {
              lineSegmentlayer.setStyle({'weight': lineSegmentlayer.options.weight - 5});
            }

            tooltip.style('display', 'none');
          });

          this.safePathLinesMap.set(polyline, {"kmh": e.kmh, "accidents": e.accidents, "casualties": e.casualties});

          this.showSafestRoute();
        });

        /*
        var myIcon = L.icon({
          iconUrl: '../../assets/images/end.png',
          iconSize: [25, 39]
        });

        console.log(pathList);
        var animatedMarker = L.animatedMarker(pathList, {
          icon: myIcon,
          distance: 300  // meters
        });

        this.safePathGroup.addLayer(animatedMarker);
        animatedMarker.start();
        */

        this.dataService.getFastPath(this.startPoint.getLatLng()['lng'], this.startPoint.getLatLng()['lat'], this.endPoint.getLatLng()['lng'], this.endPoint.getLatLng()['lat'], this.scenario).subscribe(result => {

          result.forEach(e => {
            const pathLineList = [];
            e.geojson.coordinates.forEach(c => {
              pathLineList.push(new L.LatLng(c[1], c[0]));
            });

            const danger = e.danger;
            const polyline = new L.Polyline(pathLineList, {
              color: d3.interpolateRdYlGn(color(danger)),
              weight: 4,
              opacity: 1,
              smoothFactor: 1
            });
            polyline.addTo(this.fastPathGroup).bringToBack();

            polyline.on('mouseover', (e) => {
              const lineSegmentlayer = this.fastPathGroup.getLayer(e.target._leaflet_id);
              if (lineSegmentlayer !== undefined && lineSegmentlayer !== null) {

                lineSegmentlayer.setStyle({'weight': lineSegmentlayer.options.weight + 5});
                lineSegmentlayer.bringToFront();

                tooltip
                  //.style('left', e.containerPoint.x - 150 + "px")
                  //.style('top', e.containerPoint.y - 90 + "px")
                  .transition()
                  .duration(0)
                  .style('display', "block");

                tooltip.select(".speed").select("a").html(this.fastPathLinesMap.get(lineSegmentlayer).kmh);
                tooltip.select(".accidents").select("a").html(this.fastPathLinesMap.get(lineSegmentlayer).accidents);
                tooltip.select(".casualties").select("a").html(this.fastPathLinesMap.get(lineSegmentlayer).casualties);
              }
            });

            polyline.on('mouseout', (e) => {
              const lineSegmentlayer = this.fastPathGroup.getLayer(e.target._leaflet_id);
              if (lineSegmentlayer !== undefined && lineSegmentlayer !== null) {
                lineSegmentlayer.setStyle({'weight': lineSegmentlayer.options.weight - 5});
              }

              tooltip.style('display', 'none');
            });

            this.fastPathLinesMap.set(polyline, {"kmh": e.kmh, "accidents": e.accidents, "casualties": e.casualties});


            this.routeCalculated.emit(true);
          });

          /*
          this.dataService.getTradeoffPath(this.startPoint.getLatLng()['lng'], this.startPoint.getLatLng()['lat'], this.endPoint.getLatLng()['lng'], this.endPoint.getLatLng()['lat']).subscribe(result => {

            result.forEach(e => {
              const pathLineList = [];
              e.geojson.coordinates.forEach(c => {
                pathLineList.push(new L.LatLng(c[1], c[0]));
              });

              const danger = e.danger;
              const polyline = new L.Polyline(pathLineList, {
                color: d3.interpolateRdYlGn(color(danger)),
                weight: 4,
                opacity: 1,
                smoothFactor: 1
              });
              polyline.addTo(this.tradePathGroup).bringToBack();

              this.routeCalculated.emit(true);
            });
          });
          */
        });

      });
    }
  }

  loadSavedFigures(): void {
    // Get all saved polygons from db
    this.dataService.getPolygons().subscribe(result => {
      result.forEach(e => {
        const polyPointList = [];
        e.geojson.coordinates.forEach(c => {
          c.forEach(l => {
            polyPointList.push(new L.LatLng(l[0], l[1]));
          });
        });

        const polygon = new L.Polygon(polyPointList, {
          color: 'blue',
          weight: 2,
          opacity: 1,
          smoothFactor: 1
        });
        polygon.addTo(this.savedLayerGroup).bringToBack();

        /*
        polygon.on('click', <LeafletMouseEvent>(e) => {
          this.savedLayerGroup.removeLayer(e.target._leaflet_id);
        });
        */

        /* Load lines and points after polygons to bring them to the front */

        // Get all saved lines from db
        // tslint:disable-next-line:no-shadowed-variable
        this.dataService.getLines().subscribe(result => {
          // tslint:disable-next-line:no-shadowed-variable
          result.forEach(e => {
            const linePointList = [];
            e.geojson.coordinates.forEach(c => {
              linePointList.push(new L.LatLng(c[0], c[1]));
            });

            const polyline = new L.Polyline(linePointList, {
              color: 'blue',
              weight: 2,
              opacity: 1,
              smoothFactor: 1
            });
            polyline.addTo(this.savedLayerGroup).bringToFront();
          });
        });

        // Get all saved points from db
        this.dataService.getPoints().subscribe(result => {
          result.forEach(e => {
            const point = L.circle([e.geojson.coordinates[0], e.geojson.coordinates[1]], {
              color: 'blue',
              radius: 5,
              weight: 3
            }).addTo(this.savedLayerGroup).bringToFront();
          });
        });

      });
    });
  }

  showSavedFigures(): void {
    this.savedLayerGroup.addTo(this.mymap);
  }

  hideSavedFigures(): void {
    this.mymap.removeLayer(this.savedLayerGroup);
  }

  startFigureCreation(type): void {
    this.drawActive = true;
    this.drawType = type;

    this.infoActive = true;
    this.infoText = 'Choose first point position of a polygon';

    if (type === "startPoint") this.infoText = 'Choose start point';
    if (type === "endPoint") this.infoText = 'Choose end point';
  }

  interruptFigureCreation(): void {
    this.infoActive = false;
    this.drawActive = false;
    this.drawType = undefined;
  }

  clearTemporalFigures(): void {
    this.tempPoints.forEach(p => {
      this.layerGroup.removeLayer(p);
    });

    this.tempPoints = [];
    this.pointList = [];
  }

  stopFigureCreation(): void {

    // If Polygon Mode
    let color, img;
    if (this.drawType === 'rain') {
      color = 'blue';
      this.rainMode = true;
      img = '../../assets/images/rain.png';
    }
    if (this.drawType === 'wind') {
      color = 'blue';
      this.windMode = true;
      img = '../../assets/images/wind.png';
    }
    if (this.drawType === 'sun') {
      color = 'blue';
      this.sunMode = true;
      img = '../../assets/images/sun.png';
    }
    if (this.drawType === 'snow') {
      color = 'blue';
      this.snowMode = true;
      img = '../../assets/images/snow.png';
    }
    if (this.drawType === 'fog') {
      color = 'blue';
      this.fogMode = true;
      img = '../../assets/images/fog.png';
    }

    if (this.drawType === 'dark') {
      color = 'red';
      this.darkMode = true;
      img = '../../assets/images/dark.png';
    }
    if (this.drawType === 'light') {
      color = 'red';
      this.lightMode = true;
      img = '../../assets/images/light.png';
    }
    if (this.drawType === 'lit') {
      color = 'red';
      this.litMode = true;
      img = '../../assets/images/lit.png';
    }

    if (this.drawType === 'dry') {
      color = 'gray';
      this.dryMode = true;
      img = '../../assets/images/dry.png';
    }
    if (this.drawType === 'wet') {
      color = 'gray';
      this.wetMode = true;
      img = '../../assets/images/wet.png';
    }
    if (this.drawType === 'snowRoad') {
      color = 'gray';
      this.snowRoadMode = true;
      img = '../../assets/images/snow.png';
    }
    if (this.drawType === 'ice') {
      color = 'gray';
      this.iceMode = true;
      img = '../../assets/images/ice.png';
    }
    if (this.drawType === 'flood') {
      color = 'gray';
      this.floodMode = true;
      img = '../../assets/images/flood.png';
    }

    

    if (this.pointList.length > 2) {
      const polygon = new L.Polygon(this.pointList, {
        color: color,
        weight: 2,
        fillOpacity: 0.03, 
        opacity: 0.5,
        smoothFactor: 1
      });

      polygon.addTo(this.layerGroup).bringToBack();

      this.conditionPolygonLayers.push(polygon);
      this.conditionPolygons.push(this.pointList);

      // Draw an icon inside polygon
      const size = (polygon.getBounds().getEast() - polygon.getBounds().getCenter().lat) / 1000
      const imageBounds = L.latLngBounds([
        [polygon.getBounds().getCenter().lat - (polygon.getBounds().getSouthEast().lat - polygon.getBounds().getCenter().lat) / 2, polygon.getBounds().getCenter().lng - (polygon.getBounds().getSouthEast().lng - polygon.getBounds().getCenter().lng) / 2],
        [polygon.getBounds().getSouthEast().lat - (polygon.getBounds().getSouthEast().lat - polygon.getBounds().getCenter().lat) / 0.6, polygon.getBounds().getSouthEast().lng - (polygon.getBounds().getSouthEast().lng - polygon.getBounds().getCenter().lng) / 0.6]
      ]);

      const imageLayer = L.imageOverlay(img, imageBounds);
      imageLayer.addTo(this.layerGroup);
      this.conditionPolygonLayers.push(imageLayer);

      // Save drawn polygon to database
      this.dataService.addPolygon(this.pointList).subscribe(result => {
        console.log(result);
      });

      this.infoText = 'Choose first point position of a polygon';
      this.clearTemporalFigures();
    }

  }

  onSavedFigureClick(e) {
    const layer = this.savedLayerGroup.getLayer(e.target._leaflet_id);
    this.comparingObjects.push(layer);

    if (this.comparingObjects.length === 1) {
      e.target.setStyle({
        color: 'red',
        weight: 4
      });

      this.infoText = 'Choose second object to compare';
    } else {
      this.comparingObjects.forEach(l => {
        let weight = 2;
        if (l._parts === undefined || l._parts === null || l._parts === '') {
          weight = 3;
        }

        // Default style
        l.setStyle({
          color: 'blue',
          weight
        });

        // this.dataService.getDistance(l.getLatLng(), )
      });

      this.compareObjects(this.comparingObjects);

      this.comparingObjects = [];
      this.infoText = 'Choose first object to compare';
    }

    // this.layerGroup.removeLayer(e.target._leaflet_id);
  }

  onCreatedFigureClick(e) {
    const layer = this.layerGroup.getLayer(e.target._leaflet_id);
    this.comparingObjects.push(layer);

    if (this.comparingObjects.length === 1) {
      e.target.setStyle({
        color: 'red',
        weight: 4
      });

      this.infoText = 'Choose second object to compare';
    } else {
      this.comparingObjects.forEach(l => {
        let weight = 2;
        if (l._parts === undefined || l._parts === null || l._parts === '') {
          weight = 3;
        }

        // Default style
        l.setStyle({
          color: 'blue',
          weight
        });

        // this.dataService.getDistance(l.getLatLng(), )
      });

      this.compareObjects(this.comparingObjects);

      this.comparingObjects = [];
      this.infoText = 'Choose first object to compare';
    }
  }

  compareObjects(comparingObjects) {
    const points = [];
    const lines = [];
    const polygons = [];

    this.comparingObjects.forEach((l, i) => {
      // One point
      const coords = l._latlngs;
      if (coords === undefined || coords === null || coords === '') {
        points.push(l._latlng);
      } else {
        if (l instanceof L.Polygon) {
          polygons.push(coords);
        } else if (l instanceof L.Polyline) {
          lines.push(coords);
        }
      }
    });

    this.comparisonBlockActive = true;

    // Point and Point
    if (points.length === 2) {
      console.log(points[0]);
      this.dataService.getDistanceBetweenPoints(points).subscribe(result => {
        this.comparisonResult = JSON.stringify(result);

        const point = L.circle([points[0].lat, points[0].lng], {
          color: 'green',
          radius: result.distance * 1000,
          weight: 3
        }).addTo(this.savedLayerGroup);

        console.log(result);
      });
    }

    // Point and Line
    if (points.length === lines.length && polygons.length === 0) {
      this.dataService.getDistanceBetweenPointAndLine(points[0], lines[0]).subscribe(result => {
        this.comparisonResult = JSON.stringify(result);

        const point = L.circle([points[0].lat, points[0].lng], {
          color: 'green',
          radius: result.distance * 1000,
          weight: 3
        }).addTo(this.savedLayerGroup);

        const linePointList = [];
        linePointList.push(new L.LatLng(points[0].lat, points[0].lng));
        linePointList.push(new L.LatLng(result.intersection.lat, result.intersection.lng));

        const polyline = new L.Polyline(linePointList, {
          color: 'orange',
          weight: 2,
          opacity: 1,
          smoothFactor: 1
        });
        polyline.addTo(this.savedLayerGroup);

        console.log(result);
      });
    }

    // Point and Polygon
    if (points.length === polygons.length && lines.length === 0) {
      this.dataService.checkPointInPolygon(points[0], polygons[0][0]).subscribe(result => {
        this.comparisonResult = JSON.stringify(result);
        console.log(result);
      });

      this.dataService.getDistanceBetweenPointAndPolygon(points[0], polygons[0][0]).subscribe(result => {
        this.comparisonResult += "<br>" + JSON.stringify(result);
        console.log(result);
      });
    }

    // Line and Polygon
    if (polygons.length === lines.length && points.length === 0) {
      this.dataService.checkLineInPolygon(lines[0], polygons[0][0]).subscribe(result => {
        this.comparisonResult = JSON.stringify(result);
        console.log(result);
      });
    }

    // Line and Line
    if (lines.length === 2) {
      this.dataService.checkLinesIntersection(lines).subscribe(result => {
        this.comparisonResult = JSON.stringify(result);

        /*
        const point = L.circle([result.start.lat, result.start.lng], {
          color: 'green',
          radius: result.distance * 1000,
          weight: 3
        }).addTo(this.savedLayerGroup);

        const linePointList = [];
        linePointList.push(new L.LatLng(result.start.lat, result.start.lng));
        linePointList.push(new L.LatLng(result.intersection.lat, result.intersection.lng));

        const polyline = new L.Polyline(linePointList, {
          color: 'orange',
          weight: 2,
          opacity: 1,
          smoothFactor: 1
        });
        polyline.addTo(this.savedLayerGroup);
        */

        console.log(result);
      });

      /*
      this.dataService.getDistanceBetweenLines(lines).subscribe(result => {
        this.comparisonResult += "<br>" + JSON.stringify(result);
        console.log(result);
      });
      */
    }

    // Polygon and Polygon
    if (polygons.length === 2) {
      console.log(polygons[0][0]);
      this.dataService.checkPolygonInPolygon(polygons[0][0], polygons[1][0]).subscribe(result => {
        const matrix = result.polygonsTest;
        this.comparisonResult = "&nbsp;&nbsp;&nbsp;" + "bB " + "B0 " + "B-1" + "<br>";
        this.comparisonResult += "bA&nbsp;&nbsp;" + matrix[0] + " " + matrix[1] + " " + matrix[2] + "<br>" +
          "A0&nbsp;&nbsp;" + matrix[3] + " " + matrix[4] + " " + matrix[5] + "<br>" +
          "A-1&nbsp;" + matrix[6] + " " + matrix[7] + " " + matrix[8];
        console.log(result);
      });
    }

  }

  onFigureRightClick(e) {
    const savedLayer = this.savedLayerGroup.getLayer(e.target._leaflet_id);
    if (savedLayer !== undefined && savedLayer !== null) {
      savedLayer.bringToBack();
    }

    const layer = this.layerGroup.getLayer(e.target._leaflet_id);
    if (layer !== undefined && layer !== null) {
      layer.bringToBack();
    }
  }

  onFigureHover(e) {
    e.target.setStyle({
      color: 'red',
      weight: 4
    });
  }

  onFigureOut(e) {
    if (!this.comparingObjects.includes(this.layerGroup.getLayer(e.target._leaflet_id)) && !this.comparingObjects.includes(this.savedLayerGroup.getLayer(e.target._leaflet_id))) {
      let weight = 2;

      if (e.target._parts === undefined || e.target._parts === null || e.target._parts === '') {
        weight = 3;
      }

      e.target.setStyle({
        color: 'blue',
        weight
      });
    }
  }

}
