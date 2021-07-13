
Info for *roads_dangerousness_liverpool.csv*:
=============================================

Columns:
- osm_id: 
  The id of the "road" from the merseyside data set (this is the location to match)
  
- Extra_cost: 
  The cost from previous accidents at this location. This is already included in the scenarios, so only use scenarios.
  Created as follows: each accident gives cost of 0.1 * year_weight * severity weight, 
  year weights = {'2018':1, '2017':0.9, '2016':0.8}, 
  severity_weight = {1:1, 2:0.7, 3: 0.3} (using accident severity, accident severity: 1=Fatal, 2=Serious, 3=Slight)
  
- Number_of_accidents_total:
  Sum of all accidents that happened on this road in total (all years)

- Number_of_casualties_total:
  Sum of all casualties that were recorded in all accidents at this location (all years)

- Average_severity:
  The average accident severity for all accidents at this location

- Scenarios:
  Created as follows: scenario_cost = extra_cost + 0.1 * light_weight + 0.1* weather_weight + 0.1 * road_weight
  light_weight = {1:0.1, 4:0.6, 5:0.8, 6:1, 7: 0, -1:0}
  weather_weight = {1: 0.1, 2:0.7, 3:0.8, 4:0.7, 5:0.9, 6:0.95, 7:0.8, 8:0.1, 9:0, -1:0}
  road_weight = {1:0.1, 2: 0.6, 3:0.7, 4:0.9, 5:0.9, 6:0.8, 7:0.7, -1:0}
  
  light conditions: 1:Daylight, 4:Darkness - lights lit, 5:Darkness - lights unlit, 6:Darkness - no lighting, 7:Darkness - lighting unknown, -1:Data missing or out of range
  weather: 1:Fine no high winds, 2:Raining no high winds, 3:Snowing no high winds, 4:Fine + high winds, 5:Raining + high winds, 6:Snowing + high winds, 7:Fog or mist, 8	Other, 9	Unknown, -1	Data missing or out of range
  road surface: 1:Dry, 2:Wet or damp, 3:Snow, 4:Frost or ice, 5:Flood over 3cm. deep, 6:Oil or diesel, 7:Mud, -1:Data missing or out of range
  
  - Scenario1: "daylight everything fine", 'Light_Conditions':1, 'Weather_Conditions':1, 'Road_Surface_Conditions':1
  - Scenario2: "night with lighting everything else fine", 'Light_Conditions':4, 'Weather_Conditions':1, 'Road_Surface_Conditions':1
  - Scenario3: "night and no lighting and rain, wet road", 'Light_Conditions':6, 'Weather_Conditions':2, 'Road_Surface_Conditions':2
  - Scenario4: "daylight snow and wind", 'Light_Conditions':1, 'Weather_Conditions':6, 'Road_Surface_Conditions':3
  - Scenario5: "night no light and fog and frost/ice on road", 'Light_Conditions':6, 'Weather_Conditions':7, 'Road_Surface_Conditions':4


Info for *roads_dangerousness_liverpool_2.csv*:
===============================================

Same as *roads_dangerousness_liverpool.csv* but different calculation of cost:

- Scenarios:
  Created as follows: scenario_cost = extra_cost + 0.3 * light_weight + 0.3 * weather_weight + 0.3 * road_weight
  
  light_weight = {1:0.1, 4:0.7, 5:1, 6:1, 7: 0, -1:0}
  weather_weight = {1: 0.1, 2:0.7, 3:0.8, 4:0.7, 5:0.9, 6:1, 7:0.8, 8:0.1, 9:0, -1:0}
  road_weight = {1:0.1, 2: 0.6, 3:0.8, 4:0.9, 5:1, 6:1, 7:0.7, -1:0}

Info for *roads_dangerousness_liverpool_2_norma.csv*:
=====================================================

Same as *roads_dangerousness_liverpool_2.csv* but with linear normalization of columns extra_cost, and scenarios.


Info for *accidents_data_liverpool_filtered_with_roads.csv*:
============================================================

Mapping of accidents and roads. Road_id = osm_id in DB. Use this column to join tables.

- index
- Longitude
- Latitude
- Accident_Severity
- Light_Conditions
- Weather_Conditions
- Road_Surface_Conditions
- Number_of_Casualties
- Year
- Road_id
