am4core.useTheme(am4themes_animated);
// am4core.useTheme(am4themes_dark);

am4core.ready(function () {

    const url = 'https://covid19.mathdro.id/api';
    const title = document.querySelector('title');
    const divConfirmed = document.querySelector('.confirmed');
    const divDeaths = document.querySelector('.deaths');
    const divRecovered = document.querySelector('.recovered');
    const date = document.querySelector('.date');

    // Create map instance
    const chart = am4core.create("chartdiv", am4maps.MapChart);

    chart.geodata = am4geodata_worldLow;

    var colorSet = new am4core.ColorSet();

    const getData = () => {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(data => data.json())
                .then(global => resolve(global))
                .catch(err => reject(err));
        });
    };

    const getCountries = () => {
        return new Promise((resolve, reject) => {
            fetch(`${url}/confirmed`)
                .then(data => data.json())
                .then((countries) => resolve(countries))
                .catch(err => resolve(err));
        });
    };

    const getStatistics = (id) => {
        return new Promise((resolve, reject) => {
            fetch(`${url}/countries/${id}`)
                .then(data => data.json())
                .then(stats => {
                    resolve(stats);
                })
                .catch(err => {
                    resolve(err)
                });
        });
    };

    getData().then(stats => {
        divConfirmed.innerHTML = `
            Total de cas
            <h2>${stats.confirmed.value}</h2>
        `
        divDeaths.innerHTML = `
            Total de morts
            <h2>${stats.deaths.value}</h2>
        `
        divRecovered.innerHTML = `
            Total de guéris
            <h2>${stats.recovered.value}</h2>
        `
        date.innerHTML = `
            Données mise à jour : ${moment(stats.lastUpdate).calendar()}
        `
    });

    getCountries().then(res => {
        console.log(res.length)
        res.map(({
            iso2,
            countryRegion,
            confirmed
        }) => {
            mapData.push({
                id: iso2,
                name: countryRegion,
                value: confirmed,
                color: '#e84118'
            });
        });

        imageSeries.data = mapData;
    });



    // Set projection
    chart.projection = new am4maps.projections.Miller();

    // Create map polygon series
    const polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
    polygonSeries.exclude = ["AQ"];
    polygonSeries.useGeodata = true;
    polygonSeries.nonScalingStroke = true;
    polygonSeries.strokeWidth = 0.5;
    polygonSeries.calculateVisualCenter = true;

    const data = [];
    const mapData = [];

    const imageSeries = chart.series.push(new am4maps.MapImageSeries());
    imageSeries.dataFields.value = "value";
    imageSeries.dataFields.url = "url";

    const imageTemplate = imageSeries.mapImages.template;
    imageTemplate.nonScaling = true;

    // Bubble Config
    const circle = imageTemplate.createChild(am4core.Circle);
    circle.fillOpacity = 0.7;
    circle.propertyFields.fill = "color";
    circle.cursorOverStyle = am4core.MouseCursorStyle.pointer;
    circle.tooltipText = "{name}: [bold]{value}[/]";

    const polygonTemplate = circle;
    polygonTemplate.events.on("hit", e => {
        const data = e.target.dataItem.dataContext;

        if (data.id) {
            console.log(data.id)
            getStatistics(data.id).then(stats => {
                console.log(stats)
                divConfirmed.innerHTML = `
                    Nombres de cas
                    <h2>${stats.confirmed.value}</h2>
                `
                divDeaths.innerHTML = `
                    Nombres de morts
                    <h2>${stats.deaths.value}</h2>
                `
                divRecovered.innerHTML = `
                    Nombres de guéris
                    <h2>${stats.recovered.value}</h2>
                `
            })
        }

    });


    imageSeries.heatRules.push({
        "target": circle,
        "property": "radius",
        "min": 4,
        "max": 30,
        "dataField": "value"
    });

    imageTemplate.adapter.add("latitude", (latitude, target) => {
        const polygon = polygonSeries.getPolygonById(target.dataItem.dataContext.id);
        if (polygon) {
            return polygon.visualLatitude;
        }
        return latitude;
    })

    imageTemplate.adapter.add("longitude", (longitude, target) => {
        const polygon = polygonSeries.getPolygonById(target.dataItem.dataContext.id);
        if (polygon) {
            return polygon.visualLongitude;
        }
        return longitude;
    });

    // Add zoom control
    chart.zoomControl = new am4maps.ZoomControl();
    chart.homeZoomLevel = 1.9;

});