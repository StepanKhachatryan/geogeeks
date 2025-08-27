// Google Earth Engine app allowing date, cloud cover, visualization mode, and ROI selection.
// To use, paste into the Earth Engine Code Editor.

// Initialize the map and clear the default split layout.
var map = ui.Map();
ui.root.widgets().reset([map]);

// Widgets for user input.
var dateRange = ui.DateSlider({start: '2017-01-01', end: '2024-01-01', value: ['2021-01-01', '2021-02-01'], period: 1});
var cloudSlider = ui.Slider({min: 0, max: 100, value: 20, step: 1});
var vizSelect = ui.Select({items: ['RGB', 'NDVI'], value: 'RGB'});
var fileUpload = ui.FileUpload({accept: '.geojson', multiple: false});
var runButton = ui.Button({label: 'Run'});

// Panel placed inside a dialog for a pop-up style interface.
var panel = ui.Panel([
  ui.Label('Date range'),
  dateRange,
  ui.Label('Max cloud (%)'),
  cloudSlider,
  ui.Label('Visualization'),
  vizSelect,
  ui.Label('Upload GeoJSON'),
  fileUpload,
  runButton
], ui.Panel.Layout.flow('vertical'), {width: '300px'});

var dialog = ui.Dialog({title: 'Options', widgets: [panel], style: {width: '350px'}});
ui.root.add(dialog);

var region;  // Will hold the geometry from uploaded GeoJSON.
fileUpload.onChange(function(file) {
  file.getAsString(function(content) {
    var json = JSON.parse(content);
    region = ee.FeatureCollection(json).geometry();
    map.centerObject(region);
  });
});

function displayImage() {
  if (!region) {
    ui.alert('Please upload a GeoJSON file defining the region.');
    return;
  }
  var dates = dateRange.getValue();
  var start = ee.Date(dates.start());
  var end = ee.Date(dates.end());
  var maxCloud = cloudSlider.getValue();

  var collection = ee.ImageCollection('COPERNICUS/S2')
      .filterBounds(region)
      .filterDate(start, end)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', maxCloud));

  var image = collection.median().clip(region);
  map.layers().reset();

  if (vizSelect.getValue() === 'NDVI') {
    var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
    map.addLayer(ndvi, {min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'NDVI');
  } else {
    var rgb = image.select(['B4', 'B3', 'B2']).divide(10000);
    map.addLayer(rgb, {min: 0, max: 0.3}, 'RGB');
  }
}

runButton.onClick(function() {
  displayImage();
  dialog.hide();
});
