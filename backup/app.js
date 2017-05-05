(function() {
	angular.module('config-gui', ['ngRoute', 'ngStorage', 'ngMessages'])

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

	// Service for checking if authentication is needed
	.factory('AuthService', ['$rootScope', '$sessionStorage', '$http', '$location', function($rootScope, $sessionStorage, $http, $location) {

		var service = {
			isUserLoggedIn: isUserLoggedIn
		};

		return service;

		function isUserLoggedIn() {
			if(typeof $sessionStorage.userLoggedIn === 'undefined') {
				$http.post("https://10.10.10.253/cvpservice/login/getAuthInfo.do")
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

	// Service for containers
	.factory('ContainersService', ['$http', function ($http) {

		return {
			getContainers: function() {
				var promise = $http.get("https://10.10.10.253/cvpservice/inventory/add/searchContainers.do", {
						params: { 'startIndex': '0', 'endIndex': '0' }
					})
				promise.then(
						function success(response) {
							console.log("Success");
							console.log(response);
						},
						function error(response) {
							console.log("Failure");
							console.log(response);
						}
				);
				return promise;
			}
		}

	}])

	// Service acting as wrapper for CVP API calls
	.factory('CVPAPIService', ['$http', function($http) {

		var cvpServerIPAddress = "10.10.10.253"
		var baseUrl = "https://" + cvpServerIPAddress + "/cvpservice";

		return {

			// Configlet - Operations about configlets

			// This api call is used to add a configlet.
			addConfiglet: function(config, name) {

				return $http.post(baseUrl + "/configlet/addConfiglet.do", {
					"config" : config, 
					"name" : name
				});

			},

			// This api call is used to get the configlet by its name.
			getConfigletByName: function(name) {

				return $http.get(baseUrl + "/configlet/getConfigletByName.do", {
					"params": {"name" : name}
				});

			},

			// This api call is used to update an existing configlet.
			updateConfiglet: function(config, key, name) {

				return $http.post("https://10.10.10.253/cvpservice/configlet/updateConfiglet.do", {
					"config" : config, 
					"key" : key, 
					"name" : name
				});

			},


			// Login - Login operations

			// This api call is used to log into the CVP application.
			login: function(username, password) {
				
				return $http.post(baseUrl + "/login/authenticate.do", {
						"userId" : username,
						"password" : password
					});

			},

			// This api call is used to log out from the current session.
			logout: function() {

				return $http.post(baseUrl + "/login/logout.do");

			},

			// This api call is used to get Base64 of authentication info.
			getAuthInfo: function() {

				return $http.post(baseUrl + "/login/getAuthInfo.do");

			},


			// Inventory - Operations about Inventory

			// This API endpoint searches the tempcontainers for the given query parameter.
			searchContainers: function(queryparam, startIndex, endIndex) {

				return $http.get(baseUrl + "/inventory/add/searchContainers.do", {
					"params": { 
						"queryparam": queryparam, 
						"startIndex": startIndex, 
						"endIndex": endIndex
					}
				});

			},


			// Provisioning - ZTP related Operations

			// This api call is used to save the changes made in ztp.
			saveTopology: function(body) {

				return $http.post(baseUrl + "/provisioning/v2/saveTopology.do", body);

			},


		};

	}])

	// Service for logging out the user
	.factory('LogoutService', ['CVPAPIService', '$sessionStorage', '$rootScope', '$location', function(CVPAPIService, $sessionStorage, $rootScope, $location){
	 	
		CVPAPIService.logout()
			.then(
				function success(response) {
					//console.log("Logout success. Redirecting to login page.");
					//console.log(response);

					$sessionStorage.userLoggedIn = false;
					$rootScope.userLoggedIn = false;

					$location.url('/login');
					
					//console.log("Root scope: userLoggedIn - " + $rootScope.userLoggedIn);
					//console.log("Session storage: userLoggedIn - " + $sessionStorage.userLoggedIn);
				},
				function error(response) {
					//console.log("Logout failed.");
					//console.log(response);
				}
			);

	 }])
	// .factory('LogoutService', ['$rootScope', '$http', '$location', '$sessionStorage', function($rootScope, $http, $location, $sessionStorage){
	 		
	// 	$http.post("https://10.10.10.253/cvpservice/login/logout.do")
	// 		// For debugging
	// 		.then(
	// 			function success(response) {
	// 				console.log("Logout success. Redirecting to login page.");
	// 				console.log(response);
	// 				$sessionStorage.userLoggedIn = false;
	// 				$rootScope.userLoggedIn = false;

	// 				$location.url('/login');
					
	// 				// For debugging
	// 				console.log("Root scope: userLoggedIn - " + $rootScope.userLoggedIn);
	// 				console.log("Session storage: userLoggedIn - " + $sessionStorage.userLoggedIn);
	// 			},
	// 			function error(response) {
	// 				console.log("Logout failed.");
	// 				console.log(response);
	// 			}
	// 		);

	//  }])

	// Controllers

	// Controller for the login page
	.controller('LoginController', ['$rootScope', '$http', '$location', '$sessionStorage', function($rootScope, $http, $location, $sessionStorage) {
		
		this.username = "";
		this.password = "";

		this.login = function() {
			$http.post("https://10.10.10.253/cvpservice/login/authenticate.do", {
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


	// Controller for the Containers page
	.controller('ContainerController', ['$location', '$http', '$route', 'containers', function($location, $http, $route, containers)  {

		this.containers = [];

		for(key in containers['data']['data']) {
			this.containers.push({
				'name' : containers['data']['data'][key]['name'],
				'key' : containers['data']['data'][key]['key']
			});
		}
		
		this.toggle = false;

		// Toggles the Add Container menu
		this.toggleMenu = function() {
			this.toggle = !this.toggle;
		};

		this.name = "";
		this.deviceCount = 0;

		// Adds the device into the app
		this.addContainer = function(form, name) {

			$http.get("https://10.10.10.253/cvpservice/inventory/add/searchContainers.do", {
						"params": { "queryparam": name, "startIndex": "0", "endIndex": "0" }
					})
					.then(
						function success(response) {
							console.log("Search containers success");
							console.log(response);
							if(response["data"]["total"] == 0) {
								form.name.$error.containerAlreadyExists = false;
								$http.post("https://10.10.10.253/cvpservice/provisioning/addTempAction.do?format=topology&queryParam=&nodeId=root", {
									"data": [{
										"action": "add",
										"fromId": "",
										"fromName": "",
										"info": "Container " + name + " created", 
										"infoPreview": "Container " + name + " created", 
										"nodeId": name,
										"nodeName": name,
										"nodeType": "container",
										"toId": "root",
										"toIdType": "container",
										"toName": "Tenant"
										}]
									})
									// For debugging
									.then(
										function success(response) {
											console.log("Add container success");
											console.log(response);
											$http.post("https://10.10.10.253/cvpservice/provisioning/v2/saveTopology.do", [])
												.then(
													function success(response) {
														console.log("Save topology success");
														console.log(response);
														$route.reload();
													},
													function error(response) {
														console.log("Save topology failed");
														console.log(response);
													}
												);
										},
										function error(response) {
											console.log("Add container failed");
											console.log(response);
										}
									);
							}
							else {
								console.log("Container with that name already exists");
								form.name.$error.containerAlreadyExists = true;
							}
						},
						function error(response) {
							console.log("Search containers failed");
							console.log(response);
						}
				);

		};


		this.redirect = function(name) {
			$location.path('/containers/' + name);
		}
		

	}])

	// Controller for the Devices page
	.controller('DeviceController', ['$location', function($location) {
		
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
			for (i=0;i<containers.length;++i)
			{
				if(this.container===containers[i].name)
				{

					containers[i].deviceCount++;
				}
			};

		};

		this.redirect = function(serialNo) {
			$location.path('/devices/' + serialNo);
		}

	}])

	

	// Controller for the Config page for devices
	.controller('DeviceConfigController', ['$http', '$location', '$route', '$routeParams', function($http, $location, $route, $routeParams) {
		
		this.serialNo = $routeParams.name;

		this.hostname = "";

		this.pushHostname = function() {
			$http.post("https://10.10.10.253/cvpservice/configlet/addConfiglet.do", {'config' : this.hostname, 'name' : $routeParams.name + '-hostname'})
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

	// Controller for the Config page for devices
	.controller('ContainerConfigController', ['$http', '$location', '$route', '$routeParams', function($http, $location, $route, $routeParams) {
		
		this.name = $routeParams.name;

		this.defaultTabs = {
			"banner" : "login",
			"alias" : ""
		}

		this.tab = "banner";
		this.subTab = "login";

		this.setTab = function(value) {
			this.tab = value;
			this.subTab = this.defaultTabs[this.tab];
		};

		this.setSubTab = function(value) {
			this.subTab = value;
		};

		this.loginBanner = "";
		this.motdBanner = "";

		console.log(this.name)

		this.pushConfig() = function() {

		}

		this.saveConfig = function(configName) {
			name = $routeParams.name;
			switch(configName) {
				case "loginBanner":
					if(this.loginBanner) {
						config = "banner login\n" + this.loginBanner;
						name = name + "-login-banner";
					}
					break;
				case "motdBanner":
					if(this.motdBanner) {
						config = "banner motd\n" + this.motdBanner;
						name = name + "-motd-banner";
					}
					break; 
			}
			$http.get("https://10.10.10.253/cvpservice/configlet/getConfigletByName.do", {
					params: {'name' : name}
				})
				// For debugging
				.then(
					function success(response) {
						if(response['data']['errorCode']) {
							console.log(config)
							console.log(name)
							$http.post("https://10.10.10.253/cvpservice/configlet/addConfiglet.do", {'config' : config, 'name' : name})
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
						}
						else if(response['data']['key']) {
							console.log(2)
							key = response['data']['key'];
							$http.post("https://10.10.10.253/cvpservice/configlet/updateConfiglet.do", {'config' : config, 'key' : key, 'name' : name})
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
						}
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


	// var containers = [{
	// 	name:"Undefined",
	// 	deviceCount:1
	// },
	// {
	// 	name:"Tenant",
	// 	deviceCount:1
	// }];

		
})();




