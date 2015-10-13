
$(document).ready(function(){
  var localStorageNameShapes = "CloudmedJsonImgHtml5"
  var localStorageNamePencil = "CloudmedJsonImgHtml5-pencil"

  $("#preview_elements").find('a').each(function(k,v){
    var href = [];
    href=$(this).attr('href').split('\\');
    href = href[href.length-1];

    if(((localStorage.getItem(localStorageNameShapes+href))&&
      (($.parseJSON(localStorage.getItem(localStorageNameShapes+href)).areas.length) > 0))||
      ((localStorage.getItem(localStorageNamePencil+href)) &&
      ($.parseJSON(localStorage.getItem(localStorageNamePencil+href)).areas.length) > 0))
      { $(this).find('img').addClass('has_note');
    }else {
      $(this).find('img').removeClass('has_note');
    }
  })
})
