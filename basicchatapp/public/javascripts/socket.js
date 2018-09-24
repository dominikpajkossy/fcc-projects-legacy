window.onload = function(){
    var socket = io.connect(window.location.href);

        function doStuff(){
            var clientMessage = document.getElementById("textinputelement").value;
            document.getElementById("textinputelement").value = "";
            socket.emit("clientmessage", {message : clientMessage});
        }

        socket.on("servermessage", function(data){
            document.getElementById("textcontainer").innerHTML += "<div>" + data.senderId + " : " + data.message + "</div>";
        });

        document.getElementById("sendbutton").addEventListener("click", function(){
            doStuff();
        })


}