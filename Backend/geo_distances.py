'''
Created on 28.11.2019

@author: Astrik Jeitler, Denis Makarov, Alpin Türkoglu
'''

import math


def point2point_distance(point1, point2):
    '''
    Get the distance between 2 points in meters
    
    @param point1, point2: points are dictionaries with keys "lat" and "lng"
    '''

    # phi is latitude, lambda is longitude
    # angles need to be in radians to pass to trig functions!
    radius_earth = 6371e3  # metres
    phi1 = math.radians(point1['lat'])
    phi2 = math.radians(point2['lat'])
    delta_phi = math.radians(point2['lat'] - point1['lat'])
    delta_lambda = math.radians(point2['lng'] - point1['lng'])

    # square of half the chord length between the points
    a = math.sin(delta_phi / 2) * math.sin(delta_phi / 2) + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) * math.sin(delta_lambda / 2)

    # angular distance in radians
    angular_distance = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = radius_earth * angular_distance

    return distance


def get_intersection_of_2_great_circles(vector1, vector2, vector3, vector4):
    '''
    Returns the two antipodal points of intersection of two great circles defined 
    by the arcs vector1 to vector2 and vector3 to vector4
    vectors must be 3D tuples (lat, long, radius)
    '''
    cross_product1 = cross_normalize(vector1, vector2)
    cross_product2 = cross_normalize(vector3, vector4)

    return cross_normalize(cross_product1, cross_product2)


def cross_normalize(vector_a, vector_b):
    '''
    Cross product of 2 vectors and normalization
    '''
    x = vector_a[1] * vector_b[2] - vector_a[2] * vector_b[1]
    y = vector_a[2] * vector_b[1] - vector_a[0] * vector_b[2]
    z = vector_a[0] * vector_b[1] - vector_a[1] * vector_b[0]

    norm = math.sqrt(x * x + y * y + z * z)

    norm_x = x / norm
    norm_y = y / norm
    norm_z = z / norm

    return (norm_x, norm_y, norm_z)


def point2line_distance(line, point):
    '''
    Get the distance (in meters) between a point and 
    a line (arc) defined by 2 points
    @param line: Line is an array of 2 points
    @param point: point is a dictionary with keys "lat" and "lng"
    '''
    point1 = line[0]
    point2 = line[1]

    # Find intersection point (ip) using orthogonal projection
    # https://de.wikipedia.org/wiki/Skalarprodukt#Orthogonalit%C3%A4t_und_orthogonale_Projektion

    # 1. get vector a (normalize it)
    dlat = point2['lat'] - point1['lat']
    dlon = point2['lng'] - point1['lng']

    norm = math.sqrt(dlat * dlat + dlon * dlon)

    dlat /= norm
    dlon /= norm

    # 2. orthogonal projection is k*vect_a with k = (vect_b dot vect_a)
    translate = (dlat * (point['lat'] - point1['lat']) + dlon * (point['lng'] - point1['lng']))
    ip_lat = (dlat * translate) + point1['lat']
    ip_lon = (dlon * translate) + point1['lng']

    ip = {'lat':ip_lat, 'lng':ip_lon}

    if point_between_2_points(line, ip):
        return point2point_distance(point, ip), ip

    elif point2point_distance(point1, point) < point2point_distance(point2, point):
        # return the distance to closest node
        return point2point_distance(point1, point), point1
    else:
        return point2point_distance(point2, point), point2


def point_between_2_points(line, point):
    point1 = line[0]
    point2 = line[1]

    min_lat = min(point1['lat'], point2['lat'])
    max_lat = max(point1['lat'], point2['lat'])

    min_lon = min(point1['lng'], point2['lng'])
    max_lon = max(point1['lng'], point2['lng'])

    if (point['lat'] <= max_lat and point['lat'] >= min_lat) or (point['lng'] <= max_lon and point['lng'] >= min_lon):
        return True
    return False


def point2poly_distance(poly, point):
    '''
    Use this function if not sure if line has more than 2 points.
    
    Get the distance (in meters) between a point and 
    a line (arc) defined by 2 points
    @param poly: polyline is an array of points
    @param point: point is a dictionary with keys "lat" and "lng"
    '''

    distance = float("inf")
    intersection_point = {}

    if len(poly) == 2:
        return point2line_distance(poly, point)

    for point1, point2 in zip(poly[:-1], poly[1:]):

        line_segment = [point1, point2]

        distance_to_line, intersection = point2line_distance(line_segment, point)

        if distance_to_line < distance:
            distance = distance_to_line
            intersection_point = intersection

    return distance, intersection_point


def line2line_distance(line1, line2):

    if lines_intersection(line1, line2)[0]:
        return line1[0], 0, line1[0]

    point1 = line1[0]
    point2 = line1[1]
    point3 = line2[0]
    point4 = line2[1]

    # 1 get min distance between 4 distances
    d13 = point2point_distance(point1, point3)
    d14 = point2point_distance(point1, point4)
    d23 = point2point_distance(point2, point3)
    d24 = point2point_distance(point2, point4)

    min_distance = min(min(d13, d14), min(d23, d24))

    if d13 is min_distance:
        if point_between_2_points(line1, point3):
            distance, intersection = point2line_distance(line1, point3)
            return point3, distance, intersection

        elif point_between_2_points(line2, point1):
            distance, intersection = point2line_distance(line2, point1)
            return point1, distance, intersection

    if d14 is min_distance:
        if point_between_2_points(line1, point4):
            distance, intersection = point2line_distance(line1, point4)
            return point4, distance, intersection

        elif point_between_2_points(line2, point1):
            distance, intersection = point2line_distance(line2, point1)
            return point1, distance, intersection

    if d23 is min_distance:
        if point_between_2_points(line1, point3):
            distance, intersection = point2line_distance(line1, point3)
            return point3, distance, intersection

        elif point_between_2_points(line2, point2):
            distance, intersection = point2line_distance(line2, point2)
            return point2, distance, intersection

    if d24 is min_distance:
        if point_between_2_points(line1, point4):
            distance, intersection = point2line_distance(line1, point4)
            return point4, distance, intersection

        elif point_between_2_points(line2, point2):
            distance, intersection = point2line_distance(line2, point2)
            return point2, distance, intersection

    return point1, 0, point1


def poly2poly_distance(poly1, poly2):
    lines = get_mbr_intersected_lines_recursion(poly1, poly2)

    distance = 999999999
    start_point = poly1[0]
    intersection_point = poly1[0]

    meet = False
    for line in lines:
        possible_intersected_lines = get_mbr_intersected_lines_recursion(poly2, line)

        if len(possible_intersected_lines) == 0:

            zip1 = zip(poly1[:-1], poly[1:])
            zip2 = zip(poly2[:-1], poly2[1:])

            zips = [list(zip1), list(zip2)]

            combi = [[a, b] for a in zips[0] for b in zips[1]]

            for e in combi:
                start, distance_to_poly, intersection = line2line_distance(e[0], e[1])
                if distance_to_poly < distance:
                    distance = distance_to_poly
                    start_point = start
                    intersection_point = intersection

        for line2 in possible_intersected_lines:
            intersection = lines_intersection(line, line2)

            if intersection[0]:  # Intersect
                return poly1[0], 0, poly1[0]

            if (not meet) and intersection[1]:  # Meet
                meet = True
                return poly1[0], 0, poly1[0]

            if (not intersection[0]) and intersection[1]:  # parallel
                distance_to_poly = point2point_distance(line[0], line2[0])

                if distance_to_poly < distance:
                    distance = distance_to_poly
                    start_point = line[0]
                    intersection_point = line2[0]

            start, distance_to_poly, intersection = line2line_distance(line, line2)
            if distance_to_poly < distance:
                distance = distance_to_poly
                start_point = start
                intersection_point = intersection

    return start_point, distance, intersection_point


def bearing_between_points(point1, point2):
    phi1 = point1['lat']
    lambda1 = point1['lng']
    phi2 = point2['lat']
    lambda2 = point2['lng']

    y = math.sin(lambda2 - lambda1) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(lambda2 - lambda1)
    bearing = math.degrees(math.atan2(y, x))

    return bearing


def point_in_polygon(point, points):
    mbr = get_mbr_coordinates(points)

    if point_in_mbr(point, mbr):
        start_point = {'lat': mbr[0][0] - 0.5, 'lng': mbr[0][1]}
        ray = [start_point, point]

        intersections = 0
        for i in range(len(points)):
            if i < len(points) - 1:
                line = [points[i], points[i + 1]]
                if lines_intersection(ray, line)[0]:
                    intersections += 1

        if (intersections % 2) != 0:
            return True

    return False


# Point in polygon checking using recursion (MBR divide and conquer)
def point_in_polygon_divide_conquer(point, points):
    mbr = get_mbr_coordinates(points)

    if point_in_mbr(point, mbr):
        start_point = {'lat': mbr[0][0] - 0.1, 'lng': mbr[0][1]}
        ray = [start_point, point]

        lines = get_mbr_intersected_lines_recursion(points, ray)

        intersections = 0
        for line in lines:
            if lines_intersection(line, ray)[0]:
                intersections += 1

        if (intersections % 2) != 0:
            return True

    return False


def polyline_in_polygon(linePoints, polygonPoints):
    # MBR of whole polyline
    if mbr_intersection(get_mbr_coordinates(linePoints), get_mbr_coordinates(polygonPoints)):
        intersection, meet = polylines_intersection_divide_conquer(linePoints, polygonPoints)

        if intersection:  # Real intersection
            return [True, True, meet]

        if meet:
            if mbr_inside_mbr(get_mbr_coordinates(linePoints), get_mbr_coordinates(polygonPoints)):
                for point in linePoints:
                    if point_in_polygon_divide_conquer(point, polygonPoints):
                        return [False, True, True]
            
            return [False, False, True]

        # No intersection + no meet -> then if at least one inside then contains
        if point_in_polygon_divide_conquer(linePoints[0], polygonPoints):
            return [False, True, meet]

        return [False, False, meet]

    # Intersects, Contains, Meet
    return [False, False, False]


def polygon_in_polygon(polygonPoints1, polygonPoints2):
    [intersectsAB, containsAB, meetAB] = polyline_in_polygon(polygonPoints1, polygonPoints2);
    [intersectsBA, containsBA, meetBA] = polyline_in_polygon(polygonPoints2, polygonPoints1);

    return [[intersectsAB, containsAB, meetAB], [intersectsBA, containsBA, meetBA]]


# Simple checking polylines intersection (brute force)
def polylines_intersection(points1, points2):
    meet = False
    # MBR of whole polyline
    if mbr_intersection(get_mbr_coordinates(points1), get_mbr_coordinates(points2)):
        # MBR of each line
        for i in range(len(points1)):
            if i < len(points1) - 1:
                line1 = [points1[i], points1[i + 1]]
                for j in range(len(points2)):
                    if j < len(points2) - 1:
                        line2 = [points2[j], points2[j + 1]]
                        if mbr_intersection(get_mbr_coordinates(line1), get_mbr_coordinates(line2)):
                            intersection = lines_intersection(line1, line2)

                            if intersection[0]:  # Intersect
                                return [True, True]
                            if (not meet) and intersection[1]:  # Meet
                                meet = True

    # Intersection, Meet
    return [False, meet]


# Polylines intersections checking using recursion (MBR divide and conquer)
def polylines_intersection_divide_conquer(points1, points2):
    lines = get_mbr_intersected_lines_recursion(points1, points2)

    meet = False
    for line in lines:
        possible_intersected_lines = get_mbr_intersected_lines_recursion(points2, line)
        for line2 in possible_intersected_lines:
            intersection = lines_intersection(line, line2)

            if intersection[0]:  # Intersect
                return [True, False]
            if (not meet) and intersection[1]:  # Meet
                meet = True

    # Intersection, meet
    return [False, meet]


def get_mbr_intersected_lines_recursion(points1, points2):
    # MBR of whole polyline
    if mbr_intersection(get_mbr_coordinates(points1), get_mbr_coordinates(points2)):
        if len(points1) > 2:
            split_point = int(math.ceil(len(points1) / 2.0))
            dividedPoints1 = points1[:split_point]
            dividedPoints2 = points1[(split_point - 1):]

            array1 = get_mbr_intersected_lines_recursion(dividedPoints1, points2);
            array2 = get_mbr_intersected_lines_recursion(dividedPoints2, points2);

            return array1 + array2
        else:
            return [points1]

    return []


def get_mbr_coordinates(points):
    minX = float("inf")
    maxX = float("-inf")
    minY = float("inf")
    maxY = float("-inf")

    for point in points:
        if point['lat'] < minX:
            minX = point['lat']
        if point['lat'] > maxX:
            maxX = point['lat']
        if point['lng'] < minY:
            minY = point['lng']
        if point['lng'] > maxY:
            maxY = point['lng']

    return [[minX, minY], [maxX, maxY]]


def lines_intersection(line1, line2):
    x11 = line1[0]['lat']
    x12 = line1[1]['lat']
    x21 = line2[0]['lat']
    x22 = line2[1]['lat']

    y11 = line1[0]['lng']
    y12 = line1[1]['lng']
    y21 = line2[0]['lng']
    y22 = line2[1]['lng']

    d1 = (x11 - x12) * (y21 - y22) - (x21 - x22) * (y11 - y12)
    d2 = (x21 - x22) * (y11 - y12) - (x11 - x12) * (y21 - y22)
    n1 = (x11 - x21) * (y21 - y22) - (x21 - x22) * (y11 - y21)
    n2 = (x21 - x11) * (y11 - y12) - (x11 - x12) * (y21 - y11)

    if d1 != 0:  # Not parallel
        t1 = n1 / d1
        t2 = n2 / d2

        if t1 >= 0 and t1 <= 1 and t2 >= 0 and t2 <= 1:  # Intersect
            if t1 == 0 or t2 == 0 or (1 - t1) <= 0.0001 or (1 - t2) <= 0.0001:
                return [False, True]
            # Not overlap
            return [True, False]

    # Parallel
    if n1 == 0 or n2 == 0:
        return [False, True]

    # Intersect, Overlap
    return [False, False]


def polygons_equal(polygon1, polygon2):
    if mbr_equal(get_mbr_coordinates(polygon1), get_mbr_coordinates(polygon2)):
        sortedPolygon1 = sorted(polygon1, key=lambda x: (x['lat'], x['lng']))
        sortedPolygon2 = sorted(polygon2, key=lambda x: (x['lat'], x['lng']))

        for i in range(len(sortedPolygon1)):
            if sortedPolygon1[i] != sortedPolygon2[i]:
                return False

        return True

    return False


def mbr_inside_mbr(mbr1, mbr2):
    Xsize1 = mbr1[1][0] - mbr1[0][0]
    Xsize2 = mbr2[1][0] - mbr2[0][0]

    r1 = mbr1
    r2 = mbr2

    if Xsize1 > Xsize2:
        r1 = mbr2
        r2 = mbr1

    return r1[1][0] <= r2[1][0] and r1[0][0] >= r2[0][0] and r2[1][1] >= r1[1][1] and r2[0][1] <= r1[0][1]


def point_in_mbr(point, mbr):
    return point['lat'] >= mbr[0][0] and point['lat'] <= mbr[1][0] and point['lng'] >= mbr[0][1] and point['lng'] <= mbr[1][1]


def mbr_equal(mbr1, mbr2):
    return mbr1[1][0] == mbr2[1][0] and mbr1[0][1] == mbr2[0][1] and mbr1[0][0] == mbr2[0][0] and mbr1[1][1] == mbr2[1][1]


def mbr_intersection(mbr1, mbr2):
    return mbr1[0][0] <= mbr2[1][0] and mbr1[1][0] >= mbr2[0][0] and mbr1[0][1] <= mbr2[1][1] and mbr1[1][1] >= mbr2[0][1]


if __name__ == '__main__':

    berlin = {'lat':52.520008, 'lng':13.404954}
    konstanz = {'lat':47.661942, 'lng':9.172430}
    hamburg = {'lat':53.551086, 'lng':9.993682}
    vancouver = {'lat':49.246690, 'lng':-123.220161}
    zurich = {'lat':47.376888, 'lng':8.541694}
    milano = {'lat':45.8082, 'lng':9.57694}

    distance = point2point_distance(vancouver, konstanz)
    print(math.ceil(distance / 1000))

    line = [berlin, hamburg]
    distance, intersection = point2line_distance(line, konstanz)
    print(math.ceil(distance / 1000))

    poly = [berlin, hamburg, zurich, berlin]
    distance, intersection = point2poly_distance(poly, konstanz)
    print(math.ceil(distance / 1000))

    point = {'lat': 48.8035328810707, 'lng': 10.1756854154638}
    pointA = {'lat': 48.731205883386, 'lng': 9.8900805655392}
    pointB = {'lat': 48.8215983547918, 'lng': 10.4530516639482}

    line2 = [pointA, pointB]

    distance2, intersection = point2poly_distance(line2, point)
    print(math.ceil(distance2 / 1000))

    distance3 = point2point_distance(pointA, point)
    print(math.ceil(distance3 / 1000))

    distance4 = point2point_distance(pointB, point)
    print(math.ceil(distance4 / 1000))

    line2 = [vancouver, zurich]
    line = [hamburg, berlin, konstanz]

    start, distance, intersection = poly2poly_distance(line, line2)
    print(start, math.ceil(distance / 1000), intersection)

