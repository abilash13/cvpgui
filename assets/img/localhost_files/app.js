(function() {
	angular.module('config-gui', ['ngRoute', 'ngStorage'])

	.run(['$rootScope', '$sessionStorage', '$http', '$location', 'AuthService', function($rootScope, $sessionStorage, $http, $location, AuthService) {

		$rootScope.$on('$routeChangeStart', function(event, next, prev) {

			if (next.requireAuth && !AuthService.isUserLoggedIn()) {
				$location.path("/login");
			}
			else if (next.templateUrl == 'templates/pages/login.html' && AuthService.isUserLoggedIn()) {
				event.preventDefault();
				$location.path("/");
			}

		})

		$rootScope.userLoggedIn = $sessionStorage.userLoggedIn;

		// For debugging
		console.log("Root scope: userLoggedIn - " + $rootScope.userLoggedIn);
		console.log("Session storage: userLoggedIn - " + $sessionStorage.userLoggedIn);

	}])

	// Factories

	.factory('AuthService', ['$rootScope', '$sessionStorage', '$http', '$location', function($rootScope, $sessionStorage, $http, $location) {

		var service = {
			isUserLoggedIn: isUserLoggedIn
		};

		return service;

		function isUserLoggedIn() {
			if(typeof $sessionStorage.userLoggedIn === 'undefined') {
				$http.post("https://10.85.128.248/cvpservice/login/getAuthInfo.do")
					// For debugging
					.then(
						function success(response) {
							if(!response['data']['errorCode']) {	
								console.log("User already logged in. Redirecting to home page.");
								$sessionStorage.userLoggedIn = true;
								$rootScope.userLoggedIn = true;
								return true;
							}
							else {
								console.log("No user logged in.");
								$sessionStorage.userLoggedIn = false;
								$rootScope.userLoggedIn = false;
								return false;
							}
						},
						function error(response) {
							console.log("Authentication check failed.");
							console.log(response);
							return false;
						}
					);
			}
			else {
				if($sessionStorage.userLoggedIn) {
					return true;
				}
				else {
					return false;
				}
			}
		}

	}])

	// Service for logging out the user
	.factory('LogoutService', ['$rootScope', '$http', '$location', '$sessionStorage', function($rootScope, $http, $location, $sessionStorage){
	 		
		$http.post("https://10.85.128.248/cvpservice/login/logout.do")
			// For debugging
			.then(
				function success(response) {
					console.log("Logout success. Redirecting to login page.");
					console.log(response);
					$sessionStorage.userLoggedIn = false;
					$rootScope.userLoggedIn = false;

					$location.url('/login');
					
					// For debugging
					console.log("Root scope: userLoggedIn - " + $rootScope.userLoggedIn);
					console.log("Session storage: userLoggedIn - " + $sessionStorage.userLoggedIn);
				},
				function error(response) {
					console.log("Logout failed.");
					console.log(response);
				}
			);

	 }])

	// Controllers

	// Controller for the login page
	.controller('LoginController', ['$rootScope', '$http', '$location', '$sessionStorage', function($rootScope, $http, $location, $sessionStorage) {
		
		this.username = "";
		this.password = "";

		this.login = function() {
			$http.post("https://10.85.128.248/cvpservice/login/authenticate.do", {
				"userId" : this.username,
				"password" : this.password
				})
				// For debugging
				.then(
					function success(response) {
						if(response['data']['sessionId']) {
							console.log("Authentication success. Redirecting to home page.");
							console.log(response);
							$sessionStorage.userLoggedIn = true;
							$rootScope.userLoggedIn = true;
							
							// For debugging
							console.log("Root scope: userLoggedIn - " + $rootScope.userLoggedIn);
							console.log("Session storage: userLoggedIn - " + $sessionStorage.userLoggedIn);
							
							$location.url('/');
						}
						else {
							console.log("Authentication failed");
							console.log(response);
						}
					},
					function error(response) {
						console.log("Authentication failed");
						console.log(response);
					}
				);
		
		};

	}])

	// Controller for the Devices page
	.controller('DeviceController', function() {
		
		this.devices = devices;
		
		this.toggle = false;

		// Toggles the Add Device menu
		this.toggleMenu = function() {
			this.toggle = !this.toggle;
		};

		this.name = "";
		this.serialNo = "";
		this.container="Undefined";

		// Adds the device into the app
		this.addDevice = function() {
			console.log("Device added");
			devices.push({
				name: this.name,
				serialNo: this.serialNo,
				container: this.container
				
			});
		};

	})

	// Controller for the Containers page
	.controller('ContainerController', function() {

	})

	// Controller for the Config page for devices
	.controller('DeviceConfigController', ['$http', '$location', '$route', '$routeParams', function($http, $location, $route, $routeParams) {
		
		$route.current.templateUrl = '/pages/' + $routeParams.name + ".html";

		this.hostname = "";

		this.pushHostname = function() {
			$http.post("https://10.85.128.248/cvpservice/configlet/addConfiglet.do", {'config' : this.hostname, 'name' : 'test4'})
				// For debugging
				.then(
					function success(response) {
						console.log("Push success.");
						console.log(response);
					},
					function error(response) {
						console.log("Push failed.");
						console.log(response);
					}
				);
		};

	}])

		
	var devices = [{
		name:"do450",
		serialNo:"JPE15483153",
		container: "Undefined"
	},
	{
		name:"do420",
		serialNo:"JPE15483155",
		container:"Tenant"
	}];

		
})();




