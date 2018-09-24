window.onload = function(){

    var buttons = document.getElementsByClassName("deletebutton");

    function imgError(image) {
        image.onerror = "";
        image.src = "https://pbs.twimg.com/profile_images/600060188872155136/st4Sp6Aw.jpg";
        return true;
    }

    for (var i = 0; i < buttons.length; i++){
        buttons[i].addEventListener("click", function(item){
            $.post( window.location.href + "url=" + item.target.name, function( data ) {
                location.reload();
            });
        })
    }

}