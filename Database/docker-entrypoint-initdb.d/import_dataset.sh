#!/bin/bash

echo "Starting import of dataset..."
osm2pgsql --create --database gis --slim --latlong --host localhost --username gis_user /importdata/merseyside-latest.osm.pbf
# psql -h localhost -p 15432 -U gis_user -d gis -f /importdata/hh_2po_4pgr.sql
echo "Finished import of dataset import of dataset..."
echo "Database ready!"
