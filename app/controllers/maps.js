(function(){

  function MapsController($scope){
    var vm = this;

    vm.selectAll = false;
    vm.searchText = '';
    vm.mapTypeId = 'ROADMAP';

    vm.ciudades = [
      { id: 1, nombre: 'Asunción', lat: -25.2637, lng: -57.5759, info: 'Capital de Paraguay y ciudad más poblada.' },
      { id: 2, nombre: 'Ciudad del Este', lat: -25.5097, lng: -54.6111, info: 'Principal zona de comercio del país.' },
      { id: 3, nombre: 'Encarnación', lat: -27.3306, lng: -55.8667, info: 'Conocida como la perla del sur y por su costanera.' },
      { id: 4, nombre: 'Luque', lat: -25.2694, lng: -57.4856, info: 'Sede de la CONMEBOL y ciudad de la música.' },
      { id: 5, nombre: 'San Lorenzo', lat: -25.3422, lng: -57.5092, info: 'Ciudad universitaria del Paraguay.' },
      { id: 6, nombre: 'Villarrica', lat: -25.7811, lng: -56.4450, info: 'Ciudad culta y del carnaval.' }
    ];

    vm.ciudadSeleccionada = null;

    $scope.$on('mapInitialized', function(event, map) {
      vm.map = map;
    });

    vm.mostrarCiudad = function(ciudad) {
      vm.ciudadSeleccionada = ciudad;
      if (vm.map) {
        vm.map.showInfoWindow('foo-iw', 'm' + ciudad.id);
      }
    };

    vm.seleccionarDesdeLista = function(ciudad) {
      vm.ciudadSeleccionada = ciudad;
      if (vm.map) {
        vm.map.setCenter(new google.maps.LatLng(ciudad.lat, ciudad.lng));
        vm.map.setZoom(12);
        vm.map.showInfoWindow('foo-iw', 'm' + ciudad.id);
      }
    };

    vm.resetearMapa = function() {
      if (vm.map) {
        vm.map.setCenter(new google.maps.LatLng(-23.4347092, -58.4483504));
        vm.map.setZoom(6);
        vm.mapTypeId = 'ROADMAP';
        vm.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      }
    };

    vm.cambiarTipoMapa = function() {
      if (vm.map) {
        vm.map.setMapTypeId(vm.mapTypeId.toLowerCase());
      }
    };
  }

  MapsController.$inject = ['$scope'];

  angular
    .module('app.maps',[
      'ngMap'
    ])
    .controller('MapsController', MapsController);

})();
