window.onload = function(){
    var socket = io.connect(window.location.href);
    var chartNamesClient = [];
    var seriesOptions = [];
    console.log(window.location.href);
    //Get chart data then call createChart()
    function getChartData(){
        var seriesCounter = 0;
        seriesOptions = [];

        if (chartNamesClient.length == 0){
            seriesOptions = [];
            seriesCounter = 0;
            createChart();
        } else{
            $.each(chartNamesClient, function (i, name) {
                $.getJSON('https://www.highcharts.com/samples/data/jsonp.php?filename=' + name.toLowerCase() + '-c.json&callback=?',    function (data) {
                    seriesOptions[i] = {
                        name: name,
                        data: data
                    };
                    seriesCounter += 1;
                    if (seriesCounter === chartNamesClient.length) {
                        createChart();
                    }
                });
            });
        }
    }

    //Create chart
    function createChart() {
        Highcharts.stockChart('container', {
            rangeSelector: {
                selected: 4
            },
            yAxis: {
                labels: {
                    formatter: function () {
                        return (this.value > 0 ? ' + ' : '') + this.value + '%';
                    }
                },
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: 'silver'
                }]
            },
            plotOptions: {
                series: {
                    compare: 'percent',
                    showInNavigator: true
                }
            },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
                valueDecimals: 2,
                split: true
            },
            series: seriesOptions
        });
    }

    //Add div element to document
    function createElement(valueName){
        document.getElementById("chartcontainer").innerHTML = "";
        for ( var i = 0; i < valueName.length; i++){
            document.getElementById("chartcontainer").innerHTML += "<button class='chartelement'>" + valueName[i] + "</button>";
        }
        //Remove element
        var classelement = document.getElementsByClassName("chartelement");
        for ( var i = 0; i < classelement.length; i++){
            classelement[i].addEventListener("click", function(){
                for ( var j = 0; j < chartNamesClient.length; j++){
                    if (chartNamesClient[j] == this.innerHTML){
                        chartNamesClient.splice(j,1);
                        socket.emit("namesrequest", {chartNamesClient});
                    }
                }
            });
        }

    }

    //Listen to namesresponse on socket
    socket.on('namesresponse', function(data) {
        chartNamesClient = data.chartNamesServer;
        createElement(chartNamesClient);
        getChartData();
    });

    //Send data when button is clicked
    document.getElementById("newchartbutton").onclick = function(){
        chartNamesClient = chartNamesClient.concat ( document.getElementById("newchartinput").value );
        createElement(document.getElementById("newchartinput").value);
        socket.emit("namesrequest", {chartNamesClient});
    }

};
