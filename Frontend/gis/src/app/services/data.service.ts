import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeatureCollection } from 'geojson';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json; charset=utf-8' })
};

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) { }

  /* Comparison tasks */
  getDistanceBetweenPoints(points): Observable<any> {
    const url = 'http://localhost:5000/api/test/ppdist';

    let httpParams = new HttpParams().set("points", JSON.stringify(points));
    return this.http.get<any>(url, { params: httpParams });
  }

  getDistanceBetweenPointAndLine(point, points): Observable<any> {
    const url = 'http://localhost:5000/api/test/pldist';

    let httpParams = new HttpParams().set("points", JSON.stringify([point, points]));
    return this.http.get<any>(url, { params: httpParams });
  }

  getDistanceBetweenPointAndPolygon(point, points): Observable<any> {
    const url = 'http://localhost:5000/api/test/ppolygondist';

    let httpParams = new HttpParams().set("points", JSON.stringify([point, points]));
    return this.http.get<any>(url, { params: httpParams });
  }

  getDistanceBetweenLines(points): Observable<any> {
    const url = 'http://localhost:5000/api/test/lldist';

    let httpParams = new HttpParams().set("points", JSON.stringify(points));
    return this.http.get<any>(url, { params: httpParams });
  }

  checkLinesIntersection(points): Observable<any> {
    const url = 'http://localhost:5000/api/test/llintersect';

    let httpParams = new HttpParams().set("points", JSON.stringify(points));
    return this.http.get<any>(url, { params: httpParams });
  }

  checkPointInPolygon(point, points): Observable<any> {
    const url = 'http://localhost:5000/api/test/pinpolygon';

    let httpParams = new HttpParams().set("points", JSON.stringify([point, points]));
    return this.http.get<any>(url, { params: httpParams });
  }

  checkLineInPolygon(linePoints, polygonPoints): Observable<any> {
    const url = 'http://localhost:5000/api/test/linpolygon';

    let httpParams = new HttpParams().set("points", JSON.stringify([linePoints, polygonPoints]));
    return this.http.get<any>(url, { params: httpParams });
  }

  checkPolygonInPolygon(polygonPoints1, polygonPoints2): Observable<any> {
    const url = 'http://localhost:5000/api/test/polygoninpolygon';

    let httpParams = new HttpParams().set("points", JSON.stringify([polygonPoints1, polygonPoints2]));
    return this.http.get<any>(url, { params: httpParams });
  }

  /* Points */
  addPoint(lat, lng): Observable<any> {
    const url = 'http://localhost:5000/api/data/point';

    let httpParams = new HttpParams().append("lat", lat).append("lng", lng)
    return this.http.post<any>(url, null, { params: httpParams });
  }

  getPoints(): Observable<any> {
    const url = 'http://localhost:5000/api/data/point';
    return this.http.get<any>(url);
  }

  getAvailableArea(): Observable<any> {
    const url = 'http://localhost:5000/api/data/area';
    
    return this.http.get<any>(url);
  }

  updateDanger(polygonPoints): Observable<any> {
    const url = 'http://localhost:5000/api/data/updatedanger';

    let httpParams = new HttpParams().set("points", JSON.stringify(polygonPoints));
    return this.http.get<any>(url, { params: httpParams });
  }

  getTradeoffPath(startPointLng, startPointLat, endPointLng, endPointLat): Observable<any> {
    const url = 'http://localhost:5000/api/data/tradepath';
    
    let httpParams = new HttpParams()
      .append("startPointLng", startPointLng)
      .append("startPointLat", startPointLat)
      .append("endPointLng", endPointLng)
      .append("endPointLat", endPointLat)
    return this.http.get<any>(url, { params: httpParams });
  }

  getSafePath(startPointLng, startPointLat, endPointLng, endPointLat, scenario): Observable<any> {
    const url = 'http://localhost:5000/api/data/safepath';
    
    let httpParams = new HttpParams()
      .append("startPointLng", startPointLng)
      .append("startPointLat", startPointLat)
      .append("endPointLng", endPointLng)
      .append("endPointLat", endPointLat)
      .append("scenario", scenario)
    return this.http.get<any>(url, { params: httpParams });
  }

  getFastPath(startPointLng, startPointLat, endPointLng, endPointLat, scenario): Observable<any> {
    const url = 'http://localhost:5000/api/data/pathkm';
    
    let httpParams = new HttpParams()
      .append("startPointLng", startPointLng)
      .append("startPointLat", startPointLat)
      .append("endPointLng", endPointLng)
      .append("endPointLat", endPointLat)
      .append("scenario", scenario)
    return this.http.get<any>(url, { params: httpParams });
  }

  /* Lines */
  addLine(points): Observable<any> {
    const url = 'http://localhost:5000/api/data/line';
    return this.http.post<any>(url, JSON.stringify(points), { headers: httpOptions.headers });
  }

  getLines(): Observable<any> {
    const url = 'http://localhost:5000/api/data/line';
    return this.http.get<any>(url);
  }

  /* Polygons */
  addPolygon(points): Observable<any> {
    const url = 'http://localhost:5000/api/data/polygon';
    return this.http.post<any>(url, JSON.stringify(points), { headers: httpOptions.headers });
  }

  getPolygons(): Observable<any> {
    const url = 'http://localhost:5000/api/data/polygon';
    return this.http.get<any>(url);
  }

  /**
   * Retrieves the Regierungsbezirke from the given api endpoint.
   */
  getRegierungsBezirke(): Observable<FeatureCollection> {
    const url = 'http://localhost:5000/api/data/regierungsbezirke';
    return this.getFeatureCollection(url);
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  getLandkreise(): Observable<FeatureCollection> {
    const url = 'http://localhost:5000/api/data/landkreise';
    return this.getFeatureCollection(url);
  }

  /**
   * Retrieves the bar density from the given api endpoint.
   */
  getBardichte(): Observable<FeatureCollection> {
    const url = 'http://localhost:5000/api/data/bardichte';
    return this.http.post<FeatureCollection>(url, null, httpOptions);
  }

  /**
   * Retrieves the avg bar density from the given api endpoint.
   */
  getAverageBardichte(): Observable<FeatureCollection> {
    const url = 'http://localhost:5000/api/data/averagebardichte';
    return this.http.post<FeatureCollection>(url, null, httpOptions);
  }
  /**
   * Retrieves the data and constructs a FeatureCollection object from the received data
   */
  private getFeatureCollection(url): Observable<FeatureCollection> {
    return this.http.post<any>(url, null, httpOptions).pipe(map(unparsed => {

      const f: FeatureCollection = {
        type: 'FeatureCollection',
        features: unparsed.map((u: any) => {
          return {
            type: 'Feature',
            geometry: u.geojson,
            properties: { osm_id: u.osm_id, name: u.name, area: u.area }
          };
        })
      };

      return f;
    }));
  }

}
