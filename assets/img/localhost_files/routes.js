(function() {
	angular.module('config-gui')
		.config(['$routeProvider',function($routeProvider) {
			
			$routeProvider

			// route for the Login page
			.when('/login', {
				templateUrl: 'templates/pages/login.html',
				controller: 'LoginController',
				controllerAs: 'loginCtrl'
			})

			// route for the Logout page
			.when('/logout', {
				resolve: {
					logout: ['LogoutService', function(){
						LogoutService();
					}]
				},
				requireAuth: true,
			})

			// route for the Home page
			.when('/', {
				requireAuth: true,
				redirectTo: '/devices'
			})

			// route for the Devices page
			.when('/devices', {
				templateUrl: 'templates/pages/devices/index.html',
				controller: 'DeviceController',
				controllerAs: 'deviceCtrl',
				requireAuth: true
			})

			// test route for a sample device
			.when('/devices/:name', {
				templateUrl: 'templates/pages/devices/device-test.html',
				controller: 'DeviceConfigController',
				controllerAs: 'deviceConfigCtrl',
				requireAuth: true
			})


			// route for the Containers page
			.when('/containers', {
				templateUrl : 'templates/pages/containers/index.html',
				controller: 'ContainerController',
				controllerAs: 'containerCtrl',
				requireAuth: true
			})

			// test route for a sample container
			.when('/containers/Tenant', {
				templateUrl: 'templates/pages/containers/container-test.html',
				requireAuth: true
			})

			// fallback route if everything else fails
			.otherwise( { redirectTo: '/' });

		}]);
})();
