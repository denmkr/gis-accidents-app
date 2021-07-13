import { Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from './services/data.service';
import { FeatureCollection } from 'geojson';
import { Overlay, LandkreisLayer, BardichteLayer, AverageBardensityLayer } from './types/map.types';

import { MapComponent } from './map/map.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild(MapComponent, {static: false}) mapComponent: MapComponent;

  overlays: Array<Overlay> = new Array<Overlay>();
  rainActive: boolean = false;
  windActive: boolean = false;
  sunActive: boolean = false;

  weatherActive: boolean = false;
  lightActive: boolean = false;
  roadActive: boolean = false;

  completeActive: boolean = false;
  savedElemsActive: boolean = false;
  compareElemsActive: boolean = false;

  accidentsButtonPressed: boolean = false;

  scalePanelActive: boolean = false;

  scaleImagePath: string = '../assets/images/scale.png'

  weatherImagePath: string = '../assets/images/weather.png';
  rainImagePath: string = '../assets/images/rain.png';
  windImagePath: string = '../assets/images/wind.png';
  sunImagePath: string = '../assets/images/sun.png';
  snowImagePath: string = '../assets/images/snow.png';
  fogImagePath: string = '../assets/images/fog.png';


  lightImagePath: string = '../assets/images/dark.png';
  dayLightImagePath: string = '../assets/images/light.png';
  darkImagePath: string = '../assets/images/dark.png';
  litImagePath: string = '../assets/images/lit.png';

  roadImagePath: string = '../assets/images/road.png';
  dryImagePath: string = '../assets/images/road.png';
  wetImagePath: string = '../assets/images/wet.png';
  iceImagePath: string = '../assets/images/ice.png';
  floodImagePath: string = '../assets/images/flood.png';

  leftImagePath: string = '../assets/images/left.png';
  closeImagePath: string = '../assets/images/close.png';

  startPointPressed: boolean = false;
  endPointPressed: boolean = false;
  loaderActive: boolean = false;

  startPointText: string = "Add A";
  endPointText: string = "Add B";

  isStartPoint: boolean = false;
  isEndPoint: boolean = false;

  routeInfoActive: boolean = false;

  tradeRouteActive: boolean = false;
  fastRouteActive: boolean = false;
  safeRouteActive: boolean = false;

  // constructor is here only used to inject services
  constructor(private dataService: DataService) { }

  /**
   * Retrieve data from server and add it to the overlays arrays
   */
  ngOnInit(): void {
    /*
    this.dataService.getRegierungsBezirke().toPromise().then((val: FeatureCollection) => {
      this.overlays.push(new Overlay('Regierunsbezirke', val));
    });

    this.dataService.getLandkreise().toPromise().then((val: FeatureCollection) => {
      this.overlays.push(new LandkreisLayer('Landkreise', val));
    });

    this.dataService.getBardichte().toPromise().then((val: FeatureCollection) => {
      this.overlays.push(new BardichteLayer('bar density', val));
    });

    this.dataService.getAverageBardichte().toPromise().then((val: FeatureCollection) => {
      this.overlays.push(new AverageBardensityLayer('Average bar density', val));
    });
    */
  }

  weatherButtonClick(): void {
    this.weatherActive = true;
    this.lightActive = false;
    this.roadActive = false;
  }

  lightButtonClick(): void {
    this.weatherActive = false;
    this.lightActive = true;
    this.roadActive = false;
  }

  roadButtonClick(): void {
    this.weatherActive = false;
    this.lightActive = false;
    this.roadActive = true;
  }

  showAccidentsClick(): void {
  	if (!this.accidentsButtonPressed) {
  		this.mapComponent.showAccidents();
  		this.accidentsButtonPressed = true;
  	}
  	else {
  		this.accidentsButtonPressed = false;
  		this.mapComponent.hideAccidents();
  	}
  }

  drawFigureClick(el): void {
    this.startPointPressed = false;
    this.endPointPressed = false;
    this.mapComponent.interruptFigureCreation();

    this.mapComponent.clearTemporalFigures();

    if ((el === 'rain' && this.rainActive) || (el === 'wind' && this.windActive) || (el === 'sun' && this.sunActive)) {
      this.rainActive = false;
      this.windActive = false;
      this.sunActive = false;

      this.completeActive = false;

      this.mapComponent.interruptFigureCreation();
    } else {
      this.rainActive = false;
      this.windActive = false;
      this.sunActive = false;
      
      if (el === 'rain') this.rainActive = true;
      if (el === 'wind') this.windActive = true;
      if (el === 'sun') this.sunActive = true;

      this.completeActive = true;

      this.mapComponent.startFigureCreation(el);
    }
  }

  completeClick(): void {
    this.mapComponent.stopFigureCreation();
  }

  cancelClick(): void {
    this.mapComponent.clearTemporalFigures();
  }

  inactiveStartButton(): void {
    this.startPointPressed = false;
    this.startPointText = "A";

    this.isStartPoint = true;

    // if (this.isStartPoint && this.isEndPoint) this.routeButtonActive = true;
  }

  inactiveEndButton(): void {
    this.endPointPressed = false;
    this.endPointText = "B";

    this.isEndPoint = true;

    // if (this.isStartPoint && this.isEndPoint) this.routeButtonActive = true;
  }

  startPointClick(): void {
    this.mapComponent.startFigureCreation("startPoint");
    this.startPointPressed = !this.startPointPressed;
    this.endPointPressed = false;

    this.completeActive = false;
  }

  endPointClick(): void {
    this.mapComponent.startFigureCreation("endPoint");
    this.endPointPressed = !this.endPointPressed;
    this.startPointPressed = false;

    this.completeActive = false;

    //if (this.endPointPressed)
  }

  removeStartClick(e): void {
    this.mapComponent.removeStartPoint();
    this.isStartPoint = false;
    this.startPointText = "Add A";
    this.startPointPressed = false;

    e.stopPropagation();
  }

  removeEndClick(e): void {
    this.mapComponent.removeEndPoint();
    this.isEndPoint = false;
    this.endPointText = "Add B";
    this.endPointPressed = false;

    e.stopPropagation();
  }

  /*
  applyButtonClick(): void {
    this.mapComponent.applyConditions();
  }
  */

  tradeRouteButtonClick(): void {
    if (this.tradeRouteActive) this.mapComponent.hideTradeRoute();
    else this.mapComponent.showTradeRoute();

    this.tradeRouteActive = !this.tradeRouteActive;
  }

  fastRouteButtonClick(): void {
    if (this.fastRouteActive) this.mapComponent.hideFastestRoute();
    else this.mapComponent.showFastestRoute();

    this.fastRouteActive = !this.fastRouteActive;
  }

  safeRouteButtonClick(): void {
    if (this.safeRouteActive) this.mapComponent.hideSafestRoute();
    else this.mapComponent.showSafestRoute();

    this.safeRouteActive = !this.safeRouteActive;
  }

  routeButtonClick(): void {
    if (this.isStartPoint && this.isEndPoint) {
      this.startPointPressed = true;
      this.endPointPressed = true;
      this.loaderActive = true;

      this.mapComponent.startRouting();
      this.routeInfoActive = true;

      this.safeRouteActive = true;

      this.completeActive = false;

      this.scalePanelActive = true;
    }
  }

  disactivateLoader(): void {
    this.loaderActive = false;
  }

  resetRouteButtonClick(): void {
    this.routeInfoActive = false;
    this.safeRouteActive = false;
    this.fastRouteActive = false;
    this.tradeRouteActive = false;

    this.scalePanelActive = false;

    this.mapComponent.stopRouting();

    this.removeStartClick(event);
    this.removeEndClick(event);
    
  }

  reRouteButtonClick(): void {
    if (this.isStartPoint && this.isEndPoint) {
      this.startPointPressed = true;
      this.endPointPressed = true;
      this.loaderActive = true;

      this.mapComponent.startRouting();
      this.routeInfoActive = true;

      this.safeRouteActive = true;

      this.completeActive = false;
    }
  }

  savedElemsClick(): void {
    if (!this.savedElemsActive) {
      this.savedElemsActive = true;
      this.mapComponent.showSavedFigures();
    }
    else {
      this.savedElemsActive = false;
      this.mapComponent.hideSavedFigures();
    }
  }
}
