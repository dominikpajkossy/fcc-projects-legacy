       var table = [];
       //Get table info from server
       $.ajax(window.location.href + "/getinfo", {
           success: function(data) {
               tmp = JSON.parse(data);
               for (var i = 0; i < tmp.length; i++) {
                   table = table.concat([
                       [tmp[i].name, tmp[i].votes]
                   ]);
               }

               // Load the Visualization API and the corechart package.
               google.charts.load('current', { 'packages': ['corechart'] });

               // Set a callback to run when the Google Visualization API is loaded.
               google.charts.setOnLoadCallback(drawChart);

               function drawChart() {

                   // Create the data table.
                   var data = new google.visualization.DataTable();
                   data.addColumn('string', 'Topping');
                   data.addColumn('number', 'Slices');
                   data.addRows(table);

                   // Set chart options
                   var options = {
                     //  'width': 400,
                     //  'height': 300
                   };

                   // Instantiate and draw our chart, passing in some options.
                   var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
                   chart.draw(data, options);
               }

           },
           error: function(err) {
               if (err)
                   throw err;
           }
       });