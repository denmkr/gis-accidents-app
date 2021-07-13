-- Creating landkreise table and importing data from csv file

-- CREATE TABLE landkreise (id SERIAL PRIMARY KEY, name text, population numeric);
-- COPY landkreise(id, name, population) FROM '/data/12411-0015.csv' DELIMITER ';' CSV;


DROP TABLE public.custom_point;

CREATE TABLE public.custom_point (id BIGSERIAL PRIMARY KEY, geom geometry(POINT, 4326));
INSERT INTO public.custom_point(geom) VALUES(ST_GeomFromText('POINT(-10.060316 18.432044)', 4326));

DROP TABLE public.custom_line;

CREATE TABLE public.custom_line (id BIGSERIAL PRIMARY KEY, geom geometry(LINESTRING, 3857));
INSERT INTO public.custom_line(geom) VALUES(ST_GeomFromText('LINESTRING(-71.160281 42.258729,-71.160837 42.259113,-71.161144 42.25932)', 3857));

DROP TABLE public.custom_polygon;

CREATE TABLE public.custom_polygon (id BIGSERIAL PRIMARY KEY, geom geometry(POLYGON, 28992));
INSERT INTO public.custom_polygon(geom) VALUES(ST_GeomFromText('POLYGON((-71.160281 42.258729,-71.160837 42.259113,-71.161144 42.25932, -71.160281 42.258729))', 28992));

CREATE EXTENSION pgrouting;

ALTER TABLE mlm_2po_4pgr ADD COLUMN danger_cost double precision;

UPDATE public.mlm_2po_4pgr
    SET danger_cost = random()::double precision;

CREATE TABLE road_accident_costs (id serial PRIMARY KEY, osm_id numeric, Extra_cost numeric, Number_of_accidents_total numeric, Number_of_casualties_total numeric, Average_severity numeric, Scenario1 numeric, Scenario2 numeric, Scenario3 numeric, Scenario4 numeric, Scenario5 numeric);