# flask imports, CORS will be important next week (install using: pip install -U flask-cors)
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from geo_distances import *

# general python imports
import json

# psycopg2 imports
import psycopg2
import psycopg2.extras

import random

# constants, check whether to use localhost or gis-database as the URL depending if its running in Docker
IN_DOCKER = True
DB_HOST = "gis-database" if IN_DOCKER else "localhost"
DB_PORT = "5432" if IN_DOCKER else "15432"
DB_USER = "gis_user"
DB_PASS = "gis_pass"
DB_NAME = "gis"

# we've imported flask, we still need to create an instance. __name__ is a built-in variable which evaluates
# to the name of the current module. Thus it can be used to check whether the current script is being run on
# its own or being imported somewhere else by combining it with if statement, as shown below.
app = Flask(__name__)
# extend flask with CORS, will be necessary next week
CORS(app)

####### Comparing methods #######


# # Point to point distance
@app.route('/api/test/ppdist', methods=["GET"])
def getDistanceBetweenPoints():
    points = json.loads(request.args.get('points'))
    point1 = points[0]
    point2 = points[1]

    # distance = point2point_distance(49.246690, -123.220161, 47.671274, 9.174836)
    distance = point2point_distance(point1, point2)
    return jsonify({'distance': distance / 1000}), 200


# # Intersection
@app.route('/api/test/llintersect', methods=["GET"])
def checkLinesIntersection():
    points = json.loads(request.args.get('points'))
    polyline1 = points[0]
    polyline2 = points[1]

    # intersect = polylines_intersection(polyline1, polyline2)
    linesIntersection = polylines_intersection_divide_conquer(polyline1, polyline2)
    return jsonify({'intersect': linesIntersection[0]}), 200


# # Point in polygon
@app.route('/api/test/pinpolygon', methods=["GET"])
def checkPointInPolygon():
    points = json.loads(request.args.get('points'))
    point = points[0]
    polygon = points[1]
    # Add first point to the end as it is polygon
    polygon.append(polygon[0])

    pointInPolygon = point_in_polygon_divide_conquer(point, polygon)
    return jsonify({'pointInPolygon': pointInPolygon}), 200


# # Line in polygon
@app.route('/api/test/linpolygon', methods=["GET"])
def checkLineInPolygon():
    points = json.loads(request.args.get('points'))
    line = points[0]
    polygon = points[1]
    # Add first point to the end as it is polygon
    polygon.append(polygon[0])

    lineInPolygon = polyline_in_polygon(line, polygon)
    intersects = lineInPolygon[0]
    contains = lineInPolygon[1]
    meet = lineInPolygon[2]

    return jsonify({'lineInPolygon': {'Intersects': intersects, 'Contains': contains, 'Meet': meet}}), 200


# # Line in polygon
@app.route('/api/test/polygoninpolygon', methods=["GET"])
def checkPolygonInPolygon():
    points = json.loads(request.args.get('points'))
    polygon1 = points[0]
    polygon2 = points[1]

    # Add first point to the end as it is polygon
    polygon1.append(polygon1[0])
    polygon2.append(polygon2[0])

    polygonsTest = polygon_in_polygon(polygon1, polygon2)

    intersectAB = polygonsTest[1][0]
    containAB = polygonsTest[1][1]
    meetAB = polygonsTest[1][2]

    intersectBA = polygonsTest[0][0]
    containBA = polygonsTest[0][1]
    meetBA = polygonsTest[0][2]

    matrix = []

    if not intersectAB and not containAB and not meetAB:
        matrix = [0, 0, 1, 0, 0, 1, 1, 1, 1]

    if not intersectAB and not containAB and meetAB:
        matrix = [1, 0, 1, 0, 0, 1, 1, 1, 1]

    if intersectAB:
        if polygons_equal(polygon1, polygon2):
            matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1]
        else:
            matrix = [1, 1, 1, 1, 1, 1, 1, 1, 1]

    if not intersectAB and containAB and not meetAB:
        matrix = [0, 0, 1, 1, 1, 1, 0, 0, 1]

    if not intersectAB and containBA and not meetAB:
        matrix = [0, 1, 0, 0, 1, 0, 1, 1, 1]

    if not intersectAB and containAB and meetAB:
        matrix = [1, 0, 1, 1, 1, 1, 0, 0, 1]

    if not intersectAB and containBA and meetAB:
        matrix = [1, 0, 1, 1, 1, 1, 0, 0, 1]

    return jsonify({'polygonsTest': matrix}), 200


@app.route('/api/test/pldist', methods=["GET"])
def getDistanceBetweenPointAndLine():
    points = json.loads(request.args.get('points'))
    point = points[0]
    polyline = points[1]

    distance, intersection = point2poly_distance(polyline, point)
    return jsonify({'distance': distance / 1000, 'intersection':intersection}), 200


@app.route('/api/test/ppolygondist', methods=["GET"])
def getDistanceBetweenPointAndPolygon():
    points = json.loads(request.args.get('points'))
    point = points[0]
    polygon = points[1]

    polygon.append(polygon[0])

    distance = point2poly_distance(polygon, point)[0]
    return jsonify({'distance': distance / 1000}), 200


@app.route('/api/test/lldist', methods=["GET"])
def getDistanceBetweenLines():
    points = json.loads(request.args.get('points'))
    line1 = points[0]
    line2 = points[1]

    # To implement
    start_point, distance, intersection = poly2poly_distance(line1, line2)
    return jsonify({'distance': distance, 'start':start_point, 'intersection':intersection}), 200

@app.route('/api/data/updatedanger', methods=["GET"])
def updateDanger():
    polygonPoints = json.loads(request.args.get('points'))

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:

            query = """
                SELECT id, ST_AsGeoJSON(geom_way) as line from ms_2po_4pgr
            """;
    
            cur.execute(query)
            records = cur.fetchall()
            conn.commit()

            costs = []
            ids = []

            for r in records:
                line = json.loads(r.line)['coordinates']

                linePoints = []
                for l in line:
                    linePoints.append({'lat': l[0], 'lng': l[1]})

                for p in polygonPoints:
                    polygon = p
                    # Add first point to the end as it is polygon
                    polygon.append(polygon[0])

                    # intersects, contains, meet = polyline_in_polygon(linePoints, polygon)

                ids.append(r.id)
                costs.append(random.uniform(0, 1))

            #cur.executemany('UPDATE ms_2po_4pgr SET danger_cost=%s WHERE id=%s', zip(costs, ids))
            #conn.commit()

    conn.close()

    return jsonify([{"result": line}]), 200

@app.route('/api/data/safepath', methods=["GET"])
def getSafePath():
    startPointLng = json.loads(request.args.get('startPointLng'))
    startPointLat = json.loads(request.args.get('startPointLat'))
    endPointLng = json.loads(request.args.get('endPointLng'))
    endPointLat = json.loads(request.args.get('endPointLat'))

    scenario = json.loads(request.args.get('scenario'))

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:

            '''
            query = """
                SELECT id, geom_way from ms_data
            """;

            cur.execute(query)
            records = cur.fetchall()
            conn.commit()

            costs = []
            ids = []

            for r in records:
                # geom = r.geom_way
                ids.append(r.id)
                costs.append(random.uniform(0, 1))

            # cur.executemany('UPDATE ms_2po_4pgr SET danger_cost=%s WHERE id=%s', zip(costs, ids))
            # conn.commit()
            '''
            
            query = """
                SELECT seq, path_seq, node, edge, di.cost, reverse_cost, kmh, number_of_accidents_total, number_of_casualties_total, ST_AsGeoJSON(geom_way) as geojson
                  FROM pgr_dijkstra(
                    'SELECT id, source, target, scenario{} as cost, scenario{} as reverse_cost, kmh, number_of_accidents_total, number_of_casualties_total FROM ms_data',
                    (SELECT source FROM ms_data ORDER BY ST_Distance(geom_way, 
                ST_SetSRID(ST_MakePoint({}, {}), 4326)) ASC LIMIT 1), 
                    (SELECT source FROM ms_data ORDER BY ST_Distance(geom_way, 
                ST_SetSRID(ST_MakePoint({}, {}), 4326)) ASC LIMIT 1), TRUE
                  ) as di
                  JOIN ms_data
                  ON di.edge = ms_data.id
            """.format(scenario, scenario, startPointLng, startPointLat, endPointLng, endPointLat)

            cur.execute(query)
            records = cur.fetchall()

    conn.close()

    return jsonify([{"geojson": json.loads(r.geojson), "danger": r.cost, "kmh": r.kmh, "accidents": r.number_of_accidents_total, "casualties": r.number_of_casualties_total} for r in records]), 200

@app.route('/api/data/pathkm', methods=["GET"])
def getPathKm():
    startPointLng = json.loads(request.args.get('startPointLng'))
    startPointLat = json.loads(request.args.get('startPointLat'))
    endPointLng = json.loads(request.args.get('endPointLng'))
    endPointLat = json.loads(request.args.get('endPointLat'))

    scenario = json.loads(request.args.get('scenario'))

    query = """
        SELECT seq, path_seq, node, edge, di.cost, scenario{} as danger_cost, reverse_cost, kmh, number_of_accidents_total, number_of_casualties_total, ST_AsGeoJSON(geom_way) as geojson
          FROM pgr_dijkstra(
            'SELECT id, source, target, cost as cost, scenario{}, reverse_cost, kmh, number_of_accidents_total, number_of_casualties_total FROM ms_data',
            (SELECT source FROM ms_data ORDER BY ST_Distance(geom_way, 
        ST_SetSRID(ST_MakePoint({}, {}), 4326)) ASC LIMIT 1), 
            (SELECT source FROM ms_data ORDER BY ST_Distance(geom_way, 
        ST_SetSRID(ST_MakePoint({}, {}), 4326)) ASC LIMIT 1), TRUE
          ) as di
          JOIN ms_data
          ON di.edge = ms_data.id
    """.format(scenario, scenario, startPointLng, startPointLat, endPointLng, endPointLat)

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:
            cur.execute(query)
            records = cur.fetchall()

    return jsonify([{"geojson": json.loads(r.geojson), "danger": r.danger_cost, "kmh": r.kmh, "accidents": r.number_of_accidents_total, "casualties": r.number_of_casualties_total} for r in records]), 200


@app.route('/api/data/tradepath', methods=["GET"])
def getPathTrade():
    startPointLng = json.loads(request.args.get('startPointLng'))
    startPointLat = json.loads(request.args.get('startPointLat'))
    endPointLng = json.loads(request.args.get('endPointLng'))
    endPointLat = json.loads(request.args.get('endPointLat'))

    query = """
        SELECT seq, path_seq, node, edge, di.cost, scenario4, reverse_cost, kmh, number_of_accidents_total, number_of_casualties_total, ST_AsGeoJSON(geom_way) as geojson
          FROM pgr_dijkstra(
            'SELECT id, source, target, (cost * 0.9 + scenario4 * 0.1) as cost, scenario4, (cost * 0.9 + scenario4 * 0.1) as reverse_cost, kmh, number_of_accidents_total, number_of_casualties_total FROM ms_data',
            (SELECT source FROM ms_data ORDER BY ST_Distance(geom_way, 
        ST_SetSRID(ST_MakePoint({}, {}), 4326)) ASC LIMIT 1), 
            (SELECT source FROM ms_data ORDER BY ST_Distance(geom_way, 
        ST_SetSRID(ST_MakePoint({}, {}), 4326)) ASC LIMIT 1), TRUE
          ) as di
          JOIN ms_data
          ON di.edge = ms_data.id
    """.format(startPointLng, startPointLat, endPointLng, endPointLat)

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:
            cur.execute(query)
            records = cur.fetchall()

    return jsonify([{"geojson": json.loads(r.geojson), "danger": r.scenario4, "kmh": r.kmh} for r in records]), 200


@app.route('/api/data/area', methods=["GET"])
def getArea():
    query = """
        SELECT admin_level, ST_AsGeoJSON(way) as geojson from planet_osm_polygon WHERE admin_level='6';
    """

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:
            cur.execute(query)
            records = cur.fetchall()

    return jsonify([{"geojson": json.loads(r.geojson)} for r in records]), 200


####### Figure saving methods #######


@app.route('/api/data/point', methods=["GET"])
def getPoints():
    query = """
        SELECT id as id, ST_AsGeoJSON(geom) as geojson from custom_point
    """

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:
            cur.execute(query)
            records = cur.fetchall()

    return jsonify([{"id": r.id, "geojson": json.loads(r.geojson)} for r in records]), 200


@app.route('/api/data/point', methods=["POST"])
def addPoint():
    lat = request.args.get('lat')
    lng = request.args.get('lng')

    query = """
        INSERT INTO public.custom_point(geom) VALUES(ST_GeomFromText('POINT({} {})', 4326)) RETURNING id
    """.format(lat, lng)

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            id = cur.fetchone()[0]

            conn.commit()

    conn.close()

    return jsonify([{"id": id}]), 200


@app.route('/api/data/line', methods=["GET"])
def getLines():
    query = """
        SELECT id as id, ST_AsGeoJSON(geom) as geojson from custom_line
    """

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:
            cur.execute(query)
            records = cur.fetchall()

    return jsonify([{"id": r.id, "geojson": json.loads(r.geojson)} for r in records]), 200


@app.route('/api/data/line', methods=["POST"])
def addLine():
    points = request.json

    # points = [{'lat': 2, 'lng': 3}, {'lat': 10, 'lng': 20}, {'lat': 100, 'lng': 200}]
    linestring = ""
    for line in points:
        linestring += "{} {}, ".format(line['lat'], line['lng'])

    linestring = linestring[:-2]

    query = """
        INSERT INTO public.custom_line(geom) VALUES(ST_GeomFromText('LINESTRING({})', 3857)) RETURNING id
    """.format(linestring)

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            id = cur.fetchone()[0]

            conn.commit()

    conn.close()

    return jsonify([{"id": id}]), 200


@app.route('/api/data/polygon', methods=["GET"])
def getPolygons():
    query = """
        SELECT id as id, ST_AsGeoJSON(geom) as geojson from custom_polygon
    """

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:
            cur.execute(query)
            records = cur.fetchall()

    return jsonify([{"id": r.id, "geojson": json.loads(r.geojson)} for r in records]), 200


@app.route('/api/data/polygon', methods=["POST"])
def addPolygon():
    points = request.json

    # points = [{'lat': 2, 'lng': 3}, {'lat': 10, 'lng': 20}, {'lat': 100, 'lng': 200}]
    polygon = ""
    for line in points:
        polygon += "{} {}, ".format(line['lat'], line['lng'])

    polygon += "{} {}".format(points[0]['lat'], points[0]['lng'])
    # polygon = polygon[:-2]

    query = """
        INSERT INTO public.custom_polygon(geom) VALUES(ST_GeomFromText('POLYGON(({}))', 28992)) RETURNING id
    """.format(polygon)

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            id = cur.fetchone()[0]

            conn.commit()

    conn.close()

    return jsonify([{"id": id}]), 200

#######

# Old methods


# specify the endpoint and which request methods are allowed. In this case we allow GET and POST requests,
# all other requests are not allowed and will results in HTTP Error: 405: Method not allowed"
@app.route('/api/data/regierungsbezirke', methods=["GET", "POST"])
def regierungsbezirke():

    # The SQL Query, triple quotes allow us to write multi-line strings
    query = """
        SELECT osm_id as osm_id, name as name, st_asgeojson(way) as geojson, st_area(way::geography) / (1000 * 1000) as area
        FROM planet_osm_polygon
        where admin_level = '5'
        ORDER BY way_area DESC
        LIMIT 4
    """

    # Create a psycopg2 connection in a with-block. This is similar to the try-with-resources Statement in Java
    # According to psycopg2 documentation, this wraps this block effectively into one transaction
    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:

        # Create a cursor object, which allos us to create the connection
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:

            # execute the query
            cur.execute(query)

            # fetch ALL results, we could also use fetchone() or fetchmany()
            records = cur.fetchall()

    # close the connection, after we're finished
    conn.close()

    # parse records into an result array and return it jsonified with the HTTP status code 200: OK
    # careful! r.geojson is of type str, we must convert it to a dictionary first
    return jsonify([{"osm_id": r.osm_id, "name": r.name, "geojson": json.loads(r.geojson), "area": r.area} for r in records]), 200


@app.route('/api/data/landkreise', methods=["POST"])
def landkreise():
    query = """
        SELECT osm_id as osm_id, name as name, st_asgeojson(way) as geojson, st_area(way::geography) / (1000 * 1000) as area
        FROM planet_osm_polygon
        where admin_level = '6' and boundary = 'administrative'
    """

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:
            cur.execute(query)
            records = cur.fetchall()

    return jsonify([{"osm_id": r.osm_id, "name": r.name, "geojson": json.loads(r.geojson), "area": r.area} for r in records]), 200


@app.route('/api/data/bardichte', methods=["POST"])
def bardichte():
    query = """
        select polygons.osm_id, polygons.name as name, st_asgeojson(polygons.way) as geojson, st_area(polygons.way::geography) / (1000 * 1000) as area, COUNT(points.*) as num_bars
        from planet_osm_polygon polygons JOIN planet_osm_point points ON ST_Contains(polygons.way, points.way)
        where polygons.admin_level = '6' and polygons.boundary = 'administrative' AND (points.amenity='bar' OR points.amenity='pub')
        group by polygons.osm_id, polygons.name, polygons.way
    """

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:
            cur.execute(query)
            records = cur.fetchall()

    features = []
    for r in records:
        feature = {
            "type": 'Feature',
            # careful! r.geojson is of type str, we must convert it to a dictionary
            "geometry": json.loads(r.geojson),
            "properties": {
                "osm_id": r.osm_id,
                "name": r.name,
                "area": r.area,
                "num_bars": r.num_bars
            }
        }

        features.append(feature)

    featurecollection = {
        "type": "FeatureCollection",
        "features": features
    }

    resp = Response(response=json.dumps(featurecollection),
                    status=200,
                    mimetype="application/json")
    return(resp)


@app.route('/api/data/averagebardichte', methods=['POST'])
def averagebardicht():
    query = """
        WITH bars as (select polygons.osm_id, polygons.name as name, ST_AsGeoJSON(polygons.way) as geojson,
        st_area(polygons.way::geography)/(1000*1000) as area, COUNT(points.*) as num_bars from planet_osm_polygon polygons JOIN
        planet_osm_point points on ST_Contains(polygons.way, points.way) where polygons.admin_level='6' and polygons.boundary = 'administrative' AND
        (points.amenity='bar' OR points.amenity='pub') group by polygons.osm_id, polygons.name, polygons.way)
        SELECT b.*, l.population from bars b JOIN landkreise l on b.name like '%'|| l.name||'%'    
    """

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:
            cur.execute(query)
            records = cur.fetchall()

    features = []
    for r in records:
        feature = {
            "type": 'Feature',
            "geometry": json.loads(r.geojson),
            "properties": {
                "osm_id": r.osm_id,
                "name":r.name,
                "area": r.area,
                "num_bars":r.num_bars,
                "population": float(r.population)
                }
            }
        features.append(feature)

    featurecollection = {
        "type": "FeatureCollection",
        "features": features
    }

    resp = Response(response=json.dumps(featurecollection),
                    status=200,
                    mimetype="application/json")
    return(resp)
