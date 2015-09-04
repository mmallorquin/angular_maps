(function(){

  function MapsController(){

    this.selectAll = false;

    this.user = {
      ciudades: ''
    };
  }

  angular
    .module('app.maps',[
      'ngMap'
    ])
    .controller('MapsController', MapsController);

})();
